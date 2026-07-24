import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, verifyToken } from '@/lib/auth'
import { enforceRequestLimit } from '@/lib/request-guard'
import { sourceDecision } from '@/lib/source-policy'

export const dynamic = 'force-dynamic'

const FIELDS = ['company_name','phone','email','website','address','city','state','category','source','confidence','opportunity_score'] as const

function csvCell(value: unknown): string {
  let text = value == null ? '' : String(value)
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}

export async function POST(req: NextRequest) {
  const rate = await enforceRequestLimit(req, 'export', 8, 60)
  if (!rate.allowed) return NextResponse.json({ ok: false, error: 'Export rate limit exceeded.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } })

  const body = await req.json().catch(() => null) as { format?: string; records?: Record<string, unknown>[]; dry_run?: boolean } | null
  if (!body || body.format !== 'csv' || !Array.isArray(body.records)) return NextResponse.json({ ok: false, error: 'format=csv and records[] are required' }, { status: 422 })

  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? await verifyToken(token) : null
  if (!session && body.dry_run !== true) return NextResponse.json({ ok: false, error: 'Authentication required for persistent exports.' }, { status: 401 })

  const records = body.records.slice(0, body.dry_run ? 100 : 500).filter(record => sourceDecision(String(record.source || 'unknown')) === 'allow')
  if (!records.length) return NextResponse.json({ ok: false, error: 'No source-backed records are eligible for export.' }, { status: 422 })

  const csv = [FIELDS.join(','), ...records.map(record => FIELDS.map(field => csvCell(record[field])).join(','))].join('\n')
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="xps-intelligence-${new Date().toISOString().slice(0,10)}.csv"`,
      'Cache-Control': 'no-store',
      'X-Export-Records': String(records.length),
      'X-Export-Mode': body.dry_run ? 'preview' : 'authenticated',
    },
  })
}
