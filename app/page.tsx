'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'

interface ScrapeJob { id:string; url:string; status:string; pages:number; endpoints:number; started:string; duration?:number }
interface ChatMsg { role:'user'|'assistant'; content:string; ts:number }

const TABS = ['Dashboard','Scraper','Swarm Monitor','Intel Report']
const AGENTS = ['XS-001','XS-002','XS-003','XS-004','XS-005']
const AGENT_COLORS = ['#6366f1','#22c55e','#f59e0b','#F6B800','#ec4899']

const SEED_JOBS: ScrapeJob[] = [
  { id:'j001', url:'https://apollo.io', status:'done', pages:8, endpoints:6, started:'2026-07-13T21:08:00Z', duration:4200 },
  { id:'j002', url:'https://apollo.io/pricing', status:'done', pages:1, endpoints:3, started:'2026-07-13T21:09:00Z', duration:1800 },
  { id:'j003', url:'https://apollo.io/about', status:'done', pages:1, endpoints:2, started:'2026-07-13T21:10:00Z', duration:1200 },
]

const APOLLO_REPORT = `XTREME-SCRAPER Intelligence Report
Target: https://apollo.io
Pages crawled: 8 | Successful: 8
Sitemap URLs: 176 total
API endpoints found: 6
Colors extracted: 20
Prices found: 18
JS bundles: 46

Platform: Next.js (App Router)
CDN: Cloudflare + Netlify + Google CDN
Tracking: GTM-TQ27TX8 | GA4: G-76XXTC73SP
HubSpot Portal: 21165194
Analytics: FullStory, Clarity, Amplitude

Fonts: abc_diatype, founders_grotesk, sharp_grotesk, soehne_variable

Internal API Endpoints:
  /api/form-enrichment
  /api/hubspot-form-submit
  /api/magazine-articles-for-nav
  /api/retell-form-token
  /api/retell-initiate-call
  /api/submit-sms

Colors: #3186FF #FFBDF5 #C5DDFF #FC413D #00B95C #C1B7FF #F8FF2C #FBBC04
Prices: $59 $99 $149 $69 $35 $0.025 $6 $1`

