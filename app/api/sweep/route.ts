import { NextRequest, NextResponse } from 'next/server'
import { googleMapsSearch, dedupeLeads, saveLeads, AZ_CITIES } from '@/lib/scraper-engine'

export const dynamic    = 'force-dynamic'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  const start = Date.now()
  const body  = await req.json()
  const {
    cities     = AZ_CITIES,
    state      = 'AZ',
    industry   = 'Epoxy Flooring',
    limit_per_city = 20,
  } = body as { cities?: string[]; state?: string; industry?: string; limit_per_city?: number }

  const perCity: { city: string; count: number; leads: unknown[] }[] = []
  let allLeads: ReturnType<typeof dedupeLeads> = []

  for (const city of cities.slice(0, 15)) {
    const leads = await googleMapsSearch(industry, city, state, limit_per_city)
    perCity.push({ city, count: leads.length, leads: leads.slice(0, 5) })
    allLeads.push(...leads)
    await new Promise(r => setTimeout(r, 600))
  }

  allLeads = dedupeLeads(allLeads)
  const ms  = Date.now() - start
  const saved = await saveLeads(allLeads, { industry, location: `${state} multi-city`, method: 'google_maps_sweep', ms })

  return NextResponse.json({
    ok: true, cities_swept: cities.length,
    total_leads: allLeads.length, leads_saved: saved.saved,
    duration_ms: ms, per_city: perCity,
  })
}

export async function GET() {
  return NextResponse.json({
    status: 'ready', endpoint: '/api/sweep',
    description: 'Multi-city Google Maps sweep — manual trigger only',
    default_cities: AZ_CITIES, max_cities: 15,
  })
}
