import { NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)
export const dynamic    = "force-dynamic"
export const maxDuration = 90

const SB_URL  = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const SB_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const BW_URL  = process.env.BROWSER_WORKER_URL || "https://browserworker.vercel.app"
const BW_SECRET = process.env.BROWSER_WORKER_TOKEN || process.env.BROWSER_WORKER_SECRET || ""

interface Lead {
  company_name?: string; phone?: string; email?: string
  website?: string; city?: string; state?: string
  category?: string; source_url?: string
}

// ─── Supabase persistence ─────────────────────────────────────────────────────
async function saveToSupabase(
  leads: Lead[],
  meta: { url: string; pages: number; ms: number; industry: string; method: string }
) {
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
      industry:    meta.industry,
      location:    meta.url,
      total_found: leads.length,
      new_leads:   leads.length,
      duplicates_skipped: 0,
      status:      "complete",
      notes:       `method=${meta.method} pages=${meta.pages} ms=${meta.ms}`,
      started_at:  new Date().toISOString(),
      completed_at: new Date().toISOString(),
    }),
  })
  // Save leads to xps_leads (scraper-specific table)
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
  // Try xps_leads first, fall back to scrape_runs only
  const r = await fetch(`${SB_URL}/rest/v1/xps_leads`, {
    method: "POST", headers, body: JSON.stringify(rows),
  })
  if (!r.ok) {
    // xps_leads schema mismatch — store leads summary in notes
    console.warn("[scrape] xps_leads save failed:", r.status)
    return { saved: 0, warning: "xps_leads schema mismatch — run migration" }
  }
  return { saved: leads.length }
}

// ─── BrowserWorker scraper (primary) ─────────────────────────────────────────
async function bwScrape(url: string, industry: string): Promise<{ leads: Lead[]; method: string }> {
  if (!BW_SECRET) return { leads: [], method: "bw_not_configured" }
  const jobId = "scraper-" + Date.now()
  const correlationId = jobId
  try {
    const res = await fetch(BW_URL + "/api/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + BW_SECRET,
        "X-Correlation-Id": correlationId,
      },
      body: JSON.stringify({
        version: "1.0",
        job_id: jobId,
        objective: `Extract business leads for ${industry} from ${url}`,
        steps: [
          { action: "goto", url, timeout: 15000 },
          { action: "get_title" },
          { action: "get_url" },
          { action: "scroll", value: "500" },
          { action: "get_text", selector: "body" },
        ],
        timeout_ms: 45000,
        capture: { screenshot: false, console: false, network_errors: true },
      }),
    })
    const data = await res.json()
    if (data.status !== "pass") {
      console.warn("[bwScrape] job failed:", data.errors)
      return { leads: [], method: "bw_failed" }
    }

    // Extract leads from page text via structured parsing
    const pageText: string = data.artifacts?.page_text || data.content || ""
    const nav = data.navigation || {}
    const finalUrl = nav.final_url || url
    const title = nav.title || ""

    const leads: Lead[] = []
    const domain = new URL(finalUrl).hostname

    // Parse based on source
    if (domain.includes("yellowpages")) {
      leads.push(...parseYellowPagesText(pageText, finalUrl, industry))
    } else if (domain.includes("yelp")) {
      leads.push(...parseYelpText(pageText, finalUrl, industry))
    } else {
      // Generic: use title + URL as single lead
      if (title && !title.toLowerCase().includes("error") && !title.toLowerCase().includes("403")) {
        leads.push({
          company_name: title,
          website: finalUrl,
          state: "AZ",
          category: industry,
          source_url: url,
        })
      }
    }
    return { leads, method: "browserworker" }
  } catch (err) {
    console.error("[bwScrape] error:", err)
    return { leads: [], method: "bw_error" }
  }
}

