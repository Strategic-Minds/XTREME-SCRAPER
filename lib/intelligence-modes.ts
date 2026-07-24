/**
 * XPS Intelligence delivery modes.
 * All copy is constrained to fields present in the returned records.
 * Absence of a website, rating, or contact is treated as missing data, not proof
 * of business behavior, market position, advertising spend, or buying intent.
 */

export type IntelligenceMode = 'flash' | 'deep' | 'counter_intel'

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
  source?: string
  source_url?: string
  confidence?: number
  category?: string
}

export interface FlashResult {
  rank: number
  company_name: string
  phone?: string
  rating?: number
  review_count?: number
  address?: string
  source: string
  confidence: number
  one_liner: string
  why_first?: string
}

export interface FlashIntel {
  mode: 'flash'
  summary: string
  top_results: FlashResult[]
  quick_stats: { total: number; with_phone: number; top_rated: number; missing_website: number }
  export_ready: boolean
  limitations: string[]
}

function factualOneLiner(lead: L5Lead): string {
  const facts: string[] = []
  if (typeof lead.rating === 'number') facts.push(`${lead.rating.toFixed(1)} public rating${lead.review_count ? ` from ${lead.review_count} reviews` : ''}`)
  if (lead.phone) facts.push('phone field available')
  if (lead.email) facts.push('email field available')
  if (lead.website) facts.push('website field available')
  if (!facts.length) facts.push('limited fields returned; enrichment recommended')
  return facts.join(' · ')
}

function factualScore(lead: L5Lead): number {
  return Math.min(100,
    Math.max(0, lead.confidence || 40)
    + (lead.phone ? 10 : 0)
    + (lead.email ? 10 : 0)
    + (lead.website ? 5 : 0)
    + (typeof lead.rating === 'number' ? 5 : 0),
  )
}

export function generateFlashIntel(leads: L5Lead[], query: string, city: string, state: string): FlashIntel {
  const ranked = leads.map(lead => ({ lead, score: factualScore(lead) })).sort((a, b) => b.score - a.score)
  const topResults = ranked.slice(0, 5).map(({ lead, score }, index) => ({
    rank: index + 1,
    company_name: lead.company_name,
    phone: lead.phone,
    rating: lead.rating,
    review_count: lead.review_count,
    address: lead.address,
    source: lead.source || 'unknown',
    confidence: score,
    one_liner: factualOneLiner(lead),
    why_first: index === 0 ? 'Ranked first by available record completeness and source confidence. This is not a prediction of purchase intent or business quality.' : undefined,
  }))
  return {
    mode: 'flash',
    summary: `Returned ${leads.length} source-backed records for ${query}${city ? ` in ${city}${state ? `, ${state}` : ''}` : ''}.`,
    top_results: topResults,
    quick_stats: {
      total: leads.length,
      with_phone: leads.filter(lead => lead.phone).length,
      top_rated: leads.filter(lead => typeof lead.rating === 'number' && lead.rating >= 4.8).length,
      missing_website: leads.filter(lead => !lead.website).length,
    },
    export_ready: leads.length > 0,
    limitations: [
      'Contact fields are reported as returned by their source and may require re-verification.',
      'Missing fields do not prove that the information or asset does not exist.',
      'Ranking reflects available data completeness, not guaranteed commercial value.',
    ],
  }
}

export interface DeepBrief {
  mode: 'deep'
  opener: string
  what_we_found: { headline: string; detail: string; proof: string[] }
  market_picture: {
    headline: string
    insight: string
    tier_breakdown: {
      top_tier: { company_name: string; phone?: string; rating?: number; review_count?: number; source: string }[]
      solid_tier: { company_name: string; phone?: string; rating?: number; review_count?: number; source: string }[]
      unverified: { company_name: string; phone?: string; rating?: number; review_count?: number; source: string }[]
    }
  }
  hidden_gems: { headline: string; why_hidden: string; count: number; gems: { company_name: string; phone: string; address?: string; why: string }[] }
  source_breakdown: { source: string; count: number; trust_level: string; description: string }[]
  next_steps: string[]
  confidence_statement: string
  limitations: string[]
}

