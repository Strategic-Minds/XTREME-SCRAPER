import { NextRequest, NextResponse } from 'next/server'

const AGENT_ID = process.env.BASE44_AGENT_ID || '69db047707a15d69135e3de9'
const CONV_ID  = process.env.BASE44_CONV_ID  || '69db04786e1e12f6317e2274'
const API_KEY  = process.env.BASE44_API_KEY  || process.env.BASE_URL_AGENT_KEY || ''
const BASE_URL = 'https://app.base44.com/api/agents'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const message = body.message || body.content || ''
  const convId  = body.conversation_id || CONV_ID
  if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 })

  const ctrl = new AbortController()
  setTimeout(() => ctrl.abort(), 25000)

  try {
    const res = await fetch(`${BASE_URL}/${AGENT_ID}/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { 'api_key': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'user', content: message }),
      signal: ctrl.signal,
    })
    if (!res.ok) {
      const err = await res.text()
      // Fallback to Groq if Base44 unavailable
      const groqResp = await groqFallback(message)
      if (groqResp) return NextResponse.json({ content: groqResp, provider: 'groq_fallback' })
      return NextResponse.json({ error: err }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json({ ...data, provider: 'base44', agent: AGENT_ID })
  } catch (e: unknown) {
    const groqResp = await groqFallback(message)
    if (groqResp) return NextResponse.json({ content: groqResp, provider: 'groq_fallback' })
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

async function groqFallback(message: string): Promise<string | null> {
  const key = (process.env.GROQ_API_KEY ?? '').trim()
  if (!key) return null
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are ARIA, the intelligence layer for XTREME-SCRAPER — an autonomous web intelligence and lead discovery system for Xtreme Polishing Systems (XPS) and Strategic Minds AI.' },
          { role: 'user', content: message }
        ],
        max_tokens: 600,
      }),
    })
    const d = await r.json() as { choices?: Array<{ message: { content: string } }> }
    return d?.choices?.[0]?.message?.content?.trim() ?? null
  } catch { return null }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const convId = searchParams.get('conversation_id') || CONV_ID
  try {
    const res = await fetch(`${BASE_URL}/${AGENT_ID}/conversations/${convId}/messages`, {
      headers: { 'api_key': API_KEY }
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}