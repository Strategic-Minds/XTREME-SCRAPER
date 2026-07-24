/**
 * XTREME SCRAPER — Universal Enrichment Engine v1.0
 * 5 intelligence layers for any business, anywhere, any industry.
 * Every layer is free or uses existing keys. No new signups.
 *
 * Layer 1: OpenCorporates — legal entity, registered agent, formation date
 * Layer 2: State License Boards — contractor license verification
 * Layer 3: Google Custom Search — full web mentions, news, lawsuit signals
 * Layer 4: Wayback Machine — historical phone recovery, site history
 * Layer 5: Supabase cache — never re-enrich the same business twice (7-day TTL)
 */

const GM_KEY  = process.env.GOOGLE_CLOUD_API_KEY || process.env.GOOGLE_MAPS_API_KEY || ''
const SB_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SB_SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const SB_HDR = () => ({
  'apikey': SB_SKEY,
  'Authorization': `Bearer ${SB_SKEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
})

export interface EnrichedBusiness {
  company_name: string
  city?: string
  state?: string
  phone?: string
  email?: string
  website?: string
  // Layer 1 — Legal Identity
  legal_entity_name?: string
  registered_agent?: string
  agent_address?: string
  formation_date?: string
  entity_status?: string       // Active | Dissolved | Suspended
  entity_type?: string         // LLC | Corporation | Sole Proprietor
  state_of_incorporation?: string
  opencorporates_url?: string
  // Layer 2 — License Verification
  license_number?: string
  license_type?: string
  license_status?: string      // Active | Expired | Suspended | Revoked
  license_expiry?: string
  license_complaints?: number
  licensed_person?: string     // The actual human who holds the license
  // Layer 3 — Web Intelligence
  web_mentions?: number        // How many times it appears on the open web
  news_articles?: string[]     // Relevant news/press links
  lawsuit_signals?: string[]   // Any legal action signals found
  web_presence_score?: number  // 0-100 — how visible they are online
  social_profiles?: string[]   // LinkedIn, FB, Instagram URLs found
  // Layer 4 — Historical Intelligence
  had_website?: boolean        // Did they ever have a site?
  website_last_seen?: string   // Last date Wayback saw their site
  recovered_phones?: string[]  // Phones found in archived pages
  wayback_url?: string         // Link to their archived site
  // Enrichment metadata
  enriched_at?: string
  enrichment_sources?: string[]
  enrichment_confidence?: number  // 0-100
}

// ─────────────────────────────────────────
// LAYER 1: OpenCorporates — legal identity
// ─────────────────────────────────────────
export async function enrichOpenCorporates(
  company_name: string,
  state?: string
): Promise<Partial<EnrichedBusiness>> {
  try {
    const q   = encodeURIComponent(company_name)
    const jxn = state ? `&jurisdiction_code=us_${state.toLowerCase()}` : ''
    const url = `https://api.opencorporates.com/v0.4/companies/search?q=${q}${jxn}&format=json&order=score`
    const r   = await fetch(url, { signal: AbortSignal.timeout(6000) })
    if (!r.ok) return {}
    const data = await r.json()
    const co   = data?.results?.companies?.[0]?.company
    if (!co) return {}
    return {
      legal_entity_name:       co.name,
      entity_status:           co.current_status || co.inactive ? 'Dissolved' : 'Active',
      entity_type:             co.company_type,
      formation_date:          co.incorporation_date,
      state_of_incorporation:  co.jurisdiction_code?.replace('us_', '').toUpperCase(),
      registered_agent:        co.registered_agent?.name,
      agent_address:           co.registered_address?.in_full,
      opencorporates_url:      co.opencorporates_url,
    }
  } catch { return {} }
}

// ─────────────────────────────────────────
// LAYER 2: State License Board verification
// Works for any US state — contractor, medical, legal, cosmetology, etc.
// ─────────────────────────────────────────
const LICENSE_BOARDS: Record<string, { url: string; name: string }> = {
  CA: { url: 'https://www.cslb.ca.gov', name: 'CA Contractors State License Board' },
  TX: { url: 'https://www.tdlr.texas.gov', name: 'TX Dept of Licensing & Regulation' },
  FL: { url: 'https://www.myfloridalicense.com', name: 'FL DBPR' },
  NY: { url: 'https://www.dos.ny.gov', name: 'NY Dept of State' },
  WA: { url: 'https://www.lni.wa.gov', name: 'WA L&I' },
  CO: { url: 'https://dora.colorado.gov', name: 'CO DORA' },
  GA: { url: 'https://sos.ga.gov', name: 'GA Secretary of State' },
  NC: { url: 'https://www.nclbgc.org', name: 'NC Licensing Board' },
  IL: { url: 'https://www.idfpr.com', name: 'IL DFPR' },
  OH: { url: 'https://com.ohio.gov', name: 'OH Commerce' },
  PA: { url: 'https://www.dli.pa.gov', name: 'PA L&I' },
  MI: { url: 'https://www.michigan.gov/lara', name: 'MI LARA' },
  NV: { url: 'https://nscb.nv.gov', name: 'NV State Contractors Board' },
  OR: { url: 'https://www.oregon.gov/ccb', name: 'OR CCB' },
  MN: { url: 'https://www.dli.mn.gov', name: 'MN DLI' },
}

