/**
 * XTREME SCRAPER — Level 5 Intelligence Engine
 * Every source. Maximum output. Universal targeting.
 * Sources: Google Maps + Google Places + ScrapingBee + Apollo + Firecrawl + BrowserWorker + BBB + YP + AI
 */

export interface L5Lead {
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
  owner_name?: string
  linkedin?: string
  confidence?: number // 0-100, how confident we are this is a real match
}

export interface L5Query {
  query: string      // raw user input — any industry, any category
  city: string
  state: string
  country?: string
  mode?: 'quick' | 'deep' | 'max' | 'level5'
  limit?: number
}

export interface L5Result {
  leads: L5Lead[]
  total: number
  sources_used: string[]
  sources_skipped: { source: string; reason: string }[]
  keywords_expanded: string[]
  duration_ms: number
  mode: string
}

// ── ENV ──────────────────────────────────────────────────────────────────────
const GM_KEY   = process.env.GOOGLE_MAPS_API_KEY   || process.env.GOOGLE_PLACES_API_KEY || ''
const GC_KEY   = process.env.GOOGLE_CLOUD_API_KEY  || ''
const SB_KEY   = process.env.SCRAPINGBEE_API_KEY   || ''
const AP_KEY   = process.env.APOLLO_API_KEY_2      || ''
const FC_KEY   = process.env.FIRECRAWL_API_KEY     || ''
const BW_URL   = process.env.BROWSER_WORKER_URL    || 'https://browserworker.vercel.app'
const BW_SEC   = process.env.BROWSER_WORKER_SECRET || process.env.BROWSER_WORKER_TOKEN || ''
const AI_URL   = process.env.AI_GATEWAY_BASE_URL   || 'https://ai-gateway.vercel.sh/v1'
const AI_KEY   = process.env.AI_GATEWAY_API_KEY    || ''
const SB_URL   = process.env.SUPABASE_URL          || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SB_SKEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const HS_KEY   = process.env.HUBSPOT_ACCESS_TOKEN  || ''
const YELP_KEY = process.env.YELP_API_KEY          || ''

