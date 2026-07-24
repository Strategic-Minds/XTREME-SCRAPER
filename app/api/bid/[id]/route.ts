import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

// Placeholder — connects to Supabase bid_proposals table
// For now returns 404 until Supabase schema is wired
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ ok: false, error: 'Bid retrieval via Supabase — coming soon', id: params.id }, { status: 404 })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}))
  return NextResponse.json({ ok: true, message: 'Bid update acknowledged', id: params.id, updates: body })
}
