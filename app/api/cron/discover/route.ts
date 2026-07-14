import { NextRequest, NextResponse } from "next/server"
export const dynamic    = "force-dynamic"
export const maxDuration = 60

const SB_URL    = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const SB_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const CRON_SEC  = process.env.CRON_SECRET || ""

const AZ_TARGETS = [
  "https://www.yellowpages.com/phoenix-az/mip/epoxy-flooring",
  "https://www.yellowpages.com/scottsdale-az/mip/epoxy-flooring",
  "https://www.yellowpages.com/tucson-az/mip/epoxy-flooring",
  "https://www.yellowpages.com/mesa-az/mip/epoxy-flooring",
  "https://www.yelp.com/search?find_desc=epoxy+flooring&find_loc=Phoenix%2C+AZ",
  "https://www.yelp.com/search?find_desc=garage+floor+coating&find_loc=Scottsdale%2C+AZ",
  "https://www.yelp.com/search?find_desc=concrete+polishing&find_loc=Phoenix%2C+AZ",
]

export async function GET(req: NextRequest) {
  const sec = req.headers.get("x-cron-secret") || req.headers.get("authorization")?.replace("Bearer ","")
  if (CRON_SEC && sec !== CRON_SEC) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const start   = Date.now()
  const base    = req.nextUrl.origin
  const results = []
  let   total   = 0

  for (const url of AZ_TARGETS) {
    try {
      const r = await fetch(`${base}/api/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, industry: "Epoxy Flooring", max_pages: 30 }),
      })
      const d = await r.json()
      results.push({ url, leads: d.leads_saved ?? 0, ok: r.ok })
      total += d.leads_saved ?? 0
    } catch (e) {
      results.push({ url, leads: 0, ok: false, error: String(e) })
    }
  }

  return NextResponse.json({
    ok: true, run_date: new Date().toISOString(),
    targets: AZ_TARGETS.length,
    total_leads_saved: total,
    duration_ms: Date.now() - start,
    results,
  })
}
