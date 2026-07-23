import { NextRequest, NextResponse } from 'next/server'

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function getIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

export function middleware(req: NextRequest) {
  const res = NextResponse.next()
  // Security headers
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // Rate limit /api/scrape only
  if (req.nextUrl.pathname === '/api/scrape' && req.method === 'POST') {
    const ip  = getIP(req)
    const now = Date.now()
    const key = `rl:${ip}`
    const entry = rateLimitMap.get(key)
    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + 60000 })
    } else if (entry.count >= 10) {
      return NextResponse.json({ ok: false, error: 'Rate limit exceeded. Max 10 requests/minute.' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)) }
      })
    } else {
      entry.count++
    }
  }
  return res
}

export const config = { matcher: ['/api/:path*'] }
