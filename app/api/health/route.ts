import { NextResponse } from "next/server"
export const dynamic = "force-dynamic"
const SB_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
export async function GET() {
  let db = false
  try {
    const r = await fetch(`${SB_URL}/rest/v1/leads?select=count&limit=1`, {
      headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` }, cache: "no-store"
    })
    db = r.ok
  } catch {}
  return NextResponse.json({ status: "healthy", db_connected: db, ts: new Date().toISOString() })
}
