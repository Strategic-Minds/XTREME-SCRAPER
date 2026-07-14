import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const SB_URL     = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SB_KEY     = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const dynamic   = 'force-dynamic'
export const maxDuration = 60

interface ScrapeLead {
  company_name?: string
  website?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  source?: string
  category?: string
  industry?: string
}

async function saveToSupabase(leads: ScrapeLead[], runMeta: { url: string; pages: number; duration_ms: number }) {
  if (!SB_URL || !SB_KEY) return { saved: 0, error: 'No Supabase config' }

  const headers = {
    'apikey': SB_KEY,
    'Authorization': `Bearer ${SB_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal,resolution=ignore-duplicates',
  }

  // Save scrape run first
  const runRes = await fetch(`${SB_URL}/rest/v1/scrape_runs`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      run_name: `scrape_${Date.now()}`,
      run_date: new Date().toISOString(),
      source: runMeta.url,
      total_records: leads.length,
      new_records: leads.length,
      duplicates_skipped: 0,
      status: 'complete',
      notes: `Scraped ${runMeta.pages} pages in ${runMeta.duration_ms}ms`,
    }),
  })
  console.log('[scrape] scrape_run saved:', runRes.status)

  // Save leads (map to Company schema)
  if (leads.length > 0) {
    const companyRows = leads.map(l => ({
      company_name:    l.company_name || l.website || 'Unknown',
      website_url:     l.website || '',
      phone:           l.phone || '',
      email:           l.email || '',
      city:            l.city || '',
      state:           l.state || 'AZ',
      source_type:     'web_scrape',
      raw_notes:       JSON.stringify(l),
      adjacency_class: l.industry || l.category || 'unknown',
      category_guess:  l.category || '',
    }))

    const leadsRes = await fetch(`${SB_URL}/rest/v1/leads`, {
      method: 'POST',
      headers,
      body: JSON.stringify(leads.map(l => ({
        ...l,
        scraped_at: new Date().toISOString(),
        source_url: runMeta.url,
      }))),
    })
    console.log('[scrape] leads saved:', leadsRes.status)
    return { saved: leads.length }
  }
  return { saved: 0 }
}

export async function POST(req: NextRequest) {
  const start = Date.now()
  const { url, max_pages = 50, num_agents = 5, extract_js_secrets = true } = await req.json()
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })

  try {
    const escaped = url.replace(/'/g, '')
    const cmd = `cd /app && python3 -c "
import asyncio, json, sys
sys.path.insert(0, '.')
from scraper.core import scrape
result = asyncio.run(scrape('${escaped}', max_pages=${max_pages}))
output = {
  'pages_count': result['pages_count'],
  'api_map': result['api_map'],
  'intelligence_report': result['intelligence_report'],
  'sitemap_count': len(result['sitemap_urls']),
  'bundle_count': len(result['bundle_urls']),
  'leads': result.get('leads', []),
}
print(json.dumps(output))
" 2>&1`

    const { stdout } = await execAsync(cmd, { timeout: 120000 })
    const lastLine = stdout.trim().split('\n').pop() || '{}'
    const data = JSON.parse(lastLine) as { pages_count?: number; leads?: ScrapeLead[]; api_map?: unknown; intelligence_report?: unknown }
    
    // Save to Supabase
    const saveResult = await saveToSupabase(data.leads || [], {
      url,
      pages: data.pages_count || 0,
      duration_ms: Date.now() - start,
    })

    return NextResponse.json({
      ok: true, url,
      pages_count: data.pages_count,
      api_map: data.api_map,
      intelligence_report: data.intelligence_report,
      leads_extracted: (data.leads || []).length,
      supabase: saveResult,
      duration_ms: Date.now() - start,
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
