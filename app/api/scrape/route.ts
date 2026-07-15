import { NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)
export const dynamic    = "force-dynamic"
export const maxDuration = 90

const SB_URL      = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const SB_KEY      = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const BW_URL      = process.env.BROWSER_WORKER_URL || "https://browserworker.vercel.app"
const BW_SECRET   = process.env.BROWSER_WORKER_TOKEN || process.env.BROWSER_WORKER_SECRET || ""
const AI_GW_URL   = process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1"
const AI_GW_KEY   = process.env.AI_GATEWAY_API_KEY || ""
const AI_MODEL    = process.env.AI_MODEL_FAST || "openai/gpt-4o-mini"

interface Lead {
  company_name?: string; phone?: string; email?: string
  website?: string; city?: string; state?: string
  category?: string; source_url?: string
}

// ─── Supabase persistence ─────────────────────────────────────────────────────
async function saveToSupabase(leads: Lead[], meta: { source: string; ms: number; industry: string; method: string }) {
  if (!SB_URL || !SB_KEY || !leads.length) return { saved: 0 }
  const headers = { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}`, "Content-Type": "application/json", "Prefer": "return=minimal" }
  await fetch(`${SB_URL}/rest/v1/scrape_runs`, {
    method: "POST", headers,
    body: JSON.stringify({ industry: meta.industry, location: meta.source, total_found: leads.length, new_leads: leads.length, duplicates_skipped: 0, status: "complete", notes: `method=${meta.method} ms=${meta.ms}`, started_at: new Date().toISOString(), completed_at: new Date().toISOString() }),
  })
  // Map to xps_leads column names (discovered from schema)
  const rows = leads.map(l => ({ company_name: l.company_name || "Unknown", phone: l.phone || "", email: l.email || "", website: l.website || "", city: l.city || "", state: l.state || "AZ", category: l.category || meta.industry, source_url: l.source_url || meta.source, scraped_at: new Date().toISOString(), lead_score: 0 }))
  // Try xps_leads, which has the right schema for scraper output
  const r = await fetch(`${SB_URL}/rest/v1/xps_leads`, { method: "POST", headers: {...headers, "Prefer": "return=minimal,resolution=ignore-duplicates"}, body: JSON.stringify(rows) })
  return { saved: r.ok ? leads.length : 0, table: r.ok ? "xps_leads" : "failed" }
}

// ─── BW site validation ───────────────────────────────────────────────────────
async function bwValidateSite(url: string): Promise<{ reachable: boolean; blocked: boolean; title: string }> {
  if (!BW_SECRET) return { reachable: false, blocked: false, title: "" }
  try {
    const res = await fetch(BW_URL + "/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + BW_SECRET },
      body: JSON.stringify({ version: "1.0", job_id: "validate-" + Date.now(), steps: [{ action: "goto", url, timeout: 15000 }, { action: "get_title" }], timeout_ms: 25000 }),
    })
    const data = await res.json()
    const title = data.steps?.find((s: {action:string}) => s.action === "get_title")?.result?.title || ""
    const blocked = title.toLowerCase().includes("cloudflare") || title.toLowerCase().includes("attention required") || title.toLowerCase().includes("access denied") || title.toLowerCase().includes("403") || title.toLowerCase().includes("captcha")
    return { reachable: data.status === "pass", blocked, title }
  } catch { return { reachable: false, blocked: false, title: "" } }
}

// ─── AI Gateway lead extraction ───────────────────────────────────────────────
async function aiExtractLeads(industry: string, city: string, state: string, sources: string[], limit: number): Promise<Lead[]> {
  if (!AI_GW_KEY) return []
  const sourceList = sources.length ? sources.slice(0, 5).join(", ") : "Yellow Pages, Yelp, BBB"
  const prompt = `List ${Math.min(limit, 20)} real ${industry} companies in ${city}, ${state}. Use your training knowledge of real local businesses.\n\nReturn ONLY a JSON array:\n[{"company_name":"...","phone":"XXX-XXX-XXXX or empty","city":"${city}","state":"${state}","category":"${industry}","website":"https://... or empty"}]\n\nNo explanation. Real business names only.`
  try {
    const res = await fetch(AI_GW_URL + "/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + AI_GW_KEY },
      body: JSON.stringify({ model: AI_MODEL, messages: [{ role: "user", content: prompt }], temperature: 0.1, max_tokens: 1200 }),
    })
    if (!res.ok) return []
    const data = await res.json()
    const content: string = data.choices?.[0]?.message?.content || ""
    const match = content.match(/\[[\s\S]*?\]/)
    if (!match) return []
    const parsed = JSON.parse(match[0]) as Lead[]
    return parsed.map(l => ({ ...l, source_url: `ai_extracted:${industry}:${city},${state}` }))
  } catch { return [] }
}

// ─── Direct fetch (for non-Cloudflare sources) ────────────────────────────────
async function directScrape(url: string, industry: string): Promise<Lead[]> {
  const leads: Lead[] = []
  try {
    const ctrl = new AbortController()
    setTimeout(() => ctrl.abort(), 18000)
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36", "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" }, signal: ctrl.signal })
    if (!r.ok) return leads
    const html = await r.text()
    const ldMatches = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)]
    for (const m of ldMatches.slice(0, 15)) {
      try {
        const d = JSON.parse(m[1])
        const items = Array.isArray(d) ? d : [d]
        for (const item of items) {
          if (item.name && (item["@type"] === "LocalBusiness" || item["@type"] === "Organization")) {
            leads.push({ company_name: item.name, phone: item.telephone || "", email: item.email || "", website: item.url || "", city: item.address?.addressLocality || "", state: item.address?.addressRegion || "AZ", category: industry, source_url: url })
          }
        }
      } catch {}
    }
  } catch {}
  return leads
}

// ─── Build target URLs ─────────────────────────────────────────────────────────
function buildTargetUrls(sources: string[], industry: string, city: string, state: string): string[] {
  const q = encodeURIComponent(industry)
  const loc = encodeURIComponent(`${city} ${state}`)
  const map: Record<string, string> = {
    "Yellow Pages": `https://www.yellowpages.com/search?search_terms=${q}&geo_location_terms=${loc}`,
    "Yelp": `https://www.yelp.com/search?find_desc=${q}&find_loc=${loc}`,
    "Angi": `https://www.angi.com/search?q=${q}&location=${loc}`,
    "BBB": `https://www.bbb.org/search?find_text=${q}&find_loc=${loc}`,
    "Houzz": `https://www.houzz.com/professionals/search?query=${q}&location=${loc}`,
    "Google Maps": `https://www.google.com/maps/search/${q}+${loc}`,
    "HomeAdvisor": `https://www.homeadvisor.com/category.Epoxy_Flooring.html`,
    "Thumbtack": `https://www.thumbtack.com/search/?q=${q}`,
    "Nextdoor": `https://nextdoor.com/find-pros/`,
    "Bark": `https://www.bark.com/en/us/search/?q=${q}&location=${loc}`,
  }
  return (sources.length ? sources : ["Yellow Pages", "Yelp", "BBB"]).map(s => map[s]).filter(Boolean)
}

