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
  const [jobs,     setJobs]     = useState<Job[]>([])
  const [leads,    setLeads]    = useState<Lead[]>([])
  const [stats,    setStats]    = useState({ total:0, today:0, runs:0 })
  const [loading,  setLoading]  = useState(false)

  const active = new Set(SOURCES.map(s => s.id))
  const selCount = SOURCES.length

  useEffect(()=>{ fetchStats(); fetchLeads() },[])

  async function fetchStats() {
    try { const r=await fetch("/api/stats"); if(r.ok){const d=await r.json(); setStats({total:d.total_leads??0,today:d.new_today??0,runs:d.total_runs??0})} } catch{}
  }
  async function fetchLeads() {
    try { const r=await fetch("/api/leads?limit=200"); if(r.ok){const d=await r.json(); setLeads(Array.isArray(d)?d:(d.leads??[]))} } catch{}
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

  const canRun = !loading && !!industry.trim()

  function exportCSV() {
    const rows = [["Company","City","Phone","Industry","Source"],
      ...leads.map(l=>[l.company_name,l.city||"",l.phone||"",l.category||"",l.source_url||""])]
    const blob = new Blob([rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n")],{type:"text/csv"})
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="leads.csv"; a.click()
  }

  return (
    <div style={{minHeight:"100vh",background:"#f8fafc",color:"#000000",display:"flex",flexDirection:"column"}}>

      {/* HEADER */}
      <header style={{
        position:"sticky",top:0,zIndex:100,
        background:"#ffffff",borderBottom:"1.5px solid rgba(0,0,0,0.10)",
        padding:"0 20px",height:56,flexShrink:0,
        display:"flex",alignItems:"center",justifyContent:"space-between",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:22}}>⚡</span>
          <div>
            <h1 style={{fontSize:15,fontWeight:900,letterSpacing:-0.5,color:"#000000",lineHeight:1}}>XTREME SCRAPER</h1>
            <p style={{fontSize:10,color:"#555555",marginTop:1}}>Lead Discovery Engine</p>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:24}}>
          {[["LEADS",stats.total,"#16a34a"],["TODAY",stats.today,"#2563eb"],["RUNS",stats.runs,"#7c3aed"]].map(([l,v,c])=>(
            <div key={String(l)} style={{textAlign:"center"}}>
              <p style={{fontSize:20,fontWeight:900,color:String(c),lineHeight:1}}>{v}</p>
              <p style={{fontSize:9,color:"#777777",textTransform:"uppercase",letterSpacing:1}}>{l}</p>
            </div>
          ))}
        </div>
      </header>

      {/* ── MAIN SCROLLABLE AREA — results live here ── */}
      <div style={{flex:1,overflowY:"auto",padding:"20px 16px 16px",maxWidth:860,width:"100%",margin:"0 auto",boxSizing:"border-box"}}>

        {/* RESULTS PANEL */}
        {leads.length > 0 ? (
          <div style={{background:"#ffffff",border:"1.5px solid rgba(0,0,0,0.10)",borderRadius:14,overflow:"hidden",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",borderBottom:"1px solid rgba(0,0,0,0.07)"}}>
              <div>
                <p style={{fontSize:13,fontWeight:800,color:"#000000"}}>Results</p>
                <p style={{fontSize:11,color:"#555555",marginTop:2}}>{leads.length} leads found</p>
              </div>
              <button onClick={exportCSV} style={{
                fontSize:12,fontWeight:700,color:"#ffffff",
                background:"#2563eb",border:"none",borderRadius:8,
                padding:"8px 16px",cursor:"pointer",
              }}>Export CSV</button>
            </div>
            <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch" as "touch"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:500}}>
                <thead>
                  <tr style={{background:"#f8fafc"}}>
                    {["Company","City","Phone","Industry","Source"].map(h=>(
                      <th key={h} style={{textAlign:"left",padding:"10px 14px",fontSize:10,fontWeight:800,color:"#444444",textTransform:"uppercase",letterSpacing:"0.6px",borderBottom:"1px solid rgba(0,0,0,0.07)"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l,i)=>(
                    <tr key={i} style={{borderBottom:"1px solid rgba(0,0,0,0.05)",background:i%2===0?"#ffffff":"#fafafa"}}>
                      <td style={{padding:"10px 14px",fontWeight:600,color:"#000000"}}>{l.company_name}</td>
                      <td style={{padding:"10px 14px",color:"#333333"}}>{l.city||"—"}</td>
                      <td style={{padding:"10px 14px",color:"#333333"}}>{l.phone||"—"}</td>
                      <td style={{padding:"10px 14px",color:"#333333"}}>{l.category||"—"}</td>
                      <td style={{padding:"10px 14px"}}>
                        {l.source_url
                          ? <a href={l.source_url} target="_blank" rel="noopener noreferrer" style={{color:"#2563eb",textDecoration:"none",fontWeight:600}}>View</a>
                          : <span style={{color:"#999999"}}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* EMPTY STATE */
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 20px",color:"#888888",textAlign:"center"}}>
            <span style={{fontSize:48,marginBottom:16}}>🔍</span>
            <p style={{fontSize:16,fontWeight:700,color:"#333333",marginBottom:6}}>Ready to find leads</p>
            <p style={{fontSize:13,color:"#888888"}}>Fill in the card below and hit Run</p>
          </div>
        )}

        {/* RUN ACTIVITY — mini status pills while running */}
        {jobs.length > 0 && (
          <div style={{marginBottom:16,display:"flex",flexWrap:"wrap",gap:8}}>
            {jobs.slice(0,10).map(job=>(
              <div key={job.id} style={{
                display:"flex",alignItems:"center",gap:6,
                background:"#ffffff",border:"1px solid rgba(0,0,0,0.10)",
                borderRadius:20,padding:"5px 12px",fontSize:11,fontWeight:600,
              }}>
                <span style={{
                  width:7,height:7,borderRadius:"50%",flexShrink:0,
                  background: job.status==="running"?"#2563eb":job.status==="complete"?"#16a34a":"#dc2626",
                }}/>
                <span style={{color:"#000000"}}>{job.source.name}</span>
                {job.status==="complete"&&<span style={{color:"#16a34a"}}>+{job.leads}</span>}
                {job.status==="running"&&<span style={{color:"#2563eb",animation:"pulse 1s infinite"}}>…</span>}
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ── SEARCH CARD — PINNED TO BOTTOM ── */}
      <div style={{
        flexShrink:0,
        borderTop:"1.5px solid rgba(0,0,0,0.10)",
        background:"#ffffff",
        padding:"16px",
        boxShadow:"0 -4px 24px rgba(0,0,0,0.06)",
      }}>
        <div style={{maxWidth:860,margin:"0 auto"}}>

          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <p style={{fontSize:11,fontWeight:800,color:"#2563eb",textTransform:"uppercase",letterSpacing:1}}>
              🎯 What are you looking for?
            </p>
            <span style={{
              fontSize:11,fontWeight:700,color:"#16a34a",
              background:"rgba(22,163,74,0.08)",
              border:"1px solid rgba(22,163,74,0.2)",
              borderRadius:20,padding:"3px 10px",
            }}>✓ {selCount} sources active</span>
          </div>

          {/* Industry */}
          <div style={{marginBottom:12}}>
            <input
              value={industry} onChange={e=>setIndustry(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&canRun&&run()}
              placeholder="Industry / Business Type — e.g. Epoxy Flooring, HVAC, Dentist..."
              style={{
                fontSize:15,fontWeight:500,color:"#000000",
                background:"#f8fafc",border:"1.5px solid rgba(0,0,0,0.15)",
                width:"100%",borderRadius:10,padding:"12px 14px",outline:"none",
                boxSizing:"border-box",
              }}
              autoFocus
            />
          </div>

          {/* City / State / Limit / Button */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 100px 100px auto",gap:10,alignItems:"flex-end"}}>
            <input value={city} onChange={e=>setCity(e.target.value)} placeholder="City (e.g. Phoenix)"
              style={{color:"#000000",background:"#f8fafc",border:"1.5px solid rgba(0,0,0,0.15)",
                borderRadius:10,padding:"11px 14px",fontSize:14,outline:"none"}} />
            <input value={stateVal} onChange={e=>setStateVal(e.target.value)} placeholder="State"
              style={{textTransform:"uppercase",color:"#000000",background:"#f8fafc",border:"1.5px solid rgba(0,0,0,0.15)",
                borderRadius:10,padding:"11px 14px",fontSize:14,outline:"none"}} />
            <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="50" min={1} max={500}
              style={{color:"#000000",background:"#f8fafc",border:"1.5px solid rgba(0,0,0,0.15)",
                borderRadius:10,padding:"11px 14px",fontSize:14,outline:"none"}} />
            <button onClick={run} disabled={!canRun} style={{
              padding:"11px 28px",borderRadius:10,border:"none",cursor:canRun?"pointer":"not-allowed",
              fontWeight:800,fontSize:14,letterSpacing:0.3,
              background: canRun?"#2563eb":"#e2e8f0",
              color: canRun?"#ffffff":"#94a3b8",
              transition:"all 0.15s",whiteSpace:"nowrap",
            }}>
              {loading ? "Running…" : "▶ Run"}
            </button>
          </div>

        </div>
      </div>

    </div>
  )
}
