import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const ROUTES = ['/', '/product', '/solutions', '/industries', '/pricing', '/login', '/signup', '/dashboard', '/api/search', '/api/v1/searches']

export async function GET(req: NextRequest) {
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'Preview validation endpoint is disabled in production.' }, { status: 404 })
  }

  const origin = req.nextUrl.origin
  const checks = await Promise.all(ROUTES.map(async path => {
    const started = Date.now()
    try {
      const response = await fetch(`${origin}${path}`, { cache: 'no-store', signal: AbortSignal.timeout(15000) })
      const text = await response.text()
      return { path, ok: response.ok, status: response.status, duration_ms: Date.now() - started, xps_brand_present: path.startsWith('/api/') ? undefined : text.includes('XPS INTELLIGENCE') }
    } catch (error) {
      return { path, ok: false, status: 0, duration_ms: Date.now() - started, error: error instanceof Error ? error.message : 'request failed' }
    }
  }))

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

  const routePass = checks.every(check => check.ok && (check.xps_brand_present !== false))
  const searchPass = search.ok === true && search.dry_run === true
  return NextResponse.json({
    ok: routePass && searchPass,
    environment: process.env.VERCEL_ENV || 'unknown',
    commit_sha: process.env.VERCEL_GIT_COMMIT_SHA || null,
    route_pass: routePass,
    search_pass: searchPass,
    checks,
    search,
    timestamp: new Date().toISOString(),
  }, { status: routePass && searchPass ? 200 : 503, headers: { 'Cache-Control': 'no-store' } })
}
