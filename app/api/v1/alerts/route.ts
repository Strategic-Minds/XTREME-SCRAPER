import { NextRequest, NextResponse } from 'next/server'
import { requireOrganization, supabaseBaseUrl, supabaseHeaders } from '@/lib/organization-auth'
import { enforceRequestLimit } from '@/lib/request-guard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await requireOrganization(req)
  if ('error' in auth) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status })
  const response = await fetch(`${supabaseBaseUrl()}/rest/v1/xps_alerts?organization_id=eq.${encodeURIComponent(auth.context.organizationId)}&select=id,saved_search_id,status,cadence,signal_types,minimum_confidence,last_checked_at,next_check_at,created_at,updated_at&order=updated_at.desc&limit=100`, { headers: supabaseHeaders(), cache: 'no-store' })
  if (response.status === 404) return NextResponse.json({ ok: false, error: 'Alert schema is not installed in this environment.' }, { status: 503 })
  if (!response.ok) return NextResponse.json({ ok: false, error: 'Alerts could not be loaded.' }, { status: 502 })
  return NextResponse.json({ ok: true, alerts: await response.json(), delivery_enabled: false }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest) {
  const rate = await enforceRequestLimit(req, 'alert', 10, 60)
  if (!rate.allowed) return NextResponse.json({ ok: false, error: 'Alert rate limit exceeded.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } })
  const auth = await requireOrganization(req, ['owner', 'admin', 'analyst', 'member'])
  if ('error' in auth) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status })
  const body = await req.json().catch(() => null) as Record<string, unknown> | null
  const savedSearchId = typeof body?.saved_search_id === 'string' ? body.saved_search_id : ''
  const cadence = ['hourly', 'daily', 'weekly'].includes(String(body?.cadence)) ? String(body?.cadence) : 'daily'
  const signalTypes = Array.isArray(body?.signal_types) ? body.signal_types.filter(item => typeof item === 'string').slice(0, 20) : []
  const minimumConfidence = typeof body?.minimum_confidence === 'number' ? Math.min(100, Math.max(0, body.minimum_confidence)) : 70
  if (!/^[0-9a-f-]{36}$/i.test(savedSearchId)) return NextResponse.json({ ok: false, error: 'A valid saved_search_id is required.' }, { status: 422 })

  const saved = await fetch(`${supabaseBaseUrl()}/rest/v1/xps_saved_searches?id=eq.${encodeURIComponent(savedSearchId)}&organization_id=eq.${encodeURIComponent(auth.context.organizationId)}&select=id&limit=1`, { headers: supabaseHeaders(), cache: 'no-store' })
  if (!saved.ok) return NextResponse.json({ ok: false, error: 'Saved search ownership could not be verified.' }, { status: saved.status === 404 ? 503 : 502 })
  const savedRows = await saved.json() as unknown[]
  if (!savedRows.length) return NextResponse.json({ ok: false, error: 'Saved search was not found in this organization.' }, { status: 404 })

  const response = await fetch(`${supabaseBaseUrl()}/rest/v1/xps_alerts`, {
    method: 'POST',
    headers: supabaseHeaders('return=representation'),
    body: JSON.stringify({ organization_id: auth.context.organizationId, saved_search_id: savedSearchId, created_by: auth.context.userId, status: 'paused', cadence, signal_types: signalTypes, minimum_confidence: minimumConfidence }),
  })
  if (response.status === 404) return NextResponse.json({ ok: false, error: 'Alert schema is not installed in this environment.' }, { status: 503 })
  if (!response.ok) return NextResponse.json({ ok: false, error: 'Alert could not be created.' }, { status: 502 })
  const rows = await response.json() as unknown[]
  return NextResponse.json({ ok: true, alert: rows[0] || null, delivery_enabled: false, notice: 'The alert is created in paused state. Activating scheduled delivery requires queue and communication approval.' }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
}
