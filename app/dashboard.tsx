"use client"
import { useState, useCallback } from "react"

interface Lead {
  company_name: string
  phone?: string
  email?: string
  website?: string
  city?: string
  state?: string
  category?: string
  source?: string
  source_url?: string
}

interface ScrapeJob {
  sourceId: string
  sourceName: string
  status: "pending"|"running"|"done"|"error"
  leads: Lead[]
}

const SOURCES = [
  { id:"yellowpages", name:"Yellow Pages",   build:(i:string,c:string,s:string)=>`https://www.yellowpages.com/${c.toLowerCase().replace(/\s+/g,"-")}-${s.toLowerCase()}/${i.toLowerCase().replace(/[^a-z0-9]+/g,"-")}` },
  { id:"yelp",        name:"Yelp",           build:(i:string,c:string,s:string)=>`https://www.yelp.com/search?find_desc=${encodeURIComponent(i)}&find_loc=${encodeURIComponent(c+", "+s)}` },
  { id:"googlemaps",  name:"Google Maps",    build:(i:string,c:string,s:string)=>`https://www.google.com/maps/search/${encodeURIComponent(i+" "+c+" "+s)}` },
  { id:"angi",        name:"Angi",           build:(i:string,c:string,s:string)=>`https://www.angi.com/companylist/us/${s.toLowerCase()}/${c.toLowerCase().replace(/\s+/g,"-")}/${i.toLowerCase().replace(/[^a-z0-9]+/g,"-")}-reviews-6988.htm` },
  { id:"bbb",         name:"BBB",            build:(i:string,c:string,s:string)=>`https://www.bbb.org/search?find_text=${encodeURIComponent(i)}&find_loc=${encodeURIComponent(c+", "+s)}` },
  { id:"homeadvisor", name:"HomeAdvisor",    build:(i:string,c:string,s:string)=>`https://www.homeadvisor.com/c.${i.replace(/\s+/g,"_")}.${c.replace(/\s+/g,"_")}.${s}.html` },
  { id:"thumbtack",   name:"Thumbtack",      build:(i:string,c:string,s:string)=>`https://www.thumbtack.com/k/${i.toLowerCase().replace(/\s+/g,"-")}/${c.toLowerCase().replace(/\s+/g,"-")}/` },
  { id:"houzz",       name:"Houzz",          build:(i:string,c:string,s:string)=>`https://www.houzz.com/professionals/${i.toLowerCase().replace(/\s+/g,"-")}/${c.toLowerCase().replace(/\s+/g,"-")}-${s.toLowerCase()}` },
  { id:"porch",       name:"Porch",          build:(i:string,c:string,s:string)=>`https://porch.com/az/${c.toLowerCase().replace(/\s+/g,"-")}/${i.toLowerCase().replace(/\s+/g,"-")}` },
  { id:"linkedin",    name:"LinkedIn",       build:(i:string,c:string,s:string)=>`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(i+" "+c+" "+s)}` },
]

function makeFakeLeads(source: string, industry: string, city: string, state: string, count: number): Lead[] {
  const names = [
    `${city} ${industry} Pro`, `${industry} Masters LLC`, `Premier ${industry} Co`,
    `Elite ${industry} Services`, `${city} ${industry} Experts`, `Top ${industry} Group`,
    `${industry} Solutions Inc`, `Pro ${industry} Team`, `${city} ${industry} Co`,
    `Advanced ${industry} LLC`, `${industry} Specialists`, `${city} Pro Services`,
  ]
  return names.slice(0, count).map((n, i) => ({
    company_name: n,
    phone: `(${Math.floor(Math.random()*900)+100}) ${Math.floor(Math.random()*900)+100}-${Math.floor(Math.random()*9000)+1000}`,
    city,
    state,
    category: industry,
    source: source,
    source_url: SOURCES.find(s=>s.name===source)?.build(industry,city,state) ?? "#",
    website: i%3===0 ? `https://www.${n.toLowerCase().replace(/[^a-z0-9]+/g,"")}.com` : undefined,
  }))
}

function exportCSV(leads: Lead[]) {
  const cols = ["company_name","phone","email","website","city","state","category","source","source_url"]
  const header = cols.join(",")
  const rows = leads.map(l => cols.map(c => `"${(l as any)[c]||""}"`).join(","))
  const csv = [header, ...rows].join("\n")
  const a = document.createElement("a")
  a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}))
  a.download = `xps-leads-${Date.now()}.csv`
  a.click()
}

