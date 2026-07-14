import { NextRequest, NextResponse } from 'next/server'
const sessions = new Map<string,any>()
export async function POST(req: NextRequest) {
  const { targets=[],num_agents=5 } = await req.json()
  const sessionId = `swarm_${Date.now()}`
  const session = { session_id:sessionId, targets, num_agents, status:'running', started_at:new Date().toISOString(), tasks:targets.map((url:string,i:number)=>({task_id:`XS-T-${String(i+1).padStart(3,'0')}`,url,status:'queued',agent:null,pages:0})) }
  sessions.set(sessionId, session)
  let i=0
  const tick = setInterval(()=>{ const s=sessions.get(sessionId); if(!s){clearInterval(tick);return} if(i<s.tasks.length){s.tasks[i].status='done';s.tasks[i].agent=`XS-${String((i%num_agents)+1).padStart(3,'0')}`;s.tasks[i].pages=Math.floor(Math.random()*60)+20;i++}else{s.status='complete';s.completed_at=new Date().toISOString();clearInterval(tick)} },1000)
  return NextResponse.json(session)
}
export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('session_id')
  if(id){const s=sessions.get(id);return s?NextResponse.json(s):NextResponse.json({error:'not found'},{status:404})}
  return NextResponse.json({sessions:Array.from(sessions.values()).slice(-10),total:sessions.size})
}
