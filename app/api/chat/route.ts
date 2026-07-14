import { NextRequest, NextResponse } from 'next/server'

const BASE44_AGENT_URL = 'https://app.base44.com/api/agents/6a3a1cc6fda8cc665dd22ea4'
const BASE44_KEY = process.env.BASE_URL_AGENT_KEY || ''

export async function POST(req: NextRequest) {
  const { message, conversation_id } = await req.json()
  if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 })
  
  const convId = conversation_id || '6a3a1ccae7bbd796cdbce5c5'
  
  try {
    const res = await fetch(`${BASE44_AGENT_URL}/conversations/${convId}/messages`, {
      method: 'POST',
      headers: {
        'api_key': BASE44_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'user', content: message }),
    })
    
    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: err }, { status: res.status })
    }
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const convId = searchParams.get('conversation_id') || '6a3a1ccae7bbd796cdbce5c5'
  try {
    const res = await fetch(`${BASE44_AGENT_URL}/conversations/${convId}/messages`, {
      headers: { 'api_key': BASE44_KEY }
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