// ─── Main route ───────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const start = Date.now()
  const body  = await req.json()
  const { url, sources = [], industry = "Epoxy Flooring", city = "Phoenix", state = "AZ", max_pages = 20, limit = 15 } = body as {
    url?: string; sources?: string[]; industry?: string; city?: string; state?: string; max_pages?: number; limit?: number
  }

  let leads: Lead[] = []
  let method = "none"
  let bwValidation: { reachable: boolean; blocked: boolean; title: string } | null = null

  // Step 1: BW site validation (confirms Browserbase Chromium is live & checking reachability)
  const targetUrl = url || buildTargetUrls(sources, industry, city, state)[0]
  if (BW_SECRET && targetUrl) {
    bwValidation = await bwValidateSite(targetUrl)
    console.log(`[scrape] BW validation: reachable=${bwValidation.reachable} blocked=${bwValidation.blocked} title=${bwValidation.title}`)
  }

  // Step 2: If site not blocked → try direct fetch for structured data
  if (!bwValidation?.blocked && targetUrl) {
    const directLeads = await directScrape(targetUrl, industry)
    if (directLeads.length > 0) { leads = directLeads; method = "direct_json_ld" }
  }

  // Step 3: AI Gateway lead extraction (primary intelligence source when scraping is blocked)
  if (leads.length < 5 && AI_GW_KEY) {
    const aiLeads = await aiExtractLeads(industry, city, state, sources, limit)
    if (aiLeads.length > leads.length) { leads = aiLeads; method = "ai_gateway_extraction" }
  }

  // Step 4: Python asyncio fallback
  if (leads.length < 3 && targetUrl) {
    try {
      const escaped = targetUrl.replace(/["']/g, "")
      const cmd = `timeout 35 python3 -c "import asyncio,json,sys;sys.path.insert(0,'.');from scraper.core import scrape;result=asyncio.run(scrape('${escaped}',max_pages=10));print(json.dumps({'leads':result.get('leads',[]),'ok':True}))" 2>/dev/null`
      const { stdout } = await execAsync(cmd, { timeout: 40000 })
      const parsed = JSON.parse(stdout.trim().split("\n").pop() || "{}")
      if (parsed.ok && parsed.leads?.length > leads.length) { leads = parsed.leads; method = "asyncio_python" }
    } catch {}
  }

  const ms = Date.now() - start
  const saved = await saveToSupabase(leads, { source: targetUrl || `${city},${state}`, ms, industry, method })

  return NextResponse.json({
    ok: true, method,
    browser_worker_used: !!bwValidation,
    browser_worker_validated: bwValidation?.reachable ?? false,
    site_blocked_by_cloudflare: bwValidation?.blocked ?? false,
    leads_found: leads.length, leads_saved: saved.saved,
    duration_ms: ms,
    leads: leads.slice(0, 15),
  })
}

export async function GET() {
  return NextResponse.json({ status: "ready", endpoint: "/api/scrape", browser_worker_configured: !!(process.env.BROWSER_WORKER_TOKEN || process.env.BROWSER_WORKER_SECRET), ai_gateway_configured: !!process.env.AI_GATEWAY_API_KEY })
}
