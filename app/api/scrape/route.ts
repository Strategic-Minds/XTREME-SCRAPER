import { NextRequest, NextResponse } from 'next/server'
import {
  googleMapsSearch, maxKeywordSweep, bbbScrape, yellowPagesScrape,
  yelpSearch, bingLocalSearch, apolloSearch, aiLeads, saveLeads, dedupeLeads,
  XPS_KEYWORDS, GM_TYPE_FILTERS,
} from '@/lib/scraper-engine'

export const dynamic     = 'force-dynamic'
export const maxDuration = 90

export async function POST(req: NextRequest) {
  const start = Date.now()
  const body  = await req.json()
  const {
    industry = 'Epoxy Flooring',
    city     = 'Phoenix',
    state    = 'AZ',
    limit    = 20,
    mode     = 'quick',
  } = body as { industry?: string; city?: string; state?: string; limit?: number; mode?: 'quick' | 'deep' | 'max' }

  let all: ReturnType<typeof dedupeLeads> = []
  const methods: string[] = []
  const skipped: { source: string; reason: string }[] = []

  // ── QUICK: single GM keyword + BBB ─────────────────────────────────────────
  if (mode === 'quick') {
    const gm = await googleMapsSearch(industry, city, state, 20)
    if (gm.length) { all.push(...gm); methods.push('google_maps') }

    const bbb = await bbbScrape(industry, city, state, 1)
    if (bbb.length) { all.push(...bbb); methods.push('bbb') }

    const yp = await yellowPagesScrape(industry, city, state)
    if (yp.length) { all.push(...yp); methods.push('yellowpages') }
    else skipped.push({ source: 'yellowpages', reason: 'blocked on Vercel datacenter IP' })
  }

  // ── DEEP: 16 GM keywords + 4 type filters + BBB (3 pages) + YP + Yelp ──────
  if (mode === 'deep') {
    const gm = await maxKeywordSweep(city, state)
    if (gm.length) { all.push(...gm); methods.push('google_maps_max') }

    const bbb = await bbbScrape(industry, city, state, 3)
    if (bbb.length) { all.push(...bbb); methods.push('bbb') }

    const yp = await yellowPagesScrape(industry, city, state)
    if (yp.length) { all.push(...yp); methods.push('yellowpages') }
    else skipped.push({ source: 'yellowpages', reason: 'blocked on Vercel datacenter IP (needs ScrapingBee proxy)' })

    if (YELP_KEY) {
      const yl = await yelpSearch(industry, city, state, 50)
      if (yl.length) { all.push(...yl); methods.push('yelp') }
    } else skipped.push({ source: 'yelp', reason: 'YELP_API_KEY not set — free at yelp.com/developers' })

    if (BING_KEY) {
      const bn = await bingLocalSearch(industry, city, state, 25)
      if (bn.length) { all.push(...bn); methods.push('bing_maps') }
    } else skipped.push({ source: 'bing_maps', reason: 'BING_MAPS_KEY not set — free at bingmapsportal.com' })
  }

  // ── MAX: everything above + Apollo verified emails ──────────────────────────
  if (mode === 'max') {
    const gm = await maxKeywordSweep(city, state)
    if (gm.length) { all.push(...gm); methods.push('google_maps_max') }

    const bbb = await bbbScrape(industry, city, state, 3)
    if (bbb.length) { all.push(...bbb); methods.push('bbb') }

    const yp = await yellowPagesScrape(industry, city, state)
    if (yp.length) { all.push(...yp); methods.push('yellowpages') }
    else skipped.push({ source: 'yellowpages', reason: 'blocked on Vercel datacenter IP' })

    if (YELP_KEY) {
      const yl = await yelpSearch(industry, city, state, 50)
      if (yl.length) { all.push(...yl); methods.push('yelp') }
    } else skipped.push({ source: 'yelp', reason: 'YELP_API_KEY not set' })

    if (BING_KEY) {
      const bn = await bingLocalSearch(industry, city, state, 25)
      if (bn.length) { all.push(...bn); methods.push('bing_maps') }
    } else skipped.push({ source: 'bing_maps', reason: 'BING_MAPS_KEY not set' })

    if (AP_KEY) {
      const ap = await apolloSearch(industry, city, state, 50)
      if (ap.length) { all.push(...ap); methods.push('apollo') }
    } else skipped.push({ source: 'apollo', reason: 'APOLLO_API_KEY_2 not set' })
  }

  // ── Dedup ───────────────────────────────────────────────────────────────────
  all = dedupeLeads(all)

  // ── AI fallback only if <5 real results ────────────────────────────────────
  if (all.length < 5) {
    const ai = await aiLeads(industry, city, state, limit)
    if (ai.length) { all.push(...ai); methods.push('ai_gateway') }
    all = dedupeLeads(all)
  }

  const final = limit > 0 ? all.slice(0, limit) : all
  const ms    = Date.now() - start
  const saved = await saveLeads(final, { industry, location: `${city}, ${state}`, method: methods.join('+'), ms })

  return NextResponse.json({
    ok: true, mode, city, state, industry,
    sources_used: methods,
    skipped_sources: skipped,
    google_maps_used:     methods.some(m => m.startsWith('google_maps')),
    bbb_used:             methods.includes('bbb'),
    yellowpages_used:     methods.includes('yellowpages'),
    yelp_used:            methods.includes('yelp'),
    bing_used:            methods.includes('bing_maps'),
    apollo_used:          methods.includes('apollo'),
    ai_fallback_used:     methods.includes('ai_gateway'),
    keywords_active:      XPS_KEYWORDS.length,
    type_filters_active:  GM_TYPE_FILTERS.length,
    leads_found:    all.length,
    leads_returned: final.length,
    leads_saved:    saved.saved,
    duration_ms:    ms,
    leads: final,
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const YELP_KEY: any, BING_KEY: any, AP_KEY: any

export async function GET() {
  return NextResponse.json({
    status: 'ready', endpoint: '/api/scrape',
    keywords_total: XPS_KEYWORDS.length,
    type_filters: GM_TYPE_FILTERS.length,
    modes: {
      quick: '~15s — GM single + BBB + YP (~50 leads)',
      deep:  '~60s — 16 GM keywords + 4 type filters + BBB + YP + Yelp + Bing (~200 leads)',
      max:   '~90s — All sources + Apollo emails (~250 leads)',
    },
    free_sources: [
      { id: 'google_maps', name: 'Google Maps (16 keywords + 4 types)', cost: 'Free to 10k/mo', active: !!process.env.GOOGLE_MAPS_API_KEY },
      { id: 'bbb',         name: 'BBB.org (3 pages)',                   cost: '100% FREE',      active: true },
      { id: 'yellowpages', name: 'Yellow Pages (direct HTML)',           cost: '100% FREE',      active: true, note: 'works locally, blocked on Vercel datacenter IP' },
      { id: 'yelp',        name: 'Yelp Fusion (50/search)',             cost: 'Free 500/day',   active: !!process.env.YELP_API_KEY },
      { id: 'bing_maps',   name: 'Bing Maps Local',                     cost: 'Free 125k/yr',   active: !!process.env.BING_MAPS_KEY },
      { id: 'apollo',      name: 'Apollo.io (verified emails)',          cost: 'Free tier',      active: !!process.env.APOLLO_API_KEY_2 },
    ],
    capabilities: {
      google_maps: !!process.env.GOOGLE_MAPS_API_KEY,
      bbb: true,
      yellowpages: true,
      yelp:        !!process.env.YELP_API_KEY,
      bing_maps:   !!process.env.BING_MAPS_KEY,
      apollo:      !!process.env.APOLLO_API_KEY_2,
      browser_worker: !!(process.env.BROWSER_WORKER_TOKEN || process.env.BROWSER_WORKER_SECRET),
      ai_gateway:  !!process.env.AI_GATEWAY_API_KEY,
      scrapingbee: false,
    },
  })
}
