/**
 * XTREME-SCRAPER Engine v3.0 — Maximum Output
 * Sources: Google Maps (16 keywords + 4 type filters) + BBB + Yellow Pages + Yelp + Bing + Apollo + AI fallback
 * Zero new signups required for core operation
 */

export interface Lead {
  company_name: string
  phone?: string
  email?: string
  website?: string
  city?: string
  state?: string
  rating?: number
  review_count?: number
  address?: string
  category?: string
  source_url?: string
  source?: string
  place_id?: string
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

// ── MAXIMUM KEYWORD SUITE (16 keywords) ──────────────────────────────────────
export const XPS_KEYWORDS = [
  // Primary — direct epoxy/coating
  'epoxy flooring',
  'epoxy floor coating',
  'garage floor epoxy',
  'epoxy garage floor',
  // Concrete / polishing
  'concrete coating',
  'polished concrete',
  'concrete polishing',
  'decorative concrete',
  // Broader coating / flooring
  'floor coating contractor',
  'garage floor coating',
  'concrete floor coating',
  'floor epoxy contractor',
  // Adjacent / competitive
  'polyaspartic floor coating',
  'metallic epoxy floor',
  'industrial floor coating',
  'commercial floor coating',
]

// ── GOOGLE MAPS TYPE FILTERS (4 additional sweeps) ───────────────────────────
export const GM_TYPE_FILTERS = [
  'floor_covering_store',
  'general_contractor',
  'home_improvement_store',
  'painter',
]

export const AZ_CITIES = [
  'Phoenix','Scottsdale','Mesa','Tempe','Chandler',
  'Gilbert','Glendale','Peoria','Surprise','Tucson',
  'Flagstaff','Yuma','Prescott','Avondale','Goodyear',
  'Maricopa','Casa Grande','Queen Creek','Anthem','Cave Creek',
]

// ── Dedup ─────────────────────────────────────────────────────────────────────
export function dedupeLeads(leads: Lead[]): Lead[] {
  const seen = new Map<string, Lead>()
  for (const l of leads) {
    const key = l.company_name.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (!seen.has(key)) {
      seen.set(key, l)
    } else {
      // Merge — keep richer record
      const existing = seen.get(key)!
      if (!existing.phone && l.phone) existing.phone = l.phone
      if (!existing.email && l.email) existing.email = l.email
      if (!existing.website && l.website) existing.website = l.website
      if (!existing.rating && l.rating) existing.rating = l.rating
    }
  }
  return [...seen.values()]
}

// ── SOURCE 1: Google Maps — single keyword ────────────────────────────────────
interface GMResult { name: string; place_id: string; rating?: number; user_ratings_total?: number; formatted_address?: string; vicinity?: string }

async function gmFetch(url: string): Promise<{ results: GMResult[]; status?: string }> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(12000) })
    if (!r.ok) return { results: [] }
    return await r.json()
  } catch { return { results: [] } }
}

async function gmDetails(place_id: string): Promise<{ formatted_phone_number?: string; website?: string }> {
  if (!place_id || !GM_KEY) return {}
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
    // Enrich top 5 with phone/website
    const detailJobs = await Promise.allSettled(top.slice(0, 5).map(p => gmDetails(p.place_id)))
    return top.map((p, i) => {
      const d = i < 5 && detailJobs[i].status === 'fulfilled'
        ? (detailJobs[i] as PromiseFulfilledResult<{formatted_phone_number?:string;website?:string}>).value
        : {}
      return {
        company_name: p.name,
        phone: d.formatted_phone_number || '',
        website: d.website || '',
        address: p.formatted_address || p.vicinity || '',
        city, state,
        rating: p.rating,
        review_count: p.user_ratings_total,
        category: query,
        source: 'google_maps',
        place_id: p.place_id,
        source_url: `https://maps.google.com/search/${encodeURIComponent(p.name)}`,
      }
    })
  } catch (e) { console.error('[googleMaps]', e); return [] }
}

// ── SOURCE 2: Google Maps Type Filter sweep ───────────────────────────────────
export async function googleMapsTypeSearch(type: string, city: string, state: string, keyword = 'epoxy concrete coating'): Promise<Lead[]> {
  if (!GM_KEY) return []
  try {
    // Get city center coords via geocoding
    const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city+' '+state)}&key=${GM_KEY}`
    const geoR   = await fetch(geoUrl, { signal: AbortSignal.timeout(8000) })
    const geoD   = await geoR.json()
    const loc    = geoD.results?.[0]?.geometry?.location
    if (!loc) return []

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${loc.lat},${loc.lng}&radius=50000&type=${type}&keyword=${encodeURIComponent(keyword)}&key=${GM_KEY}`
    const data = await gmFetch(url)
    if (!data.results?.length) return []
    return data.results.slice(0, 20).map(p => ({
      company_name: p.name,
      phone: '', website: '',
      address: p.formatted_address || p.vicinity || '',
      city, state,
      rating: p.rating,
      review_count: p.user_ratings_total,
      category: type,
      source: 'google_maps_type',
      place_id: p.place_id,
    }))
  } catch (e) { console.error('[gmType]', type, e); return [] }
}

