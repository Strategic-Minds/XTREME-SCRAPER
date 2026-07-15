import { NextRequest, NextResponse } from 'next/server'
import { multiKeywordSweep, multiCitySweep, googleMapsSearch, scrapingBeeScrape, dedupeLeads, saveLeads, AZ_CITIES, XPS_KEYWORDS } from '@/lib/scraper-engine'

export const dynamic    = 'force-dynamic'
export const maxDuration = 120

const CRON_SEC = process.env.CRON_SECRET || ''

function authed(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') || ''
  const key  = req.headers.get('x-cron-secret') || ''
  return auth === `Bearer ${CRON_SEC}` || key === CRON_SEC
}

export async function GET() {
  return NextResponse.json({
    status: 'manual_only',
    note: 'Automation cron is disabled — use dashboard toggle or POST to run manually',
    available_actions: [
      { action: 'run_discovery',      description: 'Single city, all 8 keywords via Google Maps', estimated_leads: '60-160', estimated_time: '30s' },
      { action: 'multi_city_sweep',   description: 'All 15 AZ cities, primary keyword', estimated_leads: '100-300', estimated_time: '90s' },
      { action: 'keyword_expansion',  description: 'Single city, deep mode (GM + ScrapingBee)', estimated_leads: '80-200', estimated_time: '60s' },
      { action: 'full_state_max',     description: 'All cities + all keywords — maximum coverage', estimated_leads: '500+', estimated_time: '120s' },
    ],
  })
}

export async function POST(req: NextRequest) {
  const start = Date.now()
  const body  = await req.json()
  const { action = 'run_discovery', config = {} } = body as {
    action?: string
    config?: { city?: string; state?: string; industry?: string; limit?: number; cities?: string[] }
  }

  const city     = config.city     || 'Phoenix'
  const state    = config.state    || 'AZ'
  const industry = config.industry || 'Epoxy Flooring'
  const limit    = config.limit    || 20

  let leads: ReturnType<typeof dedupeLeads> = []
  let method = action

  if (action === 'run_discovery') {
    // All 8 keywords for one city via GM
    leads = await multiKeywordSweep(city, state)
    method = 'multi_keyword_google_maps'
  } else if (action === 'multi_city_sweep') {
    const cities  = config.cities || AZ_CITIES
    const results = await multiCitySweep(cities, state, industry)
    leads  = dedupeLeads(results.flatMap(r => r.leads))
    method = 'multi_city_google_maps'
  } else if (action === 'keyword_expansion') {
    // GM + ScrapingBee for one city
    const gmLeads = await multiKeywordSweep(city, state)
    const sbLeads = await scrapingBeeScrape(industry, city, state)
    leads  = dedupeLeads([...gmLeads, ...sbLeads])
    method = 'keyword_expansion_gm_sb'
  } else if (action === 'full_state_max') {
    // All cities × primary keyword (GM only — respects timeout)
    const results = await multiCitySweep(AZ_CITIES, state, industry)
    leads  = dedupeLeads(results.flatMap(r => r.leads))
    method = 'full_state_google_maps'
  } else {
    return NextResponse.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400 })
  }

  const ms    = Date.now() - start
  const saved = await saveLeads(leads, { industry, location: `${city}, ${state}`, method, ms })

  return NextResponse.json({
    ok: true, action, method,
    leads_found:  leads.length,
    leads_saved:  saved.saved,
    duration_ms:  ms,
    leads: leads.slice(0, 20),
  })
}
