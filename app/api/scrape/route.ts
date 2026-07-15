import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
const execAsync = promisify(exec)

export const dynamic = 'force-dynamic'
export const maxDuration = 90

const SB_URL = 'https://app.scrapingbee.com/api/v1/'
const GM_URL = 'https://maps.googleapis.com/maps/api/place'
const AI_GW_URL = process.env.AI_GATEWAY_BASE_URL || 'https://ai-gateway.vercel.sh/v1'
const BW_URL = process.env.BROWSER_WORKER_URL || 'https://browserworker.vercel.app'

const SB_KEY = process.env.SCRAPINGBEE_API_KEY || ''
const GM_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY || ''
const AI_KEY = process.env.AI_GATEWAY_API_KEY || ''
const BW_SECRET = process.env.BROWSER_WORKER_TOKEN || process.env.BROWSER_WORKER_SECRET || ''
const SB_URL_BASE = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SB_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

interface Lead {
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

// ── TIER 1: Google Maps Places ──────────────────────────────────────────────
async function googleMapsLeads(industry: string, city: string, state: string, limit: number): Promise<Lead[]> {
  if (!GM_KEY) return []
  const query = encodeURIComponent(`${industry} ${city} ${state}`)
  try {
    const res = await fetch(`${GM_URL}/textsearch/json?query=${query}&key=${GM_KEY}`, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) return []
    const data = await res.json()
    if (data.status !== 'OK') return []
    const places = (data.results || []).slice(0, Math.min(limit, 20)) as Array<{name:string,place_id:string,rating?:number,formatted_address?:string,geometry?:unknown}>
    // Fetch details for top 5 to get phone + website
    const detailed = await Promise.allSettled(
      places.slice(0, 5).map(async (p) => {
        try {
          const dr = await fetch(`${GM_URL}/details/json?place_id=${p.place_id}&fields=name,formatted_phone_number,website,rating,formatted_address&key=${GM_KEY}`, { signal: AbortSignal.timeout(8000) })
          const dd = await dr.json()
          const r = dd.result || {}
          return { ...p, formatted_phone_number: r.formatted_phone_number || '', website: r.website || '' }
        } catch { return p }
      })
    )
    const detailMap = new Map<string, {formatted_phone_number?:string,website?:string}>()
    detailed.forEach((r, i) => { if (r.status === 'fulfilled') detailMap.set(places[i].place_id, r.value as {formatted_phone_number?:string,website?:string}) })
    return places.map(p => {
      const d = detailMap.get(p.place_id) || {}
      const addr = p.formatted_address || ''
      const cityMatch = addr.match(/,\s*([^,]+),\s*AZ/i)
      return {
        company_name: p.name,
        phone: (d as {formatted_phone_number?:string}).formatted_phone_number || '',
        website: (d as {website?:string}).website || '',
        address: addr,
        city: cityMatch?.[1]?.trim() || city,
        state,
        rating: p.rating,
        category: industry,
        source_url: `https://maps.google.com/search/${encodeURIComponent(p.name)}`,
        source: 'google_maps',
      }
    })
  } catch (e) { console.error('[googleMaps]', e); return [] }
}

// ── TIER 2: ScrapingBee ──────────────────────────────────────────────────────
async function scrapingBeeLeads(industry: string, city: string, state: string): Promise<Lead[]> {
  if (!SB_KEY) return []
  const leads: Lead[] = []
  const targets = [
    `https://www.yellowpages.com/search?search_terms=${encodeURIComponent(industry)}&geo_location_terms=${encodeURIComponent(city + ' ' + state)}`,
    `https://www.yelp.com/search?find_desc=${encodeURIComponent(industry)}&find_loc=${encodeURIComponent(city + ' ' + state)}`,
  ]
  for (const targetUrl of targets) {
    try {
      const sbUrl = `${SB_URL}?api_key=${SB_KEY}&url=${encodeURIComponent(targetUrl)}&render_js=true&premium_proxy=true&country_code=us&block_ads=true`
      const res = await fetch(sbUrl, { signal: AbortSignal.timeout(35000) })
      if (!res.ok) continue
      const html = await res.text()
      // Yellow Pages parser
      if (targetUrl.includes('yellowpages')) {
        const nameRe = /class="business-name[^"]*"[^>]*>\s*<[^>]+>([^<]{3,80})</g
        const phoneRe = /class="phones[^"]*"[^>]*>[^<]*<[^>]*>([(\)\d\s.\-]{10,16})</g
        const webRe = /class="track-visit-website"[^>]+href="([^"]+)"/g
        const cityRe = /class="locality[^"]*">([^<]{2,40})</g
        const names = [...html.matchAll(nameRe)]
        const phones = [...html.matchAll(phoneRe)]
        const webs = [...html.matchAll(webRe)]
        const cities = [...html.matchAll(cityRe)]
        const seen = new Set<string>()
        for (let i = 0; i < Math.min(names.length, 20); i++) {
          const name = names[i]?.[1]?.trim()
          if (!name || seen.has(name.toLowerCase())) continue
          seen.add(name.toLowerCase())
          leads.push({ company_name: name, phone: phones[i]?.[1]?.trim() || '', website: webs[i]?.[1]?.trim() || '', city: cities[i]?.[1]?.trim() || city, state, category: industry, source_url: targetUrl, source: 'yellowpages_scrapingbee' })
        }
      } else if (targetUrl.includes('yelp')) {
        // Yelp JSON-LD and structured data
        const nameRe = /"name":"([^"<]{3,80})"/g
        const phoneRe = /"phone":"([^"]{7,20})"/g
        const webRe = /"url":"(https://www\.yelp\.com/biz/[^"]+)"/g
        const names = [...html.matchAll(nameRe)]
        const phones = [...html.matchAll(phoneRe)]
        const seen = new Set<string>()
        for (let i = 0; i < Math.min(names.length, 15); i++) {
          const name = names[i]?.[1]?.trim()
          if (!name || name.length < 3 || seen.has(name.toLowerCase())) continue
          if (/^(yelp|search|open|closed|all|write)/i.test(name)) continue
          seen.add(name.toLowerCase())
          leads.push({ company_name: name, phone: phones[i]?.[1]?.trim() || '', city, state, category: industry, source_url: targetUrl, source: 'yelp_scrapingbee' })
        }
      }
    } catch (e) { console.error('[scrapingBee]', e) }
  }
  return leads
}