// ── KEYWORD EXPANDER ─────────────────────────────────────────────────────────
// Smart expansion for ANY query — generates 8-16 search variants instantly
export function expandQuery(query: string): string[] {
  const q = query.trim().toLowerCase()
  const variants = new Set<string>([q])

  // Universal suffixes
  const suffixes = ['contractor', 'company', 'services', 'near me', 'local', 'professional']
  for (const s of suffixes) {
    if (!q.includes(s)) variants.add(`${q} ${s}`)
  }

  // Commercial prefix
  if (!q.includes('commercial')) variants.add(`commercial ${q}`)

  // Industry-specific expansions
  const expansions: Record<string, string[]> = {
    floor: ['floor coating contractor', 'concrete coating', 'garage floor coating', 'epoxy flooring', 'polished concrete'],
    epoxy: ['epoxy floor coating', 'garage floor epoxy', 'metallic epoxy', 'industrial epoxy coating'],
    plumb: ['plumbing contractor', 'plumbing repair', 'emergency plumber', 'drain cleaning'],
    roo: ['roofing contractor', 'roof repair', 'roofing company', 'commercial roofing'],
    electr: ['electrician', 'electrical contractor', 'electrical services', 'commercial electrician'],
    hvac: ['hvac contractor', 'air conditioning', 'heating and cooling', 'ac repair'],
    landscap: ['landscaping company', 'lawn care', 'landscape contractor', 'yard maintenance'],
    clean: ['cleaning service', 'commercial cleaning', 'janitorial services', 'office cleaning'],
    paint: ['painting contractor', 'house painter', 'commercial painter', 'interior painting'],
    pest: ['pest control', 'exterminator', 'pest management', 'termite control'],
    photo: ['photographer', 'photography studio', 'wedding photographer', 'commercial photography'],
    account: ['accountant', 'CPA firm', 'tax preparation', 'bookkeeping service'],
    legal: ['attorney', 'law firm', 'legal services', 'lawyer near me'],
    realtor: ['real estate agent', 'realtor', 'real estate broker', 'property management'],
    restaur: ['restaurant', 'catering', 'food service', 'catering company'],
    dental: ['dentist', 'dental clinic', 'orthodontist', 'dental office'],
    medical: ['medical clinic', 'doctor', 'physician', 'urgent care'],
    gym: ['gym', 'fitness center', 'personal trainer', 'fitness studio'],
    salon: ['hair salon', 'beauty salon', 'barber shop', 'nail salon'],
    truck: ['trucking company', 'freight carrier', 'logistics company', 'moving company'],
    construc: ['construction company', 'general contractor', 'home builder', 'remodeling'],
    auto: ['auto repair', 'mechanic', 'car repair shop', 'auto body shop'],
    insur: ['insurance agent', 'insurance broker', 'insurance company'],
    market: ['marketing agency', 'digital marketing', 'advertising agency', 'seo company'],
    it: ['it services', 'managed it', 'computer repair', 'tech support'],

    // Stone, masonry, polishing
    stone: ['stone polishing', 'marble polishing', 'granite restoration', 'stone restoration', 'concrete polishing', 'terrazzo polishing', 'floor polishing company', 'stone cleaning company', 'masonry contractor', 'stone fabricator'],
    polis: ['polishing company', 'floor polishing', 'surface restoration', 'concrete polishing contractor', 'stone polishing contractor', 'marble restoration'],
    marble: ['marble polishing', 'marble restoration', 'marble cleaning', 'stone polishing', 'terrazzo restoration'],
    granit: ['granite polishing', 'granite restoration', 'stone fabrication', 'countertop restoration'],
    terraz: ['terrazzo polishing', 'terrazzo restoration', 'terrazzo contractor'],
    mason: ['masonry contractor', 'stone mason', 'brick mason', 'stonework contractor'],
    concrete: ['concrete polishing', 'concrete coating', 'concrete contractor', 'decorative concrete', 'concrete restoration'],

    // Restoration / cleaning specialty
    restore: ['restoration contractor', 'surface restoration', 'property restoration', 'building restoration'],
    restor: ['restoration contractor', 'surface restoration', 'stone restoration', 'floor restoration'],
    pressure: ['pressure washing', 'power washing company', 'exterior cleaning'],
    wash: ['pressure washing', 'window washing', 'fleet washing', 'soft wash contractor'],

    // Windows / glass
    window: ['window cleaning company', 'window washing service', 'glass restoration', 'commercial window cleaning'],
    glass: ['glass company', 'glass repair', 'auto glass', 'commercial glazing'],

    // Fencing / gates
    fence: ['fencing contractor', 'fence installation', 'privacy fence', 'chain link fence', 'vinyl fence company'],
    gate: ['gate installation', 'automatic gate', 'driveway gate', 'security gate contractor'],

    // Decking / outdoor
    deck: ['deck contractor', 'deck builder', 'composite decking', 'deck repair'],
    patio: ['patio contractor', 'patio builder', 'outdoor living contractor', 'hardscape contractor'],
    paver: ['paver contractor', 'paver installation', 'interlocking pavers', 'hardscape contractor'],
    hard: ['hardscape contractor', 'paver installation', 'retaining wall contractor', 'outdoor contractor'],

    // Pools / water
    pool: ['pool contractor', 'pool installation', 'pool resurfacing', 'pool cleaning service', 'swimming pool company'],
    water: ['water damage restoration', 'water heater repair', 'waterproofing contractor', 'water treatment'],
    waterproof: ['waterproofing contractor', 'foundation waterproofing', 'basement waterproofing'],

    // Foundation / structural
    found: ['foundation repair', 'foundation contractor', 'structural repair', 'basement waterproofing'],
    structur: ['structural contractor', 'structural engineer', 'foundation repair'],
    brickwork: ['brick contractor', 'brick repair', 'tuckpointing', 'masonry repair'],

    // Stucco / drywall
    stucco: ['stucco contractor', 'stucco repair', 'plaster contractor', 'exterior coating'],
    drywall: ['drywall contractor', 'drywall repair', 'drywall installation', 'interior contractor'],
    plaster: ['plastering contractor', 'plaster repair', 'drywall contractor'],

    // Insulation / energy
    insulat: ['insulation contractor', 'spray foam insulation', 'attic insulation', 'energy efficiency contractor'],
    solar: ['solar company', 'solar panel installation', 'solar contractor', 'renewable energy'],
    generator: ['generator installation', 'standby generator', 'generator contractor'],

    // Irrigation / water
    irrigat: ['irrigation contractor', 'sprinkler system', 'drip irrigation', 'irrigation repair'],
    sprinkler: ['sprinkler contractor', 'fire sprinkler', 'irrigation sprinkler', 'lawn sprinkler'],

    // Tree / outdoor
    tree: ['tree service', 'tree removal', 'tree trimming', 'arborist', 'stump grinding'],
    stump: ['stump grinding', 'stump removal', 'tree service'],
    arborist: ['certified arborist', 'tree service', 'tree trimming company'],

    // Appliance / home services
    appli: ['appliance repair', 'appliance installation', 'home appliance service'],
    cabinet: ['cabinet maker', 'custom cabinets', 'cabinet installation', 'kitchen cabinets'],
    counter: ['countertop installation', 'granite countertops', 'quartz countertops', 'stone fabricator'],

    // Security / cameras
    security: ['security system', 'security camera installation', 'alarm company', 'access control'],
    alarm: ['alarm company', 'security alarm', 'fire alarm', 'home security'],
    camera: ['security camera', 'cctv installation', 'surveillance camera'],

    // Moving / storage
    moving: ['moving company', 'local movers', 'long distance moving', 'furniture movers'],
    storage: ['storage facility', 'self storage', 'moving and storage', 'portable storage'],
    junk: ['junk removal', 'hauling company', 'debris removal', 'cleanout service'],
    haul: ['hauling company', 'junk removal', 'debris hauling', 'waste removal'],

    // Welding / fabrication
    weld: ['welding company', 'welding contractor', 'metal fabrication', 'structural welding'],
    fabricat: ['metal fabrication', 'custom fabrication', 'steel fabrication', 'welding shop'],
    metal: ['metal fabrication', 'metalwork contractor', 'steel contractor', 'iron works'],

    // Printing / signage
    print: ['printing company', 'commercial printing', 'sign company', 'large format printing'],
    sign: ['sign company', 'signage contractor', 'commercial signs', 'vinyl signs'],
    wrap: ['vehicle wraps', 'car wrap company', 'fleet wraps', 'vinyl wrap shop'],

    // Staffing / HR
    staff: ['staffing agency', 'temp agency', 'employment agency', 'staffing company'],
    recruit: ['recruiting agency', 'executive recruiter', 'staffing firm', 'headhunter'],

    // Finance / consulting
    finance: ['financial advisor', 'financial planning', 'investment advisor', 'wealth management'],
    consult: ['consulting firm', 'business consultant', 'management consulting', 'strategy consultant'],

    // Tech / software
    tech: ['tech company', 'software company', 'it consulting', 'technology services'],
    software: ['software company', 'software developer', 'app development', 'custom software'],
    website: ['web design company', 'website developer', 'web development agency', 'digital agency'],

    // Event / entertainment
    event: ['event planning company', 'event venue', 'event coordinator', 'party planning'],
    wedding: ['wedding planner', 'wedding venue', 'wedding photographer', 'wedding caterer'],
    cater: ['catering company', 'corporate catering', 'event catering', 'food service'],
    venue: ['event venue', 'wedding venue', 'banquet hall', 'conference center'],

    // Health / wellness
    therapy: ['physical therapy', 'massage therapy', 'occupational therapy', 'chiropractic'],
    chiro: ['chiropractor', 'chiropractic clinic', 'spine specialist'],
    vet: ['veterinarian', 'animal hospital', 'pet clinic', 'emergency vet'],
    pharma: ['pharmacy', 'compounding pharmacy', 'specialty pharmacy'],

    // Logistics
    logistic: ['logistics company', 'freight broker', 'supply chain', 'warehousing'],
    warehouse: ['warehouse company', 'fulfillment center', 'distribution center', 'storage warehouse'],
    shipping: ['shipping company', 'freight company', 'courier service', 'delivery service'],

    // Food production
    bakery: ['bakery', 'custom bakery', 'wholesale bakery', 'artisan bakery'],
    brewery: ['brewery', 'craft brewery', 'microbrewery', 'brewing company'],
    coffee: ['coffee shop', 'coffee roaster', 'cafe', 'espresso bar'],
  }

  for (const [key, exps] of Object.entries(expansions)) {
    if (q.includes(key)) exps.forEach(e => variants.add(e))
  }

  return [...variants].slice(0, 16)
}

