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
  { id:"chamberofcommerce", name:"Chamber of Commerce", icon:"🏛️", description:"Local chamber listings",
    build:(i,c,s)=>`https://www.chamberofcommerce.com/search?q=${encodeURIComponent(i)}&location=${encodeURIComponent(c+", "+s)}` },
  { id:"facebook", name:"Facebook Business", icon:"📘", description:"FB Pages — phone + reviews",
    build:(i,c,s)=>`https://www.facebook.com/search/pages/?q=${encodeURIComponent(i+" "+c+" "+s)}` },
]

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

  const statusColor: Record<string,string> = {
    running: "#2563eb",
    complete: "#16a34a",
    error: "#dc2626",
  }

  return (
    <div style={{minHeight:"100vh",background:"#ffffff",color:"#000000"}}>

      {/* HEADER */}
      <header style={{
        position:"sticky",top:0,zIndex:100,
        background:"#ffffff",borderBottom:"1.5px solid rgba(0,0,0,0.10)",
        padding:"0 20px",height:56,
        display:"flex",alignItems:"center",justifyContent:"space-between",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:22}}>⚡</span>
          <div>
            <h1 style={{fontSize:15,fontWeight:900,letterSpacing:-0.5,color:"#000000",lineHeight:1}}>XTREME SCRAPER</h1>
            <p style={{fontSize:10,color:"#666666",marginTop:1}}>Lead Discovery Engine</p>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:20}}>
          {[["LEADS",stats.total,"#16a34a"],["TODAY",stats.today,"#2563eb"],["RUNS",stats.runs,"#7c3aed"]].map(([l,v,c])=>(
            <div key={String(l)} style={{textAlign:"center"}}>
              <p style={{fontSize:18,fontWeight:900,color:String(c),lineHeight:1}}>{v}</p>
              <p style={{fontSize:9,color:"#666666",textTransform:"uppercase",letterSpacing:1}}>{l}</p>
            </div>
          ))}
        </div>
      </header>

      <div style={{maxWidth:900,margin:"0 auto",padding:"20px 16px",display:"flex",flexDirection:"column",gap:16}}>

        {/* ── SEARCH CARD ── */}
        <div style={{background:"#ffffff",border:"1.5px solid #2563eb",borderRadius:16,padding:20,boxShadow:"0 2px 20px rgba(37,99,235,0.08)"}}>
          <p style={{fontSize:11,fontWeight:800,color:"#2563eb",textTransform:"uppercase",letterSpacing:1,marginBottom:16}}>
            🎯 What are you looking for?
          </p>

          {/* Industry */}
          <div style={{marginBottom:12}}>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:"#000000",textTransform:"uppercase",letterSpacing:"0.7px",marginBottom:6}}>
              Industry / Business Type
            </label>
            <input
              value={industry} onChange={e=>setIndustry(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&canRun&&run()}
              placeholder="e.g. Epoxy Flooring, HVAC, Roofing, Dentist..."
              style={{fontSize:16,fontWeight:500,color:"#000000",background:"#ffffff",border:"1.5px solid rgba(0,0,0,0.18)"}}
              autoFocus
            />
          </div>

          {/* City / State / Limit */}
          <div className="search-grid-row2" style={{marginBottom:16}}>
            <div>
              <label style={{display:"block",fontSize:11,fontWeight:700,color:"#000000",textTransform:"uppercase",letterSpacing:"0.7px",marginBottom:6}}>City</label>
              <input value={city} onChange={e=>setCity(e.target.value)} placeholder="Phoenix" style={{color:"#000000",background:"#ffffff",border:"1.5px solid rgba(0,0,0,0.18)"}} />
            </div>
            <div>
              <label style={{display:"block",fontSize:11,fontWeight:700,color:"#000000",textTransform:"uppercase",letterSpacing:"0.7px",marginBottom:6}}>State</label>
              <input value={stateVal} onChange={e=>setStateVal(e.target.value)} placeholder="AZ" style={{textTransform:"uppercase",color:"#000000",background:"#ffffff",border:"1.5px solid rgba(0,0,0,0.18)"}} />
            </div>
            <div>
              <label style={{display:"block",fontSize:11,fontWeight:700,color:"#000000",textTransform:"uppercase",letterSpacing:"0.7px",marginBottom:6}}>Limit</label>
              <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} min={5} max={500} placeholder="50" style={{color:"#000000",background:"#ffffff",border:"1.5px solid rgba(0,0,0,0.18)"}} />
            </div>
          </div>

          {/* RUN BUTTON */}
          <button onClick={run} disabled={!canRun} style={{
            width:"100%",padding:"16px 0",
            background:canRun?"linear-gradient(135deg,#2563eb,#7c3aed)":"#f1f5f9",
            color:canRun?"#ffffff":"#999999",
            border:"none",borderRadius:12,fontSize:15,fontWeight:900,
            cursor:canRun?"pointer":"not-allowed",
            letterSpacing:0.5,
            transition:"opacity 0.15s",
          }}>
            {loading
              ? `⏳ Running ${selCount} source${selCount!==1?"s":""}...`
              : canRun
                ? `▶ Run ${selCount} Source${selCount!==1?"s":""}${city?" — "+city:""}${stateVal?", "+stateVal.toUpperCase():""}`
                : "Enter an industry above to begin"}
          </button>
        </div>

        {/* ── RESULTS (above sources) ── */}
        {(leads.length > 0 || jobs.length > 0) && (
          <div style={{background:"#ffffff",border:"1.5px solid rgba(0,0,0,0.10)",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
            {/* Run log */}
            {jobs.length > 0 && (
              <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(0,0,0,0.08)",display:"flex",flexDirection:"column",gap:6}}>
                <p style={{fontSize:11,fontWeight:800,color:"#000000",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>
                  🔄 Run Activity
                </p>
                {jobs.slice(0,6).map(job=>(
                  <div key={job.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:10,background:"#f8fafc",border:"1px solid rgba(0,0,0,0.08)"}}>
                    <span style={{fontSize:16,flexShrink:0}}>{job.source.icon}</span>
                    <span style={{fontSize:12,fontWeight:700,color:"#000000",flex:1}}>{job.source.name}</span>
                    <span style={{fontSize:11,color:statusColor[job.status],fontWeight:700}}>
                      {job.status==="running"?"⏳ Running…":job.status==="complete"?`✅ ${job.leads} leads`:`❌ Error`}
                    </span>
                    {job.duration_ms&&<span style={{fontSize:10,color:"#666666"}}>{(job.duration_ms/1000).toFixed(1)}s</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Leads table */}
            {leads.length > 0 && (
              <div>
                <div style={{padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(0,0,0,0.08)"}}>
                  <p style={{fontSize:11,fontWeight:800,color:"#000000",textTransform:"uppercase",letterSpacing:1}}>
                    📋 Results — {leads.length} leads found
                  </p>
                  <button onClick={()=>{
                    const csv=["Company,City,Phone,Website,Source"].concat(leads.map(l=>[l.company_name,l.city||"",l.phone||"",l.website||"",l.source_url||""].map(v=>`"${v}"`).join(","))).join("\n")
                    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="leads.csv";a.click()
                  }} style={{
                    padding:"6px 14px",background:"#2563eb",color:"#ffffff",
                    border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"
                  }}>⬇ Export CSV</button>
                </div>
                <div style={{overflowX:"auto",maxHeight:380,overflowY:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:500}}>
                    <thead>
                      <tr>
                        {["Company","City","Phone","Website","Source"].map(h=>(
                          <th key={h} style={{
                            background:"#f8fafc",color:"#000000",fontWeight:800,
                            fontSize:11,textTransform:"uppercase",letterSpacing:"0.6px",
                            padding:"10px 14px",textAlign:"left",
                            borderBottom:"1.5px solid rgba(0,0,0,0.10)",
                            position:"sticky",top:0,
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead,i)=>(
                        <tr key={i} style={{borderBottom:"1px solid rgba(0,0,0,0.06)"}}>
                          <td style={{padding:"10px 14px",fontWeight:600,color:"#000000"}}>{lead.company_name||"—"}</td>
                          <td style={{padding:"10px 14px",color:"#333333"}}>{lead.city||"—"}</td>
                          <td style={{padding:"10px 14px",color:"#333333"}}>{lead.phone||"—"}</td>
                          <td style={{padding:"10px 14px"}}>
                            {lead.website
                              ? <a href={lead.website} target="_blank" rel="noreferrer" style={{color:"#2563eb",fontWeight:600,textDecoration:"none"}}>
                                  {lead.website.replace(/https?:\/\/(www\.)?/,"").split("/")[0]}
                                </a>
                              : <span style={{color:"#999999"}}>—</span>}
                          </td>
                          <td style={{padding:"10px 14px"}}>
                            {lead.source_url
                              ? <a href={lead.source_url} target="_blank" rel="noreferrer" style={{color:"#7c3aed",fontWeight:600,fontSize:11,textDecoration:"none"}}>
                                  {lead.source_url.replace(/https?:\/\/(www\.)?/,"").split("/")[0]}
                                </a>
                              : <span style={{color:"#999999",fontSize:11}}>—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SOURCES ── */}
        <div style={{background:"#ffffff",border:"1.5px solid rgba(0,0,0,0.10)",borderRadius:16,padding:16,boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div>
              <p style={{fontSize:11,fontWeight:800,color:"#000000",textTransform:"uppercase",letterSpacing:1}}>📡 Sources</p>
              <p style={{fontSize:11,color:"#555555",marginTop:2}}>{selCount} / {SOURCES.length} selected</p>
            </div>
            <div style={{display:"flex",gap:6}}>
              {[["All",()=>setActive(new Set(SOURCES.map(s=>s.id)))],["None",()=>setActive(new Set())]].map(([l,fn])=>(
                <button key={String(l)} onClick={fn as ()=>void} style={{
                  padding:"5px 14px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",
                  border:"1.5px solid rgba(0,0,0,0.15)",background:"#f8fafc",color:"#000000",
                }}>{String(l)}</button>
              ))}
            </div>
          </div>
          <div className="sources-grid">
            {SOURCES.map(src=>{
              const on = active.has(src.id)
              return (
                <button key={src.id} onClick={()=>toggle(src.id)}
                  className={`source-card${on?" active":""}`}
                  style={{
                    display:"flex",alignItems:"center",gap:10,padding:"12px 14px",
                    borderRadius:12,cursor:"pointer",textAlign:"left",width:"100%",
                    border:on?"1.5px solid #2563eb":"1.5px solid rgba(0,0,0,0.10)",
                    background:on?"rgba(37,99,235,0.06)":"#f8fafc",
                    transition:"all 0.15s",
                  }}>
                  {/* Checkbox */}
                  <div style={{
                    width:18,height:18,borderRadius:5,flexShrink:0,
                    border:on?"none":"1.5px solid rgba(0,0,0,0.25)",
                    background:on?"#2563eb":"transparent",
                    display:"flex",alignItems:"center",justifyContent:"center",
                  }}>
                    {on&&<span style={{fontSize:10,color:"#ffffff",lineHeight:1}}>✓</span>}
                  </div>
                  <span style={{fontSize:20,flexShrink:0}}>{src.icon}</span>
                  <div style={{minWidth:0}}>
                    <p style={{fontSize:13,fontWeight:700,color:"#000000",lineHeight:1.2}}>{src.name}</p>
                    <p style={{fontSize:11,color:"#555555",marginTop:2}}>{src.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
