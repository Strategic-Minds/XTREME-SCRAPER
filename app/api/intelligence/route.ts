import { NextRequest, NextResponse } from 'next/server'
import { dispatchIntelligence, type IntelligenceMode } from '@/lib/intelligence-modes'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function reqId() { return Math.random().toString(36).slice(2,10).toUpperCase() }
function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Request-Id': reqId() } })
}

export async function POST(req: NextRequest) {
  const rid = reqId()
  let body: unknown
  try { body = await req.json() } catch { return json({ ok: false, error: 'Invalid JSON', request_id: rid }, 400) }
  const b = body as Record<string, unknown>
  const mode: IntelligenceMode = ['flash','deep','counter_intel'].includes(String(b.mode)) ? String(b.mode) as IntelligenceMode : 'deep'
  const leads    = Array.isArray(b.leads) ? b.leads : []
  const query    = typeof b.query === 'string' ? b.query.trim() : ''
  const city     = typeof b.city === 'string' ? b.city.trim() : 'Phoenix'
  const state    = typeof b.state === 'string' ? b.state.trim().toUpperCase() : 'AZ'
  const sources  = Array.isArray(b.sources) ? b.sources : []
  const keywords = Array.isArray(b.keywords) ? b.keywords : []
  if (!query) return json({ ok: false, error: 'query required', request_id: rid }, 422)
  if (!leads.length) return json({ ok: false, error: 'leads array required', request_id: rid }, 422)
  try {
    const result = await dispatchIntelligence(mode, leads, query, city, state, sources, keywords)
    return json({ ok: true, request_id: rid, ...result })
  } catch (err) {
    console.error(`[${rid}][intelligence]`, err)
    return json({ ok: false, error: 'Intelligence generation failed', request_id: rid }, 500)
  }
}

export async function GET() {
  return json({
    status: 'ready',
    endpoint: '/api/intelligence',
    description: '3-mode intelligence delivery - pass existing leads array and choose your mode',
    modes: {
      flash: 'Fast. Top 5 ranked results with one-liner per result. No analysis. Instant.',
      deep: 'Full market briefing. What we found, market picture, hidden gems, next steps. Instant.',
      counter_intel: 'Insider briefing. What Google hides, who benefits, probability call. AI-enhanced voice. 3-5s.',
    },
    usage: {
      method: 'POST',
      body: { mode: 'flash | deep | counter_intel', query: 'stone polishing', city: 'Phoenix', state: 'AZ', leads: '[array from /api/search]', sources: '[sources_used from /api/search]', keywords: '[keywords_expanded from /api/search]' }
    }
  })
}
