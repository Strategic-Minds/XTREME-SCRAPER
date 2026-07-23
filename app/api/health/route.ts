import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

const SB_URL  = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SB_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const GM_KEY  = process.env.GOOGLE_MAPS_API_KEY || ''
const AI_KEY  = process.env.AI_GATEWAY_API_KEY || ''
const AP_KEY  = process.env.APOLLO_API_KEY_2 || ''

export async function GET() {
  const start = Date.now()
  let db = false
  try {
    const r = await fetch(`${SB_URL}/rest/v1/xps_leads?select=count&limit=1`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    })
    db = r.ok
  } catch {}

  return NextResponse.json({
    status:     'healthy',
    version:    '3.1.0',
    db_connected:   db,
    configured: {
      google_maps: !!GM_KEY,
      ai_gateway:  !!AI_KEY,
      apollo:      !!AP_KEY,
      yelp:        !!process.env.YELP_API_KEY,
      bing_maps:   !!process.env.BING_MAPS_KEY,
    },
    ts:         new Date().toISOString(),
    latency_ms: Date.now() - start,
  }, {
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
  })
}
