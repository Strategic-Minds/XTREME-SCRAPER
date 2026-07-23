import { NextRequest, NextResponse } from 'next/server'
import { universalSearch, expandKeywords, inferGMTypes } from '@/lib/universal-engine'

export const dynamic     = 'force-dynamic'
export const maxDuration = 90

function reqId() { return Math.random().toString(36).slice(2, 10).toUpperCase() }

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Request-Id': reqId() } })
}

const VALID_MODES = new Set(['quick', 'deep', 'max'])

export async function POST(req: NextRequest) {
  const rid = reqId()
  let body: unknown
  try { body = await req.json() } catch { return json({ ok: false, error: 'Invalid JSON', request_id: rid }, 400) }

  const b = body as Record<string, unknown>
  const raw_query = typeof b.query === 'string' ? b.query.trim() : typeof b.industry === 'string' ? b.industry.trim() : ''
  const city      = typeof b.city  === 'string' ? b.city.trim()  : 'Phoenix'
  const state     = typeof b.state === 'string' ? b.state.trim().toUpperCase() : 'AZ'
  const limit     = typeof b.limit === 'number' ? Math.min(Math.max(0, b.limit), 500) : 0
  const mode      = VALID_MODES.has(String(b.mode)) ? String(b.mode) as 'quick'|'deep'|'max' : 'quick'

  if (!raw_query || raw_query.length < 2) return json({ ok: false, error: 'query is required (min 2 chars)', request_id: rid }, 422)
  if (raw_query.length > 200) return json({ ok: false, error: 'query too long (max 200 chars)', request_id: rid }, 422)
  if (city.length < 2 || city.length > 100) return json({ ok: false, error: 'city must be 2-100 chars', request_id: rid }, 422)

  try {
    const result = await universalSearch({ raw_query, city, state, limit, mode })
    return json({
      ok: true, request_id: rid,
      query: raw_query, city, state, mode,
      keywords_used: result.keywords_used,
      types_used: inferGMTypes(raw_query),
      sources_used: result.sources_used,
      total_results: result.results.length,
      duration_ms: result.duration_ms,
      results: result.results,
    })
  } catch (err) {
    console.error(`[${rid}][FATAL]`, err)
    return json({ ok: false, error: 'Search failed', request_id: rid }, 500)
  }
}

export async function GET() {
  return json({
    status: 'ready',
    endpoint: '/api/search',
    description: 'Universal search — any industry, any city, any category',
    usage: { method: 'POST', body: { query: 'plumbers', city: 'Dallas', state: 'TX', mode: 'deep', limit: 100 } },
    modes: {
      quick: '~3s — top keyword + BBB (~40 results)',
      deep: '~20s — all keywords + type filters + BBB (~150 results)',
      max: '~45s — everything + Apollo (~200+ results)',
    },
    examples: [
      { query: 'plumbers', city: 'Dallas', state: 'TX' },
      { query: 'wedding photographers', city: 'Austin', state: 'TX' },
      { query: 'roofing contractors', city: 'Denver', state: 'CO' },
      { query: 'accountants', city: 'Chicago', state: 'IL' },
      { query: 'restaurants', city: 'Miami', state: 'FL' },
    ],
  })
}
