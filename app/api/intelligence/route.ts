import { NextRequest, NextResponse } from 'next/server'
import { dispatchIntelligence } from '@/lib/intelligence-modes'

export const dynamic     = 'force-dynamic'
export const maxDuration = 60

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest) {
  try {
    const body    = await req.json()
    const mode    = body.mode || 'flash'
    const query   = body.query || ''
    const city    = body.city || ''
    const state   = body.state || ''
    const leads   = Array.isArray(body.leads) ? body.leads : []
    const sources = Array.isArray(body.sources) ? body.sources : []
    const keywords = Array.isArray(body.keywords) ? body.keywords : []

    if (!leads.length) return json({ ok: false, error: 'leads array required' }, 400)

    const intel = await dispatchIntelligence(mode, query, city, state, leads, sources, keywords)
    return json({ ok: true, mode, intel })
  } catch (e) {
    console.error('[intelligence]', e)
    return json({ ok: false, error: 'Intelligence generation failed' }, 500)
  }
}
