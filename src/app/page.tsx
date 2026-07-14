'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, useCallback } from 'react'

// ── TYPES ─────────────────────────────────────────────────────────────────────
interface ScrapeJob { id: string; url: string; status: string; pages: number; endpoints: number; started: string; duration?: number }
interface SwarmSession { session_id: string; targets: string[]; num_agents: number; status: string; tasks: any[]; started_at: string }
interface ChatMsg { role: 'user'|'assistant'; content: string; ts: number }
interface IntelResult { url: string; title: string; colors: string[]; prices: string[]; endpoints: string[]; report: string }

const TABS = ['Dashboard', 'Scraper', 'Swarm Monitor', 'Intel Report']
const NAV = [
  { id: 'dashboard', icon: '⬡', label: 'Dashboard' },
  { id: 'scraper', icon: '◎', label: 'Scraper' },
  { id: 'swarm', icon: '⬡', label: 'Swarm' },
  { id: 'intel', icon: '◈', label: 'Intel' },
  { id: 'settings', icon: '⚙', label: 'Settings' },
]

// Seed data from Apollo.io scrape
const APOLLO_INTEL: IntelResult = {
  url: 'https://apollo.io',
  title: 'AI Sales Platform | Apollo.io',
  colors: ['#3186FF','#FFBDF5','#C5DDFF','#FC413D','#47423D','#1FB8CD','#00B95C','#C1B7FF'],
  prices: ['$59','$99','$149','$69','$35','$0.025','$6','$1'],
  endpoints: ['/api/form-enrichment','/api/hubspot-form-submit','/api/magazine-articles-for-nav','/api/retell-form-token','/api/retell-initiate-call','/api/submit-sms'],
  report: `XTREME-SCRAPER Intelligence Report\nTarget: https://apollo.io\nPages crawled: 8 | Successful: 8\nSitemap URLs: 176\nAPI endpoints found: 6\nColors extracted: 20\nPrices found: 18\nJS bundles: 46\nTracking: GTM-TQ27TX8, G-76XXTC73SP, HubSpot Portal 21165194\nFonts: abc_diatype, founders_grotesk, sharp_grotesk, soehne_variable\nKey findings:\n- Platform: Next.js (App Router)\n- CDN: Cloudflare + Netlify\n- Auth: Custom (app.apollo.io subdomain)\n- CRM: HubSpot Portal 21165194\n- Analytics: FullStory, Microsoft Clarity, Amplitude\n- Internal APIs: /api/retell-initiate-call, /api/hubspot-form-submit, /api/submit-sms`
}

const SEED_JOBS: ScrapeJob[] = [
  { id: 'j001', url: 'https://apollo.io', status: 'done', pages: 8, endpoints: 6, started: '2026-07-13T21:08:00Z', duration: 4200 },
  { id: 'j002', url: 'https://apollo.io/pricing', status: 'done', pages: 1, endpoints: 3, started: '2026-07-13T21:09:00Z', duration: 1800 },
  { id: 'j003', url: 'https://apollo.io/about', status: 'done', pages: 1, endpoints: 2, started: '2026-07-13T21:10:00Z', duration: 1200 },
]

