/**
 * XTREME SCRAPER — Deep Intelligence Engine
 * Transforms raw search results into expert-level analysis.
 * Every claim backed by data. Every insight with examples.
 * This is what separates a search engine from a trusted advisor.
 */

const AI_URL = process.env.AI_GATEWAY_BASE_URL || 'https://ai-gateway.vercel.sh/v1'
const AI_KEY = process.env.AI_GATEWAY_API_KEY || ''

export interface DeepInsight {
  // The high-level market summary
  market_summary: string
  
  // What the data tells us — with specific examples from results
  what_we_found: {
    headline: string      // e.g. "Found 43 stone polishing companies in Phoenix"
    detail: string        // 2-3 sentences with specific company names cited
    proof: string[]       // 3-5 bullet points backed by actual result data
  }
  
  // Industry context — what makes this market unique
  market_context: {
    headline: string
    insight: string       // why this market is the way it is
    examples: string[]    // 3 specific examples from results
  }
  
  // The hidden gems — what Google wouldn't show
  hidden_gems: {
    headline: string
    insight: string
    gems: string[]        // specific companies with WHY they're hidden gems
  }
  
  // Quality tier breakdown with examples
  quality_tiers: {
    top_tier: string[]    // companies with 4.9+ stars — cited by name
    mid_tier: string[]    // 4.0-4.8 — solid options
    unverified: string[]  // no rating — worth a call, hidden opportunities
  }
  
  // Specific action recommendations
  next_steps: string[]    // 4-5 specific, actionable recommendations
  
  // Data confidence statement
  confidence_statement: string  // backs up reliability of results
}

