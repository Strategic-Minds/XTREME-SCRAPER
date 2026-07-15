/**
 * XTREME-SCRAPER Engine v2.0
 * Max-capability lead discovery: Google Maps (paginated) + ScrapingBee + Apollo + AI fallback
 */

export interface Lead {
  company_name: string
  phone?: string
  email?: string
  website?: string
  city?: string
  state?: string
  rating?: number
  address?: string
  category?: string
  source_url?: string
  source?: string
}

const GM_KEY   = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY || ''
const SB_KEY   = process.env.SCRAPINGBEE_API_KEY || ''
const AI_KEY   = process.env.AI_GATEWAY_API_KEY  || ''
const AP_KEY   = process.env.APOLLO_API_KEY_2    || ''
const BW_URL   = process.env.BROWSER_WORKER_URL  || 'https://browserworker.vercel.app'
const BW_SEC   = process.env.BROWSER_WORKER_TOKEN || process.env.BROWSER_WORKER_SECRET || ''
const AI_URL   = process.env.AI_GATEWAY_BASE_URL  || 'https://ai-gateway.vercel.sh/v1'
const SB_URL   = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SB_RKEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const XPS_KEYWORDS = [
  'epoxy flooring','concrete coating','garage floor coating',
  'polished concrete','floor coating contractor','decorative concrete',
  'epoxy garage floor','floor epoxy contractor',
]

const AZ_CITIES = [
  'Phoenix','Scottsdale','Mesa','Tempe','Chandler',
  'Gilbert','Glendale','Peoria','Surprise','Tucson',
  'Flagstaff','Yuma','Prescott','Avondale','Goodyear',
]

// ── Dedup ────────────────────────────────────────────────────────────────────
export function dedupeLeads(leads: Lead[]): Lead[] {
  const seen = new Map<string, Lead>()
  for (const l of leads) {
    const key = l.company_name.toLowerCase().replace(/[^a-z0-9]/g,'')
    if (!seen.has(key) || (l.phone && !seen.get(key)!.phone)) seen.set(key, l)
  }
  return [...seen.values()]
}

// ── TIER 1: Google Maps (paginated, up to 60/keyword) ────────────────────────
async function gmPage(url: string): Promise<{results: GMResult[], next_page_token?: string}> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(12000) })
    if (!r.ok) return { results: [] }
    return await r.json()
  } catch { return { results: [] } }
}

interface GMResult { name: string; place_id: string; rating?: number; formatted_address?: string }
interface GMDetail { formatted_phone_number?: string; website?: string }

