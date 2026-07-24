import { NextRequest, NextResponse } from 'next/server'
import { runTakeoff } from '@/lib/bid-takeoff'
import { applyPricing, DEFAULT_CONTRACTOR_CONFIG } from '@/lib/bid-pricing'
import type { ParsedBidJob } from '@/lib/bid-parser'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const job: ParsedBidJob = body.job
    if (!job || !job.job_type) {
      return NextResponse.json({ ok: false, error: 'job object with job_type required' }, { status: 400 })
    }

    const config = { ...DEFAULT_CONTRACTOR_CONFIG, ...(body.config || {}) }
    const takeoff = runTakeoff(job, config)
    const pricing = applyPricing(takeoff, config)

    return NextResponse.json({ ok: true, takeoff, pricing })
  } catch (err) {
    console.error('[bid/takeoff]', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
