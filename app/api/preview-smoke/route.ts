import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const PAGE_ROUTES = [
  '/', '/product', '/solutions', '/industries', '/pricing', '/login', '/signup',
  '/dashboard', '/search', '/results', '/companies', '/people', '/contacts',
  '/opportunities', '/markets', '/signals', '/saved', '/alerts', '/exports',
  '/settings', '/billing', '/admin', '/contractor',
]

const API_ROUTES = ['/api/search', '/api/v1/searches', '/api/billing/plans', '/api/session']

async function checkRoute(origin: string, path: string, brandRequired: boolean) {
  const started = Date.now()
  try {
    const response = await fetch(`${origin}${path}`, { cache: 'no-store', signal: AbortSignal.timeout(15000) })
    const text = await response.text()
    return {
      path,
      ok: response.ok,
      status: response.status,
      duration_ms: Date.now() - started,
      xps_brand_present: brandRequired ? text.includes('XPS INTELLIGENCE') : undefined,
    }
  } catch (error) {
    return { path, ok: false, status: 0, duration_ms: Date.now() - started, error: error instanceof Error ? error.message : 'request failed' }
  }
}

export async function GET(req: NextRequest) {
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'Preview validation endpoint is disabled in production.' }, { status: 404 })
  }

  const origin = req.nextUrl.origin
  const checks = await Promise.all([
    ...PAGE_ROUTES.map(path => checkRoute(origin, path, true)),
    ...API_ROUTES.map(path => checkRoute(origin, path, false)),
  ])

  let search: Record<string, unknown>
  try {
    const response = await fetch(`${origin}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'commercial flooring contractors', city: 'Miami', state: 'FL', mode: 'quick', intelligence_mode: 'flash', limit: 5, dry_run: true }),
      cache: 'no-store',
      signal: AbortSignal.timeout(90000),
    })
    const payload = await response.json() as Record<string, unknown>
    search = {
      ok: response.ok && payload.ok === true,
      status: response.status,
      dry_run: payload.dry_run,
      total_results: payload.total_results,
      quarantined_count: payload.quarantined_count,
      sources_used: payload.sources_used,
      persistence: payload.persistence,
      warnings: payload.warnings,
    }
  } catch (error) {
    search = { ok: false, error: error instanceof Error ? error.message : 'search validation failed' }
  }

  let score: Record<string, unknown>
  try {
    const response = await fetch(`${origin}/api/v1/opportunities/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: [{ company_name: 'Preview Validation Company', phone: '555-0100', city: 'Miami', state: 'FL', source: 'google_maps', confidence: 70 }] }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    })
    const payload = await response.json() as Record<string, unknown>
    score = { ok: response.ok && payload.ok === true, status: response.status, predictive: payload.predictive, model_version: payload.model_version }
  } catch (error) {
    score = { ok: false, error: error instanceof Error ? error.message : 'score validation failed' }
  }

  let copilot: Record<string, unknown>
  try {
    const response = await fetch(`${origin}/api/v1/copilot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Why does this result matter?', context: [{ company_name: 'Preview Validation Company', opportunity_score: 72, source: 'google_maps', evidence: [{ id: 'E1', label: 'Phone available', value: '555-0100', source: 'google_maps' }] }] }),
      cache: 'no-store',
      signal: AbortSignal.timeout(45000),
    })
    const payload = await response.json() as Record<string, unknown>
    copilot = { ok: response.ok && payload.ok === true, status: response.status, mode: payload.mode, citations_present: Array.isArray(payload.citations) }
  } catch (error) {
    copilot = { ok: false, error: error instanceof Error ? error.message : 'copilot validation failed' }
  }

  const routePass = checks.every(check => check.ok && (check.xps_brand_present !== false))
  const searchPass = search.ok === true && search.dry_run === true
  const scorePass = score.ok === true && score.predictive === false
  const copilotPass = copilot.ok === true && copilot.citations_present === true
  const ok = routePass && searchPass && scorePass && copilotPass

  return NextResponse.json({
    ok,
    environment: process.env.VERCEL_ENV || 'unknown',
    commit_sha: process.env.VERCEL_GIT_COMMIT_SHA || null,
    route_pass: routePass,
    search_pass: searchPass,
    score_pass: scorePass,
    copilot_pass: copilotPass,
    checks,
    search,
    score,
    copilot,
    timestamp: new Date().toISOString(),
  }, { status: ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } })
}
