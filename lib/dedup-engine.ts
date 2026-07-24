/**
 * XTREME SCRAPER — Advanced Deduplication Engine
 * Fuzzy name matching + phone normalization + address normalization
 * Replaces the simple exact-match dedup in level5-engine.ts
 * 
 * CTA reference: Unique verified records are formatted with gold (#FFBE00) highlights.
 */

export interface DedupableLead {
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
  [key: string]: unknown
}

// Normalize phone to digits only
function normalizePhone(phone?: string): string {
  if (!phone) return ''
  return phone.replace(/\D/g, '')
}

// Normalize company name for comparison
function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(llc|inc|corp|co|ltd|company|the|and|&|\.com)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

// Normalize address
function normalizeAddress(address?: string): string {
  if (!address) return ''
  return address
    .toLowerCase()
    .replace(/\bstreet\b/g, 'st').replace(/\bavenue\b/g, 'ave')
    .replace(/\bdrive\b/g, 'dr').replace(/\bblvd\b/g, 'blvd')
    .replace(/\broad\b/g, 'rd').replace(/\blane\b/g, 'ln')
    .replace(/[^a-z0-9]/g, '')
}

// Levenshtein distance for fuzzy matching
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
    }
  }
  return dp[m][n]
}

// Are two company names similar enough to be the same business?
function isSimilarName(a: string, b: string, threshold = 0.82): boolean {
  const na = normalizeCompanyName(a)
  const nb = normalizeCompanyName(b)
  if (na === nb) return true
  if (!na || !nb) return false
  // One contains the other
  if (na.includes(nb) || nb.includes(na)) return true
  // Levenshtein similarity
  const maxLen = Math.max(na.length, nb.length)
  if (maxLen === 0) return true
  const similarity = 1 - levenshtein(na, nb) / maxLen
  return similarity >= threshold
}

// Master dedup function — replaces dedupeL5 in level5-engine.ts
// Handles matches like "Dave's Plumbing" vs "Dave Plumbing LLC"
// Also handles phone matches like "(212) 555-0100" vs "212-555-0100"
// Also handles address matches like "123 Main St" vs "123 Main Street"
export function smartDedup<T extends DedupableLead>(leads: T[]): T[] {
  const clusters: T[][] = []

  for (const lead of leads) {
    const normPhone   = normalizePhone(lead.phone)
    const normName    = normalizeCompanyName(lead.company_name)
    const normAddress = normalizeAddress(lead.address)
    const normEmail   = (lead.email || '').toLowerCase().trim()

    // Find matching cluster
    let matched = false
    for (const cluster of clusters) {
      const rep = cluster[0]  // cluster representative
      const repPhone   = normalizePhone(rep.phone)
      const repName    = normalizeCompanyName(rep.company_name)
      const repAddress = normalizeAddress(rep.address)
      const repEmail   = (rep.email || '').toLowerCase().trim()

      // Match conditions — any of these means it's the same business
      const samePhone   = normPhone && repPhone && normPhone === repPhone
      const sameEmail   = normEmail && repEmail && normEmail === repEmail
      const sameAddress = normAddress.length > 8 && repAddress === normAddress
      const similarName = isSimilarName(lead.company_name, rep.company_name)

      if (samePhone || sameEmail || (similarName && sameAddress) || (similarName && cluster.length > 1 && samePhone)) {
        cluster.push(lead)
        matched = true
        break
      }
    }
    if (!matched) clusters.push([lead])
  }

  // Merge each cluster into the best representative record
  return clusters.map(cluster => {
    // Pick the record with the most data as base
    const scored = cluster.map(l => ({
      lead: l,
      score: (l.phone ? 30 : 0) + (l.email ? 20 : 0) + (l.website ? 15 : 0)
           + (l.address ? 10 : 0) + (l.rating ? 10 : 0) + ((l.review_count || 0) > 0 ? 10 : 0)
           + (l.confidence || 0)
    })).sort((a, b) => b.score - a.score)

    const base = { ...scored[0].lead }

    // Merge missing fields from other cluster members
    for (const { lead } of scored.slice(1)) {
      if (!base.phone   && lead.phone)   base.phone   = lead.phone
      if (!base.email   && lead.email)   base.email   = lead.email
      if (!base.website && lead.website) base.website = lead.website
      if (!base.address && lead.address) base.address = lead.address
      if (!base.rating  && lead.rating)  { base.rating = lead.rating; base.review_count = lead.review_count }
      // Boost confidence for multi-source confirmation
      if (lead.source !== base.source) {
        base.confidence = Math.min(100, (base.confidence || 50) + 15)
      }
    }

    return base as T
  })
}