// ── GM TYPE INFERENCE ─────────────────────────────────────────────────────────
export function inferTypes(query: string): string[] {
  const q = query.toLowerCase()
  const map: [string, string[]][] = [
    ['floor|epoxy|coating|tile|carpet', ['floor_covering_store', 'general_contractor', 'home_improvement_store', 'painter']],
    ['plumb', ['plumber']],
    ['electr', ['electrician']],
    ['roo', ['roofing_contractor', 'general_contractor']],
    ['paint', ['painter']],
    ['landscap|lawn|garden', ['landscaper']],
    ['restaur|food|cafe|cater', ['restaurant', 'cafe', 'meal_delivery']],
    ['gym|fitness', ['gym']],
    ['salon|hair|beauty|barber|nail', ['hair_care', 'beauty_salon']],
    ['dentist|dental|ortho', ['dentist']],
    ['doctor|medical|clinic|physician', ['doctor', 'hospital']],
    ['lawyer|attorney|legal', ['lawyer']],
    ['pharmacy|drug', ['pharmacy']],
    ['hotel|motel|lodg', ['lodging']],
    ['auto|mechanic|car repair', ['car_repair']],
    ['real estate|realtor', ['real_estate_agency']],
    ['bank|credit union', ['bank']],
    ['school|tutor|educat', ['school']],
    ['stone|polis|marble|granit|terraz|mason|slate', ['store', 'general_contractor', 'floor_covering_store', 'home_goods_store']],
    ['concrete|cement', ['general_contractor', 'home_improvement_store', 'store']],
    ['fence|gate', ['general_contractor', 'store']],
    ['deck|patio|paver|hardscape', ['general_contractor', 'home_improvement_store']],
    ['pool|spa', ['general_contractor', 'health', 'store']],
    ['tree|arborist|stump', ['general_contractor', 'store']],
    ['moving|mover', ['moving_company', 'storage']],
    ['security|alarm|camera', ['store', 'electrician']],
    ['weld|fabricat|metal', ['store', 'general_contractor']],
    ['sign|print|wrap', ['store', 'point_of_interest']],
    ['window|glass', ['store', 'general_contractor']],
    ['waterproof|found', ['general_contractor', 'home_improvement_store']],
    ['event|wedding|cater|venue', ['event_venue', 'restaurant', 'point_of_interest']],
    ['vet|animal', ['veterinary_care']],
    ['chiro|therapy', ['physiotherapist', 'health']],
    ['software|tech|website|app', ['establishment', 'point_of_interest']],
    ['staff|recruit', ['establishment', 'point_of_interest']],
    ['logistic|warehouse|freight', ['moving_company', 'storage', 'establishment']],
    ['bakery', ['bakery']],
    ['brewery|brew', ['bar', 'food']],
    ['coffee|cafe', ['cafe']],
  ]
  for (const [pattern, types] of map) {
    if (new RegExp(pattern).test(q)) return types
  }
  return ['establishment', 'general_contractor']
}

