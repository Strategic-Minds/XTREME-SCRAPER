import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 90

export async function POST(req: NextRequest) {
  const idempotencyKey = req.headers.get('idempotency-key') || crypto.randomUUID()
  const body = await req.text()
  const upstream = await fetch(new URL('/api/search', req.url), {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, body, cache: 'no-store',
  })
  const payload = await upstream.json()
  return NextResponse.json({ ...payload, api_version: 'v1', idempotency_key: idempotencyKey }, {
    status: upstream.status,
    headers: { 'Cache-Control': 'no-store', 'X-Idempotency-Key': idempotencyKey },
  })
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: '/api/v1/searches', method: 'POST', contract: 'intent -> sources -> policy -> evidence -> score -> action' })
}
