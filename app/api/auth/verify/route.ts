import { NextRequest, NextResponse } from 'next/server'
import { consumeMagicLink, signToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || ''
  if (!token) return NextResponse.redirect(new URL('/login?error=missing_token', req.nextUrl.origin))
  const user = await consumeMagicLink(token)
  if (!user) return NextResponse.redirect(new URL('/login?error=invalid_or_expired', req.nextUrl.origin))
  const jwt = await signToken({ sub: user.id, email: user.email, plan: user.plan as any })
  const res = NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin))
  res.cookies.set('xps_token', jwt, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' })
  return res
}