// ── CITY COORDS ───────────────────────────────────────────────────────────────
const COORDS: Record<string, [number, number]> = {
  'phoenix': [33.4484, -112.0740], 'scottsdale': [33.4942, -111.9261],
  'mesa': [33.4152, -111.8315], 'tempe': [33.4255, -111.9400],
  'chandler': [33.3062, -111.8413], 'gilbert': [33.3528, -111.7890],
  'glendale': [33.5387, -112.1860], 'tucson': [32.2226, -110.9747],
  'los angeles': [34.0522, -118.2437], 'san diego': [32.7157, -117.1611],
  'san francisco': [37.7749, -122.4194], 'las vegas': [36.1699, -115.1398],
  'denver': [39.7392, -104.9903], 'dallas': [32.7767, -96.7970],
  'houston': [29.7604, -95.3698], 'austin': [30.2672, -97.7431],
  'miami': [25.7617, -80.1918], 'orlando': [28.5383, -81.3792],
  'atlanta': [33.7490, -84.3880], 'chicago': [41.8781, -87.6298],
  'new york': [40.7128, -74.0060], 'boston': [42.3601, -71.0589],
  'seattle': [47.6062, -122.3321], 'portland': [45.5051, -122.6750],
  'nashville': [36.1627, -86.7816], 'charlotte': [35.2271, -80.8431],
  'tampa': [27.9506, -82.4572], 'minneapolis': [44.9778, -93.2650],
  'salt lake city': [40.7608, -111.8910], 'albuquerque': [35.0844, -106.6504],
  'kansas city': [39.0997, -94.5786], 'omaha': [41.2565, -95.9345],
  'raleigh': [35.7796, -78.6382], 'columbus': [39.9612, -82.9988],
  'cleveland': [41.4993, -81.6944], 'detroit': [42.3314, -83.0458],
  'sacramento': [38.5816, -121.4944], 'el paso': [31.7619, -106.4850],
  'san antonio': [29.4241, -98.4936], 'fort worth': [32.7555, -97.3308],
  'jacksonville': [30.3322, -81.6557], 'memphis': [35.1495, -90.0490],
  'louisville': [38.2527, -85.7585], 'richmond': [37.5407, -77.4360],
}
export function getCoords(city: string): [number, number] {
  return COORDS[city.toLowerCase().trim()] || [33.4484, -112.0740]
}

// ── DEDUP ─────────────────────────────────────────────────────────────────────
export function dedupeL5(leads: L5Lead[]): L5Lead[] {
  const seen = new Map<string, L5Lead>()
  for (const l of leads) {
    const key = l.company_name.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (!seen.has(key)) { seen.set(key, l) } else {
      const ex = seen.get(key)!
      if (!ex.phone && l.phone) ex.phone = l.phone
      if (!ex.email && l.email) ex.email = l.email
      if (!ex.website && l.website) ex.website = l.website
      if (!ex.owner_name && l.owner_name) ex.owner_name = l.owner_name
      if (!ex.rating && l.rating) { ex.rating = l.rating; ex.review_count = l.review_count }
      // Boost confidence if found in multiple sources
      ex.confidence = Math.min(100, (ex.confidence || 50) + 10)
    }
  }
  return [...seen.values()]
}