// ── STYLES ─────────────────────────────────────────────────────────────────────
const S = {
  shell: { display:'flex', height:'100vh', background:'#050508', overflow:'hidden', fontFamily:'Inter,system-ui,sans-serif' } as React.CSSProperties,
  sidebar: { width:56, background:'rgba(255,255,255,0.02)', borderRight:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column' as const, alignItems:'center', paddingTop:12, gap:4 } as React.CSSProperties,
  main: { flex:1, display:'flex', flexDirection:'column' as const, overflow:'hidden' } as React.CSSProperties,
  topbar: { height:48, borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', padding:'0 20px', gap:12, background:'rgba(255,255,255,0.01)', flexShrink:0 } as React.CSSProperties,
  logo: { fontSize:13, fontWeight:700, color:'#F6B800', letterSpacing:'0.08em', marginRight:8 } as React.CSSProperties,
  badge: (color='#6366f1') => ({ background:color+'22', border:`1px solid ${color}44`, borderRadius:6, padding:'3px 10px', fontSize:11, color, fontWeight:600 } as React.CSSProperties),
  tabbar: { display:'flex', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'0 20px', background:'rgba(255,255,255,0.01)', flexShrink:0 } as React.CSSProperties,
  content: { flex:1, overflow:'auto', padding:20 } as React.CSSProperties,
  card: { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:20 } as React.CSSProperties,
  input: { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'10px 14px', color:'#fff', fontSize:13, outline:'none', width:'100%' } as React.CSSProperties,
  btn: (bg='#6366f1') => ({ background:bg, color:'#fff', border:'none', borderRadius:8, padding:'10px 20px', fontSize:13, fontWeight:600, cursor:'pointer' } as React.CSSProperties),
  btnSm: { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, padding:'5px 12px', fontSize:12, cursor:'pointer' } as React.CSSProperties,
  kpiGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 } as React.CSSProperties,
  kpi: { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'16px 20px' } as React.CSSProperties,
  kpiLabel: { fontSize:11, color:'rgba(255,255,255,0.4)', textTransform:'uppercase' as const, letterSpacing:'0.08em', marginBottom:8 } as React.CSSProperties,
  kpiVal: { fontSize:28, fontWeight:700, color:'#fff' } as React.CSSProperties,
  table: { width:'100%', borderCollapse:'collapse' as const } as React.CSSProperties,
  th: { fontSize:11, color:'rgba(255,255,255,0.35)', textTransform:'uppercase' as const, letterSpacing:'0.06em', padding:'8px 12px', textAlign:'left' as const, borderBottom:'1px solid rgba(255,255,255,0.06)' } as React.CSSProperties,
  td: { fontSize:13, color:'rgba(255,255,255,0.8)', padding:'10px 12px', borderBottom:'1px solid rgba(255,255,255,0.04)' } as React.CSSProperties,
  pill: (c='#6366f1') => ({ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600, background:c+'22', color:c, border:`1px solid ${c}44` } as React.CSSProperties),
  h2: { fontSize:14, fontWeight:600, color:'rgba(255,255,255,0.9)', marginBottom:12 } as React.CSSProperties,
  // Chat widget
  chatBtn: { position:'fixed' as const, bottom:24, left:24, width:52, height:52, borderRadius:'50%', background:'#6366f1', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, boxShadow:'0 4px 24px rgba(99,102,241,0.5)', zIndex:1000, transition:'transform 0.2s' } as React.CSSProperties,
  chatPanel: { position:'fixed' as const, bottom:88, left:24, width:360, height:520, background:'#0f0f14', border:'1px solid rgba(255,255,255,0.12)', borderRadius:16, display:'flex', flexDirection:'column' as const, overflow:'hidden', zIndex:1000, boxShadow:'0 8px 40px rgba(0,0,0,0.6)' } as React.CSSProperties,
  chatHeader: { padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between' } as React.CSSProperties,
  chatMsgs: { flex:1, overflowY:'auto' as const, padding:16, display:'flex', flexDirection:'column' as const, gap:10 } as React.CSSProperties,
  chatBubble: (role: string) => ({ alignSelf: role==='user' ? 'flex-end' as const : 'flex-start' as const, maxWidth:'88%', background: role==='user' ? '#6366f1' : 'rgba(255,255,255,0.07)', borderRadius: role==='user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', padding:'8px 12px', fontSize:12, lineHeight:1.6, color:'#fff', whiteSpace:'pre-wrap' as const } as React.CSSProperties),
  chatFooter: { padding:12, borderTop:'1px solid rgba(255,255,255,0.08)', display:'flex', gap:8 } as React.CSSProperties,
}

// ── DASHBOARD TAB ──────────────────────────────────────────────────────────────
function DashboardTab({ jobs }: { jobs: ScrapeJob[] }) {
  const totalPages = jobs.reduce((s,j)=>s+j.pages,0)
  const totalEndpoints = jobs.reduce((s,j)=>s+j.endpoints,0)
  return (
    <div>
      <div style={S.kpiGrid}>
        {[
          { label:'Jobs Completed', val:jobs.filter(j=>j.status==='done').length, color:'#22c55e' },
          { label:'Pages Scraped', val:totalPages, color:'#6366f1' },
          { label:'Endpoints Found', val:totalEndpoints, color:'#f59e0b' },
          { label:'Swarm Agents', val:5, color:'#F6B800' },
        ].map(k => (
          <div key={k.label} style={S.kpi}>
            <div style={S.kpiLabel}>{k.label}</div>
            <div style={{ ...S.kpiVal, color:k.color }}>{k.val}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:16 }}>
        <div style={S.card}>
          <div style={S.h2}>Recent Jobs</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>URL</th><th style={S.th}>Status</th><th style={S.th}>Pages</th><th style={S.th}>Endpoints</th><th style={S.th}>Duration</th></tr></thead>
            <tbody>{jobs.map(j=>(
              <tr key={j.id}>
                <td style={{...S.td,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{j.url}</td>
                <td style={S.td}><span style={S.pill('#22c55e')}>{j.status}</span></td>
                <td style={{...S.td,textAlign:'center'}}>{j.pages}</td>
                <td style={{...S.td,textAlign:'center'}}>{j.endpoints}</td>
                <td style={{...S.td,color:'rgba(255,255,255,0.4)'}}>{j.duration}ms</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{ ...S.card, display:'flex', flexDirection:'column', gap:10 }}>
          <div style={S.h2}>System Status</div>
          {[{l:'Scraper Engine',s:'online'},{l:'Swarm (5 agents)',s:'online'},{l:'Apollo Intel',s:'loaded'},{l:'Base44 Chat',s:'connected'},{l:'Cron (*/5min)',s:'active'}].map(c=>(
            <div key={c.l} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:13,color:'rgba(255,255,255,0.6)'}}>{c.l}</span>
              <span style={S.pill('#22c55e')}>{c.s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── SCRAPER TAB ───────────────────────────────────────────────────────────────
function ScraperTab({ onJobStart }: { onJobStart: (job: ScrapeJob) => void }) {
  const [url, setUrl] = useState('https://apollo.io')
  const [maxPages, setMaxPages] = useState('50')
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState<string[]>([])

  const run = async () => {
    if (!url || running) return
    setRunning(true)
    setLog(['🚀 Launching XTREME-SCRAPER...', `🎯 Target: ${url}`, `📄 Max pages: ${maxPages}`, '⚡ Asyncio swarm initializing...'])
    const start = Date.now()
    try {
      const res = await fetch('/api/scrape', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({url,max_pages:parseInt(maxPages),num_agents:5}) })
      const data = await res.json()
      if (data.ok || data.pages_count) {
        setLog(l => [...l, `✅ Complete! Pages: ${data.pages_count || 0}`, `🔍 Endpoints: ${data.api_map?.endpoints?.length || 0}`, `📊 Report: ${data.intelligence_report?.slice(0,200) || 'Generated'}`, `⏱ Duration: ${Date.now()-start}ms`])
        onJobStart({ id:`j\${Date.now()}`, url, status:'done', pages:data.pages_count||0, endpoints:data.api_map?.endpoints?.length||0, started:new Date().toISOString(), duration:Date.now()-start })
      } else {
        setLog(l => [...l, `⚠️ API: \${JSON.stringify(data).slice(0,200)}`])
      }
    } catch(e: any) {
      setLog(l => [...l, `❌ Error: \${e.message}`])
    } finally {
      setRunning(false)
    }
  }

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <div style={S.card}>
        <div style={S.h2}>Scraper Config</div>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div>
            <label style={{fontSize:12,color:'rgba(255,255,255,0.4)',display:'block',marginBottom:6}}>TARGET URL</label>
            <input style={S.input} value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://target.com" />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <div>
              <label style={{fontSize:12,color:'rgba(255,255,255,0.4)',display:'block',marginBottom:6}}>MAX PAGES</label>
              <input style={S.input} value={maxPages} onChange={e=>setMaxPages(e.target.value)} type="number" />
            </div>
            <div>
              <label style={{fontSize:12,color:'rgba(255,255,255,0.4)',display:'block',marginBottom:6}}>AGENTS</label>
              <input style={S.input} value="5" readOnly />
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6}}>
            {['Extract JS Secrets','Extract APIs','Extract Design Tokens'].map(opt=>(
              <label key={opt} style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'rgba(255,255,255,0.6)',cursor:'pointer'}}>
                <input type="checkbox" defaultChecked style={{accentColor:'#6366f1'}} />{opt}
              </label>
            ))}
          </div>
          <button style={S.btn(running?'#374151':'#6366f1')} onClick={run} disabled={running}>
            {running ? '⚡ Scraping...' : '▶ Launch Scraper'}
          </button>
        </div>
      </div>
      <div style={{...S.card,display:'flex',flexDirection:'column'}}>
        <div style={S.h2}>Live Log</div>
        <div style={{flex:1,fontFamily:'monospace',fontSize:12,color:'#22c55e',background:'rgba(0,0,0,0.3)',borderRadius:8,padding:12,overflow:'auto',minHeight:200}}>
          {log.length===0 ? <span style={{color:'rgba(255,255,255,0.2)'}}>Waiting for scrape job...</span> : log.map((l,i)=><div key={i}>{l}</div>)}
        </div>
      </div>
    </div>
  )
}

// ── SWARM MONITOR ─────────────────────────────────────────────────────────────
function SwarmTab() {
  const [targets, setTargets] = useState('https://apollo.io\nhttps://apollo.io/pricing\nhttps://apollo.io/about')
  const [session, setSession] = useState<SwarmSession|null>(null)
  const [running, setRunning] = useState(false)
  const AGENTS = ['XS-001','XS-002','XS-003','XS-004','XS-005']
  const agentColors = ['#6366f1','#22c55e','#f59e0b','#F6B800','#ec4899']

  const launch = async () => {
    setRunning(true)
    const urls = targets.split('\n').filter(u=>u.trim())
    try {
      const res = await fetch('/api/swarm', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({targets:urls,num_agents:5,max_pages:20}) })
      const data = await res.json()
      setSession(data)
      // Poll for updates
      const poll = setInterval(async () => {
        const r2 = await fetch(`/api/swarm?session_id=\${data.session_id}`)
        const d2 = await r2.json()
        setSession(d2)
        if (d2.status==='complete') { clearInterval(poll); setRunning(false) }
      }, 1000)
    } catch(e) { setRunning(false) }
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={S.card}>
          <div style={S.h2}>Swarm Config</div>
          <label style={{fontSize:12,color:'rgba(255,255,255,0.4)',display:'block',marginBottom:6}}>TARGET URLS (one per line)</label>
          <textarea value={targets} onChange={e=>setTargets(e.target.value)} style={{...S.input,height:120,resize:'none'} as React.CSSProperties} />
          <button style={{...S.btn(running?'#374151':'#F6B800'),marginTop:12,color:'#000'}} onClick={launch} disabled={running}>
            {running ? '⚡ Swarm Running...' : '🐝 Launch Swarm'}
          </button>
        </div>
        <div style={S.card}>
          <div style={S.h2}>Agent Status</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {AGENTS.map((a,i)=>{
              const task = session?.tasks?.[i]
              const isActive = task?.status==='running'
              const isDone = task?.status==='done'
              const color = agentColors[i]
              return (
                <div key={a} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'rgba(255,255,255,0.03)',borderRadius:8,border:`1px solid \${color}33`}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:isActive?color:isDone?'#22c55e':'rgba(255,255,255,0.2)'}} />
                  <span style={{fontSize:12,fontWeight:600,color}}>{a}</span>
                  <span style={{flex:1,fontSize:11,color:'rgba(255,255,255,0.4)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {task ? (isDone ? `✓ \${task.pages||0} pages` : task.url || 'working...') : 'idle'}
                  </span>
                  <span style={S.pill(isDone?'#22c55e':isActive?color:'#555')}>{isDone?'done':isActive?'running':'idle'}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      {session && (
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
                <td style={{...S.td,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.url}</td>
                <td style={{...S.td,color:'#6366f1'}}>{t.agent||'—'}</td>
                <td style={S.td}><span style={S.pill(t.status==='done'?'#22c55e':t.status==='running'?'#6366f1':'#555')}>{t.status}</span></td>
                <td style={{...S.td,textAlign:'center'}}>{t.pages||0}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── INTEL TAB (Apollo data) ───────────────────────────────────────────────────
function IntelTab() {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
        <div style={S.card}>
          <div style={S.h2}>🎨 Color Palette</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>{APOLLO_INTEL.colors.map(c=>(
            <div key={c} title={c} style={{width:32,height:32,borderRadius:6,background:c,border:'1px solid rgba(255,255,255,0.1)'}} />
          ))}</div>
        </div>
        <div style={S.card}>
          <div style={S.h2}>💰 Pricing Found</div>
          {APOLLO_INTEL.prices.map(p=><div key={p} style={{fontSize:14,fontWeight:600,color:'#F6B800',marginBottom:4}}>{p}</div>)}
        </div>
        <div style={S.card}>
          <div style={S.h2}>🔗 API Endpoints</div>
          {APOLLO_INTEL.endpoints.map(e=><div key={e} style={{fontSize:11,fontFamily:'monospace',color:'#818cf8',marginBottom:4}}>{e}</div>)}
        </div>
      </div>
      <div style={S.card}>
        <div style={S.h2}>📋 Intelligence Report</div>
        <pre style={{fontSize:12,color:'rgba(255,255,255,0.7)',lineHeight:1.7,whiteSpace:'pre-wrap',margin:0}}>{APOLLO_INTEL.report}</pre>
      </div>
    </div>
  )
}

// ── BASE44 CHAT WIDGET ────────────────────────────────────────────────────────
function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { role:'assistant', content:'APEX online. I can analyze scraped intel, run tasks, and orchestrate your swarm. What would you like to do?', ts:Date.now() }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottom = useRef<HTMLDivElement>(null)

  useEffect(()=>{ bottom.current?.scrollIntoView({behavior:'smooth'}) },[msgs])

  const send = async () => {
    if(!input.trim()||loading) return
    const text = input.trim()
    const userMsg: ChatMsg = {role:'user',content:text,ts:Date.now()}
    setMsgs(m=>[...m,userMsg])
    setInput('')
    setLoading(true)
    const aMsg: ChatMsg = {role:'assistant',content:'',ts:Date.now()}
    setMsgs(m=>[...m,aMsg])
    try {
      const res = await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text})})
      const data = await res.json()
      const reply = data?.content || data?.message || data?.choices?.[0]?.message?.content || JSON.stringify(data).slice(0,300)
      setMsgs(m=>m.map((x,i)=>i===m.length-1?{...x,content:reply}:x))
    } catch(e:any){
      setMsgs(m=>m.map((x,i)=>i===m.length-1?{...x,content:'⚠️ '+e.message}:x))
    } finally { setLoading(false) }
  }

  return (
    <>
      <button style={S.chatBtn} onClick={()=>setOpen(o=>!o)} title="APEX Agent">
        {open ? '✕' : '⚡'}
      </button>
      {open && (
        <div style={S.chatPanel}>
          <div style={S.chatHeader}>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>APEX Agent</div>
              <div style={{fontSize:10,color:'#22c55e'}}>● Base44 Connected</div>
            </div>
            <button onClick={()=>setOpen(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:16}}>✕</button>
          </div>
          <div style={S.chatMsgs}>
            {msgs.map((m,i)=>(
              <div key={i} style={S.chatBubble(m.role)}>{m.content||'…'}</div>
            ))}
            {loading&&<div style={{...S.chatBubble('assistant'),color:'rgba(255,255,255,0.4)'}}>
              <span className="pulse-dot">●</span><span className="pulse-dot" style={{marginLeft:3}}>●</span><span className="pulse-dot" style={{marginLeft:3}}>●</span>
            </div>}
            <div ref={bottom}/>
          </div>
          <div style={S.chatFooter}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Ask APEX..." style={{...S.input,height:36}} disabled={loading} />
            <button onClick={send} disabled={loading} style={{...S.btn(),width:36,height:36,padding:0,borderRadius:8,flexShrink:0}}>↑</button>
          </div>
        </div>
      )}
    </>
  )
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const [tab, setTab] = useState('Dashboard')
  const [jobs, setJobs] = useState<ScrapeJob[]>(SEED_JOBS)

  return (
    <div style={S.shell}>
      {/* Sidebar */}
      <div style={S.sidebar}>
        <div style={{width:32,height:32,background:'#F6B800',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:12,color:'#000',marginBottom:12}}>XS</div>
        {NAV.map(n=>(
          <button key={n.id} title={n.label} style={{width:40,height:40,borderRadius:8,border:'none',background:tab.toLowerCase().includes(n.id)?'rgba(99,102,241,0.2)':'transparent',color:tab.toLowerCase().includes(n.id)?'#6366f1':'rgba(255,255,255,0.35)',cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setTab(n.label==='dashboard'?'Dashboard':n.label==='scraper'?'Scraper':n.id==='swarm'?'Swarm Monitor':n.id==='intel'?'Intel Report':'Dashboard')}>
            {n.icon}
          </button>
        ))}
      </div>

      {/* Main */}
      <div style={S.main}>
        {/* Top bar */}
        <div style={S.topbar}>
          <span style={S.logo}>XTREME-SCRAPER</span>
          <div style={{flex:1}} />
          <span style={S.badge('#22c55e')}>● 5 Agents Online</span>
          <span style={S.badge('#6366f1')}>Asyncio Swarm</span>
          <span style={S.badge('#F6B800')}>Apollo Intel Loaded</span>
          <span style={{fontSize:12,color:'rgba(255,255,255,0.4)'}}>Jeremy Bensen</span>
        </div>

        {/* Tabs */}
        <div style={S.tabbar}>
          {TABS.map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:'10px 16px',fontSize:13,fontWeight:tab===t?600:400,color:tab===t?'#6366f1':'rgba(255,255,255,0.4)',background:'none',border:'none',borderBottom:tab===t?'2px solid #6366f1':'2px solid transparent',cursor:'pointer',transition:'all 0.15s'}}>{t}</button>)}
        </div>

        {/* Content */}
        <div style={S.content}>
          {tab==='Dashboard' && <DashboardTab jobs={jobs} />}
          {tab==='Scraper' && <ScraperTab onJobStart={j=>setJobs(prev=>[j,...prev])} />}
          {tab==='Swarm Monitor' && <SwarmTab />}
          {tab==='Intel Report' && <IntelTab />}
        </div>
      </div>

      {/* Base44 Chat Widget — Bottom Left */}
      <ChatWidget />
    </div>
  )
}
