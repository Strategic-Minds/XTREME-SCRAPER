import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const required = ['JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
  const optional = ['GOOGLE_MAPS_API_KEY', 'APOLLO_API_KEY_2', 'FIRECRAWL_API_KEY', 'BROWSER_WORKER_SECRET', 'AI_GATEWAY_API_KEY', 'UPSTASH_REDIS_REST_URL']
  const missingRequired = required.filter(name => !process.env[name])
  return NextResponse.json({
    ok: missingRequired.length === 0,
    product: 'XPS Intelligence',
    version: '1.1.0-preview',
    status: missingRequired.length ? 'degraded' : 'ready',
    required_configuration: { configured: required.filter(name => !!process.env[name]), missing: missingRequired },
    optional_capabilities: Object.fromEntries(optional.map(name => [name, Boolean(process.env[name])])),
    timestamp: new Date().toISOString(),
  }, { status: missingRequired.length ? 503 : 200, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
}