// ── SOURCE 1: Google Maps Text Search ────────────────────────────────────────
async function gmTextSearch(query: string, city: string, state: string): Promise<L5Lead[]> {
  if (!GM_KEY) return []
  try {
    const q = encodeURIComponent(`${query} ${city} ${state}`)
    const r = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${q}&key=${GM_KEY}`, { signal: AbortSignal.timeout(10000) })
    if (!r.ok) return []
    const d = await r.json()
    return (d.results || []).slice(0, 20).map((p: {name:string;formatted_address?:string;vicinity?:string;rating?:number;user_ratings_total?:number;place_id?:string}) => ({
      company_name: p.name, address: p.formatted_address || p.vicinity || '',
      city, state, rating: p.rating, review_count: p.user_ratings_total,
      category: query, source: 'google_maps', place_id: p.place_id, confidence: 70
    }))
  } catch { return [] }
}

// ── SOURCE 2: Google Maps Nearby Search (type filter) ────────────────────────
async function gmNearbySearch(type: string, keyword: string, city: string, state: string): Promise<L5Lead[]> {
  if (!GM_KEY) return []
  try {
    const [lat, lng] = getCoords(city)
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=50000&type=${type}&keyword=${encodeURIComponent(keyword)}&key=${GM_KEY}`
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!r.ok) return []
    const d = await r.json()
    return (d.results || []).slice(0, 20).map((p: {name:string;formatted_address?:string;vicinity?:string;rating?:number;user_ratings_total?:number;place_id?:string}) => ({
      company_name: p.name, address: p.formatted_address || p.vicinity || '',
      city, state, rating: p.rating, review_count: p.user_ratings_total,
      category: type, source: 'google_maps_type', place_id: p.place_id, confidence: 65
    }))
  } catch { return [] }
}

// ── SOURCE 3: GM Place Details (phone + website enrichment) ──────────────────
async function gmEnrich(leads: L5Lead[], max = 10): Promise<L5Lead[]> {
  if (!GM_KEY) return leads
  const toEnrich = leads.filter(l => l.place_id && !l.phone).slice(0, max)
  const enriched = await Promise.allSettled(
    toEnrich.map(l => fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${l.place_id}&fields=formatted_phone_number,website&key=${GM_KEY}`, { signal: AbortSignal.timeout(8000) }).then(r => r.json()).catch(() => ({})))
  )
  for (let i = 0; i < toEnrich.length; i++) {
    const d = enriched[i]
    if (d.status === 'fulfilled') {
      const target = leads.find(l => l.place_id === toEnrich[i].place_id)
      if (target) {
        target.phone = d.value.result?.formatted_phone_number || target.phone
        target.website = d.value.result?.website || target.website
        if (target.phone) target.confidence = Math.min(100, (target.confidence || 70) + 20)
      }
    }
  }
  return leads
}

// ── SOURCE 4: ScrapingBee — bypasses Cloudflare, renders JS ──────────────────
// Used for: Yellow Pages, Yelp, any site that blocks direct fetch
async function scrapingBeeFetch(url: string): Promise<string> {
  if (!SB_KEY) return ''
  try {
    const sbUrl = `https://app.scrapingbee.com/api/v1/?api_key=${SB_KEY}&url=${encodeURIComponent(url)}&render_js=false&premium_proxy=false`
    const r = await fetch(sbUrl, { signal: AbortSignal.timeout(25000) })
    if (!r.ok) return ''
    return await r.text()
  } catch { return '' }
}

export async function yellowPagesScrape(query: string, city: string, state: string): Promise<L5Lead[]> {
  try {
    const url = `https://www.yellowpages.com/search?search_terms=${encodeURIComponent(query)}&geo_location_terms=${encodeURIComponent(city + ', ' + state)}`
    // Try direct first, then ScrapingBee proxy
    let html = ''
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' }, signal: AbortSignal.timeout(15000) })
      if (r.ok) html = await r.text()
    } catch {}
    if (!html && SB_KEY) html = await scrapingBeeFetch(url)
    if (!html) return []

    const names  = [...html.matchAll(/"name"\s*:\s*"([^"]{4,70})"/g)].map(m => m[1])
    const phones = [...html.matchAll(/\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}/g)].map(m => m[0])
    const addrs  = [...html.matchAll(/"streetAddress"\s*:\s*"([^"]{5,80})"/g)].map(m => m[1])
    const urls   = [...html.matchAll(/"url"\s*:\s*"(https?:\/\/[^"]{10,100})"/g)].map(m => m[1])
    const seen = new Set<string>()
    const results: L5Lead[] = []
    for (let i = 0; i < Math.min(names.length, 30); i++) {
      const name = names[i]?.trim()
      if (!name || name.length < 4) continue
      const key = name.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (seen.has(key)) continue
      seen.add(key)
      results.push({ company_name: name, phone: phones[i] || '', address: addrs[i] || '', website: urls[i] || '', city, state, category: query, source: 'yellowpages', source_url: url, confidence: 60 })
    }
    return results
  } catch { return [] }
}

