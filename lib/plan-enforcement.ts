/**
 * XTREME SCRAPER — Plan Enforcement Middleware
 * Called by /api/search, /api/enrich, /api/person before any work.
 * Returns go/no-go with reason, upgrade prompt, and usage stats.
 */
import { verifyToken, getUserById, incrementUsage } from './auth'
import { checkLimit, isTrialExpired, upgradeMessage, PLANS, type PlanKey } from './stripe'

export interface EnforcementResult {
  allowed: boolean
  user_id?: string
  plan: PlanKey
  reason?: string
  upgrade_to?: PlanKey
  upgrade_message?: string
  searches_remaining?: number
  trial_days_remaining?: number
}

export async function enforceLimit(
  cookieToken: string | undefined,
  action: 'search' | 'enrich' | 'person'
): Promise<EnforcementResult> {

  // No session — allow 1 anonymous search only
  if (!cookieToken) {
    return {
      allowed: action === 'search',
      plan: 'free_trial',
      reason: action !== 'search' ? 'Create a free account to access this feature' : undefined,
      upgrade_message: 'Sign up free — 5 searches/day for 7 days. No card required.',
      searches_remaining: 1,
    }
  }

  const payload = await verifyToken(cookieToken)
  if (!payload) return { allowed: false, plan: 'free_trial', reason: 'Session expired — please log in again' }

  const user = await getUserById(payload.sub)
  if (!user) return { allowed: false, plan: 'free_trial', reason: 'Account not found' }

  const plan = user.plan as PlanKey

  // Trial expired
  if (plan === 'free_trial' && isTrialExpired(user.trial_ends_at)) {
    return {
      allowed: false, user_id: user.id, plan,
      reason: 'Your 7-day free trial has ended.',
      upgrade_to: 'starter',
      upgrade_message: upgradeMessage('free_trial'),
      searches_remaining: 0,
      trial_days_remaining: 0,
    }
  }

  // Daily limit check
  const used = action === 'search' ? user.searches_today : user.enrichments_today
  const check = checkLimit(plan, action, used)

  if (!check.allowed) {
    return {
      allowed: false, user_id: user.id, plan,
      reason: check.reason,
      upgrade_to: check.upgrade_to,
      upgrade_message: check.upgrade_to ? upgradeMessage(plan) : undefined,
      searches_remaining: 0,
      trial_days_remaining: user.trial_ends_at
        ? Math.max(0, Math.ceil((new Date(user.trial_ends_at).getTime() - Date.now()) / 86400000))
        : undefined,
    }
  }

  // Allowed — increment counter
  await incrementUsage(user.id, action)

  const planConfig = PLANS[plan]
  const limit      = action === 'search' ? planConfig.searches_per_day : planConfig.enrichments_per_day
  const remaining  = limit === -1 ? -1 : Math.max(0, limit - used - 1)

  return {
    allowed: true, user_id: user.id, plan,
    searches_remaining: remaining,
    trial_days_remaining: user.trial_ends_at
      ? Math.max(0, Math.ceil((new Date(user.trial_ends_at).getTime() - Date.now()) / 86400000))
      : undefined,
  }
}
