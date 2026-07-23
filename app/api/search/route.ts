import { NextRequest, NextResponse } from 'next/server'
import { level5Search, expandQuery, inferTypes } from '@/lib/level5-engine'
import { generateDeepInsight, generateFastInsight } from '@/lib/deep-intelligence'

export const dynamic     = 'force-dynamic'
export const maxDuration = 90

function reqId() { return Math.random().toString(36).slice(2, 10).toUpperCase() }
function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Request-Id': reqId() } })
}

const VALID_MODES = new Set(['quick', 'deep', 'max', 'level5'])

export async function POST(req: NextRequest) {
  const rid = reqId()
  let body: unknown
  try { body = await req.json() } catch { return json({ ok: false, error: 'Invalid JSON', request_id: rid }, 400) }

  const b = body as Record<string, unknown>
  const query = typeof b.query === 'string' ? b.query.trim() : typeof b.industry === 'string' ? b.industry.trim() : ''
  const city  = typeof b.city === 'string' ? b.city.trim() : 'Phoenix'
  const state = typeof b.state === 'string' ? b.state.trim().toUpperCase() : 'AZ'
  const limit = typeof b.limit === 'number' ? Math.min(Math.max(0, Math.floor(b.limit)), 500) : 0
  const mode  = VALID_MODES.has(String(b.mode)) ? String(b.mode) as 'quick'|'deep'|'max'|'level5' : 'deep'

  if (!query || query.length < 2) return json({ ok: false, error: 'query is required (min 2 chars)', request_id: rid }, 422)
  if (query.length > 200) return json({ ok: false, error: 'query too long (max 200 chars)', request_id: rid }, 422)

  try {
    const result = await level5Search({ query, city, state, mode, limit })

    // Generate deep insight (try AI version, fall back to fast version)
    let insight = null
    let uses_ai = false
    if (result.leads.length > 0) {
      // Try AI insight (25s timeout budget already in the function)
      insight = await generateDeepInsight(query, city, state, result.leads, result.sources_used, result.keywords_expanded)
        .catch(() => null)
      if (insight) {
        uses_ai = true
      } else {
        insight = generateFastInsight(query, city, state, result.leads, result.sources_used)
      }
    }

    return json({
      ok: true, request_id: rid,
      query, city, state, mode,
      keywords_expanded: result.keywords_expanded,
      types_inferred: inferTypes(query),
      sources_used: result.sources_used,
      sources_skipped: result.sources_skipped,
      total_results: result.total,
      duration_ms: result.duration_ms,
      results: result.leads,
      deep_insight: insight,
      insight_type: insight ? (uses_ai ? 'ai_generated' : 'data_computed') : 'unavailable',
    })
  } catch (err) {
    console.error(`[${rid}][FATAL]`, err)
    return json({ ok: false, error: 'Search failed', request_id: rid }, 500)
  }
}

export async function GET() {
  return json({
    status: 'ready', version: 'level5',
    endpoint: '/api/search',
    description: 'Level 5 Universal Intelligence Engine — any industry, any city, any category',
    modes: {
      quick:  '~3s  — Google Maps + BBB (~40 results)',
      deep:   '~15s — 16 GM keywords + types + BBB + YP + Apollo (~150 results)',
      max:    '~30s — All above sources fully saturated (~200 results)',
      level5: '~60s — All above + Firecrawl + BrowserWorker + GM enrichment (~250 results)',
    },
    sources: [
      { id: 'google_maps',     active: !!process.env.GOOGLE_MAPS_API_KEY,    free: false, note: 'Primary — text search' },
      { id: 'google_maps_type',active: !!process.env.GOOGLE_MAPS_API_KEY,    free: false, note: 'Nearby search by type' },
      { id: 'bbb',            active: true,                                   free: true,  note: 'Direct HTML scrape' },
      { id: 'yellowpages',    active: true,                                   free: true,  note: 'Direct + ScrapingBee proxy' },
      { id: 'apollo',         active: !!process.env.APOLLO_API_KEY_2,         free: false, note: 'Verified contacts + emails' },
      { id: 'firecrawl',      active: !!process.env.FIRECRAWL_API_KEY,        free: false, note: 'Deep page extraction' },
      { id: 'browser_worker', active: !!(process.env.BROWSER_WORKER_SECRET), free: false, note: 'Cloud Chromium JS rendering' },
      { id: 'scrapingbee',    active: !!process.env.SCRAPINGBEE_API_KEY,      free: false, note: 'Cloudflare bypass proxy' },
      { id: 'ai_intelligence',active: !!process.env.AI_GATEWAY_API_KEY,       free: false, note: 'AI fallback (verified known businesses)' },
    ],
    examples: [
      { query: 'plumbers', city: 'Dallas', state: 'TX', mode: 'deep' },
      { query: 'wedding photographers', city: 'Austin', state: 'TX', mode: 'deep' },
      { query: 'epoxy flooring', city: 'Phoenix', state: 'AZ', mode: 'level5' },
      { query: 'accountants', city: 'Chicago', state: 'IL', mode: 'deep' },
      { query: 'roofing contractors', city: 'Denver', state: 'CO', mode: 'max' },
    ],
  })
}
