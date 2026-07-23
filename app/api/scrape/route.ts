import { NextRequest, NextResponse } from 'next/server'
import {
  googleMapsSearch, maxKeywordSweep, bbbScrape, yellowPagesScrape,
  yelpSearch, bingLocalSearch, apolloSearch, aiLeads, saveLeads, dedupeLeads,
  XPS_KEYWORDS, GM_TYPE_FILTERS,
} from '@/lib/scraper-engine'
import { validateScrapeInput } from '@/lib/validators'

export const dynamic     = 'force-dynamic'
export const maxDuration = 90

function reqId() { return Math.random().toString(36).slice(2, 10).toUpperCase() }

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Request-Id': reqId(),
      'Content-Security-Policy': "default-src 'none'",
    }
  })
}

export async function POST(req: NextRequest) {
  const start  = Date.now()
  const rid    = reqId()

  let body: unknown
  try { body = await req.json() }
  catch { return json({ ok: false, error: 'Invalid JSON body', request_id: rid }, 400) }

  const validation = validateScrapeInput(body)
  if (!validation.ok) return json({ ok: false, error: validation.error, request_id: rid }, 422)

  const { industry, city, state, limit, mode } = validation.data!
  const YELP_KEY = process.env.YELP_API_KEY || ''
  const BING_KEY = process.env.BING_MAPS_KEY || ''
  const AP_KEY   = process.env.APOLLO_API_KEY_2 || ''

  let all: ReturnType<typeof dedupeLeads> = []
  const methods: string[] = []
  const skipped: { source: string; reason: string }[] = []

  try {
    if (mode === 'quick') {
      try {
        const gm = await googleMapsSearch(industry, city, state, 20)
        if (gm.length) { all.push(...gm); methods.push('google_maps') }
      } catch (e) { console.error(`[${rid}][quick/gm]`, e) }

      try {
        const bbb = await bbbScrape(industry, city, state, 1)
        if (bbb.length) { all.push(...bbb); methods.push('bbb') }
      } catch (e) { console.error(`[${rid}][quick/bbb]`, e) }

      try {
        const yp = await yellowPagesScrape(industry, city, state)
        if (yp.length) { all.push(...yp); methods.push('yellowpages') }
        else skipped.push({ source: 'yellowpages', reason: 'blocked on Vercel datacenter IP' })
      } catch (e) { skipped.push({ source: 'yellowpages', reason: 'error: ' + String(e).slice(0, 50) }) }
    }

    if (mode === 'deep') {
      const [gmR, bbbR, ypR] = await Promise.allSettled([
        maxKeywordSweep(city, state).catch(e => { console.error(`[${rid}][deep/gm]`, e); return [] }),
        bbbScrape(industry, city, state, 2).catch(e => { console.error(`[${rid}][deep/bbb]`, e); return [] }),
        yellowPagesScrape(industry, city, state).catch(e => { console.error(`[${rid}][deep/yp]`, e); return [] }),
      ])
      if (gmR.status  === 'fulfilled' && gmR.value.length)  { all.push(...gmR.value);  methods.push('google_maps_max') }
      if (bbbR.status === 'fulfilled' && bbbR.value.length) { all.push(...bbbR.value); methods.push('bbb') }
      if (ypR.status  === 'fulfilled' && ypR.value.length)  { all.push(...ypR.value);  methods.push('yellowpages') }
      else skipped.push({ source: 'yellowpages', reason: 'blocked on Vercel datacenter IP' })

      if (YELP_KEY) {
        try { const yl = await yelpSearch(industry, city, state, 50); if (yl.length) { all.push(...yl); methods.push('yelp') } }
        catch (e) { console.error(`[${rid}][deep/yelp]`, e) }
      } else skipped.push({ source: 'yelp', reason: 'YELP_API_KEY not set' })

      if (BING_KEY) {
        try { const bn = await bingLocalSearch(industry, city, state, 25); if (bn.length) { all.push(...bn); methods.push('bing_maps') } }
        catch (e) { console.error(`[${rid}][deep/bing]`, e) }
      } else skipped.push({ source: 'bing_maps', reason: 'BING_MAPS_KEY not set' })
    }

    if (mode === 'max') {
      const [gmR, bbbR, ypR] = await Promise.allSettled([
        maxKeywordSweep(city, state).catch(e => { console.error(`[${rid}][max/gm]`, e); return [] }),
        bbbScrape(industry, city, state, 2).catch(e => { console.error(`[${rid}][max/bbb]`, e); return [] }),
        yellowPagesScrape(industry, city, state).catch(e => { console.error(`[${rid}][max/yp]`, e); return [] }),
      ])
      if (gmR.status  === 'fulfilled' && gmR.value.length)  { all.push(...gmR.value);  methods.push('google_maps_max') }
      if (bbbR.status === 'fulfilled' && bbbR.value.length) { all.push(...bbbR.value); methods.push('bbb') }
      if (ypR.status  === 'fulfilled' && ypR.value.length)  { all.push(...ypR.value);  methods.push('yellowpages') }
      else skipped.push({ source: 'yellowpages', reason: 'blocked on Vercel datacenter IP' })

      if (YELP_KEY) {
        try { const yl = await yelpSearch(industry, city, state, 50); if (yl.length) { all.push(...yl); methods.push('yelp') } }
        catch (e) { console.error(`[${rid}][max/yelp]`, e) }
      } else skipped.push({ source: 'yelp', reason: 'YELP_API_KEY not set' })

      if (BING_KEY) {
        try { const bn = await bingLocalSearch(industry, city, state, 25); if (bn.length) { all.push(...bn); methods.push('bing_maps') } }
        catch (e) { console.error(`[${rid}][max/bing]`, e) }
      } else skipped.push({ source: 'bing_maps', reason: 'BING_MAPS_KEY not set' })

      if (AP_KEY) {
        try { const ap = await apolloSearch(industry, city, state, 50); if (ap.length) { all.push(...ap); methods.push('apollo') } }
        catch (e) { console.error(`[${rid}][max/apollo]`, e) }
      } else skipped.push({ source: 'apollo', reason: 'APOLLO_API_KEY_2 not set' })
    }

    all = dedupeLeads(all)

    if (all.length < 5) {
      try {
        const ai = await aiLeads(industry, city, state, limit || 15)
        if (ai.length) { all.push(...ai); methods.push('ai_gateway') }
        all = dedupeLeads(all)
      } catch (e) { console.error(`[${rid}][ai_fallback]`, e) }
    }

    const final  = (limit > 0) ? all.slice(0, limit) : all
    const ms     = Date.now() - start
    const saved  = await saveLeads(final, { industry, location: `${city}, ${state}`, method: methods.join('+'), ms }).catch(() => ({ saved: 0 }))

    return json({
      ok: true, request_id: rid, mode, city, state, industry,
      sources_used: methods,
      skipped_sources: skipped,
      keywords_active:     XPS_KEYWORDS.length,
      type_filters_active: GM_TYPE_FILTERS.length,
      leads_found:    all.length,
      leads_returned: final.length,
      leads_saved:    saved.saved,
      duration_ms:    ms,
      leads: final,
    })
  } catch (err) {
    console.error(`[${rid}][FATAL]`, err)
    return json({ ok: false, error: 'Internal server error', request_id: rid }, 500)
  }
}

export async function GET() {
  return json({
    status: 'ready', endpoint: '/api/scrape',
    keywords_total: XPS_KEYWORDS.length,
    type_filters: GM_TYPE_FILTERS.length,
    modes: {
      quick: '~15s — GM single + BBB (~40 leads)',
      deep:  '~45s — 16 GM keywords + 4 type filters + BBB (~150 leads)',
      max:   '~70s — All sources + Apollo emails (~200 leads)',
    },
    capabilities: {
      google_maps:   !!process.env.GOOGLE_MAPS_API_KEY,
      bbb:           true,
      yellowpages:   true,
      yelp:          !!process.env.YELP_API_KEY,
      bing_maps:     !!process.env.BING_MAPS_KEY,
      apollo:        !!process.env.APOLLO_API_KEY_2,
      ai_gateway:    !!process.env.AI_GATEWAY_API_KEY,
    },
  })
}
