import { NextRequest, NextResponse } from 'next/server'
import { googleMapsSearch, scrapingBeeScrape, apolloSearch, bwValidate, aiLeads, saveLeads, dedupeLeads } from '@/lib/scraper-engine'

export const dynamic    = 'force-dynamic'
export const maxDuration = 90

export async function POST(req: NextRequest) {
  const start = Date.now()
  const body  = await req.json()
  const { industry = 'Epoxy Flooring', city = 'Phoenix', state = 'AZ', limit = 20, mode = 'quick', sources = [] } = body as {
    industry?: string; city?: string; state?: string; limit?: number
    mode?: 'quick' | 'deep' | 'max'; sources?: string[]
  }

  let all: ReturnType<typeof dedupeLeads> = []
  const methods: string[] = []

  // ── Tier 1: Google Maps (always) ──
  const gmLeads = await googleMapsSearch(industry, city, state, mode === 'quick' ? 20 : 60)
  if (gmLeads.length) { all.push(...gmLeads); methods.push('google_maps') }

  // ── Tier 2: ScrapingBee (deep + max) ──
  if ((mode === 'deep' || mode === 'max') && process.env.SCRAPINGBEE_API_KEY) {
    const sbLeads = await scrapingBeeScrape(industry, city, state)
    if (sbLeads.length) { all.push(...sbLeads); methods.push('scrapingbee') }
  }

  // ── Tier 3: Apollo (max only) ──
  if (mode === 'max' && process.env.APOLLO_API_KEY_2) {
    const apLeads = await apolloSearch(industry, city, state, limit)
    if (apLeads.length) { all.push(...apLeads); methods.push('apollo') }
  }

  // ── Dedup ──
  all = dedupeLeads(all)

  // ── Tier 4: BW validate top result ──
  let bwValidated = false
  if (all[0]?.website) bwValidated = await bwValidate(all[0].website)

  // ── Tier 5: AI fallback (only if <3 leads) ──
  if (all.length < 3) {
    const ai = await aiLeads(industry, city, state, limit)
    if (ai.length) { all.push(...ai); methods.push('ai_gateway') }
    all = dedupeLeads(all)
  }

  const final = all.slice(0, limit)
  const ms    = Date.now() - start
  const saved = await saveLeads(final, { industry, location: `${city}, ${state}`, method: methods.join('+'), ms })

  return NextResponse.json({
    ok: true, mode,
    sources_used: methods,
    google_maps_used:     methods.includes('google_maps'),
    scrapingbee_used:     methods.includes('scrapingbee'),
    apollo_used:          methods.includes('apollo'),
    ai_fallback_used:     methods.includes('ai_gateway'),
    browser_worker_validated: bwValidated,
    leads_found:  final.length,
    leads_saved:  saved.saved,
    duration_ms:  ms,
    leads: final,
  })
}

export async function GET() {
  return NextResponse.json({
    status: 'ready', endpoint: '/api/scrape',
    modes: { quick: '~5s, GM single query', deep: '~45s, GM+ScrapingBee', max: '~90s, GM+SB+Apollo' },
    capabilities: {
      google_maps:    !!process.env.GOOGLE_MAPS_API_KEY,
      scrapingbee:    !!process.env.SCRAPINGBEE_API_KEY,
      apollo:         !!process.env.APOLLO_API_KEY_2,
      browser_worker: !!(process.env.BROWSER_WORKER_TOKEN || process.env.BROWSER_WORKER_SECRET),
      ai_gateway:     !!process.env.AI_GATEWAY_API_KEY,
    },
  })
}
