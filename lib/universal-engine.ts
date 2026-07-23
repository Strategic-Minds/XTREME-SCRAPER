/**
 * XTREME SCRAPER — Universal Engine v4.0
 * Works for ANY industry, ANY city, ANY category globally.
 * Auto-expands user intent into multi-keyword, multi-source search strategy.
 */

export interface UniversalQuery {
  // What the user typed — could be ANYTHING
  // e.g. 'plumbers', 'wedding photographers', 'accountants near me', 'roofing contractors'
  raw_query: string
  city: string
  state: string
  country?: string // default 'US'
  limit?: number   // 0 = no limit
  mode?: 'quick' | 'deep' | 'max'
}

export interface UniversalResult {
  company_name: string
  phone?: string
  email?: string
  website?: string
  address?: string
  city?: string
  state?: string
  rating?: number
  review_count?: number
  category?: string
  source?: string
  place_id?: string
  source_url?: string
}

// ── SMART KEYWORD EXPANDER ────────────────────────────────────────────────────
// Takes the raw user query and returns 4-16 search keyword variations
// This runs INSTANTLY with no API call — pure logic
export function expandKeywords(raw_query: string): string[] {
  const q = raw_query.trim().toLowerCase()
  const keywords: string[] = []

  // Always include the exact query
  keywords.push(q)

  // Contractor/service expansions
  const contractorTerms = ['contractor', 'company', 'service', 'services', 'near me', 'local', 'professional', 'expert']
  if (!contractorTerms.some(t => q.includes(t))) {
    keywords.push(`${q} contractor`)
    keywords.push(`${q} company`)
    keywords.push(`${q} services`)
  }

  // Business type expansions
  if (q.includes('floor') || q.includes('epoxy') || q.includes('coating')) {
    keywords.push('floor coating contractor', 'concrete coating', 'garage floor coating')
  }
  if (q.includes('plumb')) {
    keywords.push('plumbing contractor', 'plumbing repair', 'emergency plumber')
  }
  if (q.includes('roo')) {
    keywords.push('roofing contractor', 'roof repair', 'roofing company')
  }
  if (q.includes('electric')) {
    keywords.push('electrician', 'electrical contractor', 'electrical services')
  }
  if (q.includes('hvac') || q.includes('air') || q.includes('heat')) {
    keywords.push('hvac contractor', 'air conditioning', 'heating and cooling')
  }
  if (q.includes('landscap') || q.includes('lawn') || q.includes('garden')) {
    keywords.push('landscaping company', 'lawn care', 'landscape contractor')
  }
  if (q.includes('clean')) {
    keywords.push('cleaning service', 'cleaning company', 'janitorial services', 'commercial cleaning')
  }
  if (q.includes('paint')) {
    keywords.push('painting contractor', 'house painter', 'commercial painter', 'interior painting')
  }
  if (q.includes('pest')) {
    keywords.push('pest control', 'exterminator', 'pest management')
  }
  if (q.includes('photo')) {
    keywords.push('photographer', 'photography studio', 'photography services', 'professional photographer')
  }
  if (q.includes('account') || q.includes('cpa') || q.includes('tax')) {
    keywords.push('accountant', 'CPA firm', 'tax preparation', 'bookkeeping')
  }
  if (q.includes('legal') || q.includes('attorney') || q.includes('lawyer')) {
    keywords.push('attorney', 'law firm', 'legal services', 'lawyer')
  }
  if (q.includes('realtor') || q.includes('real estate')) {
    keywords.push('real estate agent', 'realtor', 'real estate broker', 'property management')
  }
  if (q.includes('restaurant') || q.includes('food') || q.includes('cater')) {
    keywords.push('restaurant', 'catering', 'food service', 'catering company')
  }
  if (q.includes('dental') || q.includes('dentist')) {
    keywords.push('dentist', 'dental clinic', 'dental office', 'orthodontist')
  }
  if (q.includes('medical') || q.includes('doctor') || q.includes('clinic')) {
    keywords.push('medical clinic', 'doctor', 'physician', 'urgent care')
  }
  if (q.includes('gym') || q.includes('fitness')) {
    keywords.push('gym', 'fitness center', 'personal trainer', 'fitness studio')
  }
  if (q.includes('salon') || q.includes('hair') || q.includes('beauty')) {
    keywords.push('hair salon', 'beauty salon', 'barber shop', 'nail salon')
  }
  if (q.includes('truck') || q.includes('transport') || q.includes('freight')) {
    keywords.push('trucking company', 'freight carrier', 'logistics company', 'transportation')
  }
  if (q.includes('construc') || q.includes('build') || q.includes('remodel')) {
    keywords.push('construction company', 'general contractor', 'home builder', 'remodeling contractor')
  }

  // Commercial/industrial expansion
  if (!q.includes('commercial') && !q.includes('residential')) {
    keywords.push(`commercial ${q}`)
  }

  // Remove duplicates, limit to 16
  return [...new Set(keywords)].slice(0, 16)
}

