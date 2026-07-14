import { NextRequest, NextResponse } from 'next/server'

const activeSessions: Map<string, any> = new Map()

export async function POST(req: NextRequest) {
  const { targets, num_agents = 5, max_pages = 30 } = await req.json()
  if (!targets?.length) return NextResponse.json({ error: 'targets array required' }, { status: 400 })
  
  const sessionId = `swarm_${Date.now()}`
  const session = {
    session_id: sessionId,
    targets,
    num_agents,
    status: 'running',
    started_at: new Date().toISOString(),
    tasks: targets.map((url: string, i: number) => ({
      task_id: `XS-T-${i+1}`,
      url,
      status: 'queued',
      agent: null,
      pages: 0,
    })),
    progress: 0,
  }
  activeSessions.set(sessionId, session)
  
  // Simulate async progress (real impl would use Python subprocess)
  setTimeout(() => {
    const s = activeSessions.get(sessionId)
    if (s) {
      s.status = 'complete'
      s.completed_at = new Date().toISOString()
      s.tasks.forEach((t: any, i: number) => {
        t.status = 'done'
        t.agent = `XS-${(i % num_agents)+1}`.padStart(3,'0')
        t.pages = Math.floor(Math.random() * 80) + 20
      })
    }
  }, 5000)
  
  return NextResponse.json(session)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('session_id')
  if (sessionId) {
    const session = activeSessions.get(sessionId)
    return session ? NextResponse.json(session) : NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const all = Array.from(activeSessions.values()).slice(-20)
  return NextResponse.json({ sessions: all, total: activeSessions.size })
}
