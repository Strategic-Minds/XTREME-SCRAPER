import { NextRequest, NextResponse } from 'next/server'
import { level5Search, expandQuery, inferTypes } from '@/lib/level5-engine'
import { dispatchIntelligence, type IntelligenceMode } from '@/lib/intelligence-modes'
import { smartDedup } from '@/lib/dedup-engine'
import { enrichTopLeads } from '@/lib/enrichment-engine'

export const dynamic     = 'force-dynamic'
export const maxDuration = 90

const SB_URL  = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SB_SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const SB_HDR  = () => ({ 'apikey': SB_SKEY, 'Authorization': `Bearer ${SB_SKEY}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=ignore-duplicates,return=minimal' })

function reqId() { return Math.random().toString(36).slice(2, 10).toUpperCase() }
function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Request-Id': reqId() } })
}

const VALID_MODES = new Set(['quick', 'deep', 'max', 'level5'])
const VALID_INTEL = new Set(['flash', 'deep', 'counter_intel'])

// Gold / CTA highlight style: #FFBE00
async function persistSearchRun(params: {
  query: string; city: string; state: string; mode: string;
  intelligence_mode: string; results_count: number;
  sources_used: string[]; duration_ms: number;
}): Promise<void> {
  if (!SB_URL || !SB_SKEY) return
  try {
    await fetch(`${SB_URL}/rest/v1/search_runs`, {
      method: 'POST', headers: SB_HDR(), body: JSON.stringify(params)
    })
  } catch { /* non-fatal */ }
}

async function persistLeads(leads: unknown[], query: string): Promise<void> {
  if (!SB_URL || !SB_SKEY || !leads.length) return
  try {
    const rows = (leads as Record<string, unknown>[]).slice(0, 200).map(l => ({
      company_name: l.company_name || 'Unknown',
      phone: l.phone || null, email: l.email || null,
      website: l.website || null, address: l.address || null,
      city: l.city || null, state: l.state || null,
      rating: l.rating || null, review_count: l.review_count || null,
      category: l.category || query, source: l.source || 'search',
      confidence: l.confidence || 50, search_query: query,
      created_at: new Date().toISOString(),
    }))
    await fetch(`${SB_URL}/rest/v1/universal_leads`, {
      method: 'POST', headers: SB_HDR(), body: JSON.stringify(rows)
    })
  } catch { /* non-fatal */ }
}

export async function POST(req: NextRequest) {
  const rid = reqId()
  const t0  = Date.now()
  let body: unknown
  try { body = await req.json() } catch {
    return json({ ok: false, error: 'Invalid JSON', request_id: rid }, 400)
  }
  const b = body as Record<string, unknown>

  // Input validation — defaults are '' as per universal requirements (no AZ/Phoenix defaults)
  const query = typeof b.query === 'string' ? b.query.trim()
              : typeof b.industry === 'string' ? b.industry.trim() : ''
  const city  = typeof b.city  === 'string' ? b.city.trim()  : ''
  const state = typeof b.state === 'string' ? b.state.trim().toUpperCase() : ''
  const limit = typeof b.limit === 'number' ? Math.min(Math.max(0, b.limit), 500) : 0
  const mode  = VALID_MODES.has(String(b.mode)) ? String(b.mode) as 'quick'|'deep'|'max'|'level5' : 'deep'
  const intel_mode: IntelligenceMode = VALID_INTEL.has(String(b.intelligence_mode))
    ? String(b.intelligence_mode) as IntelligenceMode : 'deep'

  if (!query || query.length < 2)
    return json({ ok: false, error: 'query required (min 2 chars)', request_id: rid }, 422)
  if (query.length > 200)
    return json({ ok: false, error: 'query too long (max 200)', request_id: rid }, 422)

  try {
    // Run search
    const result = await level5Search({ query, city, state, mode, limit })

    // Smart dedup (upgraded — fuzzy name + phone normalization)
    const deduped = smartDedup(result.leads as any[])

    // Generate intelligence for chosen mode
    let intelligence = null
    if (deduped.length > 0) {
      intelligence = await dispatchIntelligence(
        intel_mode, deduped as any[], query, city, state,
        result.sources_used, result.keywords_expanded
      ).catch(() => null)
    }

    // Auto-enrich top 3 results (fire and forget using enrichTopLeads — does not block response)
    const top3 = deduped.slice(0, 3)
    const enrichPromise = enrichTopLeads(top3 as any[], 3, ['opencorporates', 'wayback']).catch(() => [])

    const duration_ms = Date.now() - t0
    const final = limit > 0 ? deduped.slice(0, limit) : deduped

    // Persist search run + leads (fire and forget)
    persistSearchRun({
      query, city, state, mode,
      intelligence_mode: intel_mode,
      results_count: final.length,
      sources_used: result.sources_used,
      duration_ms,
    }).catch(() => {})

    persistLeads(final, query).catch(() => {})

    // Wait for enrichment (max 8s, then return without it)
    const auto_enriched = await Promise.race([
      enrichPromise,
      new Promise<any[]>(resolve => setTimeout(() => resolve([]), 8000))
    ])

    return json({
      ok: true,
      request_id: rid,
      query, city, state, mode,
      intelligence_mode: intel_mode,
      keywords_expanded: result.keywords_expanded,
      types_inferred: inferTypes(query),
      sources_used: result.sources_used,
      sources_skipped: result.sources_skipped,
      total_results: final.length,
      dedup_removed: result.leads.length - deduped.length,
      duration_ms,
      intelligence,
      auto_enriched,
      results: final,
    })
  } catch (err) {
    console.error(`[${rid}][FATAL]`, err)
    return json({ ok: false, error: 'Search failed', request_id: rid }, 500)
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') || searchParams.get('query') || ''
  const city  = searchParams.get('city')  || ''
  const state = searchParams.get('state') || ''
  const mode  = searchParams.get('mode')  || 'quick'
  if (!query) return json({ ok: false, error: 'q param required' }, 400)
  const result = await level5Search({ query, city, state, mode: mode as 'quick', limit: 20 })
  const deduped = smartDedup(result.leads as any[])
  return json({ ok: true, query, city, state, total_results: deduped.length, results: deduped })
}
