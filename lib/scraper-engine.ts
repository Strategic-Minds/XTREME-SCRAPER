/**
 * XTREME-SCRAPER Engine v2.1 — Max Free Sources
 * Google Maps + Yellow Pages (direct) + Yelp Fusion + OSM + Bing Maps + AI fallback
 * No ScrapingBee required — all sources free
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
const AI_KEY   = process.env.AI_GATEWAY_API_KEY  || ''
const AP_KEY   = process.env.APOLLO_API_KEY_2    || ''
const BW_URL   = process.env.BROWSER_WORKER_URL  || 'https://browserworker.vercel.app'
const BW_SEC   = process.env.BROWSER_WORKER_TOKEN || process.env.BROWSER_WORKER_SECRET || ''
const AI_URL   = process.env.AI_GATEWAY_BASE_URL  || 'https://ai-gateway.vercel.sh/v1'
const SB_URL   = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SB_RKEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const YELP_KEY = process.env.YELP_API_KEY || ''
const BING_KEY = process.env.BING_MAPS_KEY || ''

export const XPS_KEYWORDS = [
  'epoxy flooring','concrete coating','garage floor coating',
  'polished concrete','floor coating contractor','decorative concrete',
  'epoxy garage floor','floor epoxy contractor',
]

export const AZ_CITIES = [
  'Phoenix','Scottsdale','Mesa','Tempe','Chandler',
  'Gilbert','Glendale','Peoria','Surprise','Tucson',
  'Flagstaff','Yuma','Prescott','Avondale','Goodyear',
]

// ── Dedup ────────────────────────────────────────────────────────────────────
export function dedupeLeads(leads: Lead[]): Lead[] {
  const seen = new Map<string, Lead>()
  for (const l of leads) {
    const key = l.company_name.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (!seen.has(key) || (l.phone && !seen.get(key)!.phone)) seen.set(key, l)
  }
  return [...seen.values()]
}

// ── SOURCE 1: Google Maps Places (FREE up to 10k/month) ───────────────────
interface GMResult { name: string; place_id: string; rating?: number; formatted_address?: string; vicinity?: string }

async function gmFetch(url: string): Promise<{ results: GMResult[]; next_page_token?: string; status?: string }> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(12000) })
    if (!r.ok) return { results: [] }
    return await r.json()
  } catch { return { results: [] } }
}

async function gmDetails(place_id: string): Promise<{ formatted_phone_number?: string; website?: string }> {
  if (!place_id) return {}
  try {
    const r = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=formatted_phone_number,website&key=${GM_KEY}`, { signal: AbortSignal.timeout(8000) })
    const d = await r.json()
    return d.result || {}
  } catch { return {} }
}

export async function googleMapsSearch(query: string, city: string, state: string, maxResults = 20): Promise<Lead[]> {
  if (!GM_KEY) return []
  try {
    const q = encodeURIComponent(`${query} ${city} ${state}`)
    const data = await gmFetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${q}&key=${GM_KEY}`)
    if (!data.results?.length) return []
    const top = data.results.slice(0, Math.min(maxResults, 20))
    // Enrich top 5 with phone
    const detailJobs = await Promise.allSettled(top.slice(0, 5).map(p => gmDetails(p.place_id)))
    return top.map((p, i) => {
      const d = i < 5 && detailJobs[i].status === 'fulfilled' ? (detailJobs[i] as PromiseFulfilledResult<{formatted_phone_number?:string;website?:string}>).value : {}
      const addrMatch = (p.formatted_address || '').match(/,\s*([^,]+),\s*[A-Z]{2}/i)
      return {
        company_name: p.name, phone: d.formatted_phone_number || '', website: d.website || '',
        address: p.formatted_address || p.vicinity || '', city: addrMatch?.[1]?.trim() || city,
        state, rating: p.rating, category: query, source: 'google_maps',
        source_url: `https://maps.google.com/search/${encodeURIComponent(p.name)}`,
      }
    })
  } catch (e) { console.error('[googleMaps]', e); return [] }
}

export async function multiKeywordSweep(city: string, state: string): Promise<Lead[]> {
  const all: Lead[] = []
  for (const kw of XPS_KEYWORDS) {
    try {
      const leads = await googleMapsSearch(kw, city, state, 20)
      all.push(...leads)
      await new Promise(r => setTimeout(r, 300))
    } catch (e) { console.error('[multiKeyword]', kw, e) }
  }
  return dedupeLeads(all)
}

export async function multiCitySweep(cities: string[] = AZ_CITIES, state = 'AZ', industry = 'Epoxy Flooring') {
  const results: { city: string; leads: Lead[]; count: number }[] = []
  for (const city of cities) {
    try {
      const leads = await googleMapsSearch(industry, city, state, 20)
      results.push({ city, leads, count: leads.length })
      await new Promise(r => setTimeout(r, 500))
    } catch (e) { console.error('[multiCity]', city, e); results.push({ city, leads: [], count: 0 }) }
  }
  return results
}

// ── SOURCE 2: Yellow Pages (FREE — direct HTML, no key needed) ─────────────
export async function yellowPagesScrape(industry: string, city: string, state: string): Promise<Lead[]> {
  try {
    const search = encodeURIComponent(industry)
    const loc    = encodeURIComponent(`${city}, ${state}`)
    const url    = `https://www.yellowpages.com/search?search_terms=${search}&geo_location_terms=${loc}`
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(20000),
    })
    if (!r.ok) return []
    const html = await r.text()

    // Parse structured data (JSON-LD business+phone pairs)
    const businesses: Lead[] = []
    const nameMatches  = [...html.matchAll(/"name"\s*:\s*"([^"]{5,70})"/g)].map(m => m[1]).filter(n => !/^(Phoenix|Scottsdale|Mesa|Arizona|AZ|epoxy|flooring|concrete)$/i.test(n))
    const phoneMatches = [...html.matchAll(/\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}/g)].map(m => m[0])
    const addrMatches  = [...html.matchAll(/"streetAddress"\s*:\s*"([^"]{5,80})"/g)].map(m => m[1])

    const seen = new Set<string>()
    for (let i = 0; i < Math.min(nameMatches.length, 30); i++) {
      const name = nameMatches[i]?.trim()
      if (!name || name.length < 4) continue
      const key  = name.toLowerCase().replace(/[^a-z0-9]/g,'')
      if (seen.has(key)) continue
      seen.add(key)
      businesses.push({
        company_name: name,
        phone: phoneMatches[i] || '',
        address: addrMatches[i] || '',
        city, state, category: industry,
        source: 'yellowpages', source_url: url,
      })
    }
    return businesses
  } catch (e) { console.error('[yellowPages]', e); return [] }
}

// ── SOURCE 3: Yelp Fusion API (FREE — 500 calls/day with free key) ─────────
export async function yelpSearch(industry: string, city: string, state: string, limit = 20): Promise<Lead[]> {
  if (!YELP_KEY) return []
  try {
    const url = `https://api.yelp.com/v3/businesses/search?term=${encodeURIComponent(industry)}&location=${encodeURIComponent(city+','+state)}&limit=${Math.min(limit,50)}&sort_by=rating`
    const r = await fetch(url, {
      headers: { 'Authorization': `Bearer ${YELP_KEY}` },
      signal: AbortSignal.timeout(12000),
    })
    if (!r.ok) return []
    const d = await r.json()
    return (d.businesses || []).map((b: {name:string;phone?:string;url?:string;rating?:number;location?:{address1?:string;city?:string;state?:string};categories?:{title:string}[]}) => ({
      company_name: b.name, phone: b.phone || '', website: b.url || '',
      rating: b.rating, address: b.location?.address1 || '',
      city: b.location?.city || city, state: b.location?.state || state,
      category: industry, source: 'yelp',
      source_url: `https://www.yelp.com/search?find_desc=${encodeURIComponent(industry)}&find_loc=${encodeURIComponent(city)}`,
    }))
  } catch (e) { console.error('[yelp]', e); return [] }
}

// ── SOURCE 4: Bing Maps Local Search (FREE — 125k/year with free key) ──────
export async function bingLocalSearch(industry: string, city: string, state: string, limit = 20): Promise<Lead[]> {
  if (!BING_KEY) return []
  try {
    const q   = encodeURIComponent(`${industry} ${city} ${state}`)
    const url = `https://dev.virtualearth.net/REST/v1/LocalSearch/?query=${q}&maxResults=${Math.min(limit,25)}&key=${BING_KEY}`
    const r   = await fetch(url, { signal: AbortSignal.timeout(12000) })
    if (!r.ok) return []
    const d   = await r.json()
    const places = d.resourceSets?.[0]?.resources?.[0]?.value || []
    return places.map((p: {name?:string;PhoneNumber?:string;Website?:string;Address?:{addressLine?:string;locality?:string;adminDistrict?:string}}) => ({
      company_name: p.name || 'Unknown',
      phone: p.PhoneNumber || '', website: p.Website || '',
      address: p.Address?.addressLine || '',
      city: p.Address?.locality || city,
      state: p.Address?.adminDistrict || state,
      category: industry, source: 'bing_maps',
    }))
  } catch (e) { console.error('[bing]', e); return [] }
}

// ── SOURCE 5: Apollo.io (FREE tier available) ──────────────────────────────
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
      const r2 = await fetch('https://api.apollo.io/v1/organizations/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': AP_KEY },
        body: JSON.stringify({ q_organization_keyword_tags: [industry], organization_locations: [`${city}, ${state}`], per_page: limit }),
        signal: AbortSignal.timeout(15000),
      })
      if (!r2.ok) return []
      const d2 = await r2.json()
      return (d2.organizations || []).map((o: {name?:string;phone_numbers?:{raw_number:string}[];primary_phone?:{number:string};website_url?:string;city?:string;state?:string;primary_domain?:string}) => ({
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

// ── SOURCE 6: AI Gateway fallback (use only if <5 results from real sources) 
export async function aiLeads(industry: string, city: string, state: string, limit = 12): Promise<Lead[]> {
  if (!AI_KEY) return []
  try {
    const r = await fetch(AI_URL + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + AI_KEY },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: `List ${Math.min(limit,12)} real ${industry} contractors in ${city}, ${state}. Real businesses only — no placeholders. Return JSON array ONLY: [{"company_name":"...","phone":"XXX-XXX-XXXX","city":"${city}","state":"${state}","website":"...","category":"${industry}"}]` }],
        temperature: 0.1, max_tokens: 800,
      }),
      signal: AbortSignal.timeout(20000),
    })
    if (!r.ok) return []
    const d = await r.json()
    const content: string = d.choices?.[0]?.message?.content || ''
    const match = content.match(/\[[\s\S]*?\]/)
    if (!match) return []
    return (JSON.parse(match[0]) as Lead[]).map(l => ({ ...l, source: 'ai_gateway' }))
  } catch (e) { console.error('[aiLeads]', e); return [] }
}

// ── BrowserWorker validation ───────────────────────────────────────────────
export async function bwValidate(url: string): Promise<boolean> {
  if (!BW_SEC || !url) return false
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

// ── ScrapingBee (only use if credits > 0) ─────────────────────────────────
async function sbCreditsOk(): Promise<boolean> {
  const sbKey = process.env.SCRAPINGBEE_API_KEY || ''
  if (!sbKey) return false
  try {
    const r = await fetch(`https://app.scrapingbee.com/api/v1/usage?api_key=${sbKey}`, { signal: AbortSignal.timeout(5000) })
    const d = await r.json()
    return (d.max_api_credit - d.used_api_credit) > 0
  } catch { return false }
}

export async function scrapingBeeScrape(industry: string, city: string, state: string): Promise<Lead[]> {
  const sbKey = process.env.SCRAPINGBEE_API_KEY || ''
  if (!sbKey) return []
  const ok = await sbCreditsOk()
  if (!ok) { console.warn('[scrapingBee] Credits exhausted — skipping'); return [] }
  try {
    const url   = `https://www.yellowpages.com/search?search_terms=${encodeURIComponent(industry)}&geo_location_terms=${encodeURIComponent(city+' '+state)}`
    const sbUrl = `https://app.scrapingbee.com/api/v1/?api_key=${sbKey}&url=${encodeURIComponent(url)}&render_js=true&premium_proxy=true&country_code=us&block_ads=true`
    const r     = await fetch(sbUrl, { signal: AbortSignal.timeout(40000) })
    if (!r.ok) return []
    const html  = await r.text()
    const names  = [...html.matchAll(/class="business-name[^"]*"[^>]*>\s*<[^>]+>([^<]{3,80})</g)].map(m => m[1].trim())
    const phones = [...html.matchAll(/\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}/g)].map(m => m[0])
    const seen   = new Set<string>()
    return names.slice(0,25).map((name,i) => {
      const key = name.toLowerCase().replace(/[^a-z0-9]/g,'')
      if (seen.has(key)) return null; seen.add(key)
      return { company_name: name, phone: phones[i]||'', city, state, category: industry, source:'scrapingbee_yp', source_url: url }
    }).filter(Boolean) as Lead[]
  } catch (e) { console.error('[scrapingBee]', e); return [] }
}

// ── Supabase save ─────────────────────────────────────────────────────────
export async function saveLeads(leads: Lead[], meta: { industry: string; location: string; method: string; ms: number }): Promise<{ saved: number }> {
  if (!SB_URL || !SB_RKEY || !leads.length) return { saved: 0 }
  try {
    const h = { 'apikey': SB_RKEY, 'Authorization': `Bearer ${SB_RKEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal,resolution=ignore-duplicates' }
    await fetch(`${SB_URL}/rest/v1/scrape_runs`, { method: 'POST', headers: h, body: JSON.stringify({ industry: meta.industry, location: meta.location, total_found: leads.length, new_leads: leads.length, duplicates_skipped: 0, status: 'complete', notes: `method=${meta.method} ms=${meta.ms}`, started_at: new Date().toISOString(), completed_at: new Date().toISOString() }) })
    const rows = leads.map(l => ({ company_name: l.company_name, phone: l.phone||'', email: l.email||'', website: l.website||'', city: l.city||'', state: l.state||'AZ', category: l.category||meta.industry, source_url: l.source_url||'', scraped_at: new Date().toISOString(), lead_score: Math.round((l.rating||0)*20), source: l.source||'scraper', address: l.address||'' }))
    const r = await fetch(`${SB_URL}/rest/v1/xps_leads`, { method: 'POST', headers: h, body: JSON.stringify(rows) })
    return { saved: r.ok ? leads.length : 0 }
  } catch (e) { console.error('[saveLeads]', e); return { saved: 0 } }
}
