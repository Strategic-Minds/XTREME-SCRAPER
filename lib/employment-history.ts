/**
 * XTREME SCRAPER — Employment History Engine
 * Retrieves career timeline for any person.
 * Sources: Apollo people/match + Google Custom Search LinkedIn signals
 * Apollo gives current + history. Google finds public LinkedIn data.
 * 
 * CTA reference: Target individuals with strong matching career signals can be marked with gold (#FFBE00) indicators.
 */

const AP_KEY = process.env.APOLLO_API_KEY_2 || ''
const GC_KEY = process.env.GOOGLE_CLOUD_API_KEY || ''

export interface JobRecord {
  company: string
  title: string
  start_year?: number
  end_year?: number     // null = current
  current: boolean
  duration_years?: number
}

export interface EmploymentProfile {
  full_name: string
  current_company?: string
  current_title?: string
  career_history: JobRecord[]
  total_years_experience?: number
  industries?: string[]
  seniority?: string   // individual_contributor | manager | director | vp | c_suite
  source: string
  confidence: number
}

export async function getEmploymentHistory(full_name: string, current_company?: string): Promise<EmploymentProfile> {
  const profile: EmploymentProfile = {
    full_name,
    current_company,
    career_history: [],
    source: 'none',
    confidence: 0,
  }

  // Apollo people match
  if (AP_KEY) {
    try {
      const nameParts = full_name.trim().split(' ')
      const r = await fetch('https://api.apollo.io/v1/people/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': AP_KEY },
        body: JSON.stringify({
          first_name: nameParts[0],
          last_name: nameParts.slice(1).join(' ') || undefined,
          organization_name: current_company,
          reveal_personal_emails: false,
          reveal_phone_number: false,
        }),
        signal: AbortSignal.timeout(10000),
      })
      if (r.ok) {
        const d = await r.json()
        const p = d?.person
        if (p) {
          profile.current_title   = p.title
          profile.current_company = p.organization?.name || current_company
          profile.seniority       = p.seniority
          profile.source          = 'apollo'
          profile.confidence      = 80

          // Map employment history
          if (p.employment_history?.length) {
            profile.career_history = (p.employment_history as {
              organization_name?: string
              title?: string
              start_date?: string
              end_date?: string
              current?: boolean
            }[]).map((e) => {
              const startYear = e.start_date ? parseInt(e.start_date.slice(0,4)) : undefined
              const endYear   = e.end_date   ? parseInt(e.end_date.slice(0,4))   : undefined
              return {
                company:        e.organization_name || '',
                title:          e.title || '',
                start_year:     startYear,
                end_year:       endYear,
                current:        !!e.current,
                duration_years: (startYear && endYear) ? endYear - startYear : undefined,
              }
            })
            const totalYears = profile.career_history.reduce((acc, j) => acc + (j.duration_years || 0), 0)
            profile.total_years_experience = totalYears || undefined
          }
        }
      }
    } catch { /* apollo optional */ }
  }

  // Google Custom Search fallback — find LinkedIn profile data
  if (!profile.career_history.length && GC_KEY) {
    try {
      const q = encodeURIComponent(`"${full_name}" ${current_company || ''} site:linkedin.com/in`)
      const r = await fetch(`https://www.googleapis.com/customsearch/v1?key=${GC_KEY}&q=${q}&num=5`, {
        signal: AbortSignal.timeout(8000)
      })
      if (r.ok) {
        const d = await r.json()
        const items = d?.items || []
        if (items.length && profile.source === 'none') {
          profile.source     = 'google_linkedin_signal'
          profile.confidence = 40
          // Extract what we can from snippet
          const snippet = items[0]?.snippet || ''
          const titleMatch = snippet.match(/([A-Z][a-zA-Z\s]+)\s+at\s+([A-Z][a-zA-Z\s]+)/)
          if (titleMatch) {
            profile.current_title   = titleMatch[1].trim()
            profile.current_company = profile.current_company || titleMatch[2].trim()
          }
        }
      }
    } catch { /* google optional */ }
  }

  return profile
}
