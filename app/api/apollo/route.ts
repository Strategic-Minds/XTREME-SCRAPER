import { NextRequest, NextResponse } from 'next/server'
import { apolloSearch, saveLeads } from '@/lib/scraper-engine'

export const dynamic    = 'force-dynamic'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const start  = Date.now()
  const body   = await req.json()
  const { industry = 'Epoxy Flooring', city = 'Phoenix', state = 'AZ', limit = 25 } = body as {
    industry?: string; city?: string; state?: string; limit?: number
  }
  const leads  = await apolloSearch(industry, city, state, limit)
  const ms     = Date.now() - start
  const saved  = leads.length > 0
    ? await saveLeads(leads, { industry, location: `${city}, ${state}`, method: 'apollo', ms })
    : { saved: 0 }
  return NextResponse.json({ ok: true, leads_found: leads.length, leads_saved: saved.saved, duration_ms: ms, leads })
}

export async function GET() {
  return NextResponse.json({
    status: 'ready', endpoint: '/api/apollo',
    configured: !!process.env.APOLLO_API_KEY_2,
    description: 'Apollo.io verified emails + direct dials',
  })
}
