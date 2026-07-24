import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const CRON_SECRET = process.env.CRON_SECRET || ''

function authed(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') || ''
  const sec  = req.headers.get('x-cron-secret') || ''
  return auth === `Bearer ${CRON_SECRET}` || sec === CRON_SECRET
}

const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS universal_leads (
    id BIGSERIAL PRIMARY KEY,
    company_name TEXT NOT NULL,
    phone TEXT, email TEXT, website TEXT, address TEXT,
    city TEXT, state TEXT, country TEXT DEFAULT 'US',
    rating DECIMAL(3,1), review_count INTEGER DEFAULT 0,
    category TEXT, source TEXT, confidence INTEGER DEFAULT 50,
    legal_entity_name TEXT, entity_status TEXT,
    formation_date TEXT, registered_agent TEXT,
    license_status TEXT, license_number TEXT,
    had_website BOOLEAN, historical_phones JSONB,
    web_presence_score INTEGER, lawsuit_signals BOOLEAN,
    enrichment_confidence INTEGER, enrichment_sources JSONB,
    search_query TEXT, run_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_name, city, state)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_ul_query ON universal_leads(search_query)`,
  `CREATE INDEX IF NOT EXISTS idx_ul_city  ON universal_leads(city, state)`,
  `CREATE TABLE IF NOT EXISTS enrichment_cache (
    cache_key TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    city TEXT, state TEXT,
    data JSONB NOT NULL,
    enriched_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_ec_ts ON enrichment_cache(enriched_at DESC)`,
  `CREATE TABLE IF NOT EXISTS person_searches (
    id BIGSERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    company TEXT, city TEXT, state TEXT,
    result JSONB NOT NULL,
    searched_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_ps_name ON person_searches(full_name)`,
  `CREATE TABLE IF NOT EXISTS search_runs (
    id BIGSERIAL PRIMARY KEY,
    query TEXT NOT NULL,
    city TEXT, state TEXT,
    mode TEXT, intelligence_mode TEXT,
    results_count INTEGER DEFAULT 0,
    sources_used JSONB DEFAULT '[]',
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_sr_query ON search_runs(query)`,
  `CREATE INDEX IF NOT EXISTS idx_sr_ts    ON search_runs(created_at DESC)`,
]

export async function POST(req: NextRequest) {
  if (!authed(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const SB_URL  = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const SB_SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!SB_URL || !SB_SKEY) {
    return NextResponse.json({ ok: false, error: 'Missing Supabase credentials' }, { status: 500 })
  }

  const db = createClient(SB_URL, SB_SKEY, { auth: { persistSession: false } })

  const results: { sql: string; ok: boolean; error?: string }[] = []

  for (const sql of MIGRATIONS) {
    try {
      const { error } = await db.rpc('exec_sql', { sql }).single()
      if (error && !error.message.includes('already exists')) {
        // Try direct query
        const { error: qErr } = await (db as ReturnType<typeof createClient>).from('_migrations').select('*').limit(0)
        results.push({ sql: sql.slice(0, 60), ok: !error, error: error?.message })
      } else {
        results.push({ sql: sql.slice(0, 60), ok: true })
      }
    } catch (e) {
      results.push({ sql: sql.slice(0, 60), ok: false, error: String(e) })
    }
  }

  const passed = results.filter(r => r.ok).length
  return NextResponse.json({
    ok: true,
    migrations_run: MIGRATIONS.length,
    passed,
    failed: MIGRATIONS.length - passed,
    results,
  })
}

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    endpoint: '/api/migrate',
    description: 'Run database migrations — creates universal_leads, enrichment_cache, person_searches, search_runs tables',
    requires_auth: true,
  })
}
