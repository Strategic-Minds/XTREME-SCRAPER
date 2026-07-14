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

  useEffect(()=>{ fetchStats(); fetchLeads() },[])

  async function fetchStats() {
    try { const r=await fetch("/api/stats"); if(r.ok){const d=await r.json(); setStats({total:d.total_leads??0,today:d.new_today??0,runs:d.total_runs??0})} } catch{}
  }
  async function fetchLeads() {
    try { const r=await fetch("/api/leads?limit=200"); if(r.ok){const d=await r.json(); setLeads(Array.isArray(d)?d:(d.leads??[]))} } catch{}
  }

  async function run() {
    if(loading||!industry.trim()) return
    setLoading(true)
    for(const src of SOURCES) {
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

  function exportCSV() {
    const rows = [["Company","City","Phone","Industry","Source"],
      ...leads.map(l=>[l.company_name,l.city||"",l.phone||"",l.category||"",l.source_url||""])]
    const blob = new Blob([rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n")],{type:"text/csv"})
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="leads.csv"; a.click()
  }

  const inputStyle: React.CSSProperties = {
    width:"100%", padding:"11px 14px", fontSize:14, fontWeight:500,
    border:"1.5px solid #e2e8f0", borderRadius:10, outline:"none",
    background:"#f8fafc", color:"#000000", boxSizing:"border-box",
    fontFamily:"inherit",
  }

  return (
    /* ROOT — full viewport, no scroll on body */
    <div style={{
      height:"100dvh", width:"100%",
      display:"flex", flexDirection:"column",
      background:"#f1f5f9", overflow:"hidden",
      fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    }}>

      {/* ══════════════════════════════════════
          TOP SECTION — sticky header + input card
      ══════════════════════════════════════ */}
      <div style={{flexShrink:0, background:"#ffffff", boxShadow:"0 2px 12px rgba(0,0,0,0.08)"}}>

        {/* Brand bar */}
        <div style={{
          padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between",
          borderBottom:"1px solid #f1f5f9",
        }}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:20}}>⚡</span>
            <div>
              <h1 style={{fontSize:14,fontWeight:900,letterSpacing:-0.5,color:"#000000",lineHeight:1}}>XTREME SCRAPER</h1>
              <p style={{fontSize:10,color:"#64748b",marginTop:1}}>Lead Discovery Engine</p>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:20}}>
            {([["LEADS",stats.total,"#16a34a"],["TODAY",stats.today,"#2563eb"],["RUNS",stats.runs,"#7c3aed"]] as [string,number,string][]).map(([l,v,c])=>(
              <div key={l} style={{textAlign:"center"}}>
                <p style={{fontSize:18,fontWeight:900,color:c,lineHeight:1}}>{v}</p>
                <p style={{fontSize:9,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.8px"}}>{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── INPUT CARD — at the top ── */}
        <div style={{padding:"14px 20px 16px"}}>
          {/* Row 1: Industry (full width) */}
          <input
            value={industry}
            onChange={e=>setIndustry(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&run()}
            placeholder="Industry / Business Type — e.g. Epoxy Flooring, HVAC, Dentist..."
            style={{...inputStyle, marginBottom:10}}
          />
          {/* Row 2: City | State | Limit | Run */}
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <input
              value={city} onChange={e=>setCity(e.target.value)}
              placeholder="City (e.g. Phoenix)"
              style={{...inputStyle, flex:3}}
            />
            <input
              value={stateVal} onChange={e=>setStateVal(e.target.value)}
              placeholder="State"
              style={{...inputStyle, flex:1, minWidth:60}}
            />
            <input
              value={amount} onChange={e=>setAmount(e.target.value)}
              placeholder="50"
              style={{...inputStyle, flex:1, minWidth:60}}
            />
            <button
              onClick={run}
              disabled={!industry.trim()||loading}
              style={{
                flexShrink:0, padding:"11px 22px",
                fontWeight:800, fontSize:14, color:"#ffffff",
                background: !industry.trim()||loading ? "#94a3b8" : "#2563eb",
                border:"none", borderRadius:10, cursor: !industry.trim()||loading ? "not-allowed" : "pointer",
                whiteSpace:"nowrap", transition:"background 0.15s",
              }}
            >
              {loading ? "⏳ Running..." : "▶ Run"}
            </button>
          </div>
          {/* Sources pill */}
          <div style={{marginTop:8,display:"flex",alignItems:"center",gap:8}}>
            <span style={{
              display:"inline-flex",alignItems:"center",gap:5,
              fontSize:11,fontWeight:700,color:"#16a34a",
              background:"#f0fdf4",border:"1px solid #bbf7d0",
              borderRadius:20,padding:"3px 10px",
            }}>✓ 10 sources active</span>
            {loading && <span style={{fontSize:11,color:"#64748b"}}>Scanning all sources…</span>}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          BOTTOM SECTION — results area (scrollable)
      ══════════════════════════════════════ */}
      <div style={{flex:1, overflowY:"auto", padding:"16px 20px", WebkitOverflowScrolling:"touch" as "touch"}}>

        {/* Active run status pills */}
        {jobs.length>0 && (
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
            {jobs.slice(0,10).map(j=>(
              <span key={j.id} style={{
                fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:20,
                background: j.status==="running" ? "#eff6ff" : j.status==="complete" ? "#f0fdf4" : "#fef2f2",
                color:       j.status==="running" ? "#2563eb" : j.status==="complete" ? "#16a34a" : "#dc2626",
                border: `1px solid ${j.status==="running"?"#bfdbfe":j.status==="complete"?"#bbf7d0":"#fecaca"}`,
              }}>
                {j.source.icon} {j.source.name} {j.status==="running"?"…":j.status==="complete"?`✓ ${j.leads}`:"✗"}
              </span>
            ))}
          </div>
        )}

        {/* RESULTS TABLE */}
        {leads.length > 0 ? (
          <div style={{background:"#ffffff",borderRadius:14,border:"1.5px solid #e2e8f0",overflow:"hidden"}}>
            <div style={{
              display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"12px 18px",borderBottom:"1px solid #f1f5f9",
            }}>
              <div>
                <p style={{fontSize:13,fontWeight:800,color:"#000000"}}>Results</p>
                <p style={{fontSize:11,color:"#64748b",marginTop:1}}>{leads.length} leads found</p>
              </div>
              <button onClick={exportCSV} style={{
                fontSize:12,fontWeight:700,color:"#ffffff",
                background:"#2563eb",border:"none",borderRadius:8,
                padding:"7px 16px",cursor:"pointer",
              }}>⬇ Export CSV</button>
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:500}}>
                <thead>
                  <tr style={{background:"#f8fafc"}}>
                    {["Company","City","Phone","Industry","Source"].map(h=>(
                      <th key={h} style={{
                        textAlign:"left",padding:"10px 16px",
                        fontSize:10,fontWeight:800,color:"#475569",
                        textTransform:"uppercase",letterSpacing:"0.6px",
                        borderBottom:"1px solid #f1f5f9",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l,i)=>(
                    <tr key={i} style={{borderBottom:"1px solid #f8fafc",background:i%2===0?"#ffffff":"#fafafa"}}>
                      <td style={{padding:"10px 16px",fontWeight:600,color:"#000000"}}>{l.company_name}</td>
                      <td style={{padding:"10px 16px",color:"#334155"}}>{l.city||"—"}</td>
                      <td style={{padding:"10px 16px",color:"#334155"}}>{l.phone||"—"}</td>
                      <td style={{padding:"10px 16px",color:"#334155"}}>{l.category||"—"}</td>
                      <td style={{padding:"10px 16px"}}>
                        {l.source_url
                          ? <a href={l.source_url} target="_blank" rel="noopener noreferrer"
                              style={{color:"#2563eb",textDecoration:"none",fontWeight:600}}>View</a>
                          : <span style={{color:"#94a3b8"}}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* EMPTY STATE */
          <div style={{
            display:"flex",flexDirection:"column",alignItems:"center",
            justifyContent:"center",height:"100%",minHeight:200,
            color:"#94a3b8",textAlign:"center",
          }}>
            <span style={{fontSize:42,marginBottom:12}}>🔍</span>
            <p style={{fontSize:15,fontWeight:700,color:"#334155",marginBottom:4}}>Results will appear here</p>
            <p style={{fontSize:13,color:"#94a3b8"}}>Type an industry above and hit Run</p>
          </div>
        )}
      </div>
    </div>
  )
}
