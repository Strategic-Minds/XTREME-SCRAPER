import { NextRequest, NextResponse } from 'next/server'
const BASE44_AGENT = 'https://app.base44.com/api/agents/6a3a1cc6fda8cc665dd22ea4'
const CONV_ID = '6a3a1ccae7bbd796cdbce5c5'
export async function POST(req: NextRequest) {
  const { message } = await req.json()
  if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 })
  const KEY = process.env.BASE_URL_AGENT_KEY || ''
  const OKEY = process.env.OPENAI_API_KEY || ''
  if (KEY) {
    try {
      const res = await fetch(`${BASE44_AGENT}/conversations/${CONV_ID}/messages`,{method:'POST',headers:{'api_key':KEY,'Content-Type':'application/json'},body:JSON.stringify({role:'user',content:message}),signal:AbortSignal.timeout(15000)})
      if(res.ok){const d=await res.json();return NextResponse.json({content:d?.content||d?.message||JSON.stringify(d),source:'base44'})}
    } catch{}
  }
  if (OKEY) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Authorization':`Bearer ${OKEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-4o-mini',messages:[{role:'system',content:'You are APEX, the XTREME-SCRAPER intelligence agent. Concise, strategic, data-driven.'},{role:'user',content:message}],max_tokens:512})})
      const d=await res.json();return NextResponse.json({content:d?.choices?.[0]?.message?.content||'No response',source:'openai'})
    } catch(e:any){return NextResponse.json({content:`Error: ${e.message}`,source:'error'})}
  }
  return NextResponse.json({content:'APEX ready. Configure API keys to enable live responses.',source:'mock'})
}
