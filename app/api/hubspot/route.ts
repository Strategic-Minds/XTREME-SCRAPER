import { NextRequest, NextResponse } from 'next/server'
import { syncToHubSpot } from '@/lib/level5-engine'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const CRON_SEC = process.env.CRON_SECRET || ''
function authed(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  return auth === `Bearer ${CRON_SEC}` || req.headers.get('x-cron-secret') === CRON_SEC
}

export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const leads = body.leads || []
    if (!leads.length) return NextResponse.json({ ok: false, error: 'No leads provided' }, { status: 400 })
    const result = await syncToHubSpot(leads)
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ready', endpoint: '/api/hubspot', description: 'Sync leads array to HubSpot CRM companies', requires_auth: true })
}
