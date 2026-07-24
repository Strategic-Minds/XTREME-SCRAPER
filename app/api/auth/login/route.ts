import { NextRequest, NextResponse } from 'next/server'
import { createMagicLink, sendMagicLinkEmail, upsertUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || !email.includes('@')) return NextResponse.json({ ok: false, error: 'Valid email required' }, { status: 400 })
    const clean = email.toLowerCase().trim()
    await upsertUser(clean)
    const token = await createMagicLink(clean)
    if (!token) return NextResponse.json({ ok: false, error: 'Failed to create link' }, { status: 500 })
    const baseUrl = req.nextUrl.origin
    const sent = await sendMagicLinkEmail(clean, token, baseUrl)
    return NextResponse.json({ ok: true, sent, message: sent ? 'Check your email for your login link.' : 'Email delivery unavailable — use verify endpoint manually.' })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}