import { describe, expect, it } from 'vitest'
import { buildIntelligenceResult } from '@/lib/xps-intelligence'

describe('evidence-bounded opportunity score', () => {
  it('rewards available source-backed contact and reputation fields', () => {
    const sparse = buildIntelligenceResult({ company_name: 'Sparse Co', source: 'google_maps', confidence: 50 })
    const complete = buildIntelligenceResult({ company_name: 'Complete Co', source: 'google_maps', confidence: 70, phone: '555-0100', email: 'hello@example.com', website: 'https://example.com', city: 'Miami', state: 'FL', rating: 4.8, review_count: 100 })
    expect(complete.opportunity_score).toBeGreaterThan(sparse.opportunity_score)
    expect(complete.evidence.length).toBeGreaterThan(sparse.evidence.length)
  })

  it('does not invent commercial claims', () => {
    const result = buildIntelligenceResult({ company_name: 'Evidence Only', source: 'bbb', phone: '555-0199' })
    const serialized = JSON.stringify(result).toLowerCase()
    expect(serialized).not.toContain('guaranteed')
    expect(serialized).not.toContain('will buy')
    expect(serialized).not.toContain('revenue')
  })

  it('asks for more research when no direct contact exists', () => {
    const result = buildIntelligenceResult({ company_name: 'Research Co', source: 'google_maps' })
    expect(result.recommended_action.action).toBe('research')
  })
})
