import { NextRequest, NextResponse } from 'next/server'
import { dispatchIntelligence, type IntelligenceMode, type L5Lead } from '@/lib/intelligence-modes'
import { partitionBySourcePolicy } from '@/lib/source-policy'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>
    const mode: IntelligenceMode = ['flash', 'deep', 'counter_intel'].includes(String(body.mode))
      ? String(body.mode) as IntelligenceMode
      : 'flash'
    const query = typeof body.query === 'string' ? body.query : ''
    const city = typeof body.city === 'string' ? body.city : ''
    const state = typeof body.state === 'string' ? body.state : ''
    const leads = Array.isArray(body.leads) ? body.leads as L5Lead[] : []
    const sources = Array.isArray(body.sources) ? body.sources.filter(item => typeof item === 'string') as string[] : []
    const keywords = Array.isArray(body.keywords) ? body.keywords.filter(item => typeof item === 'string') as string[] : []

    if (!leads.length) return json({ ok: false, error: 'leads array required' }, 400)
    const policy = partitionBySourcePolicy(leads)
    if (!policy.allowed.length) {
      return json({ ok: false, error: 'No source-backed records were supplied.', quarantined_count: policy.quarantined.length }, 422)
    }

    const intel = await dispatchIntelligence(mode, policy.allowed, query, city, state, sources, keywords)
    return json({ ok: true, mode, intel, quarantined_count: policy.quarantined.length })
  } catch (error) {
    console.error('[intelligence]', error)
    return json({ ok: false, error: 'Intelligence generation failed safely.' }, 500)
  }
}