// ── GOOGLE MAPS TYPE INFERENCE ─────────────────────────────────────────────
// Infers the best GM place type for a query to enable type-filter searches
export function inferGMTypes(raw_query: string): string[] {
  const q = raw_query.toLowerCase()
  if (q.includes('floor') || q.includes('epoxy') || q.includes('tile') || q.includes('carpet')) return ['floor_covering_store', 'general_contractor', 'home_improvement_store']
  if (q.includes('plumb')) return ['plumber']
  if (q.includes('electrician') || q.includes('electric')) return ['electrician']
  if (q.includes('roo')) return ['roofing_contractor', 'general_contractor']
  if (q.includes('paint')) return ['painter']
  if (q.includes('landscap') || q.includes('lawn')) return ['landscaper']
  if (q.includes('restaurant') || q.includes('food') || q.includes('cafe')) return ['restaurant', 'cafe', 'food']
  if (q.includes('gym') || q.includes('fitness')) return ['gym']
  if (q.includes('salon') || q.includes('hair')) return ['hair_care', 'beauty_salon']
  if (q.includes('dentist') || q.includes('dental')) return ['dentist']
  if (q.includes('doctor') || q.includes('medical') || q.includes('clinic')) return ['doctor', 'health']
  if (q.includes('lawyer') || q.includes('attorney')) return ['lawyer']
  if (q.includes('pharmacy') || q.includes('drug')) return ['pharmacy']
  if (q.includes('hotel') || q.includes('motel')) return ['lodging']
  if (q.includes('auto') || q.includes('car') || q.includes('mechanic')) return ['car_repair', 'car_dealer']
  if (q.includes('real estate') || q.includes('realtor')) return ['real_estate_agency']
  if (q.includes('bank') || q.includes('credit union')) return ['bank']
  if (q.includes('school') || q.includes('tutor')) return ['school']
  if (q.includes('store') || q.includes('shop') || q.includes('retail')) return ['store', 'shopping_mall']
  // Generic catch-all
  return ['general_contractor', 'establishment']
}

// ── CITY COORDS LOOKUP ─────────────────────────────────────────────────────
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'phoenix':       { lat: 33.4484, lng: -112.0740 },
  'scottsdale':    { lat: 33.4942, lng: -111.9261 },
  'mesa':          { lat: 33.4152, lng: -111.8315 },
  'tempe':         { lat: 33.4255, lng: -111.9400 },
  'chandler':      { lat: 33.3062, lng: -111.8413 },
  'gilbert':       { lat: 33.3528, lng: -111.7890 },
  'glendale':      { lat: 33.5387, lng: -112.1860 },
  'tucson':        { lat: 32.2226, lng: -110.9747 },
  'los angeles':   { lat: 34.0522, lng: -118.2437 },
  'san diego':     { lat: 32.7157, lng: -117.1611 },
  'san francisco': { lat: 37.7749, lng: -122.4194 },
  'las vegas':     { lat: 36.1699, lng: -115.1398 },
  'denver':        { lat: 39.7392, lng: -104.9903 },
  'dallas':        { lat: 32.7767, lng: -96.7970 },
  'houston':       { lat: 29.7604, lng: -95.3698 },
  'austin':        { lat: 30.2672, lng: -97.7431 },
  'miami':         { lat: 25.7617, lng: -80.1918 },
  'orlando':       { lat: 28.5383, lng: -81.3792 },
  'atlanta':       { lat: 33.7490, lng: -84.3880 },
  'chicago':       { lat: 41.8781, lng: -87.6298 },
  'new york':      { lat: 40.7128, lng: -74.0060 },
  'brooklyn':      { lat: 40.6782, lng: -73.9442 },
  'boston':        { lat: 42.3601, lng: -71.0589 },
  'seattle':       { lat: 47.6062, lng: -122.3321 },
  'portland':      { lat: 45.5051, lng: -122.6750 },
  'nashville':     { lat: 36.1627, lng: -86.7816 },
  'charlotte':     { lat: 35.2271, lng: -80.8431 },
  'jacksonville':  { lat: 30.3322, lng: -81.6557 },
  'tampa':         { lat: 27.9506, lng: -82.4572 },
  'minneapolis':   { lat: 44.9778, lng: -93.2650 },
  'st louis':      { lat: 38.6270, lng: -90.1994 },
  'kansas city':   { lat: 39.0997, lng: -94.5786 },
  'salt lake city':{ lat: 40.7608, lng: -111.8910 },
  'albuquerque':   { lat: 35.0844, lng: -106.6504 },
  'omaha':         { lat: 41.2565, lng: -95.9345 },
  'tulsa':         { lat: 36.1540, lng: -95.9928 },
  'raleigh':       { lat: 35.7796, lng: -78.6382 },
  'richmond':      { lat: 37.5407, lng: -77.4360 },
  'louisville':    { lat: 38.2527, lng: -85.7585 },
  'columbus':      { lat: 39.9612, lng: -82.9988 },
  'cleveland':     { lat: 41.4993, lng: -81.6944 },
  'detroit':       { lat: 42.3314, lng: -83.0458 },
  'indianapolis':  { lat: 39.7684, lng: -86.1581 },
  'memphis':       { lat: 35.1495, lng: -90.0490 },
  'sacramento':    { lat: 38.5816, lng: -121.4944 },
  'fresno':        { lat: 36.7378, lng: -119.7871 },
  'el paso':       { lat: 31.7619, lng: -106.4850 },
  'fort worth':    { lat: 32.7555, lng: -97.3308 },
  'san antonio':   { lat: 29.4241, lng: -98.4936 },
}

