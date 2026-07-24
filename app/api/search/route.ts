import { NextRequest, NextResponse } from 'next/server'
import { level5Search, inferTypes } from '@/lib/level5-engine'
import { dispatchIntelligence, type IntelligenceMode } from '@/lib/intelligence-modes'
import { smartDedup } from '@/lib/dedup-engine'
import { enrichTopLeads } from '@/lib/enrichment-engine'
import { protectLocationMode, type SearchMode } from '@/lib/location-guard'
import { partitionBySourcePolicy } from '@/lib/source-policy'
import { enforceRequestLimit } from '@/lib/request-guard'
import { buildIntelligenceResults, type LeadRecord } from '@/lib/xps-intelligence'

export const dynamic = 'force-dynamic'
export const maxDuration = 90

const SB_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SB_SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const VALID_MODES = new Set<SearchMode>(['quick', 'deep', 'max', 'level5'])
const VALID_INTEL = new Set<IntelligenceMode>(['flash', 'deep', 'counter_intel'])

function requestId() { return crypto.randomUUID() }
function json(data: unknown, status = 200, extra: Record<string, string> = {}) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Request-Id': requestId(), ...extra } })
}
function sbHeaders() {
  return { apikey: SB_SKEY, Authorization: `Bearer ${SB_SKEY}`, 'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates,return=minimal' }
}

async function persistSearchRun(params: Record<string, unknown>) {
  if (!SB_URL || !SB_SKEY) return false
  try {
    const response = await fetch(`${SB_URL}/rest/v1/search_runs`, { method: 'POST', headers: sbHeaders(), body: JSON.stringify(params) })
    return response.ok
  } catch { return false }
}

async function persistLeads(leads: LeadRecord[], query: string) {
  if (!SB_URL || !SB_SKEY || !leads.length) return false
  const rows = leads.slice(0, 200).map(lead => ({
    company_name: lead.company_name || 'Unknown', phone: lead.phone || null, email: lead.email || null,
    website: lead.website || null, address: lead.address || null, city: lead.city || null, state: lead.state || null,
    rating: lead.rating || null, review_count: lead.review_count || null, category: lead.category || query,
    source: lead.source || 'search', confidence: lead.confidence || 50, search_query: query, created_at: new Date().toISOString(),
  }))
  try {
    const response = await fetch(`${SB_URL}/rest/v1/universal_leads`, { method: 'POST', headers: sbHeaders(), body: JSON.stringify(rows) })
    return response.ok
  } catch { return false }
}

async function executeSearch(req: NextRequest, body: Record<string, unknown>) {
  const rid = requestId()
  const started = Date.now()
  const query = typeof body.query === 'string' ? body.query.trim() : typeof body.industry === 'string' ? body.industry.trim() : ''
  const city = typeof body.city === 'string' ? body.city.trim() : ''
  const state = typeof body.state === 'string' ? body.state.trim().toUpperCase() : ''
  const requestedMode = VALID_MODES.has(String(body.mode) as SearchMode) ? String(body.mode) as SearchMode : 'deep'
  const intelMode = VALID_INTEL.has(String(body.intelligence_mode) as IntelligenceMode) ? String(body.intelligence_mode) as IntelligenceMode : 'deep'
  const limit = typeof body.limit === 'number' ? Math.min(Math.max(1, Math.floor(body.limit)), 500) : 100

  if (query.length < 2) return json({ ok: false, error: 'query required (min 2 chars)', request_id: rid }, 422)
  if (query.length > 240) return json({ ok: false, error: 'query too long (max 240 chars)', request_id: rid }, 422)
  if (state && !/^[A-Z]{2}$/.test(state)) return json({ ok: false, error: 'state must be a two-letter code', request_id: rid }, 422)

  const rate = await enforceRequestLimit(req, 'search', 10, 60)
  if (!rate.allowed) return json({ ok: false, error: 'Rate limit exceeded. Try again shortly.', request_id: rid }, 429, { 'Retry-After': String(rate.retryAfter), 'X-RateLimit-Backend': rate.backend })

  const location = protectLocationMode(city, requestedMode)
  const result = await level5Search({ query, city, state, mode: location.mode, limit: 0 })
  const deduped = smartDedup(result.leads as LeadRecord[])
  const policy = partitionBySourcePolicy(deduped)
  const verified = policy.allowed.slice(0, limit)
  const intelligenceResults = buildIntelligenceResults(verified)

  const intelligence = verified.length
    ? await dispatchIntelligence(intelMode, verified as any[], query, city, state, result.sources_used, result.keywords_expanded).catch(() => null)
    : null

  const topThree = verified.slice(0, 3)
  const autoEnriched = await Promise.race([
    enrichTopLeads(topThree as any[], 3, ['opencorporates', 'wayback']).catch(() => []),
    new Promise<any[]>(resolve => setTimeout(() => resolve([]), 8000)),
  ])

  const durationMs = Date.now() - started
  const persistence = await Promise.all([
    persistSearchRun({ request_id: rid, query, city, state, mode: location.mode, requested_mode: requestedMode, intelligence_mode: intelMode, results_count: verified.length, quarantined_count: policy.quarantined.length, sources_used: result.sources_used, duration_ms: durationMs }),
    persistLeads(verified, query),
  ])

  const warnings = [location.warning].filter(Boolean) as string[]
  if (rate.backend === 'memory') warnings.push('Distributed rate limiting is not configured; preview fallback limiting is active.')
  if (policy.quarantined.length) warnings.push(`${policy.quarantined.length} AI-only or unregistered-source candidate${policy.quarantined.length === 1 ? ' was' : 's were'} quarantined pending corroboration.`)

  return json({
    ok: true, request_id: rid, query, city, state, requested_mode: requestedMode, mode: location.mode,
    location_strategy: location.locationStrategy, intelligence_mode: intelMode, keywords_expanded: result.keywords_expanded,
    types_inferred: inferTypes(query), sources_used: result.sources_used, sources_skipped: result.sources_skipped,
    total_results: verified.length, raw_results: result.leads.length, dedup_removed: result.leads.length - deduped.length,
    quarantined_count: policy.quarantined.length, denied_count: policy.denied.length, duration_ms: durationMs,
    intelligence, intelligence_results: intelligenceResults, auto_enriched: autoEnriched, results: verified,
    quarantined_results: policy.quarantined.slice(0, 20).map(item => ({ ...item, verification_status: 'quarantined_unverified' })),
    persistence: { search_run: persistence[0], leads: persistence[1] }, rate_limit_backend: rate.backend, warnings,
  }, 200, { 'X-RateLimit-Remaining': String(rate.remaining), 'X-RateLimit-Backend': rate.backend })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>
    return await executeSearch(req, body)
  } catch (error) {
    console.error('[xps-search]', error)
    return json({ ok: false, error: 'Search failed safely. No unverified records were returned.' }, 500)
  }
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  if (!params.get('q') && !params.get('query')) {
    return json({ status: 'ready', product: 'XPS Intelligence', modes: [...VALID_MODES], intelligence_modes: [...VALID_INTEL], safeguards: ['source-policy', 'ai-quarantine', 'location-guard', 'explainable-score'] })
  }
  return await executeSearch(req, {
    query: params.get('q') || params.get('query') || '', city: params.get('city') || '', state: params.get('state') || '',
    mode: params.get('mode') || 'quick', intelligence_mode: params.get('intelligence_mode') || 'flash', limit: Number(params.get('limit') || 20),
  })
}
