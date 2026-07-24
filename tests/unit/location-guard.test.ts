import { describe, expect, it } from 'vitest'
import { protectLocationMode } from '@/lib/location-guard'

describe('location guard', () => {
  it('keeps verified-coordinate cities in deep mode', () => {
    expect(protectLocationMode('Miami', 'deep')).toEqual({ mode: 'deep', locationStrategy: 'text-and-nearby' })
  })

  it('never substitutes another city for an unknown location', () => {
    const result = protectLocationMode('Asheville', 'level5')
    expect(result.mode).toBe('quick')
    expect(result.locationStrategy).toBe('text-search')
    expect(result.warning).toContain('Asheville')
    expect(result.warning).not.toContain('Phoenix')
  })

  it('allows quick text search for unknown cities without a warning', () => {
    expect(protectLocationMode('Asheville', 'quick')).toEqual({ mode: 'quick', locationStrategy: 'text-search' })
  })
})