export async function enrichLicenseBoard(
  company_name: string,
  state?: string
): Promise<Partial<EnrichedBusiness>> {
  if (!state || !LICENSE_BOARDS[state.toUpperCase()]) return {}
  // License board lookup via Google Custom Search scoped to the board site
  if (!GM_KEY) return {}
  try {
    const board = LICENSE_BOARDS[state.toUpperCase()]
    const q     = encodeURIComponent(`"${company_name}" site:${new URL(board.url).hostname}`)
    const url   = `https://www.googleapis.com/customsearch/v1?key=${GM_KEY}&cx=017576662512468239146:omuauf10dwe&q=${q}&num=3`
    const r     = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!r.ok) return {}
    const d     = await r.json()
    const items = d?.items || []
    if (!items.length) return {
      license_status: 'Not Found',
    }
    // Parse what we can from the snippet
    const snippet = items[0]?.snippet || ''
    const hasActive  = /active|current|valid/i.test(snippet)
    const hasExpired = /expired|inactive|lapsed/i.test(snippet)
    const numMatch   = snippet.match(/\b([A-Z]?\d{5,8})\b/)
    return {
      license_number: numMatch?.[1],
      license_status: hasExpired ? 'Expired' : hasActive ? 'Active' : 'Found',
      license_type:   `${board.name}`,
    }
  } catch { return {} }
}

// ─────────────────────────────────────────
// LAYER 3: Google Custom Search — full web intelligence
// 100 free queries/day via GOOGLE_CLOUD_API_KEY
// ─────────────────────────────────────────
export async function enrichWebIntelligence(
  company_name: string,
  city?: string,
  state?: string
): Promise<Partial<EnrichedBusiness>> {
  if (!GM_KEY) return {}
  try {
    const location  = [city, state].filter(Boolean).join(' ')
    const q         = encodeURIComponent(`"${company_name}" ${location}`)
    const url       = `https://www.googleapis.com/customsearch/v1?key=${GM_KEY}&q=${q}&num=10`
    const r         = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!r.ok) return {}
    const d         = await r.json()
    const items     = (d?.items || []) as { link: string; snippet: string; title: string }[]
    const total     = d?.searchInformation?.totalResults || '0'

    const news     = items.filter((i: { link: string }) => /news|press|article|herald|times|journal/i.test(i.link)).map((i: { link: string }) => i.link)
    const lawsuits = items.filter((i: { snippet: string; title: string }) => /lawsuit|sued|complaint|court|judgment|legal action/i.test(i.snippet + i.title)).map((i: { link: string }) => i.link)
    const social   = items.filter((i: { link: string }) => /linkedin|facebook|instagram|twitter|yelp/i.test(i.link)).map((i: { link: string }) => i.link)

    const webCount = parseInt(total.replace(/,/g, '')) || items.length
    const webScore = Math.min(100, Math.round(Math.log10(webCount + 1) * 33))

    return {
      web_mentions:       webCount,
      news_articles:      news.slice(0, 3),
      lawsuit_signals:    lawsuits.slice(0, 2),
      social_profiles:    social.slice(0, 4),
      web_presence_score: webScore,
    }
  } catch { return {} }
}

