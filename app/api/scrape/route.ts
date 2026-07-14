import { NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)
export const dynamic    = "force-dynamic"
export const maxDuration = 60

const SB_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

interface Lead {
  company_name?: string; phone?: string; email?: string
  website?: string; city?: string; state?: string
  category?: string; source_url?: string
}

async function saveToSupabase(leads: Lead[], meta: { url: string; pages: number; ms: number; industry: string }) {
  if (!SB_URL || !SB_KEY || !leads.length) return { saved: 0 }
  const headers = {
    "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=minimal,resolution=ignore-duplicates",
  }
  // Log run
  await fetch(`${SB_URL}/rest/v1/scrape_runs`, {
    method: "POST", headers,
    body: JSON.stringify({
      run_name:    `scrape_${Date.now()}`,
      run_date:    new Date().toISOString(),
      source:      meta.url,
      total_records: leads.length,
      new_records:   leads.length,
      duplicates_skipped: 0,
      status:      "complete",
      notes:       `${meta.industry} — ${meta.pages} pages — ${meta.ms}ms`,
    }),
  })
  // Save leads
  const rows = leads.map(l => ({
    company_name: l.company_name || l.website || "Unknown",
    phone:        l.phone    || "",
    email:        l.email    || "",
    website:      l.website  || "",
    city:         l.city     || "",
    state:        l.state    || "AZ",
    category:     l.category || meta.industry,
    source_url:   l.source_url || meta.url,
    scraped_at:   new Date().toISOString(),
    lead_score:   0,
  }))
  const r = await fetch(`${SB_URL}/rest/v1/leads`, {
    method: "POST", headers, body: JSON.stringify(rows),
  })
  return { saved: r.ok ? leads.length : 0, status: r.status }
}

async function directScrape(url: string, industry: string): Promise<Lead[]> {
  // Direct HTTP scrape — works on Vercel serverless
  const leads: Lead[] = []
  try {
    const ctrl = new AbortController()
    setTimeout(() => ctrl.abort(), 20000)
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: ctrl.signal,
    })
    if (!r.ok) return leads
    const html = await r.text()
    const domain = new URL(url).hostname

    if (domain.includes("yellowpages")) {
      const names  = [...html.matchAll(/class="business-name[^"]*"[^>]*>\s*<[^>]+>([^<]{3,80})</g)]
      const phones = [...html.matchAll(/class="phones[^"]*"[^>]*>[^<]*<[^>]*>([()\d\s.\-]{10,16})</g)]
      const addrs  = [...html.matchAll(/class="street-address[^"]*">([^<]{5,80})</g)]
      const cities = [...html.matchAll(/class="locality[^"]*">([^<]{2,40})</g)]
      const webs   = [...html.matchAll(/class="track-visit-website"[^>]+href="([^"]+)"/g)]
      const seen   = new Set<string>()
      for (let i = 0; i < Math.min(names.length, 30); i++) {
        const name = names[i]?.[1]?.trim()
        if (!name || seen.has(name.toLowerCase())) continue
        seen.add(name.toLowerCase())
        leads.push({
          company_name: name,
          phone:        phones[i]?.[1]?.trim() || "",
          city:         cities[i]?.[1]?.trim() || addrs[i]?.[1]?.trim() || "",
          state:        "AZ",
          website:      webs[i]?.[1]?.trim()  || "",
          category:     industry,
          source_url:   url,
        })
      }
    } else if (domain.includes("yelp")) {
      const nameMatches  = [...html.matchAll(/"name":"([^"<]{3,80})"/g)]
      const phoneMatches = [...html.matchAll(/"phone":"([^"]{7,20})"/g)]
      const cityMatches  = [...html.matchAll(/"city":"([^"]{2,40})"/g)]
      const webMatches   = [...html.matchAll(/"website":"([^"]+)"/g)]
      const seen = new Set<string>()
      for (let i = 0; i < Math.min(nameMatches.length, 30); i++) {
        const name = nameMatches[i]?.[1]?.trim()
        if (!name || seen.has(name.toLowerCase())) continue
        seen.add(name.toLowerCase())
        leads.push({
          company_name: name,
          phone:        phoneMatches[i]?.[1]?.trim() || "",
          city:         cityMatches[i]?.[1]?.trim()  || "Phoenix",
          state:        "AZ",
          website:      webMatches[i]?.[1]?.trim()   || "",
          category:     industry,
          source_url:   url,
        })
      }
    } else {
      // Generic: extract structured-data JSON-LD
      const ldMatches = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)]
      for (const m of ldMatches.slice(0, 10)) {
        try {
          const d = JSON.parse(m[1])
          const items = Array.isArray(d) ? d : [d]
          for (const item of items) {
            if (!item.name) continue
            leads.push({
              company_name: item.name,
              phone:        item.telephone || "",
              email:        item.email     || "",
              city:         item.address?.addressLocality || "",
              state:        item.address?.addressRegion   || "AZ",
              website:      item.url || "",
              category:     industry,
              source_url:   url,
            })
          }
        } catch {}
      }
      // Fallback: h2/h3 headings as business names
      const h2 = [...html.matchAll(/<h2[^>]*>([^<]{5,80})<\/h2>/gi)]
      const phones = [...html.matchAll(/\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}/g)]
      const seen = new Set<string>()
      for (let i = 0; i < Math.min(h2.length, 20); i++) {
        const name = h2[i][1].replace(/<[^>]+>/g,"").trim()
        if (!name || seen.has(name.toLowerCase())) continue
        seen.add(name.toLowerCase())
        leads.push({
          company_name: name,
          phone:        phones[i]?.[0]?.trim() || "",
          state:        "AZ",
          category:     industry,
          source_url:   url,
        })
      }
    }
  } catch (e) { console.error("[scrape] direct error:", e) }
  return leads
}

