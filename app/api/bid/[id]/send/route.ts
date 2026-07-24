import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}))
  const to: string = body.to || ''
  const subject: string = body.subject || 'Your Project Proposal'
  const html: string = body.html || ''

  if (!to || !html) {
    return NextResponse.json({ ok: false, error: 'to and html required' }, { status: 400 })
  }

  const RESEND_KEY = process.env.RESEND_API_KEY || ''
  if (!RESEND_KEY) {
    return NextResponse.json({ ok: false, error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'proposals@xtremeai.com',
        to,
        subject,
        html,
        reply_to: body.reply_to
      })
    })
    const result = await res.json() as { id?: string; error?: string }
    if (!res.ok) return NextResponse.json({ ok: false, error: result.error || 'Send failed' }, { status: 500 })
    return NextResponse.json({ ok: true, email_id: result.id, bid_id: params.id })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
