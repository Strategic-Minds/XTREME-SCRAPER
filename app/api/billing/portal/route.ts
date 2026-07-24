import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getUserById } from '@/lib/auth'
import { createPortalSession } from '@/lib/stripe'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  const token = req.cookies.get('xps_token')?.value
  if (!token) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ ok: false, error: 'Invalid session' }, { status: 401 })
  const user = await getUserById(payload.sub)
  if (!user?.stripe_customer_id) return NextResponse.json({ ok: false, error: 'No billing account' }, { status: 404 })
  const url = await createPortalSession(user.stripe_customer_id, `${req.nextUrl.origin}/dashboard`)
  if (!url) return NextResponse.json({ ok: false, error: 'Portal unavailable' }, { status: 500 })
  return NextResponse.json({ ok: true, url })
}
