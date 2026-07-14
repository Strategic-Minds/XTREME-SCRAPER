import { NextRequest, NextResponse } from "next/server"
export const dynamic = "force-dynamic"

const SB_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export async function GET(req: NextRequest) {
  if (!SB_URL || !SB_KEY) return NextResponse.json([])
  const limit = new URL(req.url).searchParams.get("limit") || "50"
  try {
    const r = await fetch(
      `${SB_URL}/rest/v1/leads?select=*&order=scraped_at.desc&limit=${limit}`,
      { headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` }, cache: "no-store" }
    )
    return NextResponse.json(r.ok ? await r.json() : [])
  } catch { return NextResponse.json([]) }
}