// ── SOURCE 5: BBB.org Direct HTML ────────────────────────────────────────────
export async function bbbScrape(query: string, city: string, state: string, pages = 2): Promise<L5Lead[]> {
  const all: L5Lead[] = []
  for (let page = 1; page <= pages; page++) {
    try {
      const url = `https://www.bbb.org/search?find_text=${encodeURIComponent(query)}&find_loc=${encodeURIComponent(city + ', ' + state)}&page=${page}`
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' }, signal: AbortSignal.timeout(20000) })
      if (!r.ok) break
      const html = await r.text()
      const names   = [...html.matchAll(/"name"\s*:\s*"([^"]{5,70})"/g)].map(m => m[1])
      const phones  = [...html.matchAll(/\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}/g)].map(m => m[0])
      const addrs   = [...html.matchAll(/"streetAddress"\s*:\s*"([^"]{5,80})"/g)].map(m => m[1])
      const ratings = [...html.matchAll(/"ratingValue"\s*:\s*"?(\d+\.?\d*)"?/g)].map(m => parseFloat(m[1]))
      const seen = new Set<string>()
      for (let i = 0; i < Math.min(names.length, 25); i++) {
        const name = names[i]?.trim()
        if (!name || name.length < 4) continue
        const key = name.toLowerCase().replace(/[^a-z0-9]/g, '')
        if (seen.has(key)) continue
        seen.add(key)
        all.push({ company_name: name, phone: phones[i] || '', address: addrs[i] || '', rating: ratings[i], city, state, category: query, source: 'bbb', source_url: url, confidence: 75 })
      }
      await new Promise(r => setTimeout(r, 400))
    } catch { break }
  }
  return all
}

// ── SOURCE 6: Apollo.io — verified contacts + emails ─────────────────────────
export async function apolloSearch(query: string, city: string, state: string, limit = 25): Promise<L5Lead[]> {
  if (!AP_KEY) return []
  try {
    const body = { q_organization_keyword_tags: [query], organization_locations: [`${city}, ${state}`], per_page: Math.min(limit, 50), page: 1 }
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
      category: query, source: 'apollo', confidence: 85
    }))
  } catch { return [] }
}

// ── SOURCE 7: Firecrawl — deep page content extraction ───────────────────────
export async function firecrawlSearch(query: string, city: string, state: string): Promise<L5Lead[]> {
  if (!FC_KEY) return []
  try {
    // Use Firecrawl to scrape a directory or search results page deeply
    const targetUrl = `https://www.yelp.com/search?find_desc=${encodeURIComponent(query)}&find_loc=${encodeURIComponent(city + ', ' + state)}`
    const r = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${FC_KEY}` },
      body: JSON.stringify({ url: targetUrl, formats: ['extract'], extract: { schema: { businesses: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, phone: { type: 'string' }, address: { type: 'string' }, rating: { type: 'number' } } } } } } }),
      signal: AbortSignal.timeout(30000),
    })
    if (!r.ok) return []
    const d = await r.json()
    const businesses = d.data?.extract?.businesses || d.extract?.businesses || []
    return businesses.map((b: {name?:string;phone?:string;address?:string;rating?:number}) => ({
      company_name: b.name || 'Unknown', phone: b.phone || '', address: b.address || '',
      rating: b.rating, city, state, category: query, source: 'firecrawl', confidence: 80
    }))
  } catch { return [] }
}

// ── SOURCE 8: BrowserWorker — cloud Chromium for JS-heavy sites ───────────────
export async function browserWorkerScrape(query: string, city: string, state: string): Promise<L5Lead[]> {
  if (!BW_URL || !BW_SEC) return []
  try {
    const targetUrl = `https://www.yelp.com/search?find_desc=${encodeURIComponent(query)}&find_loc=${encodeURIComponent(city + ', ' + state)}`
    const jobId = `l5-${Date.now()}`
    const r = await fetch(`${BW_URL}/api/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${BW_SEC}`, 'X-Correlation-Id': jobId },
      body: JSON.stringify({
        version: '1.0', job_id: jobId, type: 'scrape',
        steps: [
          { action: 'goto', url: targetUrl },
          { action: 'wait', ms: 3000 },
          { action: 'get_text', selector: '.container__09f24__sEjn8' },
        ],
        timeout_ms: 60000,
      }),
      signal: AbortSignal.timeout(65000),
    })
    if (!r.ok) return []
    const d = await r.json()
    // Parse business names/phones from extracted text
    const text: string = d.text || d.content || ''
    const names  = [...text.matchAll(/([A-Z][a-zA-Z\s&,\.]{4,50}(?:LLC|Inc|Co|Corp|Services|Solutions)?)/g)].map(m => m[1].trim()).filter(n => n.length > 4)
    const phones = [...text.matchAll(/\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}/g)].map(m => m[0])
    return names.slice(0, 15).map((name, i) => ({
      company_name: name, phone: phones[i] || '',
      city, state, category: query, source: 'browser_worker', confidence: 55
    }))
  } catch { return [] }
}

// ── SOURCE 9: AI Intelligence — LLM-powered known business discovery ─────────
export async function aiIntelligence(query: string, city: string, state: string, limit = 15): Promise<L5Lead[]> {
  if (!AI_KEY) return []
  try {
    const r = await fetch(`${AI_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AI_KEY}` },
      body: JSON.stringify({
        model: process.env.AI_MODEL_FAST || 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: `List ${Math.min(limit, 20)} REAL, VERIFIABLE ${query} businesses in ${city}, ${state}. Only include businesses that you have high confidence actually exist. Return ONLY a JSON array: [{"company_name":"...","phone":"XXX-XXX-XXXX","website":"https://...","address":"...","city":"${city}","state":"${state}"}]. No fabrications.` }],
        temperature: 0.1, max_tokens: 1500,
      }),
      signal: AbortSignal.timeout(20000),
    })
    if (!r.ok) return []
    const d = await r.json()
    const content: string = d.choices?.[0]?.message?.content || ''
    const match = content.match(/\[[\s\S]*?\]/)
    if (!match) return []
    return (JSON.parse(match[0]) as L5Lead[]).map(l => ({ ...l, source: 'ai_intelligence', confidence: 45 }))
  } catch { return [] }
}

