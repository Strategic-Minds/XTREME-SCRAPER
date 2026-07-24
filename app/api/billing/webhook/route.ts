import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/stripe'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const SB_URL  = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SB_SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const sbH     = () => ({ 'apikey': SB_SKEY, 'Authorization': `Bearer ${SB_SKEY}`, 'Content-Type': 'application/json' })

// Map Stripe Price IDs → internal plan keys
const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.STRIPE_PRICE_STARTER || 'MISSING']: 'starter',
  [process.env.STRIPE_PRICE_PRO     || 'MISSING']: 'pro',
  [process.env.STRIPE_PRICE_ELITE   || 'MISSING']: 'elite',
}

async function patchUser(customerId: string, patch: Record<string, unknown>) {
  if (!SB_URL || !SB_SKEY) return
  await fetch(`${SB_URL}/rest/v1/xps_users?stripe_customer_id=eq.${encodeURIComponent(customerId)}`, {
    method: 'PATCH', headers: sbH(), body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() })
  })
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature') || ''
  const sec  = process.env.STRIPE_WEBHOOK_SECRET || ''

  const valid = await verifyWebhookSignature(body, sig, sec)
  if (!valid) return NextResponse.json({ error: 'Bad signature' }, { status: 400 })

  const event = JSON.parse(body) as { type: string; data: { object: Record<string, unknown> } }
  const obj   = event.data.object

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const items   = obj.items as { data: { price: { id: string } }[] }
      const priceId = items?.data?.[0]?.price?.id || ''
      const plan    = PRICE_TO_PLAN[priceId] || 'starter'
      const status  = obj.status === 'active' ? 'active' : 'past_due'
      await patchUser(obj.customer as string, { plan, plan_status: status, stripe_subscription_id: obj.id })
      break
    }
    case 'customer.subscription.deleted':
      await patchUser(obj.customer as string, { plan: 'free_trial', plan_status: 'cancelled' })
      break
    case 'invoice.payment_failed':
      await patchUser(obj.customer as string, { plan_status: 'past_due' })
      break
  }

  return NextResponse.json({ received: true })
}
