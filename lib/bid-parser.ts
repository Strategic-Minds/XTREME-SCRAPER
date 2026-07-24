/**
 * XTREME SCRAPER — AI Bid Email Parser
 * Parses raw email text into structured job data using GPT-4o
 * Returns a typed BidJob object ready for takeoff engine
 */

const AI_KEY = process.env.AI_GATEWAY_API_KEY || ''
const AI_URL = 'https://ai-gateway.vercel.sh/v1/chat/completions'

export interface ParsedBidJob {
  client_name: string
  client_email: string
  client_phone: string
  client_company: string
  job_address: string
  job_city: string
  job_state: string
  job_zip: string
  job_type: 'epoxy' | 'polished_concrete' | 'painting' | 'hvac' | 'roofing' | 'flooring' | 'general_contractor' | 'other'
  job_description: string
  sqft_mentioned: number | null
  timeline_mentioned: string
  budget_mentioned: string
  materials_mentioned: string[]
  urgency_level: 'low' | 'medium' | 'high' | 'emergency'
  ai_confidence: number
  raw_notes: string
}

const SYSTEM_PROMPT = `You are a forensic bid analyst AI for a construction bidding platform.
Your job is to extract structured job data from a contractor bid request email.

Extract EVERY piece of information present. If something is not mentioned, use null or empty string.
Never hallucinate square footage — only extract what is EXPLICITLY stated.
For job_type, infer from context: epoxy/concrete/garage coatings = 'epoxy', painting = 'painting', HVAC = 'hvac', etc.
For urgency_level: emergency keywords = 'emergency', ASAP/this week = 'high', next month = 'medium', flexible = 'low'
For ai_confidence: 0-100 how confident you are in the extracted data overall.

Respond ONLY with valid JSON matching this exact schema:
{
  "client_name": string,
  "client_email": string,
  "client_phone": string,
  "client_company": string,
  "job_address": string,
  "job_city": string,
  "job_state": string,
  "job_zip": string,
  "job_type": "epoxy"|"polished_concrete"|"painting"|"hvac"|"roofing"|"flooring"|"general_contractor"|"other",
  "job_description": string,
  "sqft_mentioned": number|null,
  "timeline_mentioned": string,
  "budget_mentioned": string,
  "materials_mentioned": string[],
  "urgency_level": "low"|"medium"|"high"|"emergency",
  "ai_confidence": number,
  "raw_notes": string
}`

export async function parseEmailToBid(emailText: string): Promise<ParsedBidJob> {
  const res = await fetch(AI_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${AI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      temperature: 0.1,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Parse this bid request email:\n\n${emailText.slice(0, 6000)}` }
      ]
    })
  })

  if (!res.ok) throw new Error(`AI parse failed: ${res.status}`)
  const data = await res.json() as { choices: { message: { content: string } }[] }
  const content = data.choices[0].message.content.trim()

  // Strip markdown code fences if present
  const clean = content.replace(/^```json\n?|```$/g, '').trim()
  return JSON.parse(clean) as ParsedBidJob
}

// Enrich address with Google Maps geocoding for property context
export async function enrichAddress(address: string, city: string, state: string): Promise<{
  lat: number; lng: number; property_type: string; formatted_address: string
} | null> {
  const GM_KEY = process.env.GOOGLE_MAPS_API_KEY || ''
  if (!GM_KEY || GM_KEY.startsWith('eyJ')) return null
  try {
    const q = encodeURIComponent(`${address} ${city} ${state}`)
    const r = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${q}&key=${GM_KEY}`)
    const d = await r.json() as { status: string; results: { geometry: { location: { lat: number; lng: number } }; types: string[]; formatted_address: string }[] }
    if (d.status !== 'OK' || !d.results[0]) return null
    const result = d.results[0]
    const types = result.types || []
    const property_type =
      types.includes('establishment') ? 'commercial' :
      types.includes('premise') ? 'residential' :
      types.includes('subpremise') ? 'unit' : 'unknown'
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      property_type,
      formatted_address: result.formatted_address
    }
  } catch { return null }
}