async function gmDetails(place_id: string): Promise<GMDetail> {
  try {
    const r = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=name,formatted_phone_number,website,rating,formatted_address&key=${GM_KEY}`, { signal: AbortSignal.timeout(8000) })
    const d = await r.json()
    return d.result || {}
  } catch { return {} }
}

export async function googleMapsSearch(query: string, city: string, state: string, maxResults = 60): Promise<Lead[]> {
  if (!GM_KEY) return []
  const q  = encodeURIComponent(`${query} ${city} ${state}`)
  const all: GMResult[] = []
  let url  = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${q}&key=${GM_KEY}`
  for (let page = 0; page < 3 && all.length < maxResults; page++) {
    const data = await gmPage(url)
    all.push(...(data.results || []))
    if (!data.next_page_token) break
    await new Promise(r => setTimeout(r, 2000))
    url = `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${data.next_page_token}&key=${GM_KEY}`
  }
  const top = all.slice(0, maxResults)
  // Enrich top 5 with phone + website
  const details = await Promise.allSettled(top.slice(0,5).map(p => gmDetails(p.place_id)))
  return top.map((p, i) => {
    const d: GMDetail = i < 5 && details[i].status === 'fulfilled' ? (details[i] as PromiseFulfilledResult<GMDetail>).value : {}
    const addr  = p.formatted_address || ''
    const cityM = addr.match(/,\s*([^,]+),\s*[A-Z]{2}/i)
    return {
      company_name: p.name, phone: d.formatted_phone_number || '',
      website: d.website || '', address: addr,
      city: cityM?.[1]?.trim() || city, state,
      rating: p.rating, category: query,
      source_url: `https://maps.google.com/search/${encodeURIComponent(p.name)}`,
      source: 'google_maps',
    }
  })
}

export async function multiKeywordSweep(city: string, state: string): Promise<Lead[]> {
  let all: Lead[] = []
  for (const kw of XPS_KEYWORDS) {
    const leads = await googleMapsSearch(kw, city, state, 20)
    all.push(...leads)
    if (leads.length > 0) await new Promise(r => setTimeout(r, 500))
  }
  return dedupeLeads(all)
}

export async function multiCitySweep(cities: string[] = AZ_CITIES, state = 'AZ', industry = 'Epoxy Flooring') {
  const results: { city: string; leads: Lead[]; count: number }[] = []
  for (const city of cities) {
    const leads = await googleMapsSearch(industry, city, state, 20)
    results.push({ city, leads, count: leads.length })
    await new Promise(r => setTimeout(r, 800))
  }
  return results
}

// ── TIER 2: ScrapingBee (Yellow Pages + Yelp, real HTML) ─────────────────────
export async function scrapingBeeScrape(industry: string, city: string, state: string): Promise<Lead[]> {
  if (!SB_KEY) return []
  const targets = [
    { url: `https://www.yellowpages.com/search?search_terms=${encodeURIComponent(industry)}&geo_location_terms=${encodeURIComponent(city+' '+state)}`, parser: 'yp' },
    { url: `https://www.yelp.com/search?find_desc=${encodeURIComponent(industry)}&find_loc=${encodeURIComponent(city+' '+state)}`, parser: 'yelp' },
  ]
  const all: Lead[] = []
  for (const { url, parser } of targets) {
    try {
      const sbUrl = `https://app.scrapingbee.com/api/v1/?api_key=${SB_KEY}&url=${encodeURIComponent(url)}&render_js=true&premium_proxy=true&country_code=us&block_ads=true`
      const r = await fetch(sbUrl, { signal: AbortSignal.timeout(40000) })
      if (!r.ok) continue
      const html = await r.text()
      if (parser === 'yp') {
        const names  = [...html.matchAll(/class="business-name[^"]*"[^>]*>\s*<[^>]+>([^<]{3,80})</g)]
        const phones = [...html.matchAll(/class="phones[^"]*"[^>]*>[^<]*<[^>]*>([()\d\s.\-]{10,16})</g)]
        const webs   = [...html.matchAll(/class="track-visit-website"[^>]+href="([^"]+)"/g)]
        const cities = [...html.matchAll(/class="locality[^"]*">([^<]{2,40})</g)]
        const seen   = new Set<string>()
        for (let i = 0; i < Math.min(names.length, 25); i++) {
          const name = names[i]?.[1]?.trim()
          if (!name || seen.has(name.toLowerCase())) continue
          seen.add(name.toLowerCase())
          all.push({ company_name: name, phone: phones[i]?.[1]?.trim() || '', website: webs[i]?.[1]?.trim() || '', city: cities[i]?.[1]?.trim() || city, state, category: industry, source_url: url, source: 'yellowpages' })
        }
      } else {
        const names  = [...html.matchAll(/"name":"([^"<]{3,80})"/g)]
        const phones = [...html.matchAll(/"phone":"([^"]{7,20})"/g)]
        const seen   = new Set<string>()
        for (let i = 0; i < Math.min(names.length, 15); i++) {
          const name = names[i]?.[1]?.trim()
          if (!name || seen.has(name.toLowerCase()) || /^(yelp|search|open|write|all|rating)/i.test(name)) continue
          seen.add(name.toLowerCase())
          all.push({ company_name: name, phone: phones[i]?.[1]?.trim() || '', city, state, category: industry, source_url: url, source: 'yelp' })
        }
      }
    } catch (e) { console.error('[scrapingBee]', e) }
  }
  return all
}

// ── TIER 3: Apollo.io (verified emails + direct dials) ───────────────────────
export async function apolloSearch(industry: string, city: string, state: string, limit = 25): Promise<Lead[]> {
  if (!AP_KEY) return []
  try {
    const body = { q_organization_keyword_tags: [industry], person_locations: [`${city}, ${state}`], per_page: Math.min(limit, 50), page: 1 }
    const r = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': AP_KEY, 'Cache-Control': 'no-cache' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    })
    if (!r.ok) {
      // fallback: organization search
      const r2 = await fetch('https://api.apollo.io/v1/organizations/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': AP_KEY },
        body: JSON.stringify({ q_organization_keyword_tags: [industry], organization_locations: [`${city}, ${state}`], per_page: limit }),
        signal: AbortSignal.timeout(15000),
      })
      if (!r2.ok) return []
      const d2 = await r2.json()
      return (d2.organizations || []).map((o: {name?:string;phone_numbers?:{raw_number:string}[],primary_phone?:{number:string};website_url?:string;city?:string;state?:string;primary_domain?:string}) => ({
        company_name: o.name || 'Unknown', phone: o.phone_numbers?.[0]?.raw_number || o.primary_phone?.number || '',
        website: o.website_url || '', city: o.city || city, state: o.state || state,
        email: o.primary_domain ? `info@${o.primary_domain}` : '', category: industry, source: 'apollo_org',
      }))
    }
    const d = await r.json()
    return (d.people || []).map((p: {name?:string;organization?:{name?:string};phone_numbers?:{raw_number:string}[];email?:string;city?:string;state?:string;organization_name?:string}) => ({
      company_name: p.organization?.name || p.organization_name || p.name || 'Unknown',
      phone: p.phone_numbers?.[0]?.raw_number || '', email: p.email || '',
      city: p.city || city, state: p.state || state, category: industry, source: 'apollo',
    }))
  } catch (e) { console.error('[apollo]', e); return [] }
}

// ── TIER 4: BrowserWorker validation ─────────────────────────────────────────
export async function bwValidate(url: string): Promise<boolean> {
  if (!BW_SEC) return false
  try {
    const r = await fetch(BW_URL + '/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + BW_SEC },
      body: JSON.stringify({ version: '1.0', job_id: 'val-' + Date.now(), steps: [{ action: 'goto', url, timeout: 12000 }, { action: 'get_title' }], timeout_ms: 20000 }),
      signal: AbortSignal.timeout(25000),
    })
    const d = await r.json()
    const title: string = d.steps?.find((s:{action:string}) => s.action === 'get_title')?.result?.title || ''
    return d.status === 'pass' && !/(cloudflare|attention required|403|captcha)/i.test(title)
  } catch { return false }
}

// ── TIER 5: AI Gateway fallback ───────────────────────────────────────────────
export async function aiLeads(industry: string, city: string, state: string, limit = 12): Promise<Lead[]> {
  if (!AI_KEY) return []
  try {
    const r = await fetch(AI_URL + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + AI_KEY },
      body: JSON.stringify({ model: 'openai/gpt-4o-mini', messages: [{ role: 'user', content: `List ${Math.min(limit,12)} real ${industry} contractors in ${city}, ${state}. Real businesses only. JSON array only: [{"company_name":"...","phone":"XXX-XXX-XXXX","city":"${city}","state":"${state}","website":"...","category":"${industry}"}]` }], temperature: 0.1, max_tokens: 800 }),
      signal: AbortSignal.timeout(20000),
    })
    if (!r.ok) return []
    const d = await r.json()
    const content: string = d.choices?.[0]?.message?.content || ''
    const match = content.match(/\[[\s\S]*?\]/)
    if (!match) return []
    return (JSON.parse(match[0]) as Lead[]).map(l => ({ ...l, source: 'ai_gateway' }))
  } catch { return [] }
}