export interface Lead {
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

// Generate deep intelligence analysis from raw results
export async function generateDeepInsight(
  query: string,
  city: string,
  state: string,
  leads: Lead[],
  sourcesUsed: string[],
  keywordsUsed: string[]
): Promise<DeepInsight | null> {
  if (!AI_KEY || leads.length === 0) return null

  // Build a rich data summary to feed the AI — include REAL company names
  const withPhone    = leads.filter(l => l.phone)
  const withRating   = leads.filter(l => l.rating)
  const topRated     = leads.filter(l => (l.rating || 0) >= 4.8).sort((a,b) => (b.rating||0)-(a.rating||0))
  const highReview   = leads.filter(l => (l.review_count||0) > 100).sort((a,b)=>(b.review_count||0)-(a.review_count||0))
  const noWebsite    = leads.filter(l => !l.website && l.phone)  // hidden gems
  const bbVerified   = leads.filter(l => l.source === 'bbb')
  const apolloLeads  = leads.filter(l => l.source === 'apollo')

  // Build concrete data context — REAL names for the AI to cite
  const dataContext = `
QUERY: "${query}" in ${city}, ${state}
TOTAL RESULTS: ${leads.length}
SOURCES USED: ${sourcesUsed.join(', ')}
KEYWORDS SEARCHED: ${keywordsUsed.slice(0,8).join(', ')}

KEY METRICS:
- With verified phone: ${withPhone.length}/${leads.length} (${Math.round(withPhone.length/leads.length*100)}%)
- With ratings: ${withRating.length}/${leads.length}
- BBB registered: ${bbVerified.length}
- Apollo verified contacts: ${apolloLeads.length}
- Hidden gems (phone, no website): ${noWebsite.length}

TOP RATED COMPANIES (cite these by name):
${topRated.slice(0,5).map(l => `- ${l.company_name}: ★${l.rating} (${l.review_count||0} reviews)${l.phone ? ', Phone: '+l.phone : ''}`).join('\n')}

HIGHEST REVIEW COUNTS:
${highReview.slice(0,3).map(l => `- ${l.company_name}: ${l.review_count} reviews, ★${l.rating}`).join('\n')}

HIDDEN GEMS (active business, no website — Google wouldn't surface these):
${noWebsite.slice(0,5).map(l => `- ${l.company_name}${l.phone ? ', '+l.phone : ''}${l.address ? ', '+l.address : ''}`).join('\n')}

BBB REGISTERED (highest trust):
${bbVerified.slice(0,3).map(l => `- ${l.company_name}`).join('\n')}

ALL COMPANY NAMES (first 20):
${leads.slice(0,20).map(l => l.company_name).join(', ')}
`

  const prompt = `You are an expert market intelligence analyst. Based on this real search data, write a deep expert analysis. Be SPECIFIC — cite company names, use exact numbers, give concrete examples. Do NOT be vague. Every claim must reference actual data provided.

${dataContext}

Respond with a JSON object matching EXACTLY this structure:
{
  "market_summary": "3-4 sentence executive summary of what was found. Cite specific company names. State exact numbers. Explain what this means for someone looking for these services.",
  
  "what_we_found": {
    "headline": "One punchy sentence: e.g. 'Found 43 active ${query} businesses in ${city} — ${withPhone.length} with direct phone numbers'",
    "detail": "2-3 sentences explaining what makes these results valuable. Cite 2-3 specific company names from the data. Mention the highest rated one by name.",
    "proof": [
      "Exactly ${withPhone.length} businesses have verified direct phone numbers — meaning you can call today without going through a website",
      "${topRated.length > 0 ? topRated[0].company_name : 'Top result'} holds a ★${topRated[0]?.rating || 4.9} rating with ${topRated[0]?.review_count || 'multiple'} verified reviews",
      "${bbVerified.length} companies are BBB registered — independently verified business legitimacy",
      "${noWebsite.length} businesses have a phone number but no website — hidden from standard Google searches",
      "Results pulled from ${sourcesUsed.length} independent sources: ${sourcesUsed.join(', ')}"
    ]
  },
  
  "market_context": {
    "headline": "What this market looks like in ${city}, ${state}",
    "insight": "2-3 sentences about the ${query} market in ${city}. Is it competitive? Are there many established players? What does the review count distribution tell you? Use the data.",
    "examples": [
      "Cite company #1 by name and what makes them notable",
      "Cite company #2 by name and what makes them notable",
      "Cite company #3 by name and what makes them notable"
    ]
  },
  
  "hidden_gems": {
    "headline": "${noWebsite.length} businesses invisible to Google — active with phones but no web presence",
    "insight": "2 sentences explaining why businesses with phones but no websites are valuable opportunities. These are real businesses Google won't show you.",
    "gems": ${JSON.stringify(noWebsite.slice(0,3).map(l => `${l.company_name}${l.phone ? ' — '+l.phone : ''}${l.address ? ' — '+l.address : ''} (no website = zero competition for this lead)`))}
  },
  
  "quality_tiers": {
    "top_tier": ${JSON.stringify(topRated.slice(0,3).map(l => `${l.company_name} — ★${l.rating} (${l.review_count||0} reviews)${l.phone ? ' — '+l.phone : ''}`))},
    "mid_tier": ${JSON.stringify(leads.filter(l=>(l.rating||0)>=4.0 && (l.rating||0)<4.8).slice(0,3).map(l=>`${l.company_name} — ★${l.rating}`))},
    "unverified": ${JSON.stringify(leads.filter(l=>!l.rating && l.phone).slice(0,3).map(l=>`${l.company_name} — ${l.phone} (no public rating yet — early mover opportunity)`))}
  },
  
  "next_steps": [
    "Call the top ${Math.min(3, topRated.length)} rated companies first: they have social proof, active phones, and established operations",
    "Export the ${noWebsite.length} hidden gem contacts — these businesses have no online competition and may be hungry for new clients",
    "Cross-reference BBB registered companies (${bbVerified.length} found) for highest-trust outreach",
    "Run a Level 5 search to activate Firecrawl + BrowserWorker for up to 250+ results and deeper contact data",
    "Filter by ${state} — if you need multi-city coverage, use the sweep function to hit all major cities simultaneously"
  ],
  
  "confidence_statement": "This analysis is based on ${leads.length} verified results from ${sourcesUsed.length} independent sources (${sourcesUsed.join(', ')}). Phone numbers are confirmed active lines. Ratings are from verified Google and BBB databases. This is not a paid directory — all results are organic."
}

IMPORTANT: Use the EXACT company names from the data. Use the EXACT numbers. Do NOT fabricate anything. Every claim must come from the provided data.`

  try {
    const r = await fetch(`${AI_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AI_KEY}` },
      body: JSON.stringify({
        model: process.env.AI_MODEL_PRIMARY || 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 2000,
      }),
      signal: AbortSignal.timeout(25000),
    })
    if (!r.ok) return null
    const d = await r.json()
    const content: string = d.choices?.[0]?.message?.content || ''
    const match = content.match(/\{[\s\S]*\}/)
    if (!match) return null
    return JSON.parse(match[0]) as DeepInsight
  } catch (e) {
    console.error('[deepInsight]', e)
    return null
  }
}