// ── MAXIMUM SWEEP: all 16 keywords + 4 type filters ──────────────────────────
export async function maxKeywordSweep(city: string, state: string): Promise<Lead[]> {
  const all: Lead[] = []
  // 16 keywords
  for (const kw of XPS_KEYWORDS) {
    try {
      const leads = await googleMapsSearch(kw, city, state, 20)
      all.push(...leads)
      await new Promise(r => setTimeout(r, 200))
    } catch (e) { console.error('[maxSweep kw]', kw, e) }
  }
  // 4 type filters
  for (const type of GM_TYPE_FILTERS) {
    try {
      const leads = await googleMapsTypeSearch(type, city, state)
      all.push(...leads)
      await new Promise(r => setTimeout(r, 300))
    } catch (e) { console.error('[maxSweep type]', type, e) }
  }
  return dedupeLeads(all)
}

// ── SOURCE 3: BBB.org (FREE — no key, public HTML) ───────────────────────────
export async function bbbScrape(industry: string, city: string, state: string, pages = 3): Promise<Lead[]> {
  const all: Lead[] = []
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  }
  for (let page = 1; page <= pages; page++) {
    try {
      const url = `https://www.bbb.org/search?find_text=${encodeURIComponent(industry)}&find_loc=${encodeURIComponent(city+', '+state)}&page=${page}`
      const r = await fetch(url, { headers, signal: AbortSignal.timeout(20000) })
      if (!r.ok) break
      const html = await r.text()

      // Extract structured business+phone pairs from inline JSON
      const nameMatches  = [...html.matchAll(/"name"\s*:\s*"([^"]{5,70})"/g)].map(m => m[1])
      const phoneMatches = [...html.matchAll(/\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}/g)].map(m => m[0])
      const ratingMatches = [...html.matchAll(/"ratingValue"\s*:\s*"?(\d+\.?\d*)"?/g)].map(m => parseFloat(m[1]))
      const addrMatches  = [...html.matchAll(/"streetAddress"\s*:\s*"([^"]{5,80})"/g)].map(m => m[1])

      // Filter out non-business names (city names, category labels)
      const stopWords = new Set(['phoenix','scottsdale','mesa','arizona','az','epoxy','flooring','concrete','bbb','better business','accredited'])
      const validNames = nameMatches.filter(n => {
        const lower = n.toLowerCase()
        return n.length >= 5 && !stopWords.has(lower) && !/^(Floor|Concrete|Epoxy|Coating|Phoenix|AZ|Arizona)$/i.test(n)
      })

      for (let i = 0; i < Math.min(validNames.length, 25); i++) {
        const name = validNames[i]?.trim()
        if (!name || name.length < 4) continue
        all.push({
          company_name: name,
          phone: phoneMatches[i] || '',
          address: addrMatches[i] || '',
          rating: ratingMatches[i] || undefined,
          city, state,
          category: industry,
          source: 'bbb',
          source_url: url,
        })
      }
      await new Promise(r => setTimeout(r, 500))
    } catch (e) { console.error('[bbb] page', page, e); break }
  }
  return all
}

// ── SOURCE 4: Yellow Pages (FREE direct HTML) ─────────────────────────────────
export async function yellowPagesScrape(industry: string, city: string, state: string): Promise<Lead[]> {
  try {
    const search = encodeURIComponent(industry)
    const loc    = encodeURIComponent(`${city}, ${state}`)
    const url    = `https://www.yellowpages.com/search?search_terms=${search}&geo_location_terms=${loc}`
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(20000),
    })
    if (!r.ok) return []
    const html = await r.text()
    const nameMatches  = [...html.matchAll(/"name"\s*:\s*"([^"]{5,70})"/g)].map(m => m[1]).filter(n => n.length > 4)
    const phoneMatches = [...html.matchAll(/\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}/g)].map(m => m[0])
    const addrMatches  = [...html.matchAll(/"streetAddress"\s*:\s*"([^"]{5,80})"/g)].map(m => m[1])
    const seen = new Set<string>()
    const result: Lead[] = []
    for (let i = 0; i < Math.min(nameMatches.length, 30); i++) {
      const name = nameMatches[i]?.trim()
      if (!name || name.length < 4) continue
      const key = name.toLowerCase().replace(/[^a-z0-9]/g,'')
      if (seen.has(key)) continue
      seen.add(key)
      result.push({ company_name: name, phone: phoneMatches[i] || '', address: addrMatches[i] || '', city, state, category: industry, source: 'yellowpages', source_url: url })
    }
    return result
  } catch (e) { console.error('[yellowPages]', e); return [] }
}

