/**
 * XPS Intelligence business and professional enrichment.
 * Each field remains source-labeled and must be re-verified before consequential use.
 */

const GM_KEY = process.env.GOOGLE_CLOUD_API_KEY || process.env.GOOGLE_MAPS_API_KEY || ''
const SB_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SB_SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function sbHeaders(prefer = 'return=representation') {
  return {
    apikey: SB_SKEY,
    Authorization: `Bearer ${SB_SKEY}`,
    'Content-Type': 'application/json',
    Prefer: prefer,
  }
}

export interface EnrichedBusiness {
  company_name: string
  city?: string
  state?: string
  phone?: string
  email?: string
  website?: string
  legal_entity_name?: string
  registered_agent?: string
  agent_address?: string
  formation_date?: string
  entity_status?: string
  entity_type?: string
  state_of_incorporation?: string
  opencorporates_url?: string
  license_number?: string
  license_type?: string
  license_status?: string
  license_expiry?: string
  license_complaints?: number
  licensed_person?: string
  web_mentions?: number
  news_articles?: string[]
  lawsuit_signals?: string[]
  web_presence_score?: number
  social_profiles?: string[]
  had_website?: boolean
  website_last_seen?: string
  recovered_phones?: string[]
  wayback_url?: string
  enriched_at?: string
  enrichment_sources?: string[]
  enrichment_confidence?: number
}

export async function enrichOpenCorporates(companyName: string, state?: string): Promise<Partial<EnrichedBusiness>> {
  try {
    const jurisdiction = state ? `&jurisdiction_code=us_${state.toLowerCase()}` : ''
    const response = await fetch(`https://api.opencorporates.com/v0.4/companies/search?q=${encodeURIComponent(companyName)}${jurisdiction}&format=json&order=score`, {
      signal: AbortSignal.timeout(6000),
      cache: 'no-store',
    })
    if (!response.ok) return {}
    const data = await response.json()
    const company = data?.results?.companies?.[0]?.company
    if (!company) return {}
    const rawStatus = String(company.current_status || '').toLowerCase()
    return {
      legal_entity_name: company.name,
      entity_status: company.inactive || /dissolved|inactive|suspended|revoked/.test(rawStatus) ? 'Inactive' : company.current_status || 'Unknown',
      entity_type: company.company_type,
      formation_date: company.incorporation_date,
      state_of_incorporation: company.jurisdiction_code?.replace('us_', '').toUpperCase(),
      registered_agent: company.registered_agent?.name,
      agent_address: company.registered_address?.in_full,
      opencorporates_url: company.opencorporates_url,
    }
  } catch {
    return {}
  }
}

const LICENSE_BOARDS: Record<string, { url: string; name: string }> = {
  CA: { url: 'https://www.cslb.ca.gov', name: 'California Contractors State License Board' },
  TX: { url: 'https://www.tdlr.texas.gov', name: 'Texas Department of Licensing and Regulation' },
  FL: { url: 'https://www.myfloridalicense.com', name: 'Florida DBPR' },
  NY: { url: 'https://dos.ny.gov', name: 'New York Department of State' },
  WA: { url: 'https://www.lni.wa.gov', name: 'Washington L&I' },
  CO: { url: 'https://dora.colorado.gov', name: 'Colorado DORA' },
  GA: { url: 'https://sos.ga.gov', name: 'Georgia Secretary of State' },
  NC: { url: 'https://www.nclbgc.org', name: 'North Carolina Licensing Board' },
  IL: { url: 'https://idfpr.illinois.gov', name: 'Illinois IDFPR' },
  OH: { url: 'https://com.ohio.gov', name: 'Ohio Commerce' },
  PA: { url: 'https://www.dli.pa.gov', name: 'Pennsylvania L&I' },
  MI: { url: 'https://www.michigan.gov/lara', name: 'Michigan LARA' },
  NV: { url: 'https://nscb.nv.gov', name: 'Nevada State Contractors Board' },
  OR: { url: 'https://www.oregon.gov/ccb', name: 'Oregon CCB' },
  MN: { url: 'https://www.dli.mn.gov', name: 'Minnesota DLI' },
}

export async function enrichLicenseBoard(companyName: string, state?: string): Promise<Partial<EnrichedBusiness>> {
  const board = state ? LICENSE_BOARDS[state.toUpperCase()] : undefined
  if (!board || !GM_KEY) return {}
  try {
    const query = encodeURIComponent(`"${companyName}" site:${new URL(board.url).hostname}`)
    const response = await fetch(`https://www.googleapis.com/customsearch/v1?key=${GM_KEY}&cx=017576662512468239146:omuauf10dwe&q=${query}&num=3`, {
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    })
    if (!response.ok) return {}
    const data = await response.json()
    const item = data?.items?.[0]
    if (!item) return { license_status: 'Not found in this search', license_type: board.name }
    const snippet = String(item.snippet || '')
    const number = snippet.match(/\b([A-Z]?\d{5,10})\b/)?.[1]
    const status = /expired|inactive|lapsed|revoked/i.test(snippet)
      ? 'Possible inactive status, verify at source'
      : /active|current|valid/i.test(snippet)
        ? 'Possible active status, verify at source'
        : 'Record found, status unverified'
    return { license_number: number, license_status: status, license_type: board.name }
  } catch {
    return {}
  }
}