export function generateDeepBrief(leads: L5Lead[], query: string, city: string, state: string, sources: string[], keywords: string[]): DeepBrief {
  const withPhone = leads.filter(lead => lead.phone)
  const withWebsite = leads.filter(lead => lead.website)
  const missingWebsite = leads.filter(lead => !lead.website && lead.phone)
  const rated = leads.filter(lead => typeof lead.rating === 'number').sort((a, b) => (b.rating || 0) - (a.rating || 0))
  const highRated = rated.filter(lead => (lead.rating || 0) >= 4.8)
  const midRated = rated.filter(lead => (lead.rating || 0) >= 4 && (lead.rating || 0) < 4.8)
  const unrated = leads.filter(lead => typeof lead.rating !== 'number')
  const sourceCounts = leads.reduce<Record<string, number>>((map, lead) => {
    const source = lead.source || 'unknown'
    map[source] = (map[source] || 0) + 1
    return map
  }, {})

  return {
    mode: 'deep',
    opener: `This run returned ${leads.length} records for ${query}${city ? ` in ${city}${state ? `, ${state}` : ''}` : ''} using ${sources.length} source adapter${sources.length === 1 ? '' : 's'}.`,
    what_we_found: {
      headline: `${leads.length} records · ${withPhone.length} with phone fields · ${withWebsite.length} with website fields`,
      detail: 'The result set combines available source fields. It does not establish total market size, current availability, buying intent, or contact accuracy without additional validation.',
      proof: [
        `${keywords.length} query variation${keywords.length === 1 ? '' : 's'} were attempted`,
        `${Object.keys(sourceCounts).length} source label${Object.keys(sourceCounts).length === 1 ? '' : 's'} appear in the returned records`,
        `${rated.length} records include public rating fields`,
        `${missingWebsite.length} records include a phone field but no website field in this retrieval`,
      ],
    },
    market_picture: {
      headline: `Coverage picture for the returned ${query} records`,
      insight: `The dataset contains ${highRated.length} records rated 4.8 or above, ${midRated.length} rated from 4.0 to 4.79, and ${unrated.length} without a rating field. These are descriptive counts, not a quality certification.`,
      tier_breakdown: {
        top_tier: highRated.slice(0, 5).map(lead => ({ company_name: lead.company_name, phone: lead.phone, rating: lead.rating, review_count: lead.review_count, source: lead.source || 'unknown' })),
        solid_tier: midRated.slice(0, 5).map(lead => ({ company_name: lead.company_name, phone: lead.phone, rating: lead.rating, review_count: lead.review_count, source: lead.source || 'unknown' })),
        unverified: unrated.slice(0, 5).map(lead => ({ company_name: lead.company_name, phone: lead.phone, rating: lead.rating, review_count: lead.review_count, source: lead.source || 'unknown' })),
      },
    },
    hidden_gems: {
      headline: `${missingWebsite.length} records need website verification`,
      why_hidden: 'A website value was not returned for these records. That can mean the source omitted it, the site was unavailable, or no site was found. It does not prove the business lacks a website.',
      count: missingWebsite.length,
      gems: missingWebsite.slice(0, 5).map(lead => ({ company_name: lead.company_name, phone: lead.phone || '', address: lead.address, why: 'Phone field present; website field missing. Verify before using this as an outreach angle.' })),
    },
    source_breakdown: Object.entries(sourceCounts).map(([source, count]) => ({
      source,
      count,
      trust_level: source === 'ai_intelligence' ? 'quarantine-required' : 'source-backed',
      description: `${count} returned record${count === 1 ? '' : 's'} labeled with ${source}. Source-specific terms and freshness still apply.`,
    })),
    next_steps: [
      'Open evidence for the highest-priority records and confirm the source fields.',
      'Re-verify contact details immediately before outreach.',
      'Enrich records with missing websites, decision-makers, or contradictory fields.',
      'Record outcomes so opportunity scoring can be calibrated against real results.',
    ],
    confidence_statement: `This briefing is limited to ${leads.length} returned records and the fields supplied by ${sources.length} source adapter${sources.length === 1 ? '' : 's'}.`,
    limitations: [
      'The result count is not a census of the market.',
      'A public rating is not a certification of quality.',
      'Missing data is not evidence of absence.',
      'No buying-intent or revenue claim is made without a dated supporting signal.',
    ],
  }
}

export interface CounterIntel {
  mode: 'counter_intel'
  opener: string
  the_hidden_corner: { headline: string; what_google_shows: string; what_we_found: string; the_gap: string; why_the_gap_exists: string }
  click_pattern_analysis: { headline: string; the_trap: string; the_cost: string; what_we_did_instead: string }
  follow_the_money: { headline: string; who_wins: string; what_you_lose: string; our_difference: string }
  probability_call: { headline: string; the_bet: string; the_evidence: string[]; the_targets: { company_name: string; phone?: string; signal: string; edge: string }[] }
  hidden_corner_results: { headline: string; why_invisible: string; gems: { company_name: string; phone?: string; address?: string; invisible_because: string; opportunity: string }[] }
  call_to_action: string
  limitations: string[]
}