const S = {
  shell: { display:'flex' as const, height:'100vh', background:'#050508', overflow:'hidden' as const, fontFamily:'Inter,system-ui,sans-serif' },
  sidebar: { width:56, background:'rgba(255,255,255,0.02)', borderRight:'1px solid rgba(255,255,255,0.06)', display:'flex' as const, flexDirection:'column' as const, alignItems:'center' as const, paddingTop:12, gap:4, flexShrink:0 },
  main: { flex:1, display:'flex' as const, flexDirection:'column' as const, overflow:'hidden' as const },
  topbar: { height:48, borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex' as const, alignItems:'center' as const, padding:'0 20px', gap:12, background:'rgba(255,255,255,0.01)', flexShrink:0 },
  tabbar: { display:'flex' as const, borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'0 20px', background:'rgba(255,255,255,0.01)', flexShrink:0 },
  content: { flex:1, overflow:'auto' as const, padding:20 },
  card: { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:20 },
  input: { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'10px 14px', color:'#fff', fontSize:13, outline:'none', width:'100%', boxSizing:'border-box' as const },
  btn: (c='#6366f1') => ({ background:c, color: c==='#F6B800'?'#000':'#fff', border:'none', borderRadius:8, padding:'10px 20px', fontSize:13, fontWeight:600, cursor:'pointer' }),
  kpiGrid: { display:'grid' as const, gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 },
  kpi: { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'16px 20px' },
  table: { width:'100%', borderCollapse:'collapse' as const },
  th: { fontSize:11, color:'rgba(255,255,255,0.35)', textTransform:'uppercase' as const, letterSpacing:'0.06em', padding:'8px 12px', textAlign:'left' as const, borderBottom:'1px solid rgba(255,255,255,0.06)' },
  td: { fontSize:13, color:'rgba(255,255,255,0.8)', padding:'10px 12px', borderBottom:'1px solid rgba(255,255,255,0.04)' },
  pill: (c='#6366f1') => ({ display:'inline-flex' as const, alignItems:'center' as const, gap:4, padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600, background:c+'22', color:c, border:`1px solid ${c}44` }),
  h2: { fontSize:14, fontWeight:600, color:'rgba(255,255,255,0.9)', marginBottom:12, marginTop:0 },
  chatBtn: { position:'fixed' as const, bottom:24, left:24, width:52, height:52, borderRadius:'50%', background:'#6366f1', border:'none', cursor:'pointer', display:'flex' as const, alignItems:'center' as const, justifyContent:'center' as const, fontSize:22, boxShadow:'0 4px 24px rgba(99,102,241,0.5)', zIndex:1000 },
  chatPanel: { position:'fixed' as const, bottom:88, left:24, width:360, height:500, background:'#0a0a10', border:'1px solid rgba(255,255,255,0.12)', borderRadius:16, display:'flex' as const, flexDirection:'column' as const, overflow:'hidden' as const, zIndex:1000, boxShadow:'0 8px 40px rgba(0,0,0,0.7)' },
}

function Tab({ label, active, onClick }: { label:string; active:boolean; onClick:()=>void }) {
  return <button onClick={onClick} style={{ padding:'10px 16px', fontSize:13, fontWeight:active?600:400, color:active?'#6366f1':'rgba(255,255,255,0.4)', background:'none', border:'none', borderBottom:active?'2px solid #6366f1':'2px solid transparent', cursor:'pointer', transition:'all 0.15s' }}>{label}</button>
}

function DashboardTab({ jobs }: { jobs:ScrapeJob[] }) {
  return (
    <div>
      <div style={S.kpiGrid}>
        {[
          { label:'Jobs Completed', val:jobs.filter(j=>j.status==='done').length, color:'#22c55e' },
          { label:'Pages Scraped', val:jobs.reduce((s,j)=>s+j.pages,0), color:'#6366f1' },
          { label:'Endpoints Found', val:jobs.reduce((s,j)=>s+j.endpoints,0), color:'#f59e0b' },
          { label:'Swarm Agents', val:5, color:'#F6B800' },
        ].map(k=>(
          <div key={k.label} style={S.kpi}>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>{k.label}</div>
            <div style={{ fontSize:28, fontWeight:700, color:k.color }}>{k.val}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16 }}>
        <div style={S.card}>
          <div style={S.h2}>Recent Scrape Jobs</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>URL</th><th style={S.th}>Status</th><th style={S.th}>Pages</th><th style={S.th}>APIs</th><th style={S.th}>Time</th></tr></thead>
            <tbody>{jobs.map(j=>(
              <tr key={j.id}>
                <td style={{...S.td,maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{j.url}</td>
                <td style={S.td}><span style={S.pill('#22c55e')}>{j.status}</span></td>
                <td style={{...S.td,textAlign:'center'}}>{j.pages}</td>
                <td style={{...S.td,textAlign:'center'}}>{j.endpoints}</td>
                <td style={{...S.td,color:'rgba(255,255,255,0.35)',fontSize:11}}>{j.duration}ms</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{ ...S.card, display:'flex', flexDirection:'column', gap:10 }}>
          <div style={S.h2}>System Status</div>
          {[
            {l:'Asyncio Engine',s:'online',c:'#22c55e'},{l:'5 Swarm Agents',s:'online',c:'#22c55e'},
            {l:'Apollo Intel',s:'loaded',c:'#6366f1'},{l:'Base44 Chat',s:'connected',c:'#6366f1'},
            {l:'Cron (*/5min)',s:'active',c:'#f59e0b'},
          ].map(x=>(
            <div key={x.l} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:12,color:'rgba(255,255,255,0.6)'}}>{x.l}</span>
              <span style={S.pill(x.c)}>{x.s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ScraperTab({ onJob }: { onJob:(j:ScrapeJob)=>void }) {
  const [url, setUrl] = useState('https://apollo.io')
  const [maxPages, setMaxPages] = useState('50')
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState<string[]>([])

  const run = async () => {
    if (!url||running) return
    setRunning(true)
    setLog(['🚀 Launching XTREME-SCRAPER asyncio engine...', `🎯 Target: ${url}`, `📄 Max pages: ${maxPages}`, '⚡ 5 swarm agents initializing...'])
    const start = Date.now()
    try {
      const res = await fetch('/api/scrape',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url,max_pages:parseInt(maxPages)})})
      const data = await res.json()
      if (data.ok || data.pages_count) {
        const dur = Date.now()-start
        setLog(l=>[...l,`✅ Complete in ${dur}ms`, `📊 Pages: ${data.pages_count||0}`, `🔗 Endpoints: ${data.api_map?.endpoints?.length||0}`, `📋 ${data.intelligence_report?.split('\n').slice(0,3).join(' | ')}`])
        onJob({id:`j${Date.now()}`,url,status:'done',pages:data.pages_count||0,endpoints:data.api_map?.endpoints?.length||0,started:new Date().toISOString(),duration:dur})
      } else {
        setLog(l=>[...l,`⚠️ ${JSON.stringify(data).slice(0,200)}`])
      }
    } catch(e:any){ setLog(l=>[...l,`❌ ${e.message}`]) }
    finally { setRunning(false) }
  }

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <div style={S.card}>
        <div style={S.h2}>Scraper Config</div>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginBottom:6,textTransform:'uppercase' as const,letterSpacing:'0.06em'}}>Target URL</div>
            <input style={S.input} value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://target.com" />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginBottom:6,textTransform:'uppercase' as const,letterSpacing:'0.06em'}}>Max Pages</div>
              <input style={S.input} value={maxPages} onChange={e=>setMaxPages(e.target.value)} type="number" />
            </div>
            <div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginBottom:6,textTransform:'uppercase' as const,letterSpacing:'0.06em'}}>Agents</div>
              <input style={{...S.input,color:'rgba(255,255,255,0.4)'}} value="5 (asyncio)" readOnly />
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column' as const,gap:6}}>
            {['Extract JS Secrets','Extract API Endpoints','Extract Design Tokens','Extract Sitemap'].map(opt=>(
              <label key={opt} style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:'rgba(255,255,255,0.6)',cursor:'pointer'}}>
                <input type="checkbox" defaultChecked style={{accentColor:'#6366f1'}} />{opt}
              </label>
            ))}
          </div>
          <button style={S.btn(running?'#374151':'#6366f1')} onClick={run} disabled={running}>
            {running ? '⚡ Scraping...' : '▶ Launch Scraper'}
          </button>
        </div>
      </div>
      <div style={{...S.card,display:'flex',flexDirection:'column' as const}}>
        <div style={S.h2}>Live Log</div>
        <div style={{flex:1,fontFamily:'monospace',fontSize:12,color:'#22c55e',background:'rgba(0,0,0,0.4)',borderRadius:8,padding:12,overflow:'auto' as const,minHeight:240,lineHeight:1.8}}>
          {log.length===0 ? <span style={{color:'rgba(255,255,255,0.2)'}}>Waiting for scrape job...</span> : log.map((l,i)=><div key={i}>{l}</div>)}
        </div>
      </div>
    </div>
  )
}

