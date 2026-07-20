import { NextRequest, NextResponse } from 'next/server'
import {
  googleMapsSearch, multiKeywordSweep, yellowPagesScrape,
  yelpSearch, bingLocalSearch, apolloSearch, bwValidate, aiLeads,
  saveLeads, dedupeLeads,
} from '@/lib/scraper-engine'

export const dynamic    = 'force-dynamic'
export const maxDuration = 90

export async function POST(req: NextRequest) {
  const start = Date.now()
  const body  = await req.json()
  const {
    industry = 'Epoxy Flooring', city = 'Phoenix', state = 'AZ',
    limit = 20, mode = 'quick',
  } = body as { industry?: string; city?: string; state?: string; limit?: number; mode?: 'quick' | 'deep' | 'max' }

  let all: ReturnType<typeof dedupeLeads> = []
  const methods: string[] = []
  const skipped: { source: string; reason: string }[] = []

  // ── QUICK: Google Maps single keyword ───────────────────────────────────
  if (mode === 'quick') {
    const gm = await googleMapsSearch(industry, city, state, 20)
    if (gm.length) { all.push(...gm); methods.push('google_maps') }

    // Yellow Pages direct — free, no key
    const yp = await yellowPagesScrape(industry, city, state)
    if (yp.length) { all.push(...yp); methods.push('yellowpages') }
    else skipped.push({ source: 'yellowpages', reason: 'no results or blocked' })
  }

  // ── DEEP: All 8 GM keywords + Yellow Pages + Yelp ──────────────────────
  if (mode === 'deep') {
    const gm = await multiKeywordSweep(city, state)
    if (gm.length) { all.push(...gm); methods.push('google_maps_multi') }

    const yp = await yellowPagesScrape(industry, city, state)
    if (yp.length) { all.push(...yp); methods.push('yellowpages') }

    if (process.env.YELP_API_KEY) {
      const yl = await yelpSearch(industry, city, state, 50)
      if (yl.length) { all.push(...yl); methods.push('yelp') }
    } else {
      skipped.push({ source: 'yelp', reason: 'YELP_API_KEY not configured — free at yelp.com/developers' })
    }

    if (process.env.BING_MAPS_KEY) {
      const bn = await bingLocalSearch(industry, city, state, 25)
      if (bn.length) { all.push(...bn); methods.push('bing_maps') }
    } else {
      skipped.push({ source: 'bing_maps', reason: 'BING_MAPS_KEY not configured — free at bingmapsportal.com' })
    }
  }

  // ── MAX: Deep + Apollo verified emails ─────────────────────────────────
  if (mode === 'max') {
    const gm = await multiKeywordSweep(city, state)
    if (gm.length) { all.push(...gm); methods.push('google_maps_multi') }

    const yp = await yellowPagesScrape(industry, city, state)
    if (yp.length) { all.push(...yp); methods.push('yellowpages') }

    if (process.env.YELP_API_KEY) {
      const yl = await yelpSearch(industry, city, state, 50)
      if (yl.length) { all.push(...yl); methods.push('yelp') }
    } else skipped.push({ source: 'yelp', reason: 'YELP_API_KEY not configured' })

    if (process.env.BING_MAPS_KEY) {
      const bn = await bingLocalSearch(industry, city, state, 25)
      if (bn.length) { all.push(...bn); methods.push('bing_maps') }
    } else skipped.push({ source: 'bing_maps', reason: 'BING_MAPS_KEY not configured' })

    if (process.env.APOLLO_API_KEY_2) {
      const ap = await apolloSearch(industry, city, state, limit)
      if (ap.length) { all.push(...ap); methods.push('apollo') }
    } else skipped.push({ source: 'apollo', reason: 'APOLLO_API_KEY_2 not configured' })
  }

  // ── Dedup ───────────────────────────────────────────────────────────────
  all = dedupeLeads(all)

  // ── BW validate top result ──────────────────────────────────────────────
  let bwValidated = false
  if (all[0]?.website) bwValidated = await bwValidate(all[0].website)

  // ── AI fallback only if <5 leads from real sources ─────────────────────
  if (all.length < 5) {
    const ai = await aiLeads(industry, city, state, limit)
    if (ai.length) { all.push(...ai); methods.push('ai_gateway') }
    all = dedupeLeads(all)
  }

  const final = all.slice(0, Math.max(limit, 20))
  const ms    = Date.now() - start
  const saved = await saveLeads(final, { industry, location: `${city}, ${state}`, method: methods.join('+'), ms })

  return NextResponse.json({
    ok: true, mode, city, state, industry,
    sources_used: methods,
    skipped_sources: skipped,
    google_maps_used:    methods.some(m => m.startsWith('google_maps')),
    yellowpages_used:    methods.includes('yellowpages'),
    yelp_used:           methods.includes('yelp'),
    bing_used:           methods.includes('bing_maps'),
    apollo_used:         methods.includes('apollo'),
    ai_fallback_used:    methods.includes('ai_gateway'),
    browser_worker_validated: bwValidated,
    leads_found:    final.length,
    leads_saved:    saved.saved,
    duration_ms:    ms,
    leads: final,
  })
}

export async function GET() {
  return NextResponse.json({
    status: 'ready', endpoint: '/api/scrape',
    modes: {
      quick: '~10s — Google Maps + Yellow Pages direct (no key needed)',
      deep:  '~30s — 8 keywords + Yellow Pages + Yelp + Bing (~100 leads)',
      max:   '~60s — All sources + Apollo emails (~130 leads)',
    },
    free_sources: [
      { id: 'google_maps', name: 'Google Maps Places', key_required: 'GOOGLE_MAPS_API_KEY', cost: 'Free to 10k/mo', active: !!process.env.GOOGLE_MAPS_API_KEY },
      { id: 'yellowpages', name: 'Yellow Pages Direct HTML', key_required: 'none', cost: '100% FREE', active: true },
      { id: 'yelp', name: 'Yelp Fusion API', key_required: 'YELP_API_KEY', cost: 'Free 500/day', active: !!process.env.YELP_API_KEY },
      { id: 'bing_maps', name: 'Bing Maps Local Search', key_required: 'BING_MAPS_KEY', cost: 'Free 125k/yr', active: !!process.env.BING_MAPS_KEY },
      { id: 'apollo', name: 'Apollo.io Verified Emails', key_required: 'APOLLO_API_KEY_2', cost: 'Free tier available', active: !!process.env.APOLLO_API_KEY_2 },
    ],
    capabilities: {
      google_maps: !!process.env.GOOGLE_MAPS_API_KEY,
      yellowpages: true,
      yelp:        !!process.env.YELP_API_KEY,
      bing_maps:   !!process.env.BING_MAPS_KEY,
      apollo:      !!process.env.APOLLO_API_KEY_2,
      browser_worker: !!(process.env.BROWSER_WORKER_TOKEN || process.env.BROWSER_WORKER_SECRET),
      ai_gateway:  !!process.env.AI_GATEWAY_API_KEY,
      scrapingbee: false, // exhausted
    },
  })
}
