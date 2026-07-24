import type { NextRequest } from 'next/server'

const memory = new Map<string, { count: number; resetAt: number }>()

function clientKey(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'
}

async function upstashIncrement(key: string, windowSeconds: number): Promise<number | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL || ''
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || ''
  if (!url || !token) return null
  try {
    const response = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, String(windowSeconds), 'NX'],
      ]),
      cache: 'no-store',
      signal: AbortSignal.timeout(2500),
    })
    if (!response.ok) return null
    const data = await response.json() as Array<{ result?: number }>
    return Number(data?.[0]?.result || 0)
  } catch {
    return null
  }
}

export async function enforceRequestLimit(
  req: NextRequest,
  namespace: string,
  limit = 10,
  windowSeconds = 60,
): Promise<{ allowed: boolean; remaining: number; retryAfter: number; backend: 'upstash' | 'memory' }> {
  const identity = clientKey(req)
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000))
  const key = `xps:${namespace}:${identity}:${bucket}`
  const distributedCount = await upstashIncrement(key, windowSeconds)
  if (distributedCount !== null) {
    return {
      allowed: distributedCount <= limit,
      remaining: Math.max(0, limit - distributedCount),
      retryAfter: windowSeconds,
      backend: 'upstash',
    }
  }
  const now = Date.now()
  const current = memory.get(key)
  if (!current || now > current.resetAt) {
    memory.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
    return { allowed: true, remaining: limit - 1, retryAfter: windowSeconds, backend: 'memory' }
  }
  current.count += 1
  return {
    allowed: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
    retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    backend: 'memory',
  }
}
