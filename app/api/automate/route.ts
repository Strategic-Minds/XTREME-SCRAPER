import { NextRequest, NextResponse } from 'next/server'
import { maxKeywordSweep, multiCitySweep, googleMapsSearch, dedupeLeads, saveLeads, AZ_CITIES } from '@/lib/scraper-engine'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const CRON_SEC = process.env.CRON_SECRET || ''

function authed(req: NextRequest): boolean {
  if (!CRON_SEC) return false
  const auth = req.headers.get('authorization') || ''
  const key = req.headers.get('x-cron-secret') || ''
  return auth === `Bearer ${CRON_SEC}` || key === CRON_SEC
}

export async function GET() {
  return NextResponse.json({
    status: 'manual_only',
    note: 'Automation cron is disabled. Authenticated POST execution is required.',
    available_actions: [
      { action: 'run_discovery', description: 'Single city keyword sweep through Google Maps', estimated_time: '30s' },
      { action: 'multi_city_sweep', description: 'Approved city list with a primary industry query', estimated_time: '90s' },
      { action: 'keyword_expansion', description: 'Industry query plus the controlled keyword suite', estimated_time: '60s' },
      { action: 'full_state_max', description: 'Approved city list and primary industry query', estimated_time: '120s' },
    ],
  })
}

export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ ok: false, error: 'Unauthorized automation request' }, { status: 401 })

  const start = Date.now()
  const body = await req.json().catch(() => null) as {
    action?: string
    config?: { city?: string; state?: string; industry?: string; limit?: number; cities?: string[] }
    dry_run?: boolean
  } | null
  if (!body) return NextResponse.json({ ok: false, error: 'Valid JSON body required' }, { status: 400 })

  const action = body.action || 'run_discovery'
  const config = body.config || {}
  const city = config.city || 'Phoenix'
  const state = config.state || 'AZ'
  const industry = config.industry || 'Epoxy Flooring'
  const limit = Math.min(Math.max(config.limit || 20, 1), 500)
  const dryRun = body.dry_run === true

  let leads: ReturnType<typeof dedupeLeads> = []
  let method = action

  if (action === 'run_discovery') {
    leads = await googleMapsSearch(industry, city, state, limit)
    method = 'single_query_google_maps'
  } else if (action === 'multi_city_sweep') {
    const cities = config.cities?.slice(0, 25) || AZ_CITIES
    const results = await multiCitySweep(cities, state, industry)
    leads = dedupeLeads(results.flatMap(result => result.leads))
    method = 'multi_city_google_maps'
  } else if (action === 'keyword_expansion') {
    const [expanded, direct] = await Promise.all([
      maxKeywordSweep(city, state),
      googleMapsSearch(industry, city, state, limit),
    ])
    leads = dedupeLeads([...expanded, ...direct])
    method = 'controlled_keyword_expansion'
  } else if (action === 'full_state_max') {
    const results = await multiCitySweep((config.cities?.slice(0, 25) || AZ_CITIES), state, industry)
    leads = dedupeLeads(results.flatMap(result => result.leads))
    method = 'multi_city_primary_query'
  } else {
    return NextResponse.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400 })
  }

  const final = leads.slice(0, limit)
  const ms = Date.now() - start
  const saved = dryRun ? { saved: 0 } : await saveLeads(final, { industry, location: `${city}, ${state}`, method, ms })

  return NextResponse.json({
    ok: true,
    dry_run: dryRun,
    action,
    method,
    leads_found: leads.length,
    leads_returned: final.length,
    leads_saved: saved.saved,
    duration_ms: ms,
    leads: final.slice(0, 20),
  }, { headers: { 'Cache-Control': 'no-store' } })
}
