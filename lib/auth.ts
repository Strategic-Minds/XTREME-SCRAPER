/**
 * XTREME SCRAPER — Auth Engine
 * JWT magic-link authentication. No passwords. No OAuth complexity.
 */
import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'xps-dev-secret-change-in-prod')
const COOKIE_NAME = 'xps_token'
const SB_URL  = process.env.SUPABASE_URL || ''
const SB_SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export type Plan = 'anonymous' | 'free_trial' | 'starter' | 'pro' | 'elite'

export interface XPSUser {
  id: string
  email: string
  full_name?: string
  plan: Plan
  plan_status: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  trial_ends_at?: string
  searches_today: number
  searches_this_month: number
  enrichments_today: number
  last_search_date?: string
}

export interface SessionPayload {
  sub: string   // user id
  email: string
  plan: Plan
  iat: number
  exp: number
}

const sbHeaders = () => ({
  'apikey': SB_SKEY,
  'Authorization': `Bearer ${SB_SKEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
})

// Sign a JWT
export async function signToken(payload: Omit<SessionPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

// Verify a JWT
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as SessionPayload
  } catch { return null }
}

// Get user from Supabase by id
export async function getUserById(id: string): Promise<XPSUser | null> {
  if (!SB_URL || !SB_SKEY) return null
  try {
    const r = await fetch(`${SB_URL}/rest/v1/xps_users?id=eq.${id}&limit=1`, { headers: sbHeaders() })
    const rows = await r.json()
    return rows?.[0] || null
  } catch { return null }
}

// Get user from Supabase by email
export async function getUserByEmail(email: string): Promise<XPSUser | null> {
  if (!SB_URL || !SB_SKEY) return null
  try {
    const r = await fetch(`${SB_URL}/rest/v1/xps_users?email=eq.${encodeURIComponent(email)}&limit=1`, { headers: sbHeaders() })
    const rows = await r.json()
    return rows?.[0] || null
  } catch { return null }
}

// Create a new user
export async function createUser(email: string, name?: string): Promise<XPSUser | null> {
  if (!SB_URL || !SB_SKEY) return null
  try {
    const r = await fetch(`${SB_URL}/rest/v1/xps_users`, {
      method: 'POST', headers: sbHeaders(),
      body: JSON.stringify({ email, full_name: name || '', plan: 'free_trial', plan_status: 'active' })
    })
    const rows = await r.json()
    return rows?.[0] || null
  } catch { return null }
}

// Upsert user (create or return existing)
export async function upsertUser(email: string): Promise<XPSUser | null> {
  const existing = await getUserByEmail(email)
  if (existing) return existing
  return createUser(email)
}

// Create magic link token
export async function createMagicLink(email: string): Promise<string | null> {
  if (!SB_URL || !SB_SKEY) return null
  try {
    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 min
    await fetch(`${SB_URL}/rest/v1/xps_magic_links`, {
      method: 'POST', headers: sbHeaders(),
      body: JSON.stringify({ email, token, expires_at: expires })
    })
    return token
  } catch { return null }
}

// Verify magic link and return user
export async function consumeMagicLink(token: string): Promise<XPSUser | null> {
  if (!SB_URL || !SB_SKEY) return null
  try {
    const r = await fetch(`${SB_URL}/rest/v1/xps_magic_links?token=eq.${token}&used=eq.false&limit=1`, { headers: sbHeaders() })
    const rows = await r.json()
    const link = rows?.[0]
    if (!link) return null
    if (new Date(link.expires_at) < new Date()) return null
    // Mark used
    await fetch(`${SB_URL}/rest/v1/xps_magic_links?id=eq.${link.id}`, {
      method: 'PATCH', headers: sbHeaders(), body: JSON.stringify({ used: true })
    })
    return upsertUser(link.email)
  } catch { return null }
}

// Send magic link email via Resend
export async function sendMagicLinkEmail(email: string, token: string, baseUrl: string): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY || ''
  if (!resendKey) { console.warn('[auth] No RESEND_API_KEY'); return false }
  const link = `${baseUrl}/api/auth/verify?token=${token}`
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'XTREME SCRAPER <noreply@strategicmindsadvisory.com>',
        to: [email],
        subject: 'Your XTREME SCRAPER login link',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 20px">
            <h1 style="font-size:28px;font-weight:900;color:#111">XTREME SCRAPER</h1>
            <p style="color:#6B7280;font-size:14px;margin-bottom:32px">Go Beyond Google</p>
            <p style="color:#111;font-size:16px;margin-bottom:24px">Click the button below to sign in. This link expires in 15 minutes.</p>
            <a href="${link}" style="display:inline-block;background:#FFBE00;color:#111;font-weight:900;font-size:16px;padding:16px 32px;border-radius:12px;text-decoration:none">Sign In →</a>
            <p style="color:#9CA3AF;font-size:12px;margin-top:32px">If you didn't request this, ignore this email.</p>
          </div>
        `
      })
    })
    return r.ok
  } catch { return false }
}

// Increment usage counter for a user
export async function incrementUsage(userId: string, action: 'search' | 'enrich'): Promise<void> {
  if (!SB_URL || !SB_SKEY || !userId) return
  const today = new Date().toISOString().split('T')[0]
  try {
    const user = await getUserById(userId)
    if (!user) return
    const isNewDay = user.last_search_date !== today
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (action === 'search') {
      patch.searches_today    = isNewDay ? 1 : (user.searches_today + 1)
      patch.searches_this_month = user.searches_this_month + 1
      patch.last_search_date = today
    } else {
      patch.enrichments_today = isNewDay ? 1 : (user.enrichments_today + 1)
    }
    if (isNewDay) patch.searches_today = action === 'search' ? 1 : 0
    await fetch(`${SB_URL}/rest/v1/xps_users?id=eq.${userId}`, {
      method: 'PATCH', headers: sbHeaders(), body: JSON.stringify(patch)
    })
  } catch (e) { console.error('[incrementUsage]', e) }
}