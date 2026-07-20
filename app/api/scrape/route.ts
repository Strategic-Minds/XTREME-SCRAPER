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
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 }) }

  const industry = typeof body.industry === 'string' ? body.industry : 'Epoxy Flooring'
  const city     = typeof body.city     === 'string' ? body.city     : 'Phoenix'
  const state    = typeof body.state    === 'string' ? body.state    : 'AZ'
  const limit    = typeof body.limit    === 'number' ? body.limit    : 20
  const mode     = typeof body.mode     === 'string' ? body.mode     : 'quick'

  // Read env vars here — NOT as module-level constants (avoids runtime closure issues)
  const YELP_KEY = process.env.YELP_API_KEY || ''
  const BING_KEY = process.env.BING_MAPS_KEY || ''
  const AP_KEY   = process.env.APOLLO_API_KEY_2 || ''

  let all: ReturnType<typeof dedupeLeads> = []
  const methods: string[] = []
  const skipped: { source: string; reason: string }[] = []

  // ── QUICK: single GM keyword + BBB ─────────────────────────────────────────
  if (mode === 'quick') {
    try {
      const gm = await googleMapsSearch(industry, city, state, 20)
      if (gm.length) { all.push(...gm); methods.push('google_maps') }
    } catch (e) { console.error('[quick/gm]', e) }

    try {
      const bbb = await bbbScrape(industry, city, state, 1)
      if (bbb.length) { all.push(...bbb); methods.push('bbb') }
    } catch (e) { console.error('[quick/bbb]', e) }

    try {
      const yp = await yellowPagesScrape(industry, city, state)
      if (yp.length) { all.push(...yp); methods.push('yellowpages') }
      else skipped.push({ source: 'yellowpages', reason: 'blocked on Vercel datacenter IP' })
    } catch (e) { skipped.push({ source: 'yellowpages', reason: 'error: ' + String(e).slice(0,50) }) }
  }

  // ── DEEP: 16 GM keywords + 4 type filters + BBB + YP + Yelp + Bing ─────────
  if (mode === 'deep') {
    // Run GM sweep, BBB, and YP concurrently
    const [gmR, bbbR, ypR] = await Promise.allSettled([
      maxKeywordSweep(city, state).catch(e => { console.error('[deep/gm]', e); return [] }),
      bbbScrape(industry, city, state, 2).catch(e => { console.error('[deep/bbb]', e); return [] }),
      yellowPagesScrape(industry, city, state).catch(e => { console.error('[deep/yp]', e); return [] }),
    ])

    if (gmR.status  === 'fulfilled' && gmR.value.length)  { all.push(...gmR.value);  methods.push('google_maps_max') }
    if (bbbR.status === 'fulfilled' && bbbR.value.length) { all.push(...bbbR.value); methods.push('bbb') }
    if (ypR.status  === 'fulfilled' && ypR.value.length)  { all.push(...ypR.value);  methods.push('yellowpages') }
    else skipped.push({ source: 'yellowpages', reason: 'blocked on Vercel datacenter IP' })

    if (YELP_KEY) {
      try {
        const yl = await yelpSearch(industry, city, state, 50)
        if (yl.length) { all.push(...yl); methods.push('yelp') }
      } catch (e) { console.error('[deep/yelp]', e) }
    } else skipped.push({ source: 'yelp', reason: 'YELP_API_KEY not set — free at yelp.com/developers' })

    if (BING_KEY) {
      try {
        const bn = await bingLocalSearch(industry, city, state, 25)
        if (bn.length) { all.push(...bn); methods.push('bing_maps') }
      } catch (e) { console.error('[deep/bing]', e) }
    } else skipped.push({ source: 'bing_maps', reason: 'BING_MAPS_KEY not set — free at bingmapsportal.com' })
  }

  // ── MAX: everything + Apollo ─────────────────────────────────────────────────
  if (mode === 'max') {
    const [gmR, bbbR, ypR] = await Promise.allSettled([
      maxKeywordSweep(city, state).catch(e => { console.error('[max/gm]', e); return [] }),
      bbbScrape(industry, city, state, 2).catch(e => { console.error('[max/bbb]', e); return [] }),
      yellowPagesScrape(industry, city, state).catch(e => { console.error('[max/yp]', e); return [] }),
    ])

    if (gmR.status  === 'fulfilled' && gmR.value.length)  { all.push(...gmR.value);  methods.push('google_maps_max') }
    if (bbbR.status === 'fulfilled' && bbbR.value.length) { all.push(...bbbR.value); methods.push('bbb') }
    if (ypR.status  === 'fulfilled' && ypR.value.length)  { all.push(...ypR.value);  methods.push('yellowpages') }
    else skipped.push({ source: 'yellowpages', reason: 'blocked on Vercel datacenter IP' })

    if (YELP_KEY) {
      try { const yl = await yelpSearch(industry, city, state, 50); if (yl.length) { all.push(...yl); methods.push('yelp') } }
      catch (e) { console.error('[max/yelp]', e) }
    } else skipped.push({ source: 'yelp', reason: 'YELP_API_KEY not set' })

    if (BING_KEY) {
      try { const bn = await bingLocalSearch(industry, city, state, 25); if (bn.length) { all.push(...bn); methods.push('bing_maps') } }
      catch (e) { console.error('[max/bing]', e) }
    } else skipped.push({ source: 'bing_maps', reason: 'BING_MAPS_KEY not set' })

    if (AP_KEY) {
      try { const ap = await apolloSearch(industry, city, state, 50); if (ap.length) { all.push(...ap); methods.push('apollo') } }
      catch (e) { console.error('[max/apollo]', e) }
    } else skipped.push({ source: 'apollo', reason: 'APOLLO_API_KEY_2 not set' })
  }

  // ── Dedup + AI fallback ───────────────────────────────────────────────────
  all = dedupeLeads(all)

  if (all.length < 5) {
    try {
      const ai = await aiLeads(industry, city, state, limit || 15)
      if (ai.length) { all.push(...ai); methods.push('ai_gateway') }
      all = dedupeLeads(all)
    } catch (e) { console.error('[aiLeads]', e) }
  }

  const final  = (limit > 0) ? all.slice(0, limit) : all
  const ms     = Date.now() - start
  const saved  = await saveLeads(final, { industry, location: `${city}, ${state}`, method: methods.join('+'), ms }).catch(() => ({ saved: 0 }))

  return NextResponse.json({
    ok: true, mode, city, state, industry,
    sources_used: methods,
    skipped_sources: skipped,
    google_maps_used:    methods.some(m => m.startsWith('google_maps')),
    bbb_used:            methods.includes('bbb'),
    yellowpages_used:    methods.includes('yellowpages'),
    yelp_used:           methods.includes('yelp'),
    bing_used:           methods.includes('bing_maps'),
    apollo_used:         methods.includes('apollo'),
    ai_fallback_used:    methods.includes('ai_gateway'),
    keywords_active:     XPS_KEYWORDS.length,
    type_filters_active: GM_TYPE_FILTERS.length,
    leads_found:    all.length,
    leads_returned: final.length,
    leads_saved:    saved.saved,
    duration_ms:    ms,
    leads: final,
  })
}

export async function GET() {
  const yelpActive = !!process.env.YELP_API_KEY
  const bingActive = !!process.env.BING_MAPS_KEY
  const apolloActive = !!process.env.APOLLO_API_KEY_2
  return NextResponse.json({
    status: 'ready', endpoint: '/api/scrape',
    keywords_total: XPS_KEYWORDS.length,
    type_filters: GM_TYPE_FILTERS.length,
    modes: {
      quick: '~15s — GM single + BBB (~40 leads)',
      deep:  '~45s — 16 GM keywords + 4 type filters + BBB + YP + Yelp + Bing (~200 leads)',
      max:   '~70s — All sources + Apollo emails (~250 leads)',
    },
    capabilities: {
      google_maps:   !!process.env.GOOGLE_MAPS_API_KEY,
      bbb:           true,
      yellowpages:   true,
      yelp:          yelpActive,
      bing_maps:     bingActive,
      apollo:        apolloActive,
      browser_worker: !!(process.env.BROWSER_WORKER_TOKEN || process.env.BROWSER_WORKER_SECRET),
      ai_gateway:    !!process.env.AI_GATEWAY_API_KEY,
      scrapingbee:   false,
    },
  })
}