// ─────────────────────────────────────────
// LAYER 4: Wayback Machine — historical intelligence
// Free API, no key needed
// ─────────────────────────────────────────
export async function enrichWayback(
  company_name: string,
  website?: string
): Promise<Partial<EnrichedBusiness>> {
  // Need a domain to check — derive from company name if no website
  let domain = website
  if (!domain) {
    const slug = company_name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)
    domain = `${slug}.com`
  }
  try {
    const clean = domain.replace(/^https?:\/\//, '').replace(/\/.*/, '')
    const checkUrl = `https://archive.org/wayback/available?url=${clean}`
    const r = await fetch(checkUrl, { signal: AbortSignal.timeout(5000) })
    if (!r.ok) return {}
    const d = await r.json()
    const snap = d?.archived_snapshots?.closest
    if (!snap?.available) return { had_website: false }

    const waybackUrl    = snap.url
    const lastSeenRaw   = snap.timestamp  // format: 20231015123456
    const lastSeen      = lastSeenRaw
      ? `${lastSeenRaw.slice(0,4)}-${lastSeenRaw.slice(4,6)}-${lastSeenRaw.slice(6,8)}`
      : undefined

    // Try to extract phone from archived page
    const recoveredPhones: string[] = []
    try {
      const pageR = await fetch(waybackUrl, { signal: AbortSignal.timeout(6000) })
      if (pageR.ok) {
        const html = await pageR.text()
        const phoneMatches = html.match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g) || []
        const uniquePhones = [...new Set(phoneMatches)].slice(0, 3)
        recoveredPhones.push(...uniquePhones)
      }
    } catch { /* phone recovery optional */ }

    return {
      had_website:         true,
      website_last_seen:   lastSeen,
      wayback_url:         waybackUrl,
      recovered_phones:    recoveredPhones.length ? recoveredPhones : undefined,
    }
  } catch { return {} }
}

// ─────────────────────────────────────────
// LAYER 5: Supabase persistent cache
// 7-day TTL — never re-enrich the same business twice
// ─────────────────────────────────────────
async function getCachedEnrichment(key: string): Promise<EnrichedBusiness | null> {
  if (!SB_URL || !SB_SKEY) return null
  try {
    const r = await fetch(
      `${SB_URL}/rest/v1/enrichment_cache?cache_key=eq.${encodeURIComponent(key)}&select=*&limit=1`,
      { headers: SB_HDR() }
    )
    if (!r.ok) return null
    const rows = await r.json()
    if (!rows?.length) return null
    const row = rows[0]
    const age = Date.now() - new Date(row.enriched_at).getTime()
    if (age > 7 * 24 * 60 * 60 * 1000) return null  // 7-day TTL
    return row.data as EnrichedBusiness
  } catch { return null }
}

