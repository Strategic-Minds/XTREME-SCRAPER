import { NextResponse } from "next/server"
export const dynamic    = "force-dynamic"
export const revalidate = 0

const SB_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

async function count(table: string, qs = "") {
  if (!SB_URL || !SB_KEY) return 0
  try {
    const r = await fetch(`${SB_URL}/rest/v1/${table}?select=count${qs}`, {
      headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}`, "Prefer": "count=exact" },
      cache: "no-store",
    })
    return parseInt(r.headers.get("Content-Range")?.split("/")[1] || "0", 10) || 0
  } catch { return 0 }
}

export async function GET() {
  const yesterday = new Date(Date.now() - 86400000).toISOString()
  const [total, today, runs] = await Promise.all([
    count("leads"),
    count("leads", `&scraped_at=gte.${yesterday}`),
    count("scrape_runs"),
  ])
  return NextResponse.json({ total_leads: total, new_today: today, total_runs: runs })
}
