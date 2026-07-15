import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const gmOk  = !!process.env.GOOGLE_MAPS_API_KEY
  const sbOk  = !!process.env.SCRAPINGBEE_API_KEY
  const apOk  = !!process.env.APOLLO_API_KEY_2
  const bwOk  = !!(process.env.BROWSER_WORKER_TOKEN || process.env.BROWSER_WORKER_SECRET)
  const aiOk  = !!process.env.AI_GATEWAY_API_KEY

  return NextResponse.json({
    sources: [
      { id: 'google_maps',       name: 'Google Maps Places', status: gmOk ? 'active' : 'not_configured', quality: 'verified', avg_leads_per_query: 60,  notes: '3 pages × 20 results, real ratings + addresses' },
      { id: 'scrapingbee_yp',    name: 'ScrapingBee + Yellow Pages', status: sbOk ? 'active' : 'not_configured', quality: 'real_html', avg_leads_per_query: 25, notes: 'JS render, premium proxy, Cloudflare bypass' },
      { id: 'scrapingbee_yelp',  name: 'ScrapingBee + Yelp', status: sbOk ? 'active' : 'not_configured', quality: 'real_html', avg_leads_per_query: 15, notes: 'JS render, real reviews + phones' },
      { id: 'apollo',            name: 'Apollo.io', status: apOk ? 'active' : 'not_configured', quality: 'verified_email', avg_leads_per_query: 25, notes: 'Verified emails + direct dials from 73M+ database' },
      { id: 'browser_worker',    name: 'BrowserWorker / Browserbase', status: bwOk ? 'active' : 'not_configured', quality: 'js_rendered', avg_leads_per_query: 15, notes: 'Real Chromium, site validation + reachability' },
      { id: 'ai_gateway',        name: 'AI Gateway (fallback only)', status: aiOk ? 'active' : 'not_configured', quality: 'ai_generated', avg_leads_per_query: 12, notes: 'GPT-4o-mini fallback when real sources return <3' },
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
      quick: { description: 'Google Maps single query', time_estimate: '5-10s',  leads_estimate: '20-60'  },
      deep:  { description: 'Google Maps all keywords + ScrapingBee', time_estimate: '30-60s', leads_estimate: '100-300' },
      max:   { description: 'All sources + Apollo verified emails', time_estimate: '60-90s', leads_estimate: '200-500' },
    },
    sweep: {
      description: 'Multi-city sweep via /api/sweep',
      cities: 15, leads_per_city: 20,
      max_theoretical: 15 * 20,
    },
    max_theoretical_leads_per_full_run: 8 * 60 + 40 + 25,
    all_active: gmOk && sbOk && apOk && bwOk,
  })
}
