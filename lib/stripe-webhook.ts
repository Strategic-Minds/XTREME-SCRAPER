import { createHmac, timingSafeEqual } from 'node:crypto'

export type StripeVerification = { valid: boolean; timestamp?: number; error?: string }

function safeHexEqual(expected: string, supplied: string): boolean {
  if (!/^[a-f0-9]+$/i.test(expected) || !/^[a-f0-9]+$/i.test(supplied)) return false
  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(supplied, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}

export function verifyStripeSignature(
  body: string,
  signatureHeader: string,
  secret: string,
  toleranceSeconds = 300,
  nowSeconds = Math.floor(Date.now() / 1000),
): StripeVerification {
  if (!secret) return { valid: false, error: 'webhook secret missing' }
  const parts = signatureHeader.split(',').map(part => part.trim())
  const timestampText = parts.find(part => part.startsWith('t='))?.slice(2)
  const signatures = parts.filter(part => part.startsWith('v1=')).map(part => part.slice(3))
  const timestamp = Number(timestampText)
  if (!Number.isFinite(timestamp) || !signatures.length) return { valid: false, error: 'malformed signature header' }
  if (Math.abs(nowSeconds - timestamp) > toleranceSeconds) return { valid: false, timestamp, error: 'signature timestamp outside tolerance' }
  const expected = createHmac('sha256', secret).update(`${timestamp}.${body}`, 'utf8').digest('hex')
  return signatures.some(signature => safeHexEqual(expected, signature))
    ? { valid: true, timestamp }
    : { valid: false, timestamp, error: 'signature mismatch' }
}