// ── TIER 3: BW validation ────────────────────────────────────────────────────
async function bwValidate(url: string): Promise<boolean> {
  if (!BW_SECRET) return false
  try {
    const res = await fetch(BW_URL + '/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + BW_SECRET },
      body: JSON.stringify({ version: '1.0', job_id: 'val-' + Date.now(), steps: [{ action: 'goto', url, timeout: 12000 }, { action: 'get_title' }], timeout_ms: 20000 }),
      signal: AbortSignal.timeout(25000),
    })
    const data = await res.json()
    const title = data.steps?.find((s:{action:string}) => s.action === 'get_title')?.result?.title || ''
    return data.status === 'pass' && !title.toLowerCase().includes('cloudflare') && !title.toLowerCase().includes('error')
  } catch { return false }
}

// ── TIER 4: AI Gateway fallback ──────────────────────────────────────────────
async function aiLeads(industry: string, city: string, state: string, limit: number): Promise<Lead[]> {
  if (!AI_KEY) return []
  try {
    const res = await fetch(AI_GW_URL + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + AI_KEY },
      body: JSON.stringify({ model: 'openai/gpt-4o-mini', messages: [{ role: 'user', content: `List ${Math.min(limit,12)} real ${industry} companies in ${city}, ${state}. Real businesses only. Return ONLY JSON array: [{"company_name":"...","phone":"...","city":"${city}","state":"${state}","category":"${industry}","website":"..."}]` }], temperature: 0.1, max_tokens: 800 }),
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) return []
    const data = await res.json()
    const content: string = data.choices?.[0]?.message?.content || ''
    const match = content.match(/\[[\s\S]*?\]/)
    if (!match) return []
    const parsed = JSON.parse(match[0]) as Lead[]
    return parsed.map(l => ({ ...l, source: 'ai_gateway' }))
  } catch { return [] }
}

