import { NextRequest, NextResponse } from 'next/server'
import { verifyStripeSignature } from '@/lib/stripe-webhook'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const SB_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SB_SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function sbHeaders(prefer = 'return=representation') {
  return { apikey: SB_SKEY, Authorization: `Bearer ${SB_SKEY}`, 'Content-Type': 'application/json', Prefer: prefer }
}

function priceToPlan(): Record<string, 'starter'|'pro'|'elite'> {
  return Object.fromEntries([
    [process.env.STRIPE_PRICE_STARTER, 'starter'],
    [process.env.STRIPE_PRICE_PRO, 'pro'],
    [process.env.STRIPE_PRICE_ELITE, 'elite'],
  ].filter((entry): entry is [string,'starter'|'pro'|'elite'] => Boolean(entry[0])))
}

async function getEvent(eventId: string) {
  const response = await fetch(`${SB_URL}/rest/v1/xps_billing_events?event_id=eq.${encodeURIComponent(eventId)}&select=event_id,status&limit=1`, { headers: sbHeaders(), cache: 'no-store' })
  if (!response.ok) throw new Error(`billing event lookup failed (${response.status})`)
  const rows = await response.json() as Array<{event_id:string;status:string}>
  return rows[0] || null
}

async function claimEvent(event: { id:string; type:string; created?:number; livemode?:boolean }) {
  const existing = await getEvent(event.id)
  if (existing?.status === 'processed') return 'duplicate' as const
  const response = await fetch(`${SB_URL}/rest/v1/xps_billing_events?on_conflict=event_id`, {
    method: 'POST',
    headers: sbHeaders('resolution=ignore-duplicates,return=representation'),
    body: JSON.stringify({ event_id:event.id, event_type:event.type, status:'processing', stripe_created_at:event.created ? new Date(event.created*1000).toISOString() : null, livemode:Boolean(event.livemode), received_at:new Date().toISOString() }),
  })
  if (!response.ok) throw new Error(`billing event claim failed (${response.status})`)
  const rows = await response.json() as unknown[]
  if (!rows.length) return 'duplicate' as const
  return 'claimed' as const
}

async function finishEvent(eventId:string,status:'processed'|'failed',error?:string) {
  await fetch(`${SB_URL}/rest/v1/xps_billing_events?event_id=eq.${encodeURIComponent(eventId)}`, {
    method:'PATCH', headers:sbHeaders('return=minimal'), body:JSON.stringify({status,processed_at:new Date().toISOString(),error_message:error?.slice(0,500)||null}),
  })
}

async function patchUser(customerId:string,patch:Record<string,unknown>) {
  if (!customerId) throw new Error('Stripe customer id missing')
  const response = await fetch(`${SB_URL}/rest/v1/xps_users?stripe_customer_id=eq.${encodeURIComponent(customerId)}`, {
    method:'PATCH', headers:sbHeaders('return=representation'), body:JSON.stringify({...patch,updated_at:new Date().toISOString()}),
  })
  if (!response.ok) throw new Error(`user billing update failed (${response.status})`)
  const rows = await response.json() as unknown[]
  if (!rows.length) throw new Error('No user matched the Stripe customer id')
}

export async function POST(req:NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature') || ''
  const secret = process.env.STRIPE_WEBHOOK_SECRET || ''
  const verification = verifyStripeSignature(body, signature, secret)
  if (!verification.valid) return NextResponse.json({ok:false,error:'Invalid webhook signature',reason:verification.error},{status:400})
  if (!SB_URL || !SB_SKEY) return NextResponse.json({ok:false,error:'Billing persistence is not configured'},{status:503})

  let event:any
  try { event = JSON.parse(body) } catch { return NextResponse.json({ok:false,error:'Invalid event JSON'},{status:400}) }
  if (!event?.id || !event?.type || !event?.data?.object) return NextResponse.json({ok:false,error:'Malformed Stripe event'},{status:400})

  try {
    const claim = await claimEvent(event)
    if (claim === 'duplicate') return NextResponse.json({ok:true,received:true,duplicate:true})
    const object = event.data.object as Record<string,any>
    switch(event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const priceId = object.items?.data?.[0]?.price?.id || ''
        const plan = priceToPlan()[priceId]
        if (!plan) throw new Error(`Unrecognized Stripe price id: ${priceId || 'missing'}`)
        await patchUser(String(object.customer || ''), { plan, plan_status:String(object.status || 'unknown'), stripe_subscription_id:String(object.id || '') })
        break
      }
      case 'customer.subscription.deleted':
        await patchUser(String(object.customer || ''), { plan:'free_trial', plan_status:'cancelled', stripe_subscription_id:null })
        break
      case 'invoice.payment_failed':
        await patchUser(String(object.customer || ''), { plan_status:'past_due' })
        break
      case 'invoice.payment_succeeded':
        await patchUser(String(object.customer || ''), { plan_status:'active' })
        break
      default:
        break
    }
    await finishEvent(event.id,'processed')
    return NextResponse.json({ok:true,received:true,duplicate:false})
  } catch(error) {
    const message = error instanceof Error ? error.message : 'billing webhook failed'
    await finishEvent(event.id,'failed',message).catch(()=>{})
    console.error('[billing-webhook]',message)
    return NextResponse.json({ok:false,error:'Billing event processing failed safely.'},{status:500})
  }
}