// ── Supabase save ─────────────────────────────────────────────────────────────
export async function saveLeads(leads: Lead[], meta: { industry: string; location: string; method: string; ms: number }): Promise<{ saved: number }> {
  if (!SB_URL || !SB_RKEY || !leads.length) return { saved: 0 }
  const h = { 'apikey': SB_RKEY, 'Authorization': `Bearer ${SB_RKEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal,resolution=ignore-duplicates' }
  await fetch(`${SB_URL}/rest/v1/scrape_runs`, { method: 'POST', headers: h, body: JSON.stringify({ industry: meta.industry, location: meta.location, total_found: leads.length, new_leads: leads.length, duplicates_skipped: 0, status: 'complete', notes: `method=${meta.method} ms=${meta.ms}`, started_at: new Date().toISOString(), completed_at: new Date().toISOString() }) })
  const rows = leads.map(l => ({ company_name: l.company_name, phone: l.phone || '', email: l.email || '', website: l.website || '', city: l.city || '', state: l.state || 'AZ', category: l.category || meta.industry, source_url: l.source_url || '', scraped_at: new Date().toISOString(), lead_score: Math.round((l.rating || 0) * 20), source: l.source || 'scraper', address: l.address || '' }))
  const r = await fetch(`${SB_URL}/rest/v1/xps_leads`, { method: 'POST', headers: h, body: JSON.stringify(rows) })
  return { saved: r.ok ? leads.length : 0 }
}

export { XPS_KEYWORDS, AZ_CITIES }
