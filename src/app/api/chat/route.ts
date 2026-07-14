import { NextRequest, NextResponse } from 'next/server'

const BASE44_AGENT = 'https://app.base44.com/api/agents/6a3a1cc6fda8cc665dd22ea4'
const BASE44_KEY = process.env.BASE_URL_AGENT_KEY || ''
const CONV_ID = '6a3a1ccae7bbd796cdbce5c5'
const OPENAI_KEY = process.env.OPENAI_API_KEY || ''

export async function POST(req: NextRequest) {
  const { message, conversation_id } = await req.json()
  if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 })

  const convId = conversation_id || CONV_ID

  // Try Base44 agent first
  if (BASE44_KEY) {
    try {
      const res = await fetch(`${BASE44_AGENT}/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'api_key': BASE44_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content: message }),
        signal: AbortSignal.timeout(15000),
      })
      if (res.ok) {
        const data = await res.json()
        return NextResponse.json({ content: data?.content || data?.message || JSON.stringify(data), source: 'base44' })
      }
    } catch {}
  }

  // Fallback: OpenAI
  if (OPENAI_KEY) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are APEX, the XTREME-SCRAPER intelligence agent. You analyze scraped data, coordinate swarm agents, and provide competitive intelligence. Be concise and strategic.' },
            { role: 'user', content: message }
          ],
          max_tokens: 512
        })
      })
      const data = await res.json()
      const reply = data?.choices?.[0]?.message?.content || 'No response'
      return NextResponse.json({ content: reply, source: 'openai' })
    } catch (e: any) {
      return NextResponse.json({ content: `Error: ${e.message}`, source: 'error' })
    }
  }

  return NextResponse.json({ content: 'APEX online. Configure BASE_URL_AGENT_KEY or OPENAI_API_KEY to enable live responses.', source: 'mock' })
}
