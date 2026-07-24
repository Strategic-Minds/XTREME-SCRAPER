import { NextRequest, NextResponse } from 'next/server'
import { buildIntelligenceResult, type LeadRecord } from '@/lib/xps-intelligence'
import { sourceDecision } from '@/lib/source-policy'
import { enforceRequestLimit } from '@/lib/request-guard'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const rate = await enforceRequestLimit(req, 'score', 30, 60)
  if (!rate.allowed) return NextResponse.json({ ok:false,error:'Scoring rate limit exceeded.' },{status:429,headers:{'Retry-After':String(rate.retryAfter)}})
  const body = await req.json().catch(()=>null) as { record?:LeadRecord; records?:LeadRecord[] } | null
  const records = body?.records || (body?.record ? [body.record] : [])
  if (!records.length) return NextResponse.json({ok:false,error:'record or records[] required'},{status:422})
  if (records.length > 100) return NextResponse.json({ok:false,error:'maximum 100 records per request'},{status:422})
  const quarantined = records.filter(record=>sourceDecision(record.source)!=='allow')
  const allowed = records.filter(record=>sourceDecision(record.source)==='allow')
  const scores = allowed.map(buildIntelligenceResult)
  return NextResponse.json({ok:true,model_version:'rules-v1.0',predictive:false,scores,quarantined_count:quarantined.length,limitations:['Scores reflect available record fields, not guaranteed buying intent, revenue, response probability, or business quality.']},{headers:{'Cache-Control':'no-store'}})
}
