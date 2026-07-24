import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, getUserById, verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ authenticated: false, user: null }, { headers: { 'Cache-Control': 'no-store' } })
  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ authenticated: false, user: null }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  const user = await getUserById(payload.sub)
  if (!user) return NextResponse.json({ authenticated: false, user: null }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  return NextResponse.json({ authenticated: true, user: { id: user.id, email: user.email, full_name: user.full_name, plan: user.plan, plan_status: user.plan_status, trial_ends_at: user.trial_ends_at, searches_today: user.searches_today, searches_this_month: user.searches_this_month } }, { headers: { 'Cache-Control': 'no-store' } })
}