// ─── Multi-URL BrowserWorker scrape ──────────────────────────────────────────
async function bwScrapeSources(
  sources: string[],
  industry: string,
  city: string,
  state: string
): Promise<{ leads: Lead[]; method: string; sources_hit: number }> {
  if (!BW_SECRET) return { leads: [], method: "bw_not_configured", sources_hit: 0 }

  const allLeads: Lead[] = []
  let sourcesHit = 0

  // Build targeted URLs
  const targets = buildTargetUrls(sources, industry, city, state)

  // Run up to 5 concurrently (BW max concurrency = 3, stagger)
  const batches = chunk(targets, 3)
  for (const batch of batches.slice(0, 2)) { // max 2 batches = 6 sources
    const results = await Promise.allSettled(
      batch.map(url => bwScrape(url, industry))
    )
    for (const r of results) {
      if (r.status === "fulfilled" && r.value.leads.length > 0) {
        allLeads.push(...r.value.leads)
        sourcesHit++
      }
    }
    if (batches.indexOf(batch) < batches.length - 1) {
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  return { leads: allLeads, method: "browserworker_multi", sources_hit: sourcesHit }
}

// ─── URL builders ─────────────────────────────────────────────────────────────
function buildTargetUrls(sources: string[], industry: string, city: string, state: string): string[] {
  const q = encodeURIComponent(industry)
  const loc = encodeURIComponent(`${city} ${state}`.trim())
  const urls: string[] = []
  const sourceMap: Record<string, string> = {
    "Yellow Pages":  `https://www.yellowpages.com/search?search_terms=${q}&geo_location_terms=${loc}`,
    "Yelp":          `https://www.yelp.com/search?find_desc=${q}&find_loc=${loc}`,
    "Angi":          `https://www.angi.com/search?q=${q}&location=${loc}`,
    "HomeAdvisor":   `https://www.homeadvisor.com/category.Epoxy_Flooring.html?zip=85001`,
    "Thumbtack":     `https://www.thumbtack.com/search/?q=${q}&zipCode=85001`,
    "Google Maps":   `https://www.google.com/maps/search/${q}+in+${loc}`,
    "BBB":           `https://www.bbb.org/search?find_text=${q}&find_loc=${loc}`,
    "Houzz":         `https://www.houzz.com/professionals/search?query=${q}&location=${loc}`,
    "Nextdoor":      `https://nextdoor.com/find-pros/`,
    "Bark":          `https://www.bark.com/en/us/search/?q=${q}&location=${loc}`,
  }
  for (const source of sources) {
    const url = sourceMap[source]
    if (url) urls.push(url)
  }
  return urls.length ? urls : [sourceMap["Yellow Pages"]]
}

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size))
  return result
}

// ─── Text parsers ─────────────────────────────────────────────────────────────
function parseYellowPagesText(text: string, url: string, industry: string): Lead[] {
  const leads: Lead[] = []
  const phoneRe = /\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}/g
  const phones = text.match(phoneRe) || []
  const lines = text.split("\n").filter(l => l.trim().length > 3 && l.trim().length < 80)
  const seen = new Set<string>()
  let i = 0
  for (const line of lines) {
    if (i >= 20) break
    const trimmed = line.trim()
    if (seen.has(trimmed.toLowerCase())) continue
    if (/^\d/.test(trimmed) || trimmed.length < 5) continue
    if (/^(search|filter|sort|show|page|next|prev|home|back)/i.test(trimmed)) continue
    seen.add(trimmed.toLowerCase())
    leads.push({ company_name: trimmed, phone: phones[i] || "", state: "AZ", category: industry, source_url: url })
    i++
  }
  return leads
}

function parseYelpText(text: string, url: string, industry: string): Lead[] {
  const leads: Lead[] = []
  const phoneRe = /\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}/g
  const phones = text.match(phoneRe) || []
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 4 && l.length < 80)
  const seen = new Set<string>()
  let i = 0
  for (const line of lines) {
    if (i >= 20) break
    if (seen.has(line.toLowerCase())) continue
    if (/^(yelp|search|filter|category|write|open|closed|miles|review|stars|cost)/i.test(line)) continue
    if (/^\d+$/.test(line) || line.length < 5) continue
    seen.add(line.toLowerCase())
    leads.push({ company_name: line, phone: phones[i] || "", state: "AZ", category: industry, source_url: url })
    i++
  }
  return leads
}

