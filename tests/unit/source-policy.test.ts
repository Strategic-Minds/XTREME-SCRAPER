import { describe, expect, it } from 'vitest'
import { partitionBySourcePolicy, sourceDecision } from '@/lib/source-policy'

describe('source policy', () => {
  it('allows approved provider records', () => {
    expect(sourceDecision('google_maps')).toBe('allow')
    expect(sourceDecision('bbb')).toBe('allow')
  })

  it('quarantines AI-only and unknown records', () => {
    expect(sourceDecision('ai_intelligence')).toBe('quarantine')
    expect(sourceDecision('made_up_provider')).toBe('quarantine')
  })

  it('separates export-eligible and quarantined records', () => {
    const result = partitionBySourcePolicy([
      { company_name: 'A', source: 'google_maps' },
      { company_name: 'B', source: 'ai_intelligence' },
      { company_name: 'C' },
    ])
    expect(result.allowed.map(item => item.company_name)).toEqual(['A'])
    expect(result.quarantined).toHaveLength(2)
    expect(result.denied).toHaveLength(0)
  })
})
