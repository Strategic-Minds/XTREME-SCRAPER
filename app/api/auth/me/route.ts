import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getUserById } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('xps_token')?.value
  if (!token) return NextResponse.json({ authenticated: false, user: null })
  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ authenticated: false, user: null })
  const user = await getUserById(payload.sub)
  if (!user) return NextResponse.json({ authenticated: false, user: null })
  return NextResponse.json({ authenticated: true, user: { id: user.id, email: user.email, plan: user.plan, plan_status: user.plan_status, trial_ends_at: user.trial_ends_at, searches_today: user.searches_today, searches_this_month: user.searches_this_month } })
}