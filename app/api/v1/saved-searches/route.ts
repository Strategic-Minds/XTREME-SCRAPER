import { NextRequest, NextResponse } from 'next/server'
import { requireOrganization, supabaseBaseUrl, supabaseHeaders } from '@/lib/organization-auth'
import { enforceRequestLimit } from '@/lib/request-guard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await requireOrganization(req)
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status })
  const response = await fetch(`${supabaseBaseUrl()}/rest/v1/xps_saved_searches?organization_id=eq.${encodeURIComponent(auth.context.organizationId)}&select=id,name,intent,query,city,state,mode,intelligence_mode,filters,alert_enabled,last_run_at,created_at,updated_at&order=updated_at.desc&limit=100`, { headers: supabaseHeaders(), cache: 'no-store' })
  if (response.status === 404) return NextResponse.json({ ok: false, error: 'Saved-search schema is not installed in this environment.' }, { status: 503 })
  if (!response.ok) return NextResponse.json({ ok: false, error: 'Saved searches could not be loaded.' }, { status: 502 })
  return NextResponse.json({ ok: true, saved_searches: await response.json() }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest) {
  const rate = await enforceRequestLimit(req, 'saved-search', 20, 60)
  if (!rate.allowed) return NextResponse.json({ ok: false, error: 'Saved-search rate limit exceeded.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } })
  const auth = await requireOrganization(req, ['owner', 'admin', 'analyst', 'member'])
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status })
  const body = await req.json().catch(() => null) as Record<string, unknown> | null
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const query = typeof body?.query === 'string' ? body.query.trim() : ''
  const intent = typeof body?.intent === 'string' ? body.intent.trim() : 'find-opportunities'
  const city = typeof body?.city === 'string' ? body.city.trim() : null
  const state = typeof body?.state === 'string' ? body.state.trim().toUpperCase().slice(0, 2) : null
  const mode = ['quick', 'deep', 'max', 'level5'].includes(String(body?.mode)) ? String(body?.mode) : 'deep'
  const intelligenceMode = ['flash', 'deep', 'counter_intel'].includes(String(body?.intelligence_mode)) ? String(body?.intelligence_mode) : 'deep'
  const filters = body?.filters && typeof body.filters === 'object' ? body.filters : {}
  if (name.length < 2 || name.length > 100 || query.length < 2 || query.length > 240) return NextResponse.json({ ok: false, error: 'name must be 2-100 characters and query must be 2-240 characters.' }, { status: 422 })

  const response = await fetch(`${supabaseBaseUrl()}/rest/v1/xps_saved_searches`, {
    method: 'POST',
    headers: supabaseHeaders('return=representation'),
    body: JSON.stringify({ organization_id: auth.context.organizationId, created_by: auth.context.userId, name, intent, query, city, state, mode, intelligence_mode: intelligenceMode, filters, alert_enabled: false }),
  })
  if (response.status === 404) return NextResponse.json({ ok: false, error: 'Saved-search schema is not installed in this environment.' }, { status: 503 })
  if (!response.ok) return NextResponse.json({ ok: false, error: 'Saved search could not be created.' }, { status: 502 })
  const rows = await response.json() as unknown[]
  return NextResponse.json({ ok: true, saved_search: rows[0] || null }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
}