// ── SAVE TO SUPABASE ──────────────────────────────────────────────────────────
export async function saveL5Leads(leads: L5Lead[], meta: { query: string; location: string; mode: string; ms: number }): Promise<{ saved: number }> {
  if (!SB_URL || !SB_SKEY || !leads.length) return { saved: 0 }
  try {
    const headers = { 'apikey': SB_SKEY, 'Authorization': `Bearer ${SB_SKEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal,resolution=ignore-duplicates' }
    // Log scrape run
    await fetch(`${SB_URL}/rest/v1/scrape_runs`, { method: 'POST', headers, body: JSON.stringify({ industry: meta.query, location: meta.location, total_found: leads.length, new_leads: leads.length, duplicates_skipped: 0, status: 'complete', notes: `l5 mode=${meta.mode} ms=${meta.ms}`, started_at: new Date().toISOString(), completed_at: new Date().toISOString() }) })
    // Save leads
    const rows = leads.map(l => ({ company_name: l.company_name, phone: l.phone || '', email: l.email || '', website: l.website || '', city: l.city || '', state: l.state || '', address: l.address || '', category: l.category || meta.query, source: l.source || 'level5', source_url: l.source_url || '', lead_score: Math.round((l.confidence || 50)), scraped_at: new Date().toISOString() }))
    const r = await fetch(`${SB_URL}/rest/v1/xps_leads`, { method: 'POST', headers, body: JSON.stringify(rows) })
    return { saved: r.ok ? leads.length : 0 }
  } catch { return { saved: 0 } }
}

// ── HUBSPOT SYNC ──────────────────────────────────────────────────────────────
export async function syncToHubSpot(leads: L5Lead[]): Promise<{ synced: number }> {
  if (!HS_KEY || !leads.length) return { synced: 0 }
  let synced = 0
  const toSync = leads.filter(l => l.phone || l.email || l.website).slice(0, 20)
  await Promise.allSettled(toSync.map(async (l) => {
    try {
      const r = await fetch('https://api.hubapi.com/crm/v3/objects/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${HS_KEY}` },
        body: JSON.stringify({ properties: { name: l.company_name, phone: l.phone || '', website: l.website || '', city: l.city || '', state: l.state || '', address: l.address || '', industry: l.category || '' } }),
        signal: AbortSignal.timeout(8000),
      })
      if (r.ok || r.status === 409) synced++ // 409 = already exists
    } catch {}
  }))
  return { synced }
}

// ── MASTER LEVEL 5 SEARCH ─────────────────────────────────────────────────────
async function aiExpandQuery(query: string, city: string, state: string): Promise<string[]> {
  const AI_URL = process.env.AI_GATEWAY_BASE_URL || 'https://ai-gateway.vercel.sh/v1'
  const AI_KEY = process.env.AI_GATEWAY_API_KEY || ''
  if (!AI_KEY) return []
  try {
    const r = await fetch(`${AI_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AI_KEY}` },
      body: JSON.stringify({
        model: process.env.AI_MODEL_FAST || 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: `Generate 12 highly specific Google Maps search query variations for "${query}" businesses in ${city}, ${state}. These should be the EXACT phrases someone would search to find this type of business. Include trade-specific terminology. Return ONLY a JSON array of strings. No explanation. Example format: ["stone polishing company", "marble restoration contractor", "terrazzo polishing service"]` }],
        temperature: 0.3, max_tokens: 400,
      }),
      signal: AbortSignal.timeout(12000),
    })
    if (!r.ok) return []
    const d = await r.json()
    const content: string = d.choices?.[0]?.message?.content || ''
    const match = content.match(/\[[\s\S]*?\]/)
    if (!match) return []
    const parsed = JSON.parse(match[0])
    return Array.isArray(parsed) ? parsed.filter((s: unknown) => typeof s === 'string').slice(0, 12) : []
  } catch { return [] }
}

