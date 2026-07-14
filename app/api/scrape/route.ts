import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const SB_URL    = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SB_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const XAB_URL   = process.env.XAB_URL || 'https://xtreme-ai-builder-git-main-strategic-minds-advisory.vercel.app'
const CRON_SEC  = process.env.CRON_SECRET || ''

export const dynamic    = 'force-dynamic'
export const maxDuration = 60

interface Lead {
  company_name?: string; website?: string; phone?: string; email?: string
  address?: string; city?: string; state?: string; category?: string
  industry?: string; source_url?: string
}

async function syncToSupabase(leads: Lead[], meta: { url: string; pages: number; ms: number }) {
  if (!SB_URL || !SB_KEY || !leads.length) return { saved: 0 }
  const headers = {
    'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`,
    'Content-Type': 'application/json', 'Prefer': 'return=minimal,resolution=ignore-duplicates',
  }
  // Save scrape run
  await fetch(`${SB_URL}/rest/v1/scrape_runs`, {
    method: 'POST', headers,
    body: JSON.stringify({
      run_name: `scraper_${Date.now()}`, run_date: new Date().toISOString(),
      source: meta.url, total_records: leads.length, new_records: leads.length,
      duplicates_skipped: 0, status: 'complete',
      notes: `${meta.pages} pages in ${meta.ms}ms`,
    }),
  })
  // Save leads
  const rows = leads.map(l => ({
    ...l, scraped_at: new Date().toISOString(),
    source_url: meta.url, state: l.state || 'AZ', lead_score: 0,
  }))
  const r = await fetch(`${SB_URL}/rest/v1/leads`, {
    method: 'POST', headers, body: JSON.stringify(rows),
  })
  return { saved: r.ok ? leads.length : 0, status: r.status }
}

async function syncToXAB(leads: Lead[], meta: Record<string, unknown>) {
  if (!XAB_URL || !leads.length) return
  try {
    await fetch(`${XAB_URL}/api/scrape-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CRON_SEC,
      },
      body: JSON.stringify({ leads, run_meta: meta }),
    })
  } catch (e) { console.error('[scraper] XAB sync failed:', e) }
}

export async function POST(req: NextRequest) {
  const start = Date.now()
  const { url, max_pages = 50, industry = '', topics = [] } = await req.json() as {
    url: string; max_pages?: number; industry?: string; topics?: string[]
  }
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })

  try {
    const escaped = url.replace(/['"]/g, '')
    const cmd = `cd /app && python3 -c "
import asyncio, json, sys
sys.path.insert(0, '.')
from scraper.core import scrape
result = asyncio.run(scrape('${escaped}', max_pages=${max_pages}))
print(json.dumps({
  'pages_count': result.get('pages_count', 0),
  'api_map': result.get('api_map', {}),
  'intelligence_report': result.get('intelligence_report', {}),
  'sitemap_count': len(result.get('sitemap_urls', [])),
  'leads': result.get('leads', []),
}))
" 2>&1`

    const { stdout } = await execAsync(cmd, { timeout: 120000 })
    const lastLine = stdout.trim().split('\n').pop() || '{}'
    const data = JSON.parse(lastLine) as {
      pages_count?: number; leads?: Lead[]; api_map?: unknown; intelligence_report?: unknown; sitemap_count?: number
    }

    const leads   = data.leads || []
    const elapsed = Date.now() - start
    const meta    = { url, pages: data.pages_count || 0, ms: elapsed, industry, topics }

    // Save to Supabase + ping XAB dashboard
    const [sbResult] = await Promise.all([
      syncToSupabase(leads, { url, pages: data.pages_count || 0, ms: elapsed }),
      syncToXAB(leads, meta),
    ])

    return NextResponse.json({
      ok: true, url,
      pages_count:    data.pages_count,
      sitemap_count:  data.sitemap_count,
      api_map:        data.api_map,
      leads_found:    leads.length,
      leads_saved:    sbResult.saved,
      synced_to_xab:  true,
      duration_ms:    elapsed,
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