export function getCityCoords(city: string): { lat: number; lng: number } {
  return CITY_COORDS[city.toLowerCase().trim()] || CITY_COORDS['phoenix']
}

// ── GOOGLE MAPS UNIVERSAL SEARCH ──────────────────────────────────────────
const GM_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY || ''

async function gmTextSearch(query: string, city: string, state: string): Promise<UniversalResult[]> {
  if (!GM_KEY) return []
  try {
    const q = encodeURIComponent(`${query} ${city} ${state}`)
    const r = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${q}&key=${GM_KEY}`, { signal: AbortSignal.timeout(12000) })
    if (!r.ok) return []
    const d = await r.json()
    return (d.results || []).slice(0, 20).map((p: {name:string;formatted_address?:string;vicinity?:string;rating?:number;user_ratings_total?:number;place_id?:string}) => ({
      company_name: p.name,
      address: p.formatted_address || p.vicinity || '',
      city, state,
      rating: p.rating,
      review_count: p.user_ratings_total,
      category: query,
      source: 'google_maps',
      place_id: p.place_id,
    }))
  } catch (e) { console.error('[gmText]', e); return [] }
}

async function gmNearbySearch(type: string, city: string, state: string, keyword: string): Promise<UniversalResult[]> {
  if (!GM_KEY) return []
  try {
    const coords = getCityCoords(city)
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coords.lat},${coords.lng}&radius=50000&type=${type}&keyword=${encodeURIComponent(keyword)}&key=${GM_KEY}`
    const r = await fetch(url, { signal: AbortSignal.timeout(12000) })
    if (!r.ok) return []
    const d = await r.json()
    return (d.results || []).slice(0, 20).map((p: {name:string;formatted_address?:string;vicinity?:string;rating?:number;user_ratings_total?:number;place_id?:string}) => ({
      company_name: p.name,
      address: p.formatted_address || p.vicinity || '',
      city, state,
      rating: p.rating,
      review_count: p.user_ratings_total,
      category: type,
      source: 'google_maps_type',
      place_id: p.place_id,
    }))
  } catch (e) { console.error('[gmNearby]', type, e); return [] }
}

async function gmDetails(place_id: string): Promise<{ phone?: string; website?: string }> {
  if (!GM_KEY || !place_id) return {}
  try {
    const r = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=formatted_phone_number,website&key=${GM_KEY}`, { signal: AbortSignal.timeout(8000) })
    const d = await r.json()
    return { phone: d.result?.formatted_phone_number, website: d.result?.website }
  } catch { return {} }
}

// ── BBB UNIVERSAL SCRAPE ───────────────────────────────────────────────────
export async function bbbUniversalScrape(query: string, city: string, state: string, pages = 2): Promise<UniversalResult[]> {
  const all: UniversalResult[] = []
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml',
  }
  for (let page = 1; page <= pages; page++) {
    try {
      const url = `https://www.bbb.org/search?find_text=${encodeURIComponent(query)}&find_loc=${encodeURIComponent(city + ', ' + state)}&page=${page}`
      const r = await fetch(url, { headers, signal: AbortSignal.timeout(20000) })
      if (!r.ok) break
      const html = await r.text()
      const nameMatches  = [...html.matchAll(/"name"\s*:\s*"([^"]{5,70})"/g)].map(m => m[1])
      const phoneMatches = [...html.matchAll(/\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}/g)].map(m => m[0])
      const addrMatches  = [...html.matchAll(/"streetAddress"\s*:\s*"([^"]{5,80})"/g)].map(m => m[1])
      const ratingMatches = [...html.matchAll(/"ratingValue"\s*:\s*"?(\d+\.?\d*)"?/g)].map(m => parseFloat(m[1]))
      const seen = new Set<string>()
      for (let i = 0; i < Math.min(nameMatches.length, 25); i++) {
        const name = nameMatches[i]?.trim()
        if (!name || name.length < 4) continue
        const key = name.toLowerCase().replace(/[^a-z0-9]/g, '')
        if (seen.has(key)) continue
        seen.add(key)
        all.push({ company_name: name, phone: phoneMatches[i] || '', address: addrMatches[i] || '', rating: ratingMatches[i] || undefined, city, state, category: query, source: 'bbb', source_url: url })
      }
      await new Promise(r => setTimeout(r, 400))
    } catch (e) { console.error('[bbb]', page, e); break }
  }
  return all
}

