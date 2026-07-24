export type SourceDecision = 'allow' | 'quarantine' | 'deny'

const POLICY: Record<string, SourceDecision> = {
  google_maps: 'allow',
  google_maps_multi: 'allow',
  google_maps_type: 'allow',
  bbb: 'allow',
  yellowpages: 'allow',
  apollo: 'allow',
  firecrawl: 'allow',
  browser_worker: 'allow',
  scrapingbee: 'allow',
  opencorporates: 'allow',
  wayback: 'allow',
  ai_intelligence: 'quarantine',
  ai_gateway: 'quarantine',
  unknown: 'quarantine',
}

export function sourceDecision(source?: string): SourceDecision {
  return POLICY[(source || 'unknown').toLowerCase()] || 'quarantine'
}

export function partitionBySourcePolicy<T extends { source?: string }>(records: T[]) {
  const allowed: T[] = []
  const quarantined: T[] = []
  const denied: T[] = []
  for (const record of records) {
    const decision = sourceDecision(record.source)
    if (decision === 'allow') allowed.push(record)
    else if (decision === 'quarantine') quarantined.push(record)
    else denied.push(record)
  }
  return { allowed, quarantined, denied }
}