// ─── Direct fetch fallback ────────────────────────────────────────────────────
async function directScrape(url: string, industry: string): Promise<Lead[]> {
  const leads: Lead[] = []
  try {
    const ctrl = new AbortController()
    setTimeout(() => ctrl.abort(), 20000)
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: ctrl.signal,
    })
    if (!r.ok) return leads
    const html = await r.text()
    const domain = new URL(url).hostname
    if (domain.includes("yellowpages")) {
      const names = [...html.matchAll(/class="business-name[^"]*"[^>]*>\s*<[^>]+>([^<]{3,80})</g)]
      const phones = [...html.matchAll(/class="phones[^"]*"[^>]*>[^<]*<[^>]*>([()\d\s.\-]{10,16})</g)]
      const seen = new Set<string>()
      for (let i = 0; i < Math.min(names.length, 30); i++) {
        const name = names[i]?.[1]?.trim()
        if (!name || seen.has(name.toLowerCase())) continue
        seen.add(name.toLowerCase())
        leads.push({ company_name: name, phone: phones[i]?.[1]?.trim() || "", state: "AZ", category: industry, source_url: url })
      }
    } else {
      const ldMatches = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)]
      for (const m of ldMatches.slice(0, 10)) {
        try {
          const d = JSON.parse(m[1])
          const items = Array.isArray(d) ? d : [d]
          for (const item of items) {
            if (!item.name) continue
            leads.push({ company_name: item.name, phone: item.telephone || "", state: "AZ", category: industry, source_url: url })
          }
        } catch {}
      }
    }
  } catch (e) { console.error("[directScrape] error:", e) }
  return leads
}

// ─── Main route ───────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const start = Date.now()
  const body  = await req.json()
  const {
    url,
    urls,
    sources,
    industry = "Epoxy Flooring",
    city     = "Phoenix",
    state    = "AZ",
    max_pages = 50,
  } = body as {
    url?: string; urls?: string[]; sources?: string[]
    industry?: string; city?: string; state?: string; max_pages?: number
  }

  let leads: Lead[] = []
  let pages  = 0
  let method = "none"
  let sourcesHit = 0

  // Mode 1: Multi-source with BW (sources array from UI)
  if (sources?.length && BW_SECRET) {
    const result = await bwScrapeSources(sources, industry, city, state)
    leads      = result.leads
    method     = result.method
    sourcesHit = result.sources_hit
    pages      = sourcesHit
  }

  // Mode 2: Single URL with BW
  if (!leads.length && url && BW_SECRET) {
    const result = await bwScrape(url, industry)
    leads  = result.leads
    method = result.method
    pages  = 1
  }

  // Mode 3: Python asyncio (if BW unavailable)
  if (!leads.length && url) {
    try {
      const escaped = url.replace(/["']/g, "")
      const cmd = `cd /app && timeout 40 python3 -c "
import asyncio, json, sys
sys.path.insert(0, '.')
try:
    from scraper.core import scrape
    result = asyncio.run(scrape('${escaped}', max_pages=${Math.min(max_pages, 20)}))
    print(json.dumps({'leads': result.get('leads', []), 'pages': result.get('pages_count', 0), 'ok': True}))
except Exception as e:
    print(json.dumps({'leads': [], 'pages': 0, 'ok': False, 'error': str(e)}))
" 2>/dev/null`
      const { stdout } = await execAsync(cmd, { timeout: 45000 })
      const parsed = JSON.parse(stdout.trim().split("\n").pop() || "{}")
      if (parsed.ok && parsed.leads?.length) { leads = parsed.leads; pages = parsed.pages; method = "asyncio_python" }
    } catch {}
  }

  // Mode 4: Direct fetch (last resort)
  if (!leads.length && url) {
    leads  = await directScrape(url, industry)
    pages  = 1
    method = "direct_fetch"
  }

  const ms   = Date.now() - start
  const saved = await saveToSupabase(leads, { url: url || `multi:${sourcesHit}`, pages, ms, industry, method })

  return NextResponse.json({
    ok: true,
    method,
    sources_hit: sourcesHit,
    pages_scraped: pages,
    leads_found: leads.length,
    leads_saved: saved.saved,
    duration_ms: ms,
    browser_worker_used: method.startsWith("browserworker"),
    leads: leads.slice(0, 15),
  })
}

export async function GET() {
  return NextResponse.json({
    status: "ready",
    endpoint: "/api/scrape",
    browser_worker_configured: !!(process.env.BROWSER_WORKER_TOKEN || process.env.BROWSER_WORKER_SECRET),
    browser_worker_url: process.env.BROWSER_WORKER_URL || "https://browserworker.vercel.app",
  })
}
