/**
 * XTREME SCRAPER — Stripe Billing Engine
 * No stripe npm package. Raw fetch only.
 * 4 plans: Free Trial → Starter → Pro → Elite
 */

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || ''
const STRIPE_API    = 'https://api.stripe.com/v1'

function stripeHeaders() {
  return { 'Authorization': `Bearer ${STRIPE_SECRET}`, 'Content-Type': 'application/x-www-form-urlencoded' }
}
function toForm(obj: Record<string, string>): string {
  return Object.entries(obj).map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
}

// ─── PLAN DEFINITIONS ───────────────────────────────────────────
// Exact plan keys used everywhere: free_trial | starter | pro | elite
export const PLANS = {
  free_trial: {
    name: 'Free Trial',
    tagline: '7 days free — no card required',
    price_monthly: 0,
    price_annual: 0,
    searches_per_day: 5,
    results_per_search: 20,
    enrichments_per_day: 0,
    person_searches_per_day: 0,
    intelligence_modes: ['flash'] as string[],
    csv_export: false,
    crm_export: false,
    api_access: false,
    trial_days: 7,
    stripe_price_id: null as string | null,
    highlight: false,
    cta: 'Start Free Trial',
  },
  starter: {
    name: 'Starter',
    tagline: 'For solo prospectors',
    price_monthly: 19,
    price_annual: 15,   // $15/mo billed annually = $180/yr
    searches_per_day: 25,
    results_per_search: 100,
    enrichments_per_day: 10,
    person_searches_per_day: 0,
    intelligence_modes: ['flash', 'deep'] as string[],
    csv_export: true,
    crm_export: false,
    api_access: false,
    trial_days: 0,
    stripe_price_id: process.env.STRIPE_PRICE_STARTER as string | null ?? null,
    highlight: false,
    cta: 'Get Starter',
  },
  pro: {
    name: 'Pro',
    tagline: 'For serious closers',
    price_monthly: 49,
    price_annual: 39,   // $39/mo billed annually = $468/yr
    searches_per_day: 100,
    results_per_search: 250,
    enrichments_per_day: 50,
    person_searches_per_day: 20,
    intelligence_modes: ['flash', 'deep', 'counter_intel'] as string[],
    csv_export: true,
    crm_export: false,
    api_access: false,
    trial_days: 0,
    stripe_price_id: process.env.STRIPE_PRICE_PRO as string | null ?? null,
    highlight: true,   // MOST POPULAR badge
    cta: 'Get Pro',
  },
  elite: {
    name: 'Elite',
    tagline: 'For teams & agencies',
    price_monthly: 99,
    price_annual: 79,   // $79/mo billed annually = $948/yr
    searches_per_day: -1,           // unlimited
    results_per_search: 500,
    enrichments_per_day: -1,        // unlimited
    person_searches_per_day: -1,    // unlimited
    intelligence_modes: ['flash', 'deep', 'counter_intel'] as string[],
    csv_export: true,
    crm_export: true,
    api_access: true,
    trial_days: 0,
    stripe_price_id: process.env.STRIPE_PRICE_ELITE as string | null ?? null,
    highlight: false,
    cta: 'Get Elite',
  },
} as const

export type PlanKey = keyof typeof PLANS

// ─── PLAN ENFORCEMENT ───────────────────────────────────────────
export function checkLimit(plan: PlanKey, action: 'search' | 'enrich' | 'person', usedToday: number): {
  allowed: boolean; limit: number; reason?: string; upgrade_to?: PlanKey
} {
  const p = PLANS[plan]
  const limit =
    action === 'search' ? p.searches_per_day :
    action === 'enrich' ? p.enrichments_per_day :
    p.person_searches_per_day

  if (limit === -1) return { allowed: true, limit: -1 }

  if (action === 'person' && limit === 0) {
    return { allowed: false, limit: 0,
      reason: 'Person search requires Pro plan or higher',
      upgrade_to: 'pro' }
  }

  if (usedToday >= limit) {
    const next: PlanKey = plan === 'free_trial' ? 'starter' : plan === 'starter' ? 'pro' : 'elite'
    return { allowed: false, limit,
      reason: `Daily limit reached (${limit}/${action}s on ${PLANS[plan].name})`,
      upgrade_to: next }
  }

  return { allowed: true, limit }
}

export function isTrialExpired(trialEndsAt?: string): boolean {
  if (!trialEndsAt) return false
  return new Date(trialEndsAt) < new Date()
}

export function upgradeMessage(from: PlanKey): string {
  const next = from === 'free_trial' ? 'starter' : from === 'starter' ? 'pro' : 'elite'
  const p    = PLANS[next]
  return `Upgrade to ${p.name} ($${p.price_monthly}/mo) to continue.`
}

// ─── STRIPE API CALLS ───────────────────────────────────────────
export async function createStripeCustomer(email: string, name?: string): Promise<string | null> {
  if (!STRIPE_SECRET) return null
  try {
    const body: Record<string, string> = { email }
    if (name) body.name = name
    const r = await fetch(`${STRIPE_API}/customers`, { method: 'POST', headers: stripeHeaders(), body: toForm(body) })
    const d = await r.json() as { id?: string }
    return d.id || null
  } catch { return null }
}

export async function createCheckoutSession(params: {
  customerId: string; priceId: string; successUrl: string; cancelUrl: string; userId: string
}): Promise<string | null> {
  if (!STRIPE_SECRET) return null
  try {
    const r = await fetch(`${STRIPE_API}/checkout/sessions`, {
      method: 'POST', headers: stripeHeaders(),
      body: toForm({
        mode: 'subscription',
        customer: params.customerId,
        'line_items[0][price]': params.priceId,
        'line_items[0][quantity]': '1',
        success_url: params.successUrl,
        cancel_url:  params.cancelUrl,
        'metadata[user_id]': params.userId,
        allow_promotion_codes: 'true',
      })
    })
    const d = await r.json() as { url?: string }
    return d.url || null
  } catch { return null }
}

export async function createPortalSession(customerId: string, returnUrl: string): Promise<string | null> {
  if (!STRIPE_SECRET) return null
  try {
    const r = await fetch(`${STRIPE_API}/billing_portal/sessions`, {
      method: 'POST', headers: stripeHeaders(),
      body: toForm({ customer: customerId, return_url: returnUrl })
    })
    const d = await r.json() as { url?: string }
    return d.url || null
  } catch { return null }
}

export async function verifyWebhookSignature(body: string, sig: string, secret: string): Promise<boolean> {
  try {
    const t   = sig.split(',').find(p => p.startsWith('t='))?.slice(2)
    const v1  = sig.split(',').find(p => p.startsWith('v1='))?.slice(3)
    if (!t || !v1) return false
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const raw = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${body}`))
    const hex = Array.from(new Uint8Array(raw)).map(b => b.toString(16).padStart(2,'0')).join('')
    return hex === v1
  } catch { return false }
}