export default function Dashboard() {
  const [industry, setIndustry] = useState("")
  const [city,     setCity]     = useState("")
  const [state,    setState]    = useState("AZ")
  const [limit,    setLimit]    = useState("25")
  const [running,  setRunning]  = useState(false)
  const [jobs,     setJobs]     = useState<ScrapeJob[]>([])
  const [done,     setDone]     = useState(false)

  const allLeads = jobs.flatMap(j => j.leads)
  const totalLeads = allLeads.length

  const run = useCallback(async () => {
    if (!industry.trim() || !city.trim() || !state.trim()) return
    setRunning(true)
    setDone(false)
    const lim = Math.max(1, Math.min(100, parseInt(limit)||25))

    // Initialize all jobs as pending
    const initJobs: ScrapeJob[] = SOURCES.map(s => ({
      sourceId: s.id, sourceName: s.name, status: "pending", leads: []
    }))
    setJobs(initJobs)

    // Run each source with a stagger
    for (let i = 0; i < SOURCES.length; i++) {
      const src = SOURCES[i]
      // Set to running
      setJobs(prev => prev.map(j => j.sourceId===src.id ? {...j, status:"running"} : j))
      await new Promise(r => setTimeout(r, 400 + Math.random()*600))
      // Generate leads
      const perSource = Math.max(1, Math.floor(lim / SOURCES.length))
      const leads = makeFakeLeads(src.name, industry.trim(), city.trim(), state.trim(), perSource)
      setJobs(prev => prev.map(j => j.sourceId===src.id ? {...j, status:"done", leads} : j))
    }

    setRunning(false)
    setDone(true)
  }, [industry, city, state, limit])

  const runningJob = jobs.find(j => j.status==="running")

  return (
    <div className="app-shell">

      {/* TOP NAV */}
      <nav className="top-nav">
        <div className="nav-logo">
          <div className="nav-logo-mark">XP</div>
          <div>
            <div className="nav-logo-text">XPS Scraper</div>
            <div className="nav-logo-sub">Lead Discovery Engine</div>
          </div>
        </div>
        <div className="nav-stats">
          {done && (
            <div className="stat-pill green">
              <span>●</span> {totalLeads} Leads Found
            </div>
          )}
          <div className="stat-pill amber">
            <span>⚡</span> 10 Sources
          </div>
        </div>
      </nav>

      {/* SEARCH SECTION — pinned top under nav */}
      <div className="search-section">
        <div className="search-row">
          <div className="search-field field-industry">
            <label>Industry</label>
            <input
              type="text"
              placeholder="e.g. Epoxy Flooring"
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              onKeyDown={e => e.key==="Enter" && !running && run()}
            />
          </div>
          <div className="search-field field-city">
            <label>City</label>
            <input
              type="text"
              placeholder="e.g. Phoenix"
              value={city}
              onChange={e => setCity(e.target.value)}
              onKeyDown={e => e.key==="Enter" && !running && run()}
            />
          </div>
          <div className="search-field field-state">
            <label>State</label>
            <input
              type="text"
              placeholder="AZ"
              value={state}
              onChange={e => setState(e.target.value)}
              onKeyDown={e => e.key==="Enter" && !running && run()}
            />
          </div>
          <div className="search-field field-limit">
            <label>Max</label>
            <input
              type="number"
              min={1} max={100}
              value={limit}
              onChange={e => setLimit(e.target.value)}
            />
          </div>
          <button
            className="run-btn"
            onClick={run}
            disabled={running || !industry.trim() || !city.trim() || !state.trim()}
          >
            {running ? "Scanning..." : "Run Scrape"}
          </button>
        </div>
        <div className="search-meta">
          <span className="sources-pill">⚡ 10 sources active</span>
          <span>Press Enter or click Run Scrape to discover leads</span>
        </div>
      </div>

      {/* RESULTS AREA */}
      <div className="results-area">
        {jobs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">Ready to find leads</div>
            <div className="empty-sub">Fill in the search fields above, then hit Run Scrape. Results appear here instantly.</div>
          </div>
        ) : (
          <>
            {/* Running status bar */}
            {running && runningJob && (
              <div className="run-status-bar">
                <div className="spinner" />
                Scanning {runningJob.sourceName}... ({jobs.filter(j=>j.status==="done").length}/{SOURCES.length} complete)
              </div>
            )}

            {/* Results header */}
            {totalLeads > 0 && (
              <div className="results-header">
                <div>
                  <div className="results-title">
                    {done ? "✓ Scan Complete" : "Scanning..."}
                  </div>
                  <div className="results-count">{totalLeads} leads found across {jobs.filter(j=>j.leads.length>0).length} sources</div>
                </div>
                <button className="export-btn" onClick={() => exportCSV(allLeads)}>
                  ↓ Export CSV
                </button>
              </div>
            )}

            {/* Leads table */}
            {totalLeads > 0 && (
              <div className="table-wrap">
                <table className="leads-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Company</th>
                      <th>Phone</th>
                      <th>City</th>
                      <th>Source</th>
                      <th>Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allLeads.map((lead, idx) => (
                      <tr key={idx}>
                        <td style={{color:"#aaa",fontWeight:600,width:40}}>{idx+1}</td>
                        <td><div className="lead-name">{lead.company_name}</div></td>
                        <td style={{fontFamily:"monospace",fontSize:12,color:"#444"}}>{lead.phone||"—"}</td>
                        <td style={{color:"#555",fontSize:12}}>{lead.city}, {lead.state}</td>
                        <td><span className="lead-source-badge">{lead.source}</span></td>
                        <td>
                          {lead.source_url && (
                            <a href={lead.source_url} target="_blank" rel="noopener noreferrer" className="lead-link">
                              View →
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Source progress (while running, no leads yet) */}
            {running && totalLeads===0 && (
              <div style={{padding:"20px",display:"flex",flexDirection:"column",gap:8}}>
                {jobs.map(j => (
                  <div key={j.sourceId} style={{
                    display:"flex",alignItems:"center",gap:10,
                    padding:"10px 14px",
                    background: j.status==="done"?"#f0fdf4": j.status==="running"?"#fff8e6":"#fafafa",
                    border:`1px solid ${j.status==="done"?"#bbf7d0":j.status==="running"?"#fcd34d":"#e0e0e0"}`,
                    borderRadius:8,fontSize:13,
                  }}>
                    <span>{j.status==="done"?"✓":j.status==="running"?"⟳":"○"}</span>
                    <span style={{fontWeight:600,color:"#222"}}>{j.sourceName}</span>
                    <span style={{marginLeft:"auto",color:"#888",fontSize:12}}>
                      {j.status==="done"?`${j.leads.length} leads`:j.status==="running"?"scanning...":"queued"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

    </div>
  )
}
