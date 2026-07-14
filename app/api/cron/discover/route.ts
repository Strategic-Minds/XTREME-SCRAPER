/**
 * /api/cron/discover
 * Runs every night at 11 PM EST (04:00 UTC) → Arizona epoxy lead harvest
 * Scraped data flows: XTREME-SCRAPER → Supabase leads + scrape_runs → XAB Dashboard
 * Presentation data guaranteed by 6 AM EST.
 */
import { NextRequest, NextResponse } from 'next/server'

export const dynamic    = 'force-dynamic'
export const maxDuration = 60

const CRON_SEC  = process.env.CRON_SECRET || ''
const SB_URL    = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SB_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const XAB_URL   = process.env.XAB_URL || 'https://xtreme-ai-builder-git-main-strategic-minds-advisory.vercel.app'

const AZ_TARGETS = ["https://www.yellowpages.com/phoenix-az/mip/epoxy-flooring", "https://www.yellowpages.com/tucson-az/mip/epoxy-flooring", "https://www.yellowpages.com/scottsdale-az/mip/epoxy-flooring", "https://www.yellowpages.com/mesa-az/mip/epoxy-flooring", "https://www.yelp.com/search?find_desc=epoxy+flooring&find_loc=Phoenix%2C+AZ", "https://www.yelp.com/search?find_desc=concrete+polishing&find_loc=Phoenix%2C+AZ", "https://www.yelp.com/search?find_desc=garage+floor+coating&find_loc=Scottsdale%2C+AZ", "https://www.angieslist.com/companylist/us/az/phoenix/epoxy-flooring-reviews-6988.htm"]

async function scrapeTarget(url: string): Promise<{leads: unknown[]; pages: number}> {
  try {
    // Direct fetch + parse approach — extract business data from directory listings
    const ctrl = new AbortController()
    setTimeout(() => ctrl.abort(), 25000)
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: ctrl.signal,
    })
    if (!r.ok) return { leads: [], pages: 0 }
    const html = await r.text()

    // Extract business listings from YellowPages / Yelp / Angi
    const leads: unknown[] = []
    const domain = new URL(url).hostname

    if (domain.includes('yellowpages')) {
      // YellowPages: .result .business-name, .phone, .street-address
      const nameMatches  = [...html.matchAll(/class="business-name[^>]*>\s*<[^>]+>([^<]+)</g)]
      const phoneMatches = [...html.matchAll(/class="phones[^>]*>[^<]*<[^>]*>([^<]+)</g)]
      const addrMatches  = [...html.matchAll(/class="street-address[^>]*>([^<]+)</g)]
      const count = Math.min(nameMatches.length, 20)
      for (let i = 0; i < count; i++) {
        leads.push({
          company_name: nameMatches[i]?.[1]?.trim() || '',
          phone:        phoneMatches[i]?.[1]?.trim() || '',
          address:      addrMatches[i]?.[1]?.trim()  || '',
          state:        'AZ',
          source_url:   url,
          category:     'Epoxy Flooring',
          industry:     'Construction',
        })
      }
    } else if (domain.includes('yelp')) {
      const nameMatches  = [...html.matchAll(/"name":"([^"]+)"/g)]
      const phoneMatches = [...html.matchAll(/"phone":"([^"]+)"/g)]
      const cityMatches  = [...html.matchAll(/"city":"([^"]+)"/g)]
      const count = Math.min(nameMatches.length, 20)
      for (let i = 0; i < count; i++) {
        const name = nameMatches[i]?.[1]?.trim()
        if (!name || name.length < 3) continue
        leads.push({
          company_name: name,
          phone:        phoneMatches[i]?.[1]?.trim() || '',
          city:         cityMatches[i]?.[1]?.trim()  || '',
          state:        'AZ',
          source_url:   url,
          category:     'Epoxy Flooring',
          industry:     'Construction',
        })
      }
    } else {
      // Generic: pull any business-looking text patterns
      const nameMatches = [...html.matchAll(/<h[23][^>]*>([^<]{5,80})<\/h[23]>/g)]
      const phoneMatches = [...html.matchAll(/(\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4})/g)]
      for (let i = 0; i < Math.min(nameMatches.length, 15); i++) {
        const name = nameMatches[i]?.[1]?.replace(/<[^>]+>/g,'').trim()
        if (!name) continue
        leads.push({
          company_name: name,
          phone:        phoneMatches[i]?.[1]?.trim() || '',
          state:        'AZ',
          source_url:   url,
          category:     'Flooring / Epoxy',
          industry:     'Construction',
        })
      }
    }

    return { leads, pages: 1 }
  } catch (e) {
    console.error('[discover] failed:', url, e)
    return { leads: [], pages: 0 }
  }
}

async function saveToSupabase(leads: unknown[], source: string) {
  if (!SB_URL || !SB_KEY || !leads.length) return 0
  const headers = {
    'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal,resolution=ignore-duplicates',
  }
  // Log the run
  await fetch(`${SB_URL}/rest/v1/scrape_runs`, {
    method: 'POST', headers,
    body: JSON.stringify({
      run_name:          `cron_discover_${Date.now()}`,
      run_date:          new Date().toISOString(),
      source,
      total_records:     leads.length,
      new_records:       leads.length,
      duplicates_skipped: 0,
      status:            'complete',
      notes:             `Nightly AZ discovery cron — ${leads.length} leads`,
    }),
  })
  // Save leads
  const r = await fetch(`${SB_URL}/rest/v1/leads`, {
    method: 'POST', headers,
    body: JSON.stringify(leads),
  })
  return r.ok ? leads.length : 0
}

export async function GET(req: NextRequest) {
  const sec = req.headers.get('x-cron-secret') || req.headers.get('authorization')?.replace('Bearer ','')
  if (CRON_SEC && sec !== CRON_SEC) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const start    = Date.now()
  const allLeads: unknown[] = []
  const log: string[] = []

  // Scrape all AZ targets in parallel (batches of 3)
  for (let i = 0; i < AZ_TARGETS.length; i += 3) {
    const batch   = AZ_TARGETS.slice(i, i + 3)
    const results = await Promise.all(batch.map(u => scrapeTarget(u)))
    for (let j = 0; j < batch.length; j++) {
      const { leads, pages } = results[j]
      log.push(`${batch[j].split('/').slice(-2).join('/')}: ${leads.length} leads`)
      allLeads.push(...leads)
    }
  }

  // Deduplicate by company_name
  const seen    = new Set<string>()
  const unique  = (allLeads as Array<{company_name?: string}>).filter(l => {
    const k = (l.company_name || '').toLowerCase().trim()
    if (!k || seen.has(k)) return false
    seen.add(k); return true
  })

  // Save to Supabase
  const saved = await saveToSupabase(unique, 'nightly_az_discovery')

  // Ping XAB dashboard to refresh stats
  try {
    await fetch(`${XAB_URL}/api/stats`, { cache: 'no-store' })
  } catch {}

  const summary = {
    ok:         true,
    run_date:   new Date().toISOString(),
    targets:    AZ_TARGETS.length,
    raw_leads:  allLeads.length,
    unique:     unique.length,
    saved,
    duration_ms: Date.now() - start,
    log,
  }

  console.log('[cron/discover]', JSON.stringify(summary))
  return NextResponse.json(summary)
}
