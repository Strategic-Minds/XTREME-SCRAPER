import { NextRequest, NextResponse } from 'next/server'
import { searchPerson } from '@/lib/enrichment-engine'

export const dynamic     = 'force-dynamic'
export const maxDuration = 30

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, full_name, company, city, state, title } = body
    const resolvedName = full_name || name
    if (!resolvedName || typeof resolvedName !== 'string' || resolvedName.trim().length < 2) {
      return json({ ok: false, error: 'name is required' }, 400)
    }
    const profile = await searchPerson(resolvedName.trim(), { company, city, state, title })
    return json({ ok: true, profile })
  } catch (e) {
    console.error('[person]', e)
    return json({ ok: false, error: 'Person search failed' }, 500)
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const name    = searchParams.get('name') || searchParams.get('q')
  const company = searchParams.get('company') || undefined
  const city    = searchParams.get('city') || undefined
  const state   = searchParams.get('state') || undefined
  if (!name) return json({ ok: false, error: 'name param required' }, 400)
  const profile = await searchPerson(name, { company, city, state })
  return json({ ok: true, profile })
}
