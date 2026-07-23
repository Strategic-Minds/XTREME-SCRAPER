export interface ScrapeInput {
  industry: string
  city: string
  state: string
  limit: number
  mode: 'quick' | 'deep' | 'max'
}

export interface ValidationResult {
  ok: boolean
  error?: string
  data?: ScrapeInput
}

const VALID_STATES = new Set(['AZ','CA','TX','FL','NY','NV','CO','WA','OR','ID','NM','UT','MT','WY'])
const VALID_MODES  = new Set(['quick','deep','max'])
const SAFE_STRING  = /^[a-zA-Z0-9 \-\'\.,&()]+$/

export function validateScrapeInput(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Body must be a JSON object' }
  const b = body as Record<string, unknown>

  const industry = typeof b.industry === 'string' ? b.industry.trim() : 'Epoxy Flooring'
  const city     = typeof b.city === 'string' ? b.city.trim() : 'Phoenix'
  const state    = typeof b.state === 'string' ? b.state.trim().toUpperCase() : 'AZ'
  const limit    = typeof b.limit === 'number' ? Math.floor(b.limit) : 0
  const mode     = typeof b.mode === 'string' ? b.mode.trim() : 'quick'

  if (industry.length < 2 || industry.length > 100) return { ok: false, error: 'industry must be 2-100 chars' }
  if (!SAFE_STRING.test(industry)) return { ok: false, error: 'industry contains invalid characters' }
  if (city.length < 2 || city.length > 80) return { ok: false, error: 'city must be 2-80 chars' }
  if (!SAFE_STRING.test(city)) return { ok: false, error: 'city contains invalid characters' }
  if (!VALID_STATES.has(state)) return { ok: false, error: `state must be one of: ${[...VALID_STATES].join(', ')}` }
  if (limit < 0 || limit > 500) return { ok: false, error: 'limit must be 0-500' }
  if (!VALID_MODES.has(mode)) return { ok: false, error: 'mode must be quick, deep, or max' }

  return { ok: true, data: { industry, city, state, limit, mode: mode as ScrapeInput['mode'] } }
}

export function sanitizeString(s: string, maxLen = 200): string {
  return s.replace(/[<>"'`]/g, '').slice(0, maxLen).trim()
}
