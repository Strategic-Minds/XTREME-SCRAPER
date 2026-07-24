export type LeadRecord = {
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
  source_url?: string
  confidence?: number
  owner_name?: string
  signals?: Array<{ type?: string; label?: string; evidence?: string }>
}

export type EvidenceItem = {
  type: 'source' | 'contact' | 'location' | 'reputation' | 'signal'
  label: string
  value: string
  source?: string
  source_url?: string
}

export type IntelligenceResult = {
  company_name: string
  verification_status: 'source-backed' | 'limited-evidence'
  opportunity_score: number
  score_confidence: 'low' | 'medium' | 'high'
  score_explanation: string[]
  evidence: EvidenceItem[]
  recommended_action: {
    action: 'call' | 'email' | 'visit_website' | 'research'
    label: string
    reason: string
  }
  lead: LeadRecord
}

function clamp(value: number) { return Math.max(0, Math.min(100, Math.round(value))) }

export function buildIntelligenceResult(lead: LeadRecord): IntelligenceResult {
  const evidence: EvidenceItem[] = []
  const explanation: string[] = []
  let score = Math.max(0, Math.min(35, (lead.confidence || 45) * .35))

  if (lead.source) {
    evidence.push({ type: 'source', label: 'Discovery source', value: lead.source, source: lead.source, source_url: lead.source_url })
    explanation.push(`Discovered through ${lead.source.replaceAll('_', ' ')}`)
  }
  if (lead.phone) {
    score += 18
    evidence.push({ type: 'contact', label: 'Phone available', value: lead.phone, source: lead.source })
    explanation.push('Direct phone contact is available')
  }
  if (lead.email) {
    score += 16
    evidence.push({ type: 'contact', label: 'Email available', value: lead.email, source: lead.source })
    explanation.push('Email contact is available')
  }
  if (lead.website) {
    score += 9
    evidence.push({ type: 'contact', label: 'Website', value: lead.website, source: lead.source })
  }
  if (lead.address || lead.city || lead.state) {
    score += 8
    evidence.push({ type: 'location', label: 'Location', value: lead.address || [lead.city, lead.state].filter(Boolean).join(', '), source: lead.source })
  }
  if (typeof lead.rating === 'number') {
    const reviewWeight = Math.min(8, Math.log10((lead.review_count || 0) + 1) * 4)
    score += Math.max(0, (lead.rating - 3) * 5) + reviewWeight
    evidence.push({ type: 'reputation', label: 'Public rating', value: `${lead.rating.toFixed(1)}${lead.review_count ? ` from ${lead.review_count} reviews` : ''}`, source: lead.source })
    explanation.push('Public reputation data is available')
  }
  if (lead.signals?.length) {
    score += Math.min(15, lead.signals.length * 5)
    for (const signal of lead.signals.slice(0, 3)) {
      evidence.push({ type: 'signal', label: signal.label || signal.type || 'Business signal', value: signal.evidence || 'Signal attached to record', source: lead.source })
    }
    explanation.push(`${lead.signals.length} business signal${lead.signals.length === 1 ? '' : 's'} attached`)
  }

  const opportunityScore = clamp(score)
  const scoreConfidence = evidence.length >= 5 ? 'high' : evidence.length >= 3 ? 'medium' : 'low'

  let recommendedAction: IntelligenceResult['recommended_action']
  if (lead.phone) {
    recommendedAction = { action: 'call', label: `Call ${lead.company_name}`, reason: 'A direct phone number is available. Verify fit and need before making any commercial claim.' }
  } else if (lead.email) {
    recommendedAction = { action: 'email', label: `Email ${lead.company_name}`, reason: 'An email address is available. Use a concise, evidence-based introduction.' }
  } else if (lead.website) {
    recommendedAction = { action: 'visit_website', label: 'Review website', reason: 'Review the company website to identify a relevant decision-maker and confirm current information.' }
  } else {
    recommendedAction = { action: 'research', label: 'Gather more evidence', reason: 'The record lacks a direct contact method. Enrich it before outreach.' }
  }

  return {
    company_name: lead.company_name,
    verification_status: evidence.length >= 2 ? 'source-backed' : 'limited-evidence',
    opportunity_score: opportunityScore,
    score_confidence: scoreConfidence,
    score_explanation: explanation,
    evidence,
    recommended_action: recommendedAction,
    lead,
  }
}

export function buildIntelligenceResults(leads: LeadRecord[]): IntelligenceResult[] {
  return leads.map(buildIntelligenceResult).sort((a, b) => b.opportunity_score - a.opportunity_score)
}
