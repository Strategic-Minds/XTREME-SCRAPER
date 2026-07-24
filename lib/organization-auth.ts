import type { NextRequest } from 'next/server'
import { COOKIE_NAME, verifyToken } from '@/lib/auth'

const SB_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SB_SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export type OrganizationRole = 'owner' | 'admin' | 'analyst' | 'member' | 'viewer'
export type OrganizationContext = { userId: string; email: string; organizationId: string; role: OrganizationRole }

function headers() {
  if (!SB_URL || !SB_SKEY) throw new Error('Supabase server configuration is incomplete')
  return { apikey: SB_SKEY, Authorization: `Bearer ${SB_SKEY}`, 'Content-Type': 'application/json' }
}

export function supabaseConfigured() { return Boolean(SB_URL && SB_SKEY) }
export function supabaseBaseUrl() { return SB_URL }
export function supabaseHeaders(prefer?: string) { return { ...headers(), ...(prefer ? { Prefer: prefer } : {}) } }

export async function requireOrganization(
  req: NextRequest,
  allowedRoles: OrganizationRole[] = ['owner', 'admin', 'analyst', 'member', 'viewer'],
): Promise<{ ok: true; context: OrganizationContext } | { ok: false; status: number; error: string }> {
  if (!supabaseConfigured()) return { ok: false, status: 503, error: 'Organization persistence is not configured.' }
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return { ok: false, status: 401, error: 'Authentication required.' }
  const payload = await verifyToken(token)
  if (!payload) return { ok: false, status: 401, error: 'Session is invalid or expired.' }

  const requestedOrg = req.headers.get('x-organization-id') || req.nextUrl.searchParams.get('organization_id') || ''
  const query = requestedOrg
    ? `organization_id=eq.${encodeURIComponent(requestedOrg)}&user_id=eq.${encodeURIComponent(payload.sub)}&select=organization_id,user_id,role&limit=1`
    : `user_id=eq.${encodeURIComponent(payload.sub)}&select=organization_id,user_id,role&order=created_at.asc&limit=1`

  try {
    const response = await fetch(`${SB_URL}/rest/v1/xps_organization_memberships?${query}`, { headers: headers(), cache: 'no-store' })
    if (response.status === 404) return { ok: false, status: 503, error: 'Organization schema is not installed in this environment.' }
    if (!response.ok) return { ok: false, status: 503, error: 'Organization membership could not be verified.' }
    const rows = await response.json() as Array<{ organization_id: string; role: OrganizationRole }>
    const membership = rows[0]
    if (!membership) return { ok: false, status: 403, error: 'No organization membership was found.' }
    if (!allowedRoles.includes(membership.role)) return { ok: false, status: 403, error: 'Your organization role does not allow this action.' }
    return { ok: true, context: { userId: payload.sub, email: payload.email, organizationId: membership.organization_id, role: membership.role } }
  } catch {
    return { ok: false, status: 503, error: 'Organization membership verification failed.' }
  }
}