export async function enrichWebIntelligence(companyName: string, city?: string, state?: string): Promise<Partial<EnrichedBusiness>> {
  if (!GM_KEY) return {}
  try {
    const location = [city, state].filter(Boolean).join(' ')
    const response = await fetch(`https://www.googleapis.com/customsearch/v1?key=${GM_KEY}&q=${encodeURIComponent(`"${companyName}" ${location}`)}&num=10`, {
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    })
    if (!response.ok) return {}
    const data = await response.json()
    const items = (data?.items || []) as Array<{ link: string; snippet: string; title: string }>
    const total = Number.parseInt(String(data?.searchInformation?.totalResults || '0').replaceAll(',', ''), 10) || items.length
    const news = items.filter(item => /news|press|article|journal|times|herald/i.test(item.link)).map(item => item.link)
    const legal = items.filter(item => /lawsuit|complaint|court|judgment|legal action/i.test(`${item.snippet} ${item.title}`)).map(item => item.link)
    const social = items.filter(item => /linkedin|facebook|instagram|twitter|x\.com|yelp/i.test(item.link)).map(item => item.link)
    return {
      web_mentions: total,
      news_articles: news.slice(0, 3),
      lawsuit_signals: legal.slice(0, 2),
      social_profiles: social.slice(0, 4),
      web_presence_score: Math.min(100, Math.round(Math.log10(total + 1) * 33)),
    }
  } catch {
    return {}
  }
}