export function generateCounterIntelSync(leads: L5Lead[], query: string, city: string, state: string, sources: string[], keywords: string[]): CounterIntel {
  const withPhone = leads.filter(lead => lead.phone)
  const missingWebsite = leads.filter(lead => !lead.website && lead.phone)
  const rated = leads.filter(lead => typeof lead.rating === 'number').sort((a, b) => (b.rating || 0) - (a.rating || 0))
  return {
    mode: 'counter_intel',
    opener: `A normal search experience presents pages. This run organized ${leads.length} records for ${query}${city ? ` in ${city}${state ? `, ${state}` : ''}` : ''} across ${sources.length} source adapter${sources.length === 1 ? '' : 's'}.`,
    the_hidden_corner: {
      headline: 'What a page of links does not organize for you',
      what_google_shows: 'Traditional search is optimized for navigating pages and listings. It does not automatically produce a normalized, deduplicated, evidence-labeled workflow for this specific business goal.',
      what_we_found: `${leads.length} structured records, ${withPhone.length} phone fields, and ${missingWebsite.length} records that require website verification.`,
      the_gap: 'The difference demonstrated here is aggregation, normalization, evidence labeling, and prioritization. It is not a claim that another search provider cannot index the underlying public pages.',
      why_the_gap_exists: 'Useful business decisions usually require combining fields from multiple sources and applying a consistent workflow after retrieval.',
    },
    click_pattern_analysis: {
      headline: 'The manual-work trap',
      the_trap: 'Opening individual results still leaves entity matching, contact verification, evidence review, and prioritization to the user.',
      the_cost: 'The cost is research time and inconsistent decisions. This system does not estimate a dollar amount without measured user data.',
      what_we_did_instead: `Applied ${keywords.length} query variation${keywords.length === 1 ? '' : 's'}, normalized returned records, separated quarantined candidates, and attached explainable actions.`,
    },
    follow_the_money: {
      headline: 'Commercial value must be measured, not invented',
      who_wins: 'The user benefits when verified research time falls or conversion improves. Those outcomes require pilot measurement.',
      what_you_lose: 'Without outcome tracking, the system cannot honestly claim revenue lift, pickup probability, or superior lead quality.',
      our_difference: 'XPS exposes the evidence, uncertainty, source labels, and next step instead of hiding them behind a single opaque rank.',
    },
    probability_call: {
      headline: 'Hypotheses worth testing',
      the_bet: 'Records with complete contact fields may be easier to act on. Records with missing website fields may merit enrichment. Neither condition proves buying intent, responsiveness, quality, or marketing behavior.',
      the_evidence: [
        `${withPhone.length} records include a phone field`,
        `${rated.length} records include a public rating field`,
        `${missingWebsite.length} records include a phone field but no website field in this retrieval`,
        `${sources.length} source adapter${sources.length === 1 ? '' : 's'} contributed to the run`,
      ],
      the_targets: leads.slice(0, 4).map(lead => ({
        company_name: lead.company_name,
        phone: lead.phone,
        signal: factualOneLiner(lead),
        edge: 'Review the evidence and verify current fit before outreach.',
      })),
    },
    hidden_corner_results: {
      headline: `${missingWebsite.length} records need an additional website check`,
      why_invisible: 'The retrieved record did not include a website field. No conclusion is drawn about advertising, SEO, profile ownership, or whether a website exists elsewhere.',
      gems: missingWebsite.slice(0, 5).map(lead => ({
        company_name: lead.company_name,
        phone: lead.phone,
        address: lead.address,
        invisible_because: 'Website field missing from the current record',
        opportunity: 'Enrich and verify before deciding whether this is commercially relevant.',
      })),
    },
    call_to_action: 'Review the highest-completeness records first, open their evidence, re-verify contact details, and record the outcome. Use measured results to improve future scoring.',
    limitations: [
      'No claim is made about paid placement, ad spend, platform fees, response probability, or revenue.',
      'No missing field is treated as proof that an asset or profile does not exist.',
      'AI-only candidates must remain quarantined until corroborated.',
    ],
  }
}

export async function generateCounterIntel(leads: L5Lead[], query: string, city: string, state: string, sources: string[], keywords: string[]): Promise<CounterIntel> {
  return generateCounterIntelSync(leads, query, city, state, sources, keywords)
}

export type IntelligencePayload =
  | { mode: 'flash'; intel: FlashIntel }
  | { mode: 'deep'; intel: DeepBrief }
  | { mode: 'counter_intel'; intel: CounterIntel }

export async function dispatchIntelligence(mode: IntelligenceMode, leads: L5Lead[], query: string, city: string, state: string, sources: string[], keywords: string[]): Promise<IntelligencePayload> {
  switch (mode) {
    case 'flash': return { mode: 'flash', intel: generateFlashIntel(leads, query, city, state) }
    case 'deep': return { mode: 'deep', intel: generateDeepBrief(leads, query, city, state, sources, keywords) }
    case 'counter_intel': return { mode: 'counter_intel', intel: await generateCounterIntel(leads, query, city, state, sources, keywords) }
    default: return { mode: 'flash', intel: generateFlashIntel(leads, query, city, state) }
  }
}