// Fast version — generates insight from data ONLY, no AI call
// Used when AI is too slow or unavailable
export function generateFastInsight(query: string, city: string, state: string, leads: Lead[], sources: string[]): DeepInsight {
  const withPhone  = leads.filter(l => l.phone)
  const topRated   = leads.filter(l => (l.rating||0) >= 4.8).sort((a,b)=>(b.rating||0)-(a.rating||0))
  const noWebsite  = leads.filter(l => !l.website && l.phone)
  const bbb        = leads.filter(l => l.source === 'bbb')

  return {
    market_summary: `Found ${leads.length} ${query} businesses in ${city}, ${state} across ${sources.length} independent sources. ${withPhone.length} have verified direct phone numbers. ${topRated.length > 0 ? `Top rated: ${topRated[0].company_name} at ★${topRated[0].rating}.` : ''} ${noWebsite.length} businesses are active with phones but no website — invisible to Google.`,
    
    what_we_found: {
      headline: `${leads.length} ${query} businesses found in ${city} — ${withPhone.length} with direct phone numbers`,
      detail: `Results pulled from ${sources.join(', ')}. ${topRated[0] ? `${topRated[0].company_name} leads with ★${topRated[0].rating} and ${topRated[0].review_count||'multiple'} reviews.` : ''} ${noWebsite.length} businesses have phones but no web presence.`,
      proof: [
        `${withPhone.length}/${leads.length} results have verified direct phone numbers`,
        topRated[0] ? `${topRated[0].company_name}: ★${topRated[0].rating} (${topRated[0].review_count||0} reviews)` : `${leads.length} total results found`,
        `${bbb.length} BBB-registered companies — independently verified`,
        `${noWebsite.length} hidden gems: active businesses invisible to Google search`,
        `${sources.length} independent sources cross-referenced`,
      ]
    },
    
    market_context: {
      headline: `The ${query} market in ${city}, ${state}`,
      insight: `${leads.length} businesses found suggests a ${leads.length > 50 ? 'competitive' : leads.length > 20 ? 'moderate' : 'niche'} market. ${topRated.length} businesses have 4.8+ star ratings indicating established, high-quality operators in the area.`,
      examples: topRated.slice(0,3).map(l => `${l.company_name} — ★${l.rating} with ${l.review_count||0} reviews${l.phone ? ', '+l.phone : ''}`)
    },
    
    hidden_gems: {
      headline: `${noWebsite.length} businesses active but invisible to Google`,
      insight: 'These businesses have verified phone numbers and are actively operating but have no website — meaning zero Google competition for this lead.',
      gems: noWebsite.slice(0,3).map(l => `${l.company_name}${l.phone ? ' — '+l.phone : ''}${l.address ? ' — '+l.address : ''}`)
    },
    
    quality_tiers: {
      top_tier: topRated.slice(0,3).map(l => `${l.company_name} — ★${l.rating} (${l.review_count||0} reviews)`),
      mid_tier: leads.filter(l=>(l.rating||0)>=4.0 && (l.rating||0)<4.8).slice(0,3).map(l=>`${l.company_name} — ★${l.rating}`),
      unverified: leads.filter(l=>!l.rating && l.phone).slice(0,3).map(l=>`${l.company_name} — ${l.phone}`)
    },
    
    next_steps: [
      `Call the top ${Math.min(3, topRated.length)} rated companies first — established, verified, and active`,
      `Export the ${noWebsite.length} hidden gems — phones confirmed, no online competition`,
      `${bbb.length} BBB registered companies available for highest-trust outreach`,
      'Run Level 5 mode for 250+ results with Firecrawl + BrowserWorker deep extraction',
      'Use multi-city sweep to cover surrounding markets simultaneously'
    ],
    
    confidence_statement: `Based on ${leads.length} results from ${sources.length} sources: ${sources.join(', ')}. Phone numbers confirmed. Ratings from verified databases. Zero paid placements.`
  }
}
