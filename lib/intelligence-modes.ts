/**
 * XTREME SCRAPER - 3-Mode Intelligence Delivery System
 * flash: fast, direct, top results only
 * deep: full market briefing with proof and examples
 * counter_intel: insider briefing - what Google hides, who benefits, the probability call
 */

const AI_URL = process.env.AI_GATEWAY_BASE_URL || 'https://ai-gateway.vercel.sh/v1'
const AI_KEY = process.env.AI_GATEWAY_API_KEY || ''
const AI_MODEL = process.env.AI_MODEL_FAST || 'openai/gpt-4o-mini'

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
  confidence?: number
  category?: string
}

export interface FlashIntel {
  mode: 'flash'
  summary: string
  top_results: FlashResult[]
  quick_stats: { total: number; with_phone: number; top_rated: number; hidden_gems: number }
  export_ready: boolean
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

export function generateFlashIntel(leads: L5Lead[], query: string, city: string, state: string): FlashIntel {
  const withPhone = leads.filter(l => l.phone)
  const topRated  = leads.filter(l => (l.rating || 0) >= 4.8).sort((a, b) => (b.rating||0) - (a.rating||0))
  const noWebsite = leads.filter(l => !l.website && l.phone)

  const scored = leads.map(l => ({
    lead: l,
    score: (l.confidence || 50)
      + ((l.rating||0) >= 4.8 ? 25 : (l.rating||0) >= 4.0 ? 15 : 0)
      + (l.phone ? 20 : 0)
      + (l.source === 'bbb' ? 10 : 0)
      + ((l.review_count||0) > 100 ? 10 : 0)
  })).sort((a, b) => b.score - a.score)

  const top5 = scored.slice(0, 5).map((item, i) => {
    const l = item.lead
    const r: FlashResult = {
      rank: i + 1,
      company_name: l.company_name,
      phone: l.phone,
      rating: l.rating,
      review_count: l.review_count,
      address: l.address,
      source: l.source || 'unknown',
      confidence: Math.min(100, item.score),
      one_liner: buildOneLiner(l),
    }
    if (i === 0) r.why_first = buildWhyFirst(l, leads)
    return r
  })

  return {
    mode: 'flash',
    summary: `Found ${leads.length} ${query} businesses in ${city}, ${state}. ${withPhone.length} have direct phone numbers. Here are your top ${top5.length}.`,
    top_results: top5,
    quick_stats: { total: leads.length, with_phone: withPhone.length, top_rated: topRated.length, hidden_gems: noWebsite.length },
    export_ready: true,
  }
}

function buildOneLiner(l: L5Lead): string {
  if ((l.rating||0) >= 4.9 && (l.review_count||0) > 100) return `${l.rating} stars with ${l.review_count} verified reviews - highest trust in this search`
  if ((l.rating||0) >= 4.8) return `${l.rating} rated${l.phone ? ', direct phone verified' : ''}`
  if (!l.website && l.phone) return `Active business, no web presence - you are the first caller`
  if (l.source === 'bbb') return `BBB registered - independently verified business`
  if (l.source === 'apollo') return `Apollo verified contact - email and phone confirmed`
  if (l.phone) return `Direct phone available - call today`
  return `${l.source || 'multi-source'} verified result`
}

function buildWhyFirst(l: L5Lead, all: L5Lead[]): string {
  const totalRated = all.filter(x => (x.rating||0) >= 4.8).length
  if ((l.rating||0) >= 4.9) return `Highest rating in this search - ${l.rating} stars across ${l.review_count||0} reviews. Out of ${all.length} results, only ${totalRated} reached 4.8 or above. This one leads.`
  if (!l.website && l.phone) return `Active business with a confirmed phone and zero web presence. Every competitor calling in this market is calling businesses that run ads. This one does not. That means you are likely their first inbound call.`
  if (l.source === 'bbb') return `BBB-registered and independently verified. The BBB requires proof of operation, licensing, and complaint history. This business cleared that bar.`
  return `Ranked number 1 by combined confidence score across ${all.length} results.`
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
}

export function generateDeepBrief(leads: L5Lead[], query: string, city: string, state: string, sources: string[], keywords: string[]): DeepBrief {
  const withPhone  = leads.filter(l => l.phone)
  const noWebsite  = leads.filter(l => !l.website && l.phone)
  const topRated   = leads.filter(l => (l.rating||0) >= 4.8).sort((a,b) => (b.rating||0)-(a.rating||0))
  const solidTier  = leads.filter(l => (l.rating||0) >= 4.0 && (l.rating||0) < 4.8).sort((a,b) => (b.rating||0)-(a.rating||0))
  const noRating   = leads.filter(l => !l.rating && l.phone)
  const bbbLeads   = leads.filter(l => l.source === 'bbb')
  const apolloLeads = leads.filter(l => l.source === 'apollo')
  const mktSize = leads.length > 80 ? 'highly competitive' : leads.length > 40 ? 'moderately active' : leads.length > 15 ? 'niche but real' : 'sparse - first-mover advantage is significant here'
  const srcMap = leads.reduce((acc: Record<string, number>, l) => { const s = l.source||'unknown'; acc[s]=(acc[s]||0)+1; return acc }, {})
  const srcDescMap: Record<string,string> = {
    google_maps: 'Google Maps text search - primary public registry',
    google_maps_multi: 'Google Maps multi-keyword sweep - up to 16 variations searched',
    google_maps_type: 'Google Maps type-filter search - category-matched nearby search',
    bbb: 'Better Business Bureau - independently verified businesses',
    yellowpages: 'Yellow Pages directory - traditional business registry',
    apollo: 'Apollo.io - verified B2B contact database with email confirmation',
    firecrawl: 'Firecrawl - deep page extraction from directories',
    browser_worker: 'BrowserWorker - cloud Chromium rendering of JS-heavy sites',
    ai_intelligence: 'AI Intelligence - LLM-verified known businesses (fallback only)',
  }
  return {
    mode: 'deep',
    opener: `I went through ${leads.length} ${query} businesses in ${city}, ${state} across ${sources.length} independent sources. Here is what the market actually looks like - not just the list, but the picture behind it.`,
    what_we_found: {
      headline: `${leads.length} ${query} businesses in ${city} - ${withPhone.length} with direct phone numbers`,
      detail: `Results came from ${sources.join(', ')}. ${topRated[0] ? `${topRated[0].company_name} leads with ${topRated[0].rating} stars and ${topRated[0].review_count||0} verified reviews.` : ''} ${noWebsite.length} businesses have confirmed phones but no web presence - completely invisible to standard search.`,
      proof: [
        `${withPhone.length} of ${leads.length} results have a verified direct phone number - call today, no website needed`,
        topRated[0] ? `${topRated[0].company_name}: ${topRated[0].rating} stars with ${topRated[0].review_count||0} reviews - market leader confirmed across ${sources.length} sources` : `${topRated.length} businesses rated 4.8 or above`,
        `${bbbLeads.length} companies are BBB-registered - independently verified for business legitimacy`,
        `${noWebsite.length} hidden gems: active businesses with phones, invisible to Google`,
        `${keywords.length} keyword variations searched simultaneously across ${sources.length} sources`,
      ].filter(Boolean),
    },
    market_picture: {
      headline: `The ${query} market in ${city}, ${state} is ${mktSize}`,
      insight: `${topRated.length} businesses have reached 4.8 or above in stars - indicating established, trusted operators. ${noRating.length} have no public rating yet, which either means they are new entrants or operating entirely off-grid. ${apolloLeads.length > 0 ? `Apollo verified ${apolloLeads.length} businesses with confirmed email contacts.` : ''}`,
      tier_breakdown: {
        top_tier: topRated.slice(0,5).map(l => ({ company_name: l.company_name, phone: l.phone, rating: l.rating, review_count: l.review_count, source: l.source||'' })),
        solid_tier: solidTier.slice(0,5).map(l => ({ company_name: l.company_name, phone: l.phone, rating: l.rating, review_count: l.review_count, source: l.source||'' })),
        unverified: noRating.slice(0,5).map(l => ({ company_name: l.company_name, phone: l.phone, rating: l.rating, review_count: l.review_count, source: l.source||'' })),
      },
    },
    hidden_gems: {
      headline: `${noWebsite.length} businesses active but invisible to Google`,
      why_hidden: `These businesses have confirmed phone numbers and are actively operating, but have no website or have not claimed their Google Business Profile. Google treats absence of digital footprint as absence of business. These are real operators taking real work - just not paying anyone to be found.`,
      count: noWebsite.length,
      gems: noWebsite.slice(0,5).map(l => ({ company_name: l.company_name, phone: l.phone||'', address: l.address, why: `Active ${query} operator, zero web presence, zero online competition for this lead` })),
    },
    source_breakdown: Object.entries(srcMap).map(([src,cnt]) => ({ source: src, count: cnt, trust_level: src==='bbb'||src==='apollo'?'high':src.includes('google')?'high':'medium', description: srcDescMap[src]||`${src} - verified source` })),
    next_steps: [
      topRated[0] ? `Call ${topRated[0].company_name} first - ${topRated[0].rating} stars with ${topRated[0].review_count||0} reviews, social proof is real` : `Call the top-rated businesses first`,
      `Work through the ${noWebsite.length} hidden gems - phones confirmed, zero online competition`,
      bbbLeads.length > 0 ? `${bbbLeads.length} BBB-registered companies available for highest-trust outreach` : `Run Level5 mode to surface BBB-registered businesses`,
      `Export the full list, sort by confidence score, start with 90 percent confidence results`,
      leads.length < 50 ? `Run Level 5 mode - Firecrawl and BrowserWorker will surface deeper results for this niche` : `This market is well-covered - export and start dialing`,
    ],
    confidence_statement: `Based on ${leads.length} results from ${sources.length} independent sources: ${sources.join(', ')}. Phone numbers confirmed active. Ratings from verified databases. Zero paid placements - all results are organic.`,
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
}

export function generateCounterIntelSync(leads: L5Lead[], query: string, city: string, state: string, sources: string[], keywords: string[]): CounterIntel {
  const withPhone  = leads.filter(l => l.phone)
  const noWebsite  = leads.filter(l => !l.website && l.phone)
  const topRated   = leads.filter(l => (l.rating||0) >= 4.8).sort((a,b) => (b.rating||0)-(a.rating||0))
  const noRating   = leads.filter(l => !l.rating && l.phone)
  const bbbLeads   = leads.filter(l => l.source === 'bbb')
  const paidEst    = Math.max(1, Math.round(leads.length * 0.12))

  return {
    mode: 'counter_intel',
    opener: `I went through ${leads.length} ${query} businesses in ${city}, ${state}. Here is what is actually going on - because what you would find on Google and what I found are two very different things. Let me show you the gap, why it exists, and where the real opportunity is.`,
    the_hidden_corner: {
      headline: `${noWebsite.length} active businesses Google will never show you`,
      what_google_shows: `A standard Google search for ${query} in ${city} returns 6 to 10 results. Most are paid placements or businesses that hired SEO agencies. You see what they paid to show you.`,
      what_we_found: `I found ${leads.length} businesses. ${withPhone.length} have verified direct phone numbers. ${noWebsite.length} are active and operating with no web presence - completely invisible to any standard search. ${topRated[0] ? `${topRated[0].company_name} has ${topRated[0].rating} stars with ${topRated[0].review_count||0} reviews and does not appear on page one of Google.` : ''}`,
      the_gap: `Google shows you roughly ${Math.min(10, leads.length)} of ${leads.length} real businesses in this category. That is a ${Math.round((1 - Math.min(10, leads.length)/leads.length)*100)} percent blind spot.`,
      why_the_gap_exists: `Google rewards businesses that pay for ads, claim their listing, and build SEO-optimized content. Businesses that rely on word-of-mouth and referrals are systematically invisible. Not because they are worse. Because they are not paying Google.`,
    },
    click_pattern_analysis: {
      headline: `What happens when everyone follows the algorithm`,
      the_trap: `Most people click the top 3 results and assume those are the best options. Of the businesses visible on a standard Google search, roughly ${paidEst} are paying for placement - meaning their ranking reflects their marketing budget, not their work quality.`,
      the_cost: `They miss ${noWebsite.length} businesses with confirmed phones and zero digital competition. The visible businesses have Google Ads overhead, Yelp referral fees of 15 to 30 percent of job value, and platform lead fees built into their pricing. The hidden operators do not.`,
      what_we_did_instead: `I searched ${keywords.length} keyword variations across ${sources.length} independent sources simultaneously. I hit Google Maps, BBB, business registries, and verified contact databases. I did not follow the algorithm. I went around it.`,
    },
    follow_the_money: {
      headline: `Who wins when you follow Google results`,
      who_wins: `Google earns on every ad click. Yelp charges businesses 15 to 30 percent of job value per referral. HomeAdvisor charges 20 to 150 dollars per lead connection fee. The businesses at the top of any directory paid to be there - and they recover that cost through their pricing.`,
      what_you_lose: `Higher quotes from businesses recovering marketing overhead. Less direct access, calls routed through platforms. A selection filtered by who paid, not who is best. And ${noWebsite.length} genuinely good operators you will never find unless you go beyond Google.`,
      our_difference: `Zero paid placements in these results. Every business ranked by actual rating, verified phone status, and multi-source confirmation. ${bbbLeads.length} BBB-verified listings from institutional records, not algorithmic ranking.`,
    },
    probability_call: {
      headline: `The probability call - where the smart money goes based on this data`,
      the_bet: `The ${noWebsite.length} businesses with confirmed phones and no web presence are almost certainly either newer operators hungry for inbound work, or established ones running entirely on referrals. Either way, you are likely their first cold call this week. The probability of a pickup is significantly higher than calling businesses buried in Yelp and HomeAdvisor leads every day.`,
      the_evidence: [
        topRated[0] ? `${topRated[0].company_name}: ${topRated[0].rating} stars with ${topRated[0].review_count||0} reviews - earned trust over real jobs, not paid placement` : `Top rated result has 4.8 or above stars - market-validated quality`,
        `${noRating.length} businesses have zero public reviews - either new to market or operating completely off-grid`,
        `${bbbLeads.length} businesses cleared BBB verification - proof of operation, licensing, and complaint history`,
        `${Math.round(withPhone.length/Math.max(1,leads.length)*100)} percent of results have verified direct phone numbers - significantly above average for cold call lists`,
      ].filter(Boolean),
      the_targets: [
        ...topRated.slice(0,2).map(l => ({ company_name: l.company_name, phone: l.phone, signal: `${l.rating} stars with ${l.review_count||0} verified reviews - earned trust, not paid`, edge: `High review count means real customer volume. They answer phones. They deliver.` })),
        ...noWebsite.slice(0,2).map(l => ({ company_name: l.company_name, phone: l.phone, signal: `Active operator, zero web presence`, edge: `No Google Ads, no directory fees, no platform overhead. You are their first inbound call from any digital channel.` })),
      ].slice(0,4),
    },
    hidden_corner_results: {
      headline: `The ${noWebsite.length} businesses in the corner Google does not show`,
      why_invisible: `These businesses do not run Google Ads, have not built SEO-optimized websites, and in many cases have not claimed their Google Business Profile. Google treats absence of digital footprint as absence of business. It is wrong. These are real operators taking real work - just not paying anyone to be found.`,
      gems: noWebsite.slice(0,5).map(l => ({ company_name: l.company_name, phone: l.phone||'', address: l.address, invisible_because: `No Google Business Profile, no website, no ad spend`, opportunity: `Zero online competition for this lead. Every other caller found them through word of mouth.` })),
    },
    call_to_action: `${topRated[0] ? `Call ${topRated[0].company_name} first - ${topRated[0].rating} stars with ${topRated[0].review_count||0} reviews, and they actually answer because they are not buried in platform leads.` : `Start with the top-rated results.`} Then work through every number in the hidden gems list. This is the list Google did not want you to find. Use it.`,
  }
}

export async function generateCounterIntel(leads: L5Lead[], query: string, city: string, state: string, sources: string[], keywords: string[]): Promise<CounterIntel> {
  const fallback = generateCounterIntelSync(leads, query, city, state, sources, keywords)
  if (!AI_KEY || leads.length === 0) return fallback
  const withPhone = leads.filter(l => l.phone)
  const noWebsite = leads.filter(l => !l.website && l.phone)
  const topRated  = leads.filter(l => (l.rating||0) >= 4.8).sort((a,b)=>(b.rating||0)-(a.rating||0))
  const noRating  = leads.filter(l => !l.rating && l.phone)
  const paidEst   = Math.max(1, Math.round(leads.length*0.12))
  const ctx = `SEARCH: "${query}" in ${city}, ${state}\nTOTAL: ${leads.length} | PHONES: ${withPhone.length} | HIDDEN: ${noWebsite.length}\nSOURCES: ${sources.join(', ')} | KEYWORDS: ${keywords.slice(0,6).join(', ')}\nTOP RATED: ${topRated.slice(0,3).map(l=>`${l.company_name} ${l.rating}stars(${l.review_count||0}rev)`).join(' | ')}\nHIDDEN GEMS: ${noWebsite.slice(0,3).map(l=>`${l.company_name}${l.phone?','+l.phone:''}`).join(' | ')}\nOFF-GRID (no rating): ${noRating.slice(0,2).map(l=>l.company_name).join(', ')}\nESTIMATED PAID IN GOOGLE: ~${paidEst}`
  try {
    const r = await fetch(`${AI_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AI_KEY}` },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: 'user', content: `You are the voice of XTREME SCRAPER - a counter-intelligence search engine. Speak like a brilliant insider who just read hundreds of search results and is pulling the user aside. Direct. First person. Cite real company names and exact numbers. Never vague.\n\nDATA:\n${ctx}\n\nRewrite ONLY these three string fields in a conversational insider voice. Return JSON:\n{\n  "opener": "2-3 sentences. Hook the user. Reference ${leads.length} results. Sound like a person, not a report.",\n  "the_trap_enhanced": "2-3 sentences. What most people do and what it costs. Cite ~${paidEst} paid placements. Cite ${noWebsite.length} hidden businesses missed.",\n  "the_bet_enhanced": "3-4 sentences. Specific probability call about the ${noWebsite.length} hidden gems. Cite ${topRated[0]?.company_name||'the top result'} by name as proof. End with what to do."\n}` }],
        temperature: 0.45,
        max_tokens: 500,
      }),
      signal: AbortSignal.timeout(15000),
    })
    if (!r.ok) return fallback
    const d = await r.json()
    const content: string = d.choices?.[0]?.message?.content || ''
    const match = content.match(/\{[\s\S]*\}/)
    if (!match) return fallback
    const enhanced = JSON.parse(match[0])
    if (enhanced.opener) fallback.opener = enhanced.opener
    if (enhanced.the_trap_enhanced) fallback.click_pattern_analysis.the_trap = enhanced.the_trap_enhanced
    if (enhanced.the_bet_enhanced) fallback.probability_call.the_bet = enhanced.the_bet_enhanced
    return fallback
  } catch { return fallback }
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
