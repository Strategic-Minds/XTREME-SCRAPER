"use client"
import { useState, useEffect } from "react"

interface Lead {
  company_name: string; phone?: string; email?: string
  website?: string; city?: string; state?: string
  category?: string; source_url?: string
}
interface Job {
  id: string; source: Source; status: "running"|"complete"|"error"
  leads: number; duration_ms?: number; log: string[]
}
interface Source {
  id: string; name: string; icon: string
  description: string; build: (i:string,c:string,s:string)=>string
}

const SOURCES: Source[] = [
  { id:"yellowpages", name:"Yellow Pages", icon:"📒", description:"Largest US directory",
    build:(i,c,s)=>`https://www.yellowpages.com/${c.toLowerCase().replace(/\s+/g,"-")}-${s.toLowerCase()}/mip/${i.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}` },
  { id:"yelp", name:"Yelp", icon:"⭐", description:"Reviews + local discovery",
    build:(i,c,s)=>`https://www.yelp.com/search?find_desc=${encodeURIComponent(i)}&find_loc=${encodeURIComponent(c+", "+s)}` },
  { id:"googlemaps", name:"Google Maps", icon:"📍", description:"Google Places + local SEO",
    build:(i,c,s)=>`https://www.google.com/maps/search/${encodeURIComponent(i+" near "+c+" "+s)}` },
  { id:"angi", name:"Angi", icon:"🔧", description:"Home services — high intent",
    build:(i,c,s)=>`https://www.angi.com/companylist/us/${s.toLowerCase()}/${c.toLowerCase().replace(/\s+/g,"-")}/${i.toLowerCase().replace(/[^a-z0-9]+/g,"-")}-reviews-6988.htm` },
  { id:"bbb", name:"BBB", icon:"🏆", description:"Verified businesses only",
    build:(i,c,s)=>`https://www.bbb.org/search?find_country=USA&find_text=${encodeURIComponent(i)}&find_loc=${encodeURIComponent(c+", "+s)}` },
  { id:"homeadvisor", name:"HomeAdvisor", icon:"🏠", description:"Home pros — pre-qualified",
    build:(i,c,s)=>`https://www.homeadvisor.com/c.${i.replace(/\s+/g,"-")}.${c.replace(/\s+/g,"-")}-${s}.html` },
  { id:"thumbtack", name:"Thumbtack", icon:"📌", description:"On-demand professionals",
    build:(i,c,s)=>`https://www.thumbtack.com/k/${encodeURIComponent(i.toLowerCase().replace(/\s+/g,"-"))}/${encodeURIComponent(c.toLowerCase().replace(/\s+/g,"-"))}/` },
  { id:"manta", name:"Manta", icon:"🔍", description:"Small business profiles",
    build:(i,c,s)=>`https://www.manta.com/mb_46_${s.toUpperCase()}_${c.toLowerCase().replace(/\s+/g,"_")}/search?search_term=${encodeURIComponent(i)}` },
  { id:"chamberofcommerce", name:"Chamber", icon:"🏛️", description:"Local chamber listings",
    build:(i,c,s)=>`https://www.chamberofcommerce.com/search?q=${encodeURIComponent(i)}&location=${encodeURIComponent(c+", "+s)}` },
  { id:"facebook", name:"Facebook", icon:"📘", description:"FB Pages — phone + reviews",
    build:(i,c,s)=>`https://www.facebook.com/search/pages/?q=${encodeURIComponent(i+" "+c+" "+s)}` },
]

const STATUS: Record<string,string> = { running:"var(--blue)", complete:"var(--green)", error:"var(--red)" }

function hostname(url: string) {
  try { return new URL(url).hostname.replace("www.","") } catch { return "—" }
}