function SwarmTab() {
  const [targets, setTargets] = useState('https://apollo.io\nhttps://apollo.io/pricing\nhttps://apollo.io/about')
  const [session, setSession] = useState<any>(null)
  const [running, setRunning] = useState(false)

  const launch = async () => {
    setRunning(true)
    const urls = targets.split('\n').filter(u=>u.trim())
    try {
      const res = await fetch('/api/swarm',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({targets:urls,num_agents:5,max_pages:20})})
      const data = await res.json()
      setSession(data)
      const poll = setInterval(async()=>{
        const r2 = await fetch(`/api/swarm?session_id=${data.session_id}`)
        const d2 = await r2.json()
        setSession(d2)
        if(d2.status==='complete'){clearInterval(poll);setRunning(false)}
      },800)
    } catch(){ setRunning(false) }
  }

  return (
    <div style={{display:'flex',flexDirection:'column' as const,gap:16}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={S.card}>
          <div style={S.h2}>Swarm Config</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginBottom:6,textTransform:'uppercase' as const,letterSpacing:'0.06em'}}>Target URLs (one per line)</div>
          <textarea value={targets} onChange={e=>setTargets(e.target.value)} style={{...S.input,height:100,resize:'none' as const,marginBottom:12}} />
          <button style={S.btn('#F6B800')} onClick={launch} disabled={running}>
            {running ? '⚡ Swarm Running...' : '🐝 Launch Swarm'}
          </button>
        </div>
        <div style={S.card}>
          <div style={S.h2}>Agent Status</div>
          {AGENTS.map((a,i)=>{
            const task = session?.tasks?.[i]
            const done = task?.status==='done'
            const color = AGENT_COLORS[i]
            return (
              <div key={a} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'rgba(255,255,255,0.03)',borderRadius:8,border:`1px solid ${color}33`,marginBottom:6}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:done?'#22c55e':running&&!done?color:'rgba(255,255,255,0.2)',flexShrink:0}} />
                <span style={{fontSize:12,fontWeight:600,color,width:56}}>{a}</span>
                <span style={{flex:1,fontSize:11,color:'rgba(255,255,255,0.4)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>
                  {task?(done?`✓ ${task.pages||0} pages`:task.url||'working...'):'idle'}
                </span>
                <span style={S.pill(done?'#22c55e':running?color:'#555')}>{done?'done':running?'active':'idle'}</span>
              </div>
            )
          })}
        </div>
      </div>
      {session&&(
        <div style={S.card}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
            <div style={S.h2}>Session: {session.session_id}</div>
            <span style={S.pill(session.status==='complete'?'#22c55e':'#f59e0b')}>{session.status}</span>
          </div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Task</th><th style={S.th}>URL</th><th style={S.th}>Agent</th><th style={S.th}>Status</th><th style={S.th}>Pages</th></tr></thead>
            <tbody>{(session.tasks||[]).map((t:any,i:number)=>(
              <tr key={i}>
                <td style={{...S.td,fontFamily:'monospace',fontSize:11}}>{t.task_id}</td>
                <td style={{...S.td,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{t.url}</td>
                <td style={{...S.td,color:'#6366f1'}}>{t.agent||'—'}</td>
                <td style={S.td}><span style={S.pill(t.status==='done'?'#22c55e':t.status==='running'?'#6366f1':'#555')}>{t.status}</span></td>
                <td style={{...S.td,textAlign:'center' as const}}>{t.pages||0}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function IntelTab() {
  const COLORS = ['#3186FF','#FFBDF5','#C5DDFF','#FC413D','#47423D','#1FB8CD','#00B95C','#C1B7FF','#F8FF2C','#4893FC','#FBBC04','#FFEE48']
  const PRICES = ['$59/mo','$99/mo','$149/mo','$69/mo','$35/mo','$0.025/credit']
  const APIS = ['/api/form-enrichment','/api/hubspot-form-submit','/api/magazine-articles-for-nav','/api/retell-form-token','/api/retell-initiate-call','/api/submit-sms']
  return (
    <div style={{display:'flex',flexDirection:'column' as const,gap:16}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
        <div style={S.card}>
          <div style={S.h2}>🎨 Color Palette</div>
          <div style={{display:'flex',flexWrap:'wrap' as const,gap:6}}>
            {COLORS.map(c=><div key={c} title={c} style={{width:30,height:30,borderRadius:6,background:c,border:'1px solid rgba(255,255,255,0.1)',cursor:'pointer'}} />)}
          </div>
        </div>
        <div style={S.card}>
          <div style={S.h2}>💰 Pricing Found</div>
          {PRICES.map(p=><div key={p} style={{fontSize:14,fontWeight:600,color:'#F6B800',marginBottom:6}}>{p}</div>)}
        </div>
        <div style={S.card}>
          <div style={S.h2}>🔗 API Endpoints</div>
          {APIS.map(e=><div key={e} style={{fontSize:11,fontFamily:'monospace',color:'#818cf8',marginBottom:5,wordBreak:'break-all' as const}}>{e}</div>)}
        </div>
      </div>
      <div style={S.card}>
        <div style={S.h2}>📋 Intelligence Report — Apollo.io</div>
        <pre style={{fontSize:12,color:'rgba(255,255,255,0.7)',lineHeight:1.7,whiteSpace:'pre-wrap' as const,margin:0,fontFamily:'monospace'}}>{APOLLO_REPORT}</pre>
      </div>
    </div>
  )
}

function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    {role:'assistant',content:'APEX online. I analyze scraped intel, coordinate swarms, and provide competitive intelligence. What would you like to investigate?',ts:Date.now()}
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottom = useRef<HTMLDivElement>(null)

  useEffect(()=>{bottom.current?.scrollIntoView({behavior:'smooth'})},[msgs])

  const send = async()=>{
    if(!input.trim()||loading) return
    const text = input.trim()
    const userMsg:ChatMsg = {role:'user',content:text,ts:Date.now()}
    setMsgs(m=>[...m,userMsg])
    setInput('')
    setLoading(true)
    setMsgs(m=>[...m,{role:'assistant',content:'',ts:Date.now()}])
    try {
      const res = await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text})})
      const data = await res.json()
      const reply = data?.content || data?.message || 'Response received'
      setMsgs(m=>m.map((x,i)=>i===m.length-1?{...x,content:reply}:x))
    } catch(e:any){
      setMsgs(m=>m.map((x,i)=>i===m.length-1?{...x,content:'⚠️ '+e.message}:x))
    } finally{setLoading(false)}
  }

  return (
    <>
      <button style={S.chatBtn} onClick={()=>setOpen(o=>!o)} title="APEX — Base44 Agent">
        {open?'✕':'⚡'}
      </button>
      {open&&(
        <div style={S.chatPanel}>
          <div style={{padding:'14px 16px',borderBottom:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>APEX Agent</div>
              <div style={{fontSize:10,color:'#22c55e'}}>● Base44 Connected</div>
            </div>
            <button onClick={()=>setOpen(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:18}}>✕</button>
          </div>
          <div style={{flex:1,overflowY:'auto' as const,padding:14,display:'flex',flexDirection:'column' as const,gap:8}}>
            {msgs.map((m,i)=>(
              <div key={i} style={{alignSelf:m.role==='user'?'flex-end':'flex-start',maxWidth:'88%',background:m.role==='user'?'#6366f1':'rgba(255,255,255,0.07)',borderRadius:m.role==='user'?'12px 12px 2px 12px':'12px 12px 12px 2px',padding:'8px 12px',fontSize:12,lineHeight:1.6,color:'#fff',whiteSpace:'pre-wrap' as const}}>
                {m.content||'…'}
              </div>
            ))}
            {loading&&<div style={{alignSelf:'flex-start',background:'rgba(255,255,255,0.07)',borderRadius:'12px 12px 12px 2px',padding:'8px 12px',fontSize:12,color:'rgba(255,255,255,0.4)'}}>
              <span className="pulse-dot">●</span><span className="pulse-dot" style={{marginLeft:3}}>●</span><span className="pulse-dot" style={{marginLeft:3}}>●</span>
            </div>}
            <div ref={bottom}/>
          </div>
          <div style={{padding:10,borderTop:'1px solid rgba(255,255,255,0.08)',display:'flex',gap:8}}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Ask APEX..." style={{...S.input,height:36,padding:'0 12px'}} disabled={loading} />
            <button onClick={send} disabled={loading} style={{width:36,height:36,background:'#6366f1',border:'none',borderRadius:8,color:'#fff',cursor:'pointer',fontSize:16,flexShrink:0}}>↑</button>
          </div>
        </div>
      )}
    </>
  )
}

export default function Home() {
  const [tab, setTab] = useState('Dashboard')
  const [jobs, setJobs] = useState<ScrapeJob[]>(SEED_JOBS)

  return (
    <div style={S.shell}>
      <div style={S.sidebar}>
        <div style={{width:32,height:32,background:'#F6B800',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:11,color:'#000',marginBottom:12}}>XS</div>
        {[{id:'Dashboard',icon:'⬡'},{id:'Scraper',icon:'◎'},{id:'Swarm Monitor',icon:'⬡'},{id:'Intel Report',icon:'◈'},{id:'Settings',icon:'⚙'}].map(n=>(
          <button key={n.id} title={n.id} onClick={()=>setTab(n.id)} style={{width:40,height:40,borderRadius:8,border:'none',background:tab===n.id?'rgba(99,102,241,0.2)':'transparent',color:tab===n.id?'#6366f1':'rgba(255,255,255,0.35)',cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center'}}>
            {n.icon}
          </button>
        ))}
      </div>

      <div style={S.main}>
        <div style={S.topbar}>
          <span style={{fontSize:13,fontWeight:700,color:'#F6B800',letterSpacing:'0.08em'}}>XTREME-SCRAPER</span>
          <div style={{flex:1}}/>
          <span style={S.pill('#22c55e')}>● 5 Agents Online</span>
          <span style={S.pill('#6366f1')}>Asyncio Swarm</span>
          <span style={S.pill('#F6B800')}>Apollo Intel Loaded</span>
          <span style={{fontSize:12,color:'rgba(255,255,255,0.4)'}}>Jeremy Bensen</span>
        </div>
        <div style={S.tabbar}>
          {TABS.map(t=><Tab key={t} label={t} active={tab===t} onClick={()=>setTab(t)}/>)}
        </div>
        <div style={S.content}>
          {tab==='Dashboard'&&<DashboardTab jobs={jobs}/>}
          {tab==='Scraper'&&<ScraperTab onJob={j=>setJobs(p=>[j,...p])}/>}
          {tab==='Swarm Monitor'&&<SwarmTab/>}
          {tab==='Intel Report'&&<IntelTab/>}
          {tab==='Settings'&&(
            <div style={S.card}>
              <div style={S.h2}>Settings</div>
              <div style={{fontSize:13,color:'rgba(255,255,255,0.5)'}}>Configure scraper defaults, API keys, and swarm parameters.</div>
            </div>
          )}
        </div>
      </div>

      <ChatWidget/>
    </div>
  )
}
