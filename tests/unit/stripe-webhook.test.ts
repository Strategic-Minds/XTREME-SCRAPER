import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifyStripeSignature } from '@/lib/stripe-webhook'

function signature(body: string, secret: string, timestamp: number) {
  const digest = createHmac('sha256', secret).update(`${timestamp}.${body}`, 'utf8').digest('hex')
  return `t=${timestamp},v1=${digest}`
}

describe('Stripe webhook signature verification', () => {
  const body = JSON.stringify({ id: 'evt_test', type: 'invoice.payment_succeeded' })
  const secret = 'whsec_test_secret_long_enough_for_validation'
  const now = 1_800_000_000

  it('accepts a valid signature inside the replay window', () => {
    expect(verifyStripeSignature(body, signature(body, secret, now - 30), secret, 300, now).valid).toBe(true)
  })

  it('rejects stale signed events', () => {
    const result = verifyStripeSignature(body, signature(body, secret, now - 301), secret, 300, now)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('timestamp')
  })

  it('rejects a mismatched signature', () => {
    const result = verifyStripeSignature(body, signature(`${body}tampered`, secret, now), secret, 300, now)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('mismatch')
  })

  it('rejects missing webhook configuration', () => {
    expect(verifyStripeSignature(body, signature(body, secret, now), '', 300, now)).toEqual({ valid: false, error: 'webhook secret missing' })
  })
})
