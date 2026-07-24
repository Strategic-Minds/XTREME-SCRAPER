import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getUserById } from '@/lib/auth'
import { createStripeCustomer, createCheckoutSession, PLANS, type PlanKey } from '@/lib/stripe'

const SB_URL  = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SB_SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const sbH     = () => ({ 'apikey': SB_SKEY, 'Authorization': `Bearer ${SB_SKEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' })

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('xps_token')?.value
  if (!token) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ ok: false, error: 'Invalid session' }, { status: 401 })
  const user = await getUserById(payload.sub)
  if (!user) return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })

  const body = await req.json().catch(() => ({})) as { plan?: string }
  const plan  = body.plan as PlanKey
  const planConfig = PLANS[plan]
  if (!planConfig || !planConfig.stripe_price_id || planConfig.price_monthly === 0) {
    return NextResponse.json({ ok: false, error: 'Invalid plan or plan is free' }, { status: 400 })
  }

  let customerId = user.stripe_customer_id
  if (!customerId) {
    customerId = await createStripeCustomer(user.email, user.full_name)
    if (customerId) {
      await fetch(`${SB_URL}/rest/v1/xps_users?id=eq.${user.id}`, {
        method: 'PATCH', headers: sbH(), body: JSON.stringify({ stripe_customer_id: customerId })
      })
    }
  }
  if (!customerId) return NextResponse.json({ ok: false, error: 'Could not create billing account' }, { status: 500 })

  const base = req.nextUrl.origin
  const url  = await createCheckoutSession({
    customerId,
    priceId: planConfig.stripe_price_id as string,
    successUrl: `${base}/dashboard?upgraded=1&plan=${plan}`,
    cancelUrl:  `${base}/pricing`,
    userId: user.id,
  })

  if (!url) return NextResponse.json({ ok: false, error: 'Failed to create checkout session' }, { status: 500 })
  return NextResponse.json({ ok: true, url })
}