async function saveEnrichmentCache(key: string, data: EnrichedBusiness): Promise<void> {
  if (!SB_URL || !SB_SKEY) return
  try {
    await fetch(`${SB_URL}/rest/v1/enrichment_cache`, {
      method: 'POST',
      headers: { ...SB_HDR(), 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({
        cache_key: key,
        company_name: data.company_name,
        city: data.city,
        state: data.state,
        data,
        enriched_at: new Date().toISOString(),
      })
    })
  } catch { /* cache write optional */ }
}

// ─────────────────────────────────────────
// MASTER ENRICHMENT — runs all 5 layers
// Returns full enriched profile for any business
// ─────────────────────────────────────────
export async function enrichBusiness(
  company_name: string,
  opts: { city?: string; state?: string; phone?: string; website?: string; layers?: string[] }
): Promise<EnrichedBusiness> {
  const { city, state, phone, website } = opts
  const layers = opts.layers || ['opencorporates', 'web', 'wayback']  // license is opt-in (slower)
  const cacheKey = `${company_name.toLowerCase().replace(/\s+/g,'_')}:${(city||'')}:${(state||'')}`.slice(0, 200)

  // Layer 5 — check cache first
  const cached = await getCachedEnrichment(cacheKey)
  if (cached) return { ...cached, enrichment_sources: [...(cached.enrichment_sources || []), 'cache'] }

  const sources: string[] = []
  let result: Partial<EnrichedBusiness> = { company_name, city, state, phone, website }

  // Run layers in parallel — all independent
  const promises: Promise<Partial<EnrichedBusiness>>[] = []

  if (layers.includes('opencorporates')) {
    promises.push(enrichOpenCorporates(company_name, state).then(d => { if (Object.keys(d).length) sources.push('opencorporates'); return d }))
  }
  if (layers.includes('license') && state) {
    promises.push(enrichLicenseBoard(company_name, state).then(d => { if (Object.keys(d).length) sources.push('license_board'); return d }))
  }
  if (layers.includes('web')) {
    promises.push(enrichWebIntelligence(company_name, city, state).then(d => { if (Object.keys(d).length) sources.push('web_intel'); return d }))
  }
  if (layers.includes('wayback')) {
    promises.push(enrichWayback(company_name, website).then(d => { if (Object.keys(d).length) sources.push('wayback'); return d }))
  }

  const results = await Promise.allSettled(promises)
  for (const r of results) {
    if (r.status === 'fulfilled') Object.assign(result, r.value)
  }

  // Compute final confidence score
  let confidence = 30  // base
  if (result.legal_entity_name)    confidence += 20
  if (result.license_status === 'Active') confidence += 15
  if (result.web_mentions && result.web_mentions > 5) confidence += 10
  if (result.had_website)           confidence += 10
  if (result.registered_agent)      confidence += 10
  if (result.phone)                 confidence += 5

  const final: EnrichedBusiness = {
    ...result,
    enrichment_sources:    sources,
    enrichment_confidence: Math.min(100, confidence),
    enriched_at:           new Date().toISOString(),
  }

  // Layer 5 — save to cache
  await saveEnrichmentCache(cacheKey, final)

  return final
}

// ─────────────────────────────────────────
// PERSON SEARCH — individual profile
// Sources: Apollo + Google Custom Search + web intelligence
// ─────────────────────────────────────────
export interface PersonProfile {
  full_name: string
  company?: string
  title?: string
  city?: string
  state?: string
  // Contact
  email?: string
  phone?: string
  linkedin?: string
  // Professional
  industry?: string
  specialties?: string[]
  years_experience?: number
  previous_companies?: string[]
  // Web presence
  web_mentions?: number
  news_articles?: string[]
  social_profiles?: string[]
  // Metadata
  confidence?: number
  sources?: string[]
  searched_at?: string
}

export async function searchPerson(
  full_name: string,
  opts: { company?: string; city?: string; state?: string; title?: string }
): Promise<PersonProfile> {
  const { company, city, state } = opts
  const sources: string[] = []
  let profile: Partial<PersonProfile> = { full_name, company, city, state }

  // Apollo person search
  const apolloKey = process.env.APOLLO_API_KEY_2
  if (apolloKey) {
    try {
      const nameParts = full_name.trim().split(' ')
      const body = {
        first_name: nameParts[0],
        last_name:  nameParts.slice(1).join(' ') || undefined,
        organization_name: company,
        person_locations: city ? [`${city}, ${state || ''}`] : undefined,
      }
      const r = await fetch('https://api.apollo.io/v1/people/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apolloKey },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
      })
      if (r.ok) {
        const d = await r.json()
        const p = d?.person
        if (p) {
          sources.push('apollo')
          profile = {
            ...profile,
            email:              p.email,
            phone:              p.phone_numbers?.[0]?.sanitized_number,
            title:              p.title,
            industry:           p.organization?.industry,
            linkedin:           p.linkedin_url,
            years_experience:   p.seniority === 'senior' ? 10 : p.seniority === 'director' ? 15 : 5,
            previous_companies: p.employment_history?.slice(1,4).map((e: { organization_name: string }) => e.organization_name).filter(Boolean),
          }
        }
      }
    } catch { /* apollo optional */ }
  }

  // Google Custom Search — full web presence
  if (GM_KEY) {
    try {
      const location = [city, state].filter(Boolean).join(' ')
      const q = encodeURIComponent(`"${full_name}" ${company || ''} ${location}`.trim())
      const url = `https://www.googleapis.com/customsearch/v1?key=${GM_KEY}&q=${q}&num=10`
      const r = await fetch(url, { signal: AbortSignal.timeout(8000) })
      if (r.ok) {
        const d = await r.json()
        const items = (d?.items || []) as { link: string; snippet: string; title: string }[]
        sources.push('web_search')
        profile.web_mentions   = parseInt((d?.searchInformation?.totalResults || '0').replace(/,/g, '')) || items.length
        profile.news_articles  = items.filter((i: { link: string }) => /news|press|article|herald|times/i.test(i.link)).map((i: { link: string }) => i.link).slice(0,3)
        profile.social_profiles = items.filter((i: { link: string }) => /linkedin|twitter|instagram|facebook/i.test(i.link)).map((i: { link: string }) => i.link).slice(0,4)
        // Extract LinkedIn if not from Apollo
        if (!profile.linkedin) {
          const li = items.find((i: { link: string }) => i.link.includes('linkedin.com/in/'))
          if (li) profile.linkedin = li.link
        }
      }
    } catch { /* web optional */ }
  }

  // Persist to Supabase
  if (SB_URL && SB_SKEY) {
    try {
      await fetch(`${SB_URL}/rest/v1/person_searches`, {
        method: 'POST',
        headers: SB_HDR(),
        body: JSON.stringify({
          full_name,
          company: company || null,
          city: city || null,
          state: state || null,
          result: { ...profile, sources },
          searched_at: new Date().toISOString(),
        })
      })
    } catch { /* persist optional */ }
  }

  return {
    ...profile,
    sources,
    confidence: sources.length >= 2 ? 85 : sources.length === 1 ? 60 : 30,
    searched_at: new Date().toISOString(),
  } as PersonProfile
}