// ── DEDUP ──────────────────────────────────────────────────────────────────
export function dedupeResults(results: UniversalResult[]): UniversalResult[] {
  const seen = new Map<string, UniversalResult>()
  for (const r of results) {
    const key = r.company_name.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (!seen.has(key)) { seen.set(key, r) } else {
      const ex = seen.get(key)!
      if (!ex.phone && r.phone) ex.phone = r.phone
      if (!ex.website && r.website) ex.website = r.website
      if (!ex.email && r.email) ex.email = r.email
    }
  }
  return [...seen.values()]
}

// ── MAIN UNIVERSAL SEARCH ──────────────────────────────────────────────────
export async function universalSearch(query: UniversalQuery): Promise<{ results: UniversalResult[]; keywords_used: string[]; sources_used: string[]; duration_ms: number }> {
  const start = Date.now()
  const { raw_query, city, state, mode = 'quick' } = query
  const keywords = expandKeywords(raw_query)
  const gmTypes  = inferGMTypes(raw_query)
  const all: UniversalResult[] = []
  const sources: string[] = []

  if (mode === 'quick') {
    // 1 keyword + BBB concurrently
    const [gmR, bbbR] = await Promise.allSettled([
      gmTextSearch(keywords[0], city, state).catch(() => []),
      bbbUniversalScrape(raw_query, city, state, 1).catch(() => []),
    ])
    if (gmR.status === 'fulfilled' && gmR.value.length)  { all.push(...gmR.value);  sources.push('google_maps') }
    if (bbbR.status === 'fulfilled' && bbbR.value.length) { all.push(...bbbR.value); sources.push('bbb') }
  }

  if (mode === 'deep' || mode === 'max') {
    // All keywords in batches of 4, + type filters + BBB concurrently
    const BATCH = 4
    const kwBatches: string[][] = []
    for (let i = 0; i < keywords.length; i += BATCH) kwBatches.push(keywords.slice(i, i + BATCH))

    const kwPromises = kwBatches.map(batch =>
      Promise.allSettled(batch.map(kw => gmTextSearch(kw, city, state).catch(() => [])))
    )
    const typePromises = gmTypes.map(t => gmNearbySearch(t, city, state, raw_query).catch(() => []))
    const bbbPromise  = bbbUniversalScrape(raw_query, city, state, 2).catch(() => [])

    const [kwResults, typeResults, bbbResult] = await Promise.allSettled([
      Promise.all(kwPromises),
      Promise.allSettled(typePromises),
      bbbPromise,
    ])

    if (kwResults.status === 'fulfilled') {
      for (const batch of kwResults.value) {
        for (const r of batch) { if (r.status === 'fulfilled' && r.value.length) all.push(...r.value) }
      }
      sources.push('google_maps_multi')
    }
    if (typeResults.status === 'fulfilled') {
      for (const r of typeResults.value) { if (r.status === 'fulfilled' && r.value.length) all.push(...r.value) }
      if (typeResults.value.some(r => r.status === 'fulfilled' && r.value.length)) sources.push('google_maps_type')
    }
    if (bbbResult.status === 'fulfilled' && bbbResult.value.length) { all.push(...bbbResult.value); sources.push('bbb') }
  }

  // Enrich top 5 with phone/website via GM Details
  const deduped = dedupeResults(all)
  const needsPhone = deduped.filter(r => r.source === 'google_maps' && !r.phone && r.place_id).slice(0, 5)
  if (needsPhone.length) {
    const enriched = await Promise.allSettled(needsPhone.map(r => gmDetails(r.place_id!)))
    for (let i = 0; i < needsPhone.length; i++) {
      const d = enriched[i]
      if (d.status === 'fulfilled') {
        const target = deduped.find(r => r.place_id === needsPhone[i].place_id)
        if (target) { target.phone = d.value.phone; target.website = d.value.website }
      }
    }
  }

  const final = query.limit && query.limit > 0 ? deduped.slice(0, query.limit) : deduped
  return { results: final, keywords_used: keywords, sources_used: sources, duration_ms: Date.now() - start }
}