// ── Supabase save ────────────────────────────────────────────────────────────
async function saveLeads(leads: Lead[], meta: { industry: string; location: string; method: string; ms: number }) {
  if (!SB_URL_BASE || !SB_ROLE_KEY || !leads.length) return { saved: 0 }
  const headers = { 'apikey': SB_ROLE_KEY, 'Authorization': `Bearer ${SB_ROLE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal,resolution=ignore-duplicates' }
  await fetch(`${SB_URL_BASE}/rest/v1/scrape_runs`, { method: 'POST', headers, body: JSON.stringify({ industry: meta.industry, location: meta.location, total_found: leads.length, new_leads: leads.length, duplicates_skipped: 0, status: 'complete', notes: `method=${meta.method} ms=${meta.ms}`, started_at: new Date().toISOString(), completed_at: new Date().toISOString() }) })
  const rows = leads.map(l => ({ company_name: l.company_name, phone: l.phone || '', email: l.email || '', website: l.website || '', city: l.city || '', state: l.state || 'AZ', category: l.category || meta.industry, source_url: l.source_url || '', scraped_at: new Date().toISOString(), lead_score: Math.round((l.rating || 0) * 20), address: l.address || '', source: l.source || 'scraper' }))
  const r = await fetch(`${SB_URL_BASE}/rest/v1/xps_leads`, { method: 'POST', headers, body: JSON.stringify(rows) })
  return { saved: r.ok ? leads.length : 0 }
}

// ── Deduplicate ───────────────────────────────────────────────────────────────
function dedup(leads: Lead[]): Lead[] {
  const seen = new Set<string>()
  return leads.filter(l => {
    const key = l.company_name.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const start = Date.now()
  const body = await req.json()
  const { industry = 'Epoxy Flooring', city = 'Phoenix', state = 'AZ', limit = 20, sources = [] } = body as { industry?: string; city?: string; state?: string; limit?: number; sources?: string[] }

  let allLeads: Lead[] = []
  const methods: string[] = []

  // Tier 1: Google Maps (always first — best quality)
  if (GM_KEY) {
    const gmLeads = await googleMapsLeads(industry, city, state, limit)
    if (gmLeads.length > 0) { allLeads.push(...gmLeads); methods.push('google_maps') }
  }

  // Tier 2: ScrapingBee (run in parallel with GM)
  if (SB_KEY && allLeads.length < limit) {
    const sbLeads = await scrapingBeeLeads(industry, city, state)
    if (sbLeads.length > 0) { allLeads.push(...sbLeads); methods.push('scrapingbee') }
  }

  // Dedup after combining GM + SB
  allLeads = dedup(allLeads)

  // Tier 3: BW validate top result website (non-blocking, just for metadata)
  let bwValidated = false
  if (BW_SECRET && allLeads[0]?.website) {
    bwValidated = await bwValidate(allLeads[0].website)
  }

  // Tier 4: AI fallback only if real sources returned <3
  if (allLeads.length < 3) {
    const aiL = await aiLeads(industry, city, state, limit)
    if (aiL.length > 0) { allLeads.push(...aiL); methods.push('ai_gateway') }
    allLeads = dedup(allLeads)
  }

  const ms = Date.now() - start
  const saved = await saveLeads(allLeads.slice(0, limit), { industry, location: `${city}, ${state}`, method: methods.join('+'), ms })

  return NextResponse.json({
    ok: true,
    method: methods.join('+') || 'none',
    sources_used: methods,
    google_maps_used: methods.includes('google_maps'),
    scrapingbee_used: methods.includes('scrapingbee'),
    browser_worker_validated: bwValidated,
    ai_fallback_used: methods.includes('ai_gateway'),
    leads_found: allLeads.length,
    leads_saved: saved.saved,
    duration_ms: ms,
    leads: allLeads.slice(0, limit),
  })
}

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    capabilities: {
      google_maps: !!process.env.GOOGLE_MAPS_API_KEY,
      scrapingbee: !!process.env.SCRAPINGBEE_API_KEY,
      browser_worker: !!(process.env.BROWSER_WORKER_TOKEN || process.env.BROWSER_WORKER_SECRET),
      ai_gateway: !!process.env.AI_GATEWAY_API_KEY,
    }
  })
}