export async function level5Search(q: L5Query): Promise<L5Result> {
  const start = Date.now()
  const { query, city, state, mode = 'deep', limit = 0 } = q
  const keywords = expandQuery(query)

  // AI keyword expansion for niche queries
  if (keywords.length < 10) {
    const aiKeywords = await aiExpandQuery(query, city, state).catch(() => [])
    for (const kw of aiKeywords) {
      if (!keywords.includes(kw)) keywords.push(kw)
    }
  }

  const types    = inferTypes(query)
  const all: L5Lead[] = []
  const sources: string[] = []
  const skipped: { source: string; reason: string }[] = []

  // ── QUICK: Top GM keyword + BBB concurrent ───────────────────────────────
  if (mode === 'quick') {
    const [gmR, bbbR] = await Promise.allSettled([
      gmTextSearch(keywords[0], city, state).catch(() => []),
      bbbScrape(query, city, state, 1).catch(() => []),
    ])
    if (gmR.status === 'fulfilled' && gmR.value.length)  { all.push(...gmR.value);  sources.push('google_maps') }
    if (bbbR.status === 'fulfilled' && bbbR.value.length) { all.push(...bbbR.value); sources.push('bbb') }
  }

  // ── DEEP: All GM keywords + type filters + BBB + YP + Apollo concurrent ──
  if (mode === 'deep' || mode === 'max' || mode === 'level5') {
    // Batch keywords 4 at a time
    const batches: string[][] = []
    for (let i = 0; i < keywords.length; i += 4) batches.push(keywords.slice(i, i + 4))

    const [kwBatchR, typesR, bbbR, ypR, apolloR] = await Promise.allSettled([
      // All keyword batches
      (async () => {
        const batchResults: L5Lead[] = []
        for (const batch of batches) {
          const res = await Promise.allSettled(batch.map(kw => gmTextSearch(kw, city, state).catch(() => [])))
          for (const r of res) if (r.status === 'fulfilled') batchResults.push(...r.value)
          await new Promise(r => setTimeout(r, 100))
        }
        return batchResults
      })(),
      // Type filter sweeps
      Promise.allSettled(types.map(t => gmNearbySearch(t, query, city, state).catch(() => []))),
      // BBB
      bbbScrape(query, city, state, 2).catch(() => []),
      // Yellow Pages (direct + ScrapingBee fallback)
      yellowPagesScrape(query, city, state).catch(() => []),
      // Apollo
      apolloSearch(query, city, state, 50).catch(() => []),
    ])

    if (kwBatchR.status === 'fulfilled' && kwBatchR.value.length) { all.push(...kwBatchR.value); sources.push('google_maps_multi') }
    if (typesR.status === 'fulfilled') {
      for (const r of typesR.value) if (r.status === 'fulfilled' && r.value.length) all.push(...r.value)
      if (typesR.value.some(r => r.status === 'fulfilled' && r.value.length)) sources.push('google_maps_type')
    }
    if (bbbR.status === 'fulfilled' && bbbR.value.length)    { all.push(...bbbR.value);    sources.push('bbb') }
    if (ypR.status === 'fulfilled' && ypR.value.length)      { all.push(...ypR.value);      sources.push('yellowpages') }
    else skipped.push({ source: 'yellowpages', reason: 'no results or blocked' })
    if (apolloR.status === 'fulfilled' && apolloR.value.length) { all.push(...apolloR.value); sources.push('apollo') }
    else if (!AP_KEY) skipped.push({ source: 'apollo', reason: 'APOLLO_API_KEY_2 not set' })
  }

  // ── LEVEL5: Everything above + Firecrawl + BrowserWorker ────────────────
  if (mode === 'level5') {
    const [fcR, bwR] = await Promise.allSettled([
      FC_KEY ? firecrawlSearch(query, city, state).catch(() => []) : Promise.resolve([]),
      BW_SEC ? browserWorkerScrape(query, city, state).catch(() => []) : Promise.resolve([]),
    ])
    if (fcR.status === 'fulfilled' && fcR.value.length)  { all.push(...fcR.value);  sources.push('firecrawl') }
    else if (!FC_KEY) skipped.push({ source: 'firecrawl', reason: 'FIRECRAWL_API_KEY not set' })
    if (bwR.status === 'fulfilled' && bwR.value.length)  { all.push(...bwR.value);  sources.push('browser_worker') }
    else if (!BW_SEC) skipped.push({ source: 'browser_worker', reason: 'BROWSER_WORKER_SECRET not set' })
  }

  // ── Dedup ─────────────────────────────────────────────────────────────────
  let deduped = dedupeL5(all)

  // ── Enrich top leads with phone via GM Details ────────────────────────────
  if (deduped.length > 0) {
    deduped = await gmEnrich(deduped, mode === 'level5' ? 20 : 10)
  }

  // ── AI fallback only if <5 results ───────────────────────────────────────
  if (deduped.length < 5) {
    const ai = await aiIntelligence(query, city, state, 15).catch(() => [])
    if (ai.length) { deduped.push(...ai); sources.push('ai_intelligence') }
    deduped = dedupeL5(deduped)
  }

  // ── Sort by confidence desc ───────────────────────────────────────────────
  deduped.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))

  const final = (limit > 0) ? deduped.slice(0, limit) : deduped
  return { leads: final, total: final.length, sources_used: sources, sources_skipped: skipped, keywords_expanded: keywords, duration_ms: Date.now() - start, mode }
}
