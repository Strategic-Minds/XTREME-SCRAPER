import { NextRequest, NextResponse } from 'next/server'
import { parseEmailToBid, enrichAddress } from '@/lib/bid-parser'
import { runTakeoff } from '@/lib/bid-takeoff'
import { applyPricing, DEFAULT_CONTRACTOR_CONFIG } from '@/lib/bid-pricing'
import { generateProposalHTML } from '@/lib/bid-proposal'
import type { ProposalData } from '@/lib/bid-proposal'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function proposalNumber(): string {
  const d = new Date()
  return `XS-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${Math.floor(Math.random()*9000)+1000}`
}

function addDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })
}

export async function POST(req: NextRequest) {
  const start = Date.now()
  try {
    const body = await req.json().catch(() => ({}))
    const email_text: string = body.email_text || ''
    if (!email_text || email_text.length < 20) {
      return NextResponse.json({ ok: false, error: 'email_text required' }, { status: 400 })
    }

    // Step 1: Parse email
    const job = await parseEmailToBid(email_text)

    // Step 2: Enrich address (non-blocking)
    const enrichment = job.job_address
      ? await enrichAddress(job.job_address, job.job_city, job.job_state).catch(() => null)
      : null

    // Step 3: Takeoff
    const config = { ...DEFAULT_CONTRACTOR_CONFIG, ...(body.config || {}) }
    const takeoff = runTakeoff(job, config)

    // Step 4: Pricing
    const pricing = applyPricing(takeoff, config)

    // Step 5: Build proposal data
    const contractor = body.contractor || {}
    const validity_days = contractor.default_validity_days || config.default_validity_days || 30

    const proposalData: ProposalData = {
      contractor_name:    contractor.business_name || 'Your Company Name',
      contractor_email:   contractor.email || '',
      contractor_phone:   contractor.phone || '',
      contractor_address: contractor.address ? `${contractor.address}, ${contractor.city}, ${contractor.state}` : '',
      contractor_license: contractor.license_number,
      contractor_logo_url: contractor.logo_url,
      proposal_footer:    contractor.proposal_footer,
      job,
      takeoff,
      pricing,
      proposal_number: proposalNumber(),
      proposal_date:   new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }),
      valid_until:     addDays(validity_days),
      payment_terms:   contractor.default_payment_terms || config.default_payment_terms,
      scope_of_work:   body.scope_of_work
    }

    // Step 6: Generate HTML
    const html = generateProposalHTML(proposalData)

    return NextResponse.json({
      ok: true,
      proposal_number: proposalData.proposal_number,
      job,
      takeoff,
      pricing,
      enrichment,
      html,
      duration_ms: Date.now() - start
    })
  } catch (err) {
    console.error('[bid/proposal]', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