export async function enrichWayback(companyName: string, website?: string): Promise<Partial<EnrichedBusiness>> {
  const domain = website || `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)}.com`
  const clean = domain.replace(/^https?:\/\//, '').replace(/\/.*/, '')
  if (!clean) return {}
  try {
    const response = await fetch(`https://archive.org/wayback/available?url=${encodeURIComponent(clean)}`, {
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    })
    if (!response.ok) return {}
    const data = await response.json()
    const snapshot = data?.archived_snapshots?.closest
    if (!snapshot?.available) return { had_website: false }
    const timestamp = String(snapshot.timestamp || '')
    return {
      had_website: true,
      website_last_seen: timestamp.length >= 8 ? `${timestamp.slice(0, 4)}-${timestamp.slice(4, 6)}-${timestamp.slice(6, 8)}` : undefined,
      wayback_url: snapshot.url,
    }
  } catch {
    return {}
  }
}

async function getCachedEnrichment(key: string): Promise<EnrichedBusiness | null> {
  if (!SB_URL || !SB_SKEY) return null
  try {
    const response = await fetch(`${SB_URL}/rest/v1/enrichment_cache?cache_key=eq.${encodeURIComponent(key)}&select=data,enriched_at&limit=1`, {
      headers: sbHeaders(),
      cache: 'no-store',
    })
    if (!response.ok) return null
    const rows = await response.json() as Array<{ data: EnrichedBusiness; enriched_at: string }>
    const row = rows[0]
    if (!row || Date.now() - new Date(row.enriched_at).getTime() > 7 * 24 * 60 * 60 * 1000) return null
    return row.data
  } catch {
    return null
  }
}

async function saveEnrichmentCache(key: string, data: EnrichedBusiness): Promise<void> {
  if (!SB_URL || !SB_SKEY) return
  try {
    await fetch(`${SB_URL}/rest/v1/enrichment_cache`, {
      method: 'POST',
      headers: sbHeaders('resolution=merge-duplicates,return=minimal'),
      body: JSON.stringify({ cache_key: key, company_name: data.company_name, city: data.city, state: data.state, data, enriched_at: data.enriched_at }),
    })
  } catch {
    // Cache persistence is non-critical.
  }
}

export async function enrichBusiness(
  companyName: string,
  opts: { city?: string; state?: string; phone?: string; website?: string; layers?: string[] },
): Promise<EnrichedBusiness> {
  const { city, state, phone, website } = opts
  const layers = opts.layers || ['opencorporates', 'web', 'wayback']
  const cacheKey = `${companyName.toLowerCase().replace(/\s+/g, '_')}:${city || ''}:${state || ''}`.slice(0, 200)
  const cached = await getCachedEnrichment(cacheKey)
  if (cached) return { ...cached, company_name: cached.company_name || companyName, enrichment_sources: [...(cached.enrichment_sources || []), 'cache'] }

  const base: EnrichedBusiness = { company_name: companyName, city, state, phone, website }
  const sources: string[] = []
  const jobs: Array<Promise<Partial<EnrichedBusiness>>> = []
  if (layers.includes('opencorporates')) jobs.push(enrichOpenCorporates(companyName, state).then(value => { if (Object.keys(value).length) sources.push('opencorporates'); return value }))
  if (layers.includes('license') && state) jobs.push(enrichLicenseBoard(companyName, state).then(value => { if (Object.keys(value).length) sources.push('license_board'); return value }))
  if (layers.includes('web')) jobs.push(enrichWebIntelligence(companyName, city, state).then(value => { if (Object.keys(value).length) sources.push('web_intelligence'); return value }))
  if (layers.includes('wayback')) jobs.push(enrichWayback(companyName, website).then(value => { if (Object.keys(value).length) sources.push('wayback'); return value }))

  const result: EnrichedBusiness = { ...base }
  for (const job of await Promise.allSettled(jobs)) if (job.status === 'fulfilled') Object.assign(result, job.value)
  result.company_name = companyName

  let confidence = 30
  if (result.legal_entity_name) confidence += 20
  if (result.license_status && !/not found|unverified/i.test(result.license_status)) confidence += 10
  if ((result.web_mentions || 0) > 5) confidence += 10
  if (result.had_website) confidence += 10
  if (result.registered_agent) confidence += 10
  if (result.phone) confidence += 5

  const final: EnrichedBusiness = {
    ...result,
    company_name: companyName,
    enrichment_sources: sources,
    enrichment_confidence: Math.min(100, confidence),
    enriched_at: new Date().toISOString(),
  }
  await saveEnrichmentCache(cacheKey, final)
  return final
}

export interface PersonProfile {
  full_name: string
  company?: string
  title?: string
  city?: string
  state?: string
  email?: string
  phone?: string
  linkedin?: string
  industry?: string
  specialties?: string[]
  years_experience?: number
  previous_companies?: string[]
  web_mentions?: number
  news_articles?: string[]
  social_profiles?: string[]
  confidence?: number
  sources?: string[]
  searched_at?: string
}

export async function searchPerson(
  fullName: string,
  opts: { company?: string; city?: string; state?: string; title?: string },
): Promise<PersonProfile> {
  const { company, city, state, title } = opts
  const sources: string[] = []
  const profile: PersonProfile = { full_name: fullName, company, city, state, title }
  const apolloKey = process.env.APOLLO_API_KEY_2 || ''

  if (apolloKey) {
    try {
      const parts = fullName.trim().split(/\s+/)
      const response = await fetch('https://api.apollo.io/v1/people/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apolloKey },
        body: JSON.stringify({
          first_name: parts[0],
          last_name: parts.slice(1).join(' ') || undefined,
          organization_name: company,
          person_locations: city ? [`${city}, ${state || ''}`] : undefined,
        }),
        signal: AbortSignal.timeout(8000),
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        const person = data?.person
        if (person) {
          sources.push('apollo')
          profile.email = person.email
          profile.phone = person.phone_numbers?.[0]?.sanitized_number
          profile.title = person.title || title
          profile.industry = person.organization?.industry
          profile.linkedin = person.linkedin_url
          profile.previous_companies = person.employment_history?.slice(1, 4).map((item: { organization_name?: string }) => item.organization_name).filter(Boolean)
        }
      }
    } catch {
      // Apollo is optional.
    }
  }

  if (GM_KEY) {
    try {
      const location = [city, state].filter(Boolean).join(' ')
      const response = await fetch(`https://www.googleapis.com/customsearch/v1?key=${GM_KEY}&q=${encodeURIComponent(`"${fullName}" ${company || ''} ${location}`.trim())}&num=10`, {
        signal: AbortSignal.timeout(8000),
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        const items = (data?.items || []) as Array<{ link: string; snippet: string; title: string }>
        sources.push('web_search')
        profile.web_mentions = Number.parseInt(String(data?.searchInformation?.totalResults || '0').replaceAll(',', ''), 10) || items.length
        profile.news_articles = items.filter(item => /news|press|article|journal|times/i.test(item.link)).map(item => item.link).slice(0, 3)
        profile.social_profiles = items.filter(item => /linkedin|twitter|instagram|facebook|x\.com/i.test(item.link)).map(item => item.link).slice(0, 4)
        if (!profile.linkedin) profile.linkedin = items.find(item => item.link.includes('linkedin.com/in/'))?.link
      }
    } catch {
      // Web discovery is optional.
    }
  }

  return {
    ...profile,
    sources,
    confidence: sources.length >= 2 ? 85 : sources.length === 1 ? 60 : 30,
    searched_at: new Date().toISOString(),
  }
}