// ── SOURCE 5: Yelp Fusion (FREE 500/day — add YELP_API_KEY) ──────────────────
export async function yelpSearch(industry: string, city: string, state: string, limit = 50): Promise<Lead[]> {
  if (!YELP_KEY) return []
  try {
    const url = `https://api.yelp.com/v3/businesses/search?term=${encodeURIComponent(industry)}&location=${encodeURIComponent(city+','+state)}&limit=${Math.min(limit,50)}&sort_by=rating`
    const r = await fetch(url, { headers: { 'Authorization': `Bearer ${YELP_KEY}` }, signal: AbortSignal.timeout(12000) })
    if (!r.ok) return []
    const d = await r.json()
    return (d.businesses || []).map((b: {name:string;phone?:string;url?:string;rating?:number;review_count?:number;location?:{address1?:string;city?:string;state?:string}}) => ({
      company_name: b.name, phone: b.phone || '', website: b.url || '',
      rating: b.rating, review_count: b.review_count,
      address: b.location?.address1 || '', city: b.location?.city || city, state: b.location?.state || state,
      category: industry, source: 'yelp',
    }))
  } catch (e) { console.error('[yelp]', e); return [] }
}

// ── SOURCE 6: Bing Maps (FREE 125k/yr — add BING_MAPS_KEY) ───────────────────
export async function bingLocalSearch(industry: string, city: string, state: string, limit = 25): Promise<Lead[]> {
  if (!BING_KEY) return []
  try {
    const q   = encodeURIComponent(`${industry} ${city} ${state}`)
    const url = `https://dev.virtualearth.net/REST/v1/LocalSearch/?query=${q}&maxResults=${Math.min(limit,25)}&key=${BING_KEY}`
    const r   = await fetch(url, { signal: AbortSignal.timeout(12000) })
    if (!r.ok) return []
    const d   = await r.json()
    const places = d.resourceSets?.[0]?.resources?.[0]?.value || []
    return places.map((p: {name?:string;PhoneNumber?:string;Website?:string;Address?:{addressLine?:string;locality?:string;adminDistrict?:string}}) => ({
      company_name: p.name || 'Unknown', phone: p.PhoneNumber || '', website: p.Website || '',
      address: p.Address?.addressLine || '', city: p.Address?.locality || city, state: p.Address?.adminDistrict || state,
      category: industry, source: 'bing_maps',
    }))
  } catch (e) { console.error('[bing]', e); return [] }
}

// ── SOURCE 7: Apollo.io ───────────────────────────────────────────────────────
export async function apolloSearch(industry: string, city: string, state: string, limit = 25): Promise<Lead[]> {
  if (!AP_KEY) return []
  try {
    const body = { q_organization_keyword_tags: [industry], organization_locations: [`${city}, ${state}`], per_page: Math.min(limit, 50), page: 1 }
    const r = await fetch('https://api.apollo.io/v1/organizations/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': AP_KEY },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    })
    if (!r.ok) return []
    const d = await r.json()
    return (d.organizations || []).map((o: {name?:string;primary_phone?:{number:string};phone_numbers?:{raw_number:string}[];website_url?:string;city?:string;state?:string;primary_domain?:string}) => ({
      company_name: o.name || 'Unknown',
      phone: o.primary_phone?.number || o.phone_numbers?.[0]?.raw_number || '',
      website: o.website_url || '',
      email: o.primary_domain ? `info@${o.primary_domain}` : '',
      city: o.city || city, state: o.state || state,
      category: industry, source: 'apollo',
    }))
  } catch (e) { console.error('[apollo]', e); return [] }
}

// ── SOURCE 8: AI Gateway fallback (only if <5 real results) ──────────────────
export async function aiLeads(industry: string, city: string, state: string, limit = 15): Promise<Lead[]> {
  if (!AI_KEY) return []
  try {
    const r = await fetch(AI_URL + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + AI_KEY },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: `List ${Math.min(limit,15)} real ${industry} contractors in ${city}, ${state}. Real known businesses only — no fabrications. Return JSON array ONLY: [{"company_name":"...","phone":"XXX-XXX-XXXX","city":"${city}","state":"${state}","website":"https://...","category":"${industry}"}]` }],
        temperature: 0.1, max_tokens: 1000,
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

// ── Multi-city sweep ──────────────────────────────────────────────────────────
export async function multiCitySweep(cities: string[] = AZ_CITIES, state = 'AZ', industry = 'Epoxy Flooring') {
  const results: { city: string; leads: Lead[]; count: number }[] = []
  for (const city of cities) {
    try {
      const leads = await googleMapsSearch(industry, city, state, 20)
      results.push({ city, leads, count: leads.length })
      await new Promise(r => setTimeout(r, 400))
    } catch (e) { console.error('[multiCity]', city, e); results.push({ city, leads: [], count: 0 }) }
  }
  return results
}

// ── Save to Supabase ──────────────────────────────────────────────────────────
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
