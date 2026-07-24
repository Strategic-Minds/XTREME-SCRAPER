import { NextRequest, NextResponse } from 'next/server'
import { parseEmailToBid, enrichAddress } from '@/lib/bid-parser'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const start = Date.now()
  try {
    const body = await req.json().catch(() => ({}))
    const email_text: string = body.email_text || body.email || ''
    if (!email_text || email_text.length < 20) {
      return NextResponse.json({ ok: false, error: 'email_text is required (min 20 chars)' }, { status: 400 })
    }

    const parsed = await parseEmailToBid(email_text)

    // Enrich address if we have one
    let enrichment = null
    if (parsed.job_address && parsed.job_city) {
      enrichment = await enrichAddress(parsed.job_address, parsed.job_city, parsed.job_state)
    }

    return NextResponse.json({
      ok: true,
      parsed,
      enrichment,
      duration_ms: Date.now() - start
    })
  } catch (err) {
    console.error('[bid/parse]', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