export async function POST(req: NextRequest) {
  const start   = Date.now()
  const body    = await req.json()
  const { url, industry = "Epoxy Flooring", max_pages = 50 } = body as {
    url: string; industry?: string; max_pages?: number
  }
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 })

  // Try Python asyncio scraper first (if available in build)
  let leads: Lead[] = []
  let pages  = 0
  let method = "direct"

  try {
    const escaped = url.replace(/["']/g, "")
    const cmd = `cd /app && timeout 45 python3 -c "
import asyncio, json, sys
sys.path.insert(0, '.')
try:
    from scraper.core import scrape
    result = asyncio.run(scrape('${escaped}', max_pages=${Math.min(max_pages, 30)}))
    leads = result.get('leads', [])
    # Map to standard lead format
    output = []
    for l in leads:
        output.append({
            'company_name': l.get('name','') or l.get('company_name',''),
            'phone':        l.get('phone','') or l.get('telephone',''),
            'email':        l.get('email',''),
            'website':      l.get('url','')  or l.get('website',''),
            'city':         l.get('city','') or l.get('address',{}).get('city','') if isinstance(l.get('address'),dict) else '',
            'state':        l.get('state','AZ'),
            'category':     l.get('category','${industry}'),
            'source_url':   '${escaped}',
        })
    print(json.dumps({'leads': output, 'pages': result.get('pages_count', 0), 'ok': True}))
except Exception as e:
    print(json.dumps({'leads': [], 'pages': 0, 'ok': False, 'error': str(e)}))
" 2>/dev/null`
    
    const { stdout } = await execAsync(cmd, { timeout: 50000 })
    const last = stdout.trim().split("\n").pop() || "{}"
    const parsed = JSON.parse(last)
    if (parsed.ok && parsed.leads?.length > 0) {
      leads  = parsed.leads
      pages  = parsed.pages
      method = "asyncio_python"
    }
  } catch { /* fall through to direct */ }

  // Fallback: direct fetch scraper
  if (!leads.length) {
    leads  = await directScrape(url, industry)
    pages  = 1
    method = "direct_fetch"
  }

  const ms      = Date.now() - start
  const saved   = await saveToSupabase(leads, { url, pages, ms, industry })

  return NextResponse.json({
    ok:          true,
    url,
    method,
    pages_scraped: pages,
    leads_found:   leads.length,
    leads_saved:   saved.saved,
    duration_ms:   ms,
    leads:         leads.slice(0, 10), // preview first 10
  })
}

export async function GET() {
  return NextResponse.json({ status: "ready", endpoint: "/api/scrape", method: "POST" })
}
