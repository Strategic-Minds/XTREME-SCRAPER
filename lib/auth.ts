/**
 * XPS Intelligence authentication engine.
 * Magic-link authentication with fail-closed JWT configuration.
 */
import { SignJWT, jwtVerify } from 'jose'

const SB_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SB_SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
export const COOKIE_NAME = 'xps_token'

export type Plan = 'anonymous' | 'free_trial' | 'starter' | 'pro' | 'elite'
export type UsageAction = 'search' | 'enrich' | 'person'

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
  sub: string
  email: string
  plan: Plan
  session_version?: number
  iat: number
  exp: number
}

function jwtSecret(): Uint8Array {
  const value = process.env.JWT_SECRET || ''
  if (value.length < 32) throw new Error('JWT_SECRET must be configured with at least 32 characters')
  return new TextEncoder().encode(value)
}

function sbHeaders(prefer = 'return=representation') {
  if (!SB_URL || !SB_SKEY) throw new Error('Supabase server configuration is incomplete')
  return {
    apikey: SB_SKEY,
    Authorization: `Bearer ${SB_SKEY}`,
    'Content-Type': 'application/json',
    Prefer: prefer,
  }
}

async function readRows<T>(path: string): Promise<T[]> {
  if (!SB_URL || !SB_SKEY) return []
  const response = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: sbHeaders(), cache: 'no-store' })
  if (!response.ok) return []
  return await response.json() as T[]
}

export async function signToken(payload: Omit<SessionPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(jwtSecret())
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret(), { algorithms: ['HS256'] })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function getUserById(id: string): Promise<XPSUser | null> {
  const rows = await readRows<XPSUser>(`xps_users?id=eq.${encodeURIComponent(id)}&limit=1`)
  return rows[0] || null
}

export async function getUserByEmail(email: string): Promise<XPSUser | null> {
  const rows = await readRows<XPSUser>(`xps_users?email=eq.${encodeURIComponent(email)}&limit=1`)
  return rows[0] || null
}

export async function createUser(email: string, name?: string): Promise<XPSUser | null> {
  if (!SB_URL || !SB_SKEY) return null
  const response = await fetch(`${SB_URL}/rest/v1/xps_users`, {
    method: 'POST',
    headers: sbHeaders(),
    body: JSON.stringify({ email, full_name: name || '', plan: 'free_trial', plan_status: 'active' }),
  })
  if (!response.ok) return null
  const rows = await response.json() as XPSUser[]
  return rows[0] || null
}

export async function upsertUser(email: string): Promise<XPSUser | null> {
  return await getUserByEmail(email) || await createUser(email)
}

export async function createMagicLink(email: string): Promise<string | null> {
  if (!SB_URL || !SB_SKEY) return null
  const token = `${crypto.randomUUID().replaceAll('-', '')}${crypto.randomUUID().replaceAll('-', '')}`
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
  const response = await fetch(`${SB_URL}/rest/v1/xps_magic_links`, {
    method: 'POST',
    headers: sbHeaders('return=minimal'),
    body: JSON.stringify({ email, token, expires_at: expiresAt, used: false }),
  })
  return response.ok ? token : null
}

export async function consumeMagicLink(token: string): Promise<XPSUser | null> {
  if (!SB_URL || !SB_SKEY || token.length < 40) return null
  const rows = await readRows<{ id: string; email: string; expires_at: string }>(
    `xps_magic_links?token=eq.${encodeURIComponent(token)}&used=eq.false&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&limit=1`,
  )
  const link = rows[0]
  if (!link) return null

  const response = await fetch(`${SB_URL}/rest/v1/xps_magic_links?id=eq.${encodeURIComponent(link.id)}&used=eq.false`, {
    method: 'PATCH',
    headers: sbHeaders('return=representation'),
    body: JSON.stringify({ used: true, used_at: new Date().toISOString() }),
  })
  if (!response.ok) return null
  const updated = await response.json() as unknown[]
  if (!updated.length) return null
  return await upsertUser(link.email)
}

export async function sendMagicLinkEmail(email: string, token: string, baseUrl: string): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY || ''
  if (!resendKey) return false
  const link = `${baseUrl}/api/auth/verify?token=${encodeURIComponent(token)}`
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.AUTH_FROM_EMAIL || 'XPS Intelligence <noreply@strategicmindsadvisory.com>',
      to: [email],
      subject: 'Your XPS Intelligence sign-in link',
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:40px"><h1>XPS Intelligence</h1><p>Go Beyond Google. Find What Others Can't.</p><p>This secure sign-in link expires in 15 minutes.</p><a href="${link}" style="display:inline-block;background:#c9a44f;color:#111;padding:14px 24px;border-radius:999px;font-weight:700;text-decoration:none">Sign in securely</a></div>`,
    }),
  })
  return response.ok
}

export async function getUsageToday(userId: string, action: UsageAction): Promise<number> {
  const user = await getUserById(userId)
  if (!user || !SB_URL || !SB_SKEY) return 0
  const today = new Date().toISOString().slice(0, 10)
  if (action === 'search') return user.last_search_date === today ? user.searches_today || 0 : 0
  if (action === 'enrich') return user.last_search_date === today ? user.enrichments_today || 0 : 0

  try {
    const start = `${today}T00:00:00.000Z`
    const response = await fetch(`${SB_URL}/rest/v1/xps_usage_log?user_id=eq.${encodeURIComponent(userId)}&action=eq.person&created_at=gte.${encodeURIComponent(start)}&select=id`, {
      headers: { ...sbHeaders('count=exact'), Range: '0-0' },
      cache: 'no-store',
    })
    if (!response.ok) return 0
    return Number.parseInt(response.headers.get('Content-Range')?.split('/')[1] || '0', 10) || 0
  } catch {
    return 0
  }
}

export async function incrementUsage(userId: string, action: UsageAction): Promise<void> {
  const user = await getUserById(userId)
  if (!user || !SB_URL || !SB_SKEY) return
  const today = new Date().toISOString().slice(0, 10)

  if (action === 'person') {
    await fetch(`${SB_URL}/rest/v1/xps_usage_log`, {
      method: 'POST',
      headers: sbHeaders('return=minimal'),
      body: JSON.stringify({ user_id: userId, action: 'person', plan: user.plan, created_at: new Date().toISOString() }),
    }).catch(() => undefined)
    return
  }

  const newDay = user.last_search_date !== today
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (action === 'search') {
    patch.searches_today = newDay ? 1 : (user.searches_today || 0) + 1
    patch.searches_this_month = (user.searches_this_month || 0) + 1
    patch.last_search_date = today
  } else {
    patch.enrichments_today = newDay ? 1 : (user.enrichments_today || 0) + 1
  }
  await fetch(`${SB_URL}/rest/v1/xps_users?id=eq.${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: sbHeaders('return=minimal'),
    body: JSON.stringify(patch),
  })
}