export default function ScraperDashboard() {
  const [city,     setCity]     = useState("")
  const [stateVal, setStateVal] = useState("")
  const [industry, setIndustry] = useState("")
  const [amount,   setAmount]   = useState("50")
  const [active,   setActive]   = useState<Set<string>>(new Set(SOURCES.map(s=>s.id)))
  const [jobs,     setJobs]     = useState<Job[]>([])
  const [leads,    setLeads]    = useState<Lead[]>([])
  const [stats,    setStats]    = useState({ total:0, today:0, runs:0 })
  const [loading,  setLoading]  = useState(false)
  const [dark,     setDark]     = useState(true)

  useEffect(()=>{
    const saved = localStorage.getItem("xscraper-theme")
    const pref  = window.matchMedia("(prefers-color-scheme: dark)").matches
    const isDark = saved ? saved==="dark" : pref
    setDark(isDark)
    document.documentElement.setAttribute("data-theme", isDark?"dark":"light")
  },[])

  function toggleTheme() {
    const next = !dark; setDark(next)
    document.documentElement.setAttribute("data-theme", next?"dark":"light")
    localStorage.setItem("xscraper-theme", next?"dark":"light")
  }

  useEffect(()=>{ fetchStats(); fetchLeads() },[])

  async function fetchStats() {
    try { const r=await fetch("/api/stats"); if(r.ok){const d=await r.json(); setStats({total:d.total_leads??0,today:d.new_today??0,runs:d.total_runs??0})} } catch{}
  }
  async function fetchLeads() {
    try { const r=await fetch("/api/leads?limit=200"); if(r.ok){const d=await r.json(); setLeads(Array.isArray(d)?d:(d.leads??[]))} } catch{}
  }

  function toggle(id:string) {
    setActive(prev=>{ const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n })
  }

  async function run() {
    const sel = SOURCES.filter(s=>active.has(s.id))
    if(!sel.length||!industry.trim()) return
    setLoading(true)
    for(const src of sel) {
      const url   = src.build(industry.trim(), city.trim()||"USA", stateVal.trim()||"US")
      const jobId = Date.now().toString()+Math.random()
      setJobs(prev=>[{id:jobId,source:src,status:"running",leads:0,log:[`▶ ${src.name}`]},...prev])
      try {
        const r = await fetch("/api/scrape",{method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({url,industry:industry.trim(),city:city.trim(),state:stateVal.trim(),max_pages:Math.max(1,parseInt(amount)||50)})})
        const d = await r.json()
        setJobs(prev=>prev.map(j=>j.id!==jobId?j:{...j,status:r.ok?"complete":"error",leads:d.leads_saved??d.leads_found??0,duration_ms:d.duration_ms,
          log:[...j.log,r.ok?`✅ ${d.leads_saved??0} leads saved`:`❌ ${d.error||"Error"}`]}))
        if(r.ok){fetchStats();fetchLeads()}
      } catch(e:unknown){
        setJobs(prev=>prev.map(j=>j.id===jobId?{...j,status:"error",log:[...j.log,`❌ ${String(e)}`]}:j))
      }
      await new Promise(res=>setTimeout(res,400))
    }
    setLoading(false)
  }

  const selCount = active.size
  const canRun   = !loading && !!industry.trim() && selCount>0

  const card: React.CSSProperties = {
    background:"var(--bg2)", border:"1px solid var(--border)",
    borderRadius:14, padding:16, boxShadow:"0 2px 16px var(--shadow)",
  }
  const lbl: React.CSSProperties = {
    display:"block", fontSize:11, fontWeight:600,
    color:"var(--text3)", textTransform:"uppercase" as const,
    letterSpacing:"0.7px", marginBottom:6,
  }

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",color:"var(--text)"}}>

      {/* HEADER */}
      <header style={{
        position:"sticky",top:0,zIndex:100,
        background:"var(--bg2)",borderBottom:"1px solid var(--border)",
        padding:"0 16px",height:56,
        display:"flex",alignItems:"center",justifyContent:"space-between",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:20}}>⚡</span>
          <div>
            <h1 style={{fontSize:14,fontWeight:800,letterSpacing:-0.5,lineHeight:1}}>XTREME SCRAPER</h1>
            <p style={{fontSize:9,color:"var(--text3)",marginTop:1}}>Lead Discovery Engine</p>
          </div>
        </div>
        <div className="header-stats">
          {[["Leads",stats.total,"var(--green)"],["Today",stats.today,"var(--blue)"],["Runs",stats.runs,"var(--purple)"]].map(([l,v,c])=>(
            <div key={String(l)} style={{textAlign:"center"}}>
              <p style={{fontSize:16,fontWeight:800,color:String(c),lineHeight:1}}>{v}</p>
              <p style={{fontSize:9,color:"var(--text3)",textTransform:"uppercase",letterSpacing:1}}>{l}</p>
            </div>
          ))}
          <button onClick={toggleTheme} style={{
            background:"var(--bg3)",border:"1px solid var(--border)",
            borderRadius:20,padding:"5px 10px",fontSize:14,
            color:"var(--text2)",cursor:"pointer",flexShrink:0,
          }}>{dark?"☀️":"🌙"}</button>
        </div>
      </header>

      <div style={{maxWidth:900,margin:"0 auto",padding:"16px",display:"flex",flexDirection:"column",gap:14}}>

        {/* SEARCH CARD */}
        <div style={{...card,border:"1px solid var(--accent)",boxShadow:"0 0 0 1px var(--card-glow),0 4px 24px var(--shadow)"}}>
          <p style={{fontSize:11,fontWeight:700,color:"var(--accent)",textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>
            🎯 What are you looking for?
          </p>
          {/* Industry — full width */}
          <div style={{marginBottom:10}}>
            <label style={lbl}>Industry / Business Type</label>
            <input value={industry} onChange={e=>setIndustry(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&canRun&&run()}
              placeholder="e.g. Epoxy Flooring, HVAC, Roofing, Dentist..."
              style={{fontSize:16,fontWeight:500}}
              autoFocus
            />
          </div>
          {/* City / State / Amount — 3 col on mobile too (short labels) */}
          <div className="search-grid-row2" style={{marginBottom:14}}>
            <div>
              <label style={lbl}>City</label>
              <input value={city} onChange={e=>setCity(e.target.value)} placeholder="Phoenix" />
            </div>
            <div>
              <label style={lbl}>State</label>
              <input value={stateVal} onChange={e=>setStateVal(e.target.value)} placeholder="AZ" style={{textTransform:"uppercase"}} />
            </div>
            <div>
              <label style={lbl}>Limit</label>
              <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} min={5} max={500} placeholder="50" />
            </div>
          </div>
          {/* BIG RUN BUTTON */}
          <button onClick={run} disabled={!canRun} style={{
            width:"100%", padding:"15px 0",
            background:canRun?"linear-gradient(135deg,var(--accent),var(--accent2))":"var(--bg3)",
            color:canRun?"white":"var(--text3)",
            border:"none",borderRadius:12,fontSize:15,fontWeight:800,
            cursor:canRun?"pointer":"not-allowed",letterSpacing:0.3,
            boxShadow:canRun?"0 4px 20px rgba(37,99,235,0.35)":"none",
            transition:"all 0.2s",lineHeight:1.4,
          }}>
            {loading
              ? `⏳ Scraping ${selCount} source${selCount!==1?"s":""}...`
              : canRun
                ? `⚡ Search ${selCount} Source${selCount!==1?"s":""}\n"${industry}"${city?` in ${city}`:""}${stateVal?`, ${stateVal.toUpperCase()}`:""}`
                : "Enter an industry above to begin"
            }
          </button>
        </div>

        {/* SOURCES */}
        <div style={card}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div>
              <p style={{fontSize:11,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:1}}>📡 Sources</p>
              <p style={{fontSize:11,color:"var(--text3)",marginTop:2}}>{selCount} / {SOURCES.length} selected</p>
            </div>
            <div style={{display:"flex",gap:6}}>
              {[["All",()=>setActive(new Set(SOURCES.map(s=>s.id)))],["None",()=>setActive(new Set())]].map(([l,fn])=>(
                <button key={String(l)} onClick={fn as ()=>void} style={{
                  fontSize:11,padding:"4px 10px",borderRadius:6,
                  border:"1px solid var(--border)",background:"var(--bg3)",
                  color:"var(--text2)",cursor:"pointer",
                }}>{String(l)}</button>
              ))}
            </div>
          </div>
          <div className="sources-grid">
            {SOURCES.map(src=>{
              const on = active.has(src.id)
              return (
                <button key={src.id} onClick={()=>toggle(src.id)} style={{
                  display:"flex",alignItems:"center",gap:8,
                  padding:"10px 10px",borderRadius:10,cursor:"pointer",textAlign:"left",
                  border:on?"1px solid rgba(37,99,235,0.5)":"1px solid var(--border)",
                  background:on?"rgba(37,99,235,0.1)":"var(--bg3)",
                  transition:"all 0.15s",minWidth:0,
                }}>
                  <div style={{
                    width:16,height:16,borderRadius:4,flexShrink:0,
                    border:on?"none":"1.5px solid var(--text3)",
                    background:on?"var(--accent)":"transparent",
                    display:"flex",alignItems:"center",justifyContent:"center",
                  }}>
                    {on&&<span style={{fontSize:9,color:"white",lineHeight:1}}>✓</span>}
                  </div>
                  <span style={{fontSize:16,flexShrink:0}}>{src.icon}</span>
                  <div style={{minWidth:0,flex:1}}>
                    <p style={{fontSize:11,fontWeight:600,color:on?"var(--text)":"var(--text2)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{src.name}</p>
                    <p style={{fontSize:9,color:"var(--text3)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{src.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* JOB QUEUE */}
        {jobs.length>0&&(
          <div style={card}>
            <p style={{fontSize:11,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>🔄 Job Queue</p>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {jobs.slice(0,8).map(job=>(
                <div key={job.id} style={{
                  display:"flex",alignItems:"center",gap:10,
                  background:"var(--bg3)",border:"1px solid var(--border2)",
                  borderRadius:8,padding:"10px 12px",
                }}>
                  <span style={{fontSize:18,flexShrink:0}}>{job.source.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                      <span style={{fontSize:12,fontWeight:600}}>{job.source.name}</span>
                      <span style={{fontSize:10,fontWeight:700,color:STATUS[job.status],textTransform:"uppercase"}}>{job.status}</span>
                    </div>
                    <p style={{fontSize:10,color:"var(--text3)",fontFamily:"monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{job.log[job.log.length-1]}</p>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <p style={{fontSize:16,fontWeight:800,color:"var(--green)"}}>{job.leads}</p>
                    <p style={{fontSize:9,color:"var(--text3)"}}>leads</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LEADS TABLE — scrollable on mobile */}
        <div style={{...card,flex:1}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <p style={{fontSize:11,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:1}}>
              📋 Leads ({leads.length})
            </p>
            <button onClick={fetchLeads} style={{fontSize:11,color:"var(--blue)",background:"none",border:"none",cursor:"pointer",padding:"4px 8px"}}>
              ↻ Refresh
            </button>
          </div>
          {leads.length===0?(
            <div style={{textAlign:"center",padding:"40px 0"}}>
              <p style={{fontSize:32,marginBottom:10}}>🔍</p>
              <p style={{fontSize:14,fontWeight:600,color:"var(--text2)",marginBottom:4}}>No leads yet</p>
              <p style={{fontSize:12,color:"var(--text3)"}}>Type what you want above and hit Search</p>
            </div>
          ):(
            <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:500}}>
                <thead>
                  <tr style={{borderBottom:"1px solid var(--border)"}}>
                    {["Company","City","Phone","Industry","Source"].map(h=>(
                      <th key={h} style={{textAlign:"left",paddingBottom:8,paddingRight:12,fontSize:10,fontWeight:600,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.5px",whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead,i)=>(
                    <tr key={i} style={{borderBottom:"1px solid var(--border2)"}}>
                      <td style={{padding:"8px 12px 8px 0",fontWeight:600,whiteSpace:"nowrap"}}>{lead.company_name}</td>
                      <td style={{padding:"8px 12px 8px 0",color:"var(--text2)",whiteSpace:"nowrap"}}>{lead.city||"—"}{lead.state?`, ${lead.state}`:""}</td>
                      <td style={{padding:"8px 12px 8px 0",color:"var(--text2)",whiteSpace:"nowrap"}}>{lead.phone||"—"}</td>
                      <td style={{padding:"8px 12px 8px 0",whiteSpace:"nowrap"}}>
                        <span style={{background:"var(--tag-bg)",color:"var(--tag-text)",padding:"2px 7px",borderRadius:4,fontSize:10,fontWeight:600}}>
                          {lead.category||"—"}
                        </span>
                      </td>
                      <td style={{padding:"8px 0",color:"var(--text3)",fontSize:10,whiteSpace:"nowrap"}}>{hostname(lead.source_url||"")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
