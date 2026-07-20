import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Check ScrapingBee credits dynamically
  const sbKey     = process.env.SCRAPINGBEE_API_KEY || ''
  let sbStatus    = sbKey ? 'checking' : 'not_configured'
  let sbCredits   = 0
  if (sbKey) {
    try {
      const r = await fetch(`https://app.scrapingbee.com/api/v1/usage?api_key=${sbKey}`, { signal: AbortSignal.timeout(5000) })
      const d = await r.json()
      sbCredits = d.max_api_credit - d.used_api_credit
      sbStatus  = sbCredits > 0 ? 'active' : 'exhausted'
    } catch { sbStatus = 'error' }
  }

  return NextResponse.json({
    sources: [
      { id: 'google_maps',    name: 'Google Maps Places API', status: process.env.GOOGLE_MAPS_API_KEY ? 'active' : 'not_configured', cost: 'Free to 10k/mo then $0.032/req',  key: 'GOOGLE_MAPS_API_KEY',  quality: 'verified_rated',  avg_leads: 20, notes: '8 keywords × 20 = ~100 unique/city' },
      { id: 'yellowpages',    name: 'Yellow Pages (direct)',  status: 'active',                                                        cost: '100% FREE — no key needed',      key: 'none',                 quality: 'real_html',       avg_leads: 30, notes: 'Direct HTML parse, 30 names + phones per search' },
      { id: 'yelp',           name: 'Yelp Fusion API',        status: process.env.YELP_API_KEY ? 'active' : 'not_configured',          cost: 'Free 500 calls/day',             key: 'YELP_API_KEY',         quality: 'verified_rated',  avg_leads: 20, notes: 'Free signup at yelp.com/developers (5 min)' },
      { id: 'bing_maps',      name: 'Bing Maps Local Search', status: process.env.BING_MAPS_KEY ? 'active' : 'not_configured',         cost: 'Free 125,000/year',              key: 'BING_MAPS_KEY',        quality: 'verified',        avg_leads: 25, notes: 'Free signup at bingmapsportal.com' },
      { id: 'apollo',         name: 'Apollo.io',              status: process.env.APOLLO_API_KEY_2 ? 'active' : 'not_configured',      cost: 'Free tier / paid plans',         key: 'APOLLO_API_KEY_2',     quality: 'verified_email',  avg_leads: 25, notes: 'Verified emails + direct dials from 73M+ DB' },
      { id: 'scrapingbee_yp', name: 'ScrapingBee + YP/Yelp', status: sbStatus,                                                        cost: '$49 for 10k credits',            key: 'SCRAPINGBEE_API_KEY',  quality: 'js_rendered',     avg_leads: 40, credits_remaining: sbCredits, notes: sbStatus === 'exhausted' ? `Exhausted (${sbCredits} remaining) — top up at app.scrapingbee.com` : 'Cloudflare bypass + JS render' },
      { id: 'browser_worker', name: 'BrowserWorker Chromium', status: (process.env.BROWSER_WORKER_TOKEN || process.env.BROWSER_WORKER_SECRET) ? 'active' : 'not_configured', cost: 'Free (self-hosted)',  key: 'BROWSER_WORKER_SECRET', quality: 'js_rendered',    avg_leads: 15, notes: 'Site validation + reachability testing' },
      { id: 'ai_gateway',     name: 'AI Gateway (fallback)',  status: process.env.AI_GATEWAY_API_KEY ? 'active' : 'not_configured',    cost: 'Per-token (fallback only)',      key: 'AI_GATEWAY_API_KEY',   quality: 'ai_generated',    avg_leads: 12, notes: 'Only fires when real sources return <5 leads' },
    ],
    keywords: [
      'epoxy flooring','concrete coating','garage floor coating',
      'polished concrete','floor coating contractor','decorative concrete',
      'epoxy garage floor','floor epoxy contractor',
    ],
    target_cities: [
      'Phoenix','Scottsdale','Mesa','Tempe','Chandler',
      'Gilbert','Glendale','Peoria','Surprise','Tucson',
      'Flagstaff','Yuma','Prescott','Avondale','Goodyear',
    ],
    modes: {
      quick: { description: 'Google Maps + Yellow Pages direct', time: '~10s', leads: '20-50' },
      deep:  { description: '8 GM keywords + YP + Yelp + Bing',  time: '~30s', leads: '80-150' },
      max:   { description: 'All sources + Apollo emails',        time: '~60s', leads: '120-200' },
    },
    to_unlock_more: [
      { source: 'yelp',     action: 'Get free key at yelp.com/developers',     adds: '+20 leads/run', time: '5 minutes' },
      { source: 'bing',     action: 'Get free key at bingmapsportal.com',       adds: '+25 leads/run', time: '5 minutes' },
      { source: 'scrapingbee', action: 'Top up at app.scrapingbee.com ($49/10k)', adds: '+40 leads/run', time: '2 minutes' },
    ],
  })
}
