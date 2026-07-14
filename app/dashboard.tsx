"use client"
import { useState, useEffect } from "react"

interface Lead {
  company_name: string
  phone?: string
  email?: string
  website?: string
  city?: string
  state?: string
  category?: string
  source_url?: string
}

interface ScrapeJob {
  id: string
  url: string
  status: "queued" | "running" | "complete" | "error"
  pages: number
  leads: number
  duration_ms?: number
  log: string[]
}

// ── Location data ─────────────────────────────────────────────────
const US_STATES: Record<string, string[]> = {
  AZ: ["Phoenix","Scottsdale","Tempe","Mesa","Chandler","Gilbert","Glendale","Peoria","Tucson","Flagstaff","Yuma","Surprise","Avondale","Goodyear","Queen Creek"],
  TX: ["Houston","Dallas","Austin","San Antonio","Fort Worth","El Paso","Arlington","Corpus Christi","Plano","Lubbock"],
  CA: ["Los Angeles","San Diego","San Francisco","San Jose","Fresno","Sacramento","Long Beach","Oakland","Bakersfield","Anaheim"],
  FL: ["Miami","Orlando","Tampa","Jacksonville","St. Petersburg","Hialeah","Tallahassee","Fort Lauderdale","Port St. Lucie","Cape Coral"],
  GA: ["Atlanta","Columbus","Augusta","Savannah","Athens","Sandy Springs","Roswell","Macon","Albany","Johns Creek"],
  NY: ["New York City","Buffalo","Rochester","Yonkers","Syracuse","Albany","New Rochelle","Mount Vernon","Schenectady","Utica"],
  CO: ["Denver","Colorado Springs","Aurora","Fort Collins","Lakewood","Thornton","Arvada","Westminster","Pueblo","Centennial"],
  NV: ["Las Vegas","Henderson","Reno","North Las Vegas","Sparks","Carson City","Fernley","Elko","Mesquite","Boulder City"],
  WA: ["Seattle","Spokane","Tacoma","Vancouver","Bellevue","Kent","Everett","Renton","Spokane Valley","Kirkland"],
  IL: ["Chicago","Aurora","Joliet","Naperville","Rockford","Springfield","Elgin","Peoria","Champaign","Waukegan"],
  OH: ["Columbus","Cleveland","Cincinnati","Toledo","Akron","Dayton","Parma","Canton","Youngstown","Lorain"],
  NC: ["Charlotte","Raleigh","Greensboro","Durham","Winston-Salem","Fayetteville","Cary","Wilmington","High Point","Concord"],
  MI: ["Detroit","Grand Rapids","Warren","Sterling Heights","Ann Arbor","Lansing","Flint","Dearborn","Livonia","Westland"],
  PA: ["Philadelphia","Pittsburgh","Allentown","Erie","Reading","Scranton","Bethlehem","Lancaster","Harrisburg","Altoona"],
  TN: ["Nashville","Memphis","Knoxville","Chattanooga","Clarksville","Murfreesboro","Jackson","Franklin","Johnson City","Bartlett"],
}

const STATE_NAMES: Record<string, string> = {
  AZ:"Arizona", TX:"Texas", CA:"California", FL:"Florida", GA:"Georgia",
  NY:"New York", CO:"Colorado", NV:"Nevada", WA:"Washington", IL:"Illinois",
  OH:"Ohio", NC:"North Carolina", MI:"Michigan", PA:"Pennsylvania", TN:"Tennessee",
}

const INDUSTRIES = [
  "Epoxy Flooring","Concrete Polishing","Garage Floor Coating","Decorative Concrete",
  "Industrial Coatings","General Contractor","Painting Contractor","Flooring Contractor",
  "Plumbing","Electrical","HVAC","Roofing","Landscaping","Commercial Cleaning",
]

const SOURCES: Record<string, string> = {
  yellowpages: "Yellow Pages",
  yelp:        "Yelp",
  angies:      "Angi (Angie's List)",
  google:      "Google Maps",
}

function buildTargetUrl(source: string, city: string, state: string, industry: string): string {
  const slug     = industry.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"")
  const citySlug = city.toLowerCase().replace(/\s+/g,"-")
  const stateAb  = state.toLowerCase()
  const query    = encodeURIComponent(industry)
  const loc      = encodeURIComponent(`${city}, ${state}`)

  switch (source) {
    case "yellowpages":
      return `https://www.yellowpages.com/${citySlug}-${stateAb}/mip/${slug}`
    case "yelp":
      return `https://www.yelp.com/search?find_desc=${query}&find_loc=${loc}`
    case "angies":
      return `https://www.angieslist.com/companylist/us/${stateAb}/${citySlug}/${slug}-reviews-6988.htm`
    case "google":
      return `https://www.google.com/maps/search/${query}+near+${loc}`
    default:
      return `https://www.yellowpages.com/${citySlug}-${stateAb}/mip/${slug}`
  }
}

const STATUS_COLOR: Record<string, string> = {
  queued: "#facc15", running: "#60a5fa", complete: "#4ade80", error: "#f87171",
}

export default function ScraperDashboard() {
  const [selectedState,    setSelectedState]    = useState("AZ")
  const [selectedCity,     setSelectedCity]     = useState("Phoenix")
  const [selectedIndustry, setSelectedIndustry] = useState("Epoxy Flooring")
  const [selectedSource,   setSelectedSource]   = useState("yellowpages")
  const [customUrl,        setCustomUrl]        = useState("")
  const [useCustomUrl,     setUseCustomUrl]     = useState(false)
  const [maxPages,         setMaxPages]         = useState(30)
  const [jobs,             setJobs]             = useState<ScrapeJob[]>([])
  const [leads,            setLeads]            = useState<Lead[]>([])
  const [stats,            setStats]            = useState({ total: 0, today: 0, runs: 0 })
  const [loading,          setLoading]          = useState(false)

  const cities     = US_STATES[selectedState] || []
  const targetUrl  = useCustomUrl ? customUrl : buildTargetUrl(selectedSource, selectedCity, selectedState, selectedIndustry)

  // Auto-reset city when state changes
  useEffect(() => {
    const c = US_STATES[selectedState]
    if (c && !c.includes(selectedCity)) setSelectedCity(c[0])
  }, [selectedState])

  useEffect(() => { fetchStats(); fetchLeads() }, [])

  async function fetchStats() {
    try {
      const r = await fetch("/api/stats")
      if (r.ok) { const d = await r.json(); setStats({ total: d.total_leads ?? 0, today: d.new_today ?? 0, runs: d.total_runs ?? 0 }) }
    } catch {}
  }

  async function fetchLeads() {
    try {
      const r = await fetch("/api/leads?limit=100")
      if (r.ok) { const d = await r.json(); setLeads(Array.isArray(d) ? d : (d.leads ?? [])) }
    } catch {}
  }

  async function runScrape() {
    const url = targetUrl
    if (!url.trim()) return
    setLoading(true)
    const jobId = Date.now().toString()
    const job: ScrapeJob = {
      id: jobId, url, status: "running", pages: 0, leads: 0,
      log: [`▶ Starting: ${selectedCity}, ${selectedState} — ${selectedIndustry}`, `URL: ${url}`],
    }
    setJobs(prev => [job, ...prev])

    try {
      const r = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          industry:  selectedIndustry,
          city:      selectedCity,
          state:     selectedState,
          max_pages: maxPages,
        }),
      })
      const data = await r.json()
      setJobs(prev => prev.map(j =>
        j.id !== jobId ? j : {
          ...j,
          status: r.ok ? "complete" : "error",
          pages:  data.pages_scraped ?? 0,
          leads:  data.leads_saved   ?? data.leads_found ?? 0,
          duration_ms: data.duration_ms,
          log: [...j.log, r.ok
            ? `✅ ${data.leads_saved ?? 0} leads saved — ${(data.duration_ms/1000).toFixed(1)}s (${data.method})`
            : `❌ ${data.error}`
          ],
        }
      ))
      if (r.ok) { fetchStats(); fetchLeads() }
    } catch (e: unknown) {
      setJobs(prev => prev.map(j =>
        j.id === jobId ? { ...j, status: "error", log: [...j.log, `❌ ${String(e)}`] } : j
      ))
    }
    setLoading(false)
  }

  const S = (label: string, desc?: string) => (
    <div>
      <label style={{ display:"block", fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>{label}</label>
      {desc && <p style={{ fontSize:10, color:"rgba(255,255,255,0.25)", margin:"0 0 4px" }}>{desc}</p>}
    </div>
  )

  const inputStyle: React.CSSProperties = {
    width:"100%", background:"#1a1d26", border:"1px solid rgba(255,255,255,0.08)",
    borderRadius:8, padding:"8px 10px", color:"white", fontSize:13, outline:"none",
  }
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor:"pointer" }
  const cardStyle: React.CSSProperties   = { background:"#0f1117", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20 }

  return (
    <div style={{ minHeight:"100vh", background:"#090B10", color:"white", fontFamily:"system-ui,-apple-system,sans-serif" }}>

      {/* Header */}
      <header style={{ borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"16px 32px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <h1 style={{ margin:0, fontSize:18, fontWeight:700, letterSpacing:-0.5 }}>⚡ XTREME SCRAPER</h1>
          <p style={{ margin:"2px 0 0", fontSize:11, color:"rgba(255,255,255,0.3)" }}>Asyncio Lead Discovery → Supabase</p>
        </div>
        <div style={{ display:"flex", gap:24 }}>
          {[["Total Leads", stats.total, "#4ade80"], ["Today", stats.today, "#60a5fa"], ["Runs", stats.runs, "#a78bfa"]].map(([label, val, col]) => (
            <div key={String(label)} style={{ textAlign:"center" }}>
              <p style={{ margin:0, fontSize:22, fontWeight:700, color:String(col) }}>{val}</p>
              <p style={{ margin:0, fontSize:10, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:1 }}>{label}</p>
            </div>
          ))}
        </div>
      </header>

      <div style={{ display:"grid", gridTemplateColumns:"340px 1fr", gap:24, padding:24 }}>

        {/* ── LEFT COLUMN ───────────────────────────────── */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* 📍 LOCATION BOX */}
          <div style={{ ...cardStyle, border:"1px solid rgba(96,165,250,0.25)" }}>
            <h2 style={{ margin:"0 0 16px", fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:1 }}>
              📍 Target Location
            </h2>

            {S("State")}
            <select value={selectedState} onChange={e => setSelectedState(e.target.value)} style={{ ...selectStyle, marginBottom:12 }}>
              {Object.entries(STATE_NAMES).map(([code, name]) => (
                <option key={code} value={code}>{name} ({code})</option>
              ))}
            </select>

            {S("City")}
            <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} style={{ ...selectStyle, marginBottom:12 }}>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {S("Industry / Category")}
            <select value={selectedIndustry} onChange={e => setSelectedIndustry(e.target.value)} style={{ ...selectStyle, marginBottom:12 }}>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>

            {S("Data Source")}
            <select value={selectedSource} onChange={e => setSelectedSource(e.target.value)} style={{ ...selectStyle, marginBottom:16 }}>
              {Object.entries(SOURCES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
            </select>

            {/* Generated URL preview */}
            <div style={{ background:"#0a0c14", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, padding:"8px 10px", marginBottom:16 }}>
              <p style={{ margin:"0 0 4px", fontSize:10, color:"rgba(255,255,255,0.3)", textTransform:"uppercase" }}>Generated URL</p>
              <p style={{ margin:0, fontSize:10, color:"rgba(96,165,250,0.8)", wordBreak:"break-all" }}>{useCustomUrl ? customUrl || "—" : targetUrl}</p>
            </div>

            {/* Custom URL toggle */}
            <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", marginBottom: useCustomUrl ? 10 : 0, fontSize:12, color:"rgba(255,255,255,0.4)" }}>
              <input type="checkbox" checked={useCustomUrl} onChange={e => setUseCustomUrl(e.target.checked)} style={{ accentColor:"#60a5fa" }} />
              Use custom URL instead
            </label>
            {useCustomUrl && (
              <input value={customUrl} onChange={e => setCustomUrl(e.target.value)}
                placeholder="https://..."
                style={{ ...inputStyle, marginBottom:0 }} />
            )}
          </div>

          {/* Scrape settings */}
          <div style={cardStyle}>
            <h2 style={{ margin:"0 0 14px", fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:1 }}>
              ⚙️ Settings
            </h2>
            {S("Max Pages")}
            <input type="number" value={maxPages} min={1} max={200}
              onChange={e => setMaxPages(Number(e.target.value))}
              style={{ ...inputStyle, marginBottom:0 }} />
          </div>

          {/* Run button */}
          <button onClick={runScrape} disabled={loading}
            style={{
              width:"100%", padding:"14px 0", borderRadius:10, border:"none",
              background: loading ? "#1a1d26" : "linear-gradient(135deg,#2563eb,#7c3aed)",
              color:"white", fontSize:14, fontWeight:700, cursor: loading ? "not-allowed" : "pointer",
              letterSpacing:0.5,
            }}>
            {loading ? "⏳ Scraping..." : `▶ Scrape ${selectedCity}, ${selectedState}`}
          </button>

          {/* Quick AZ targets */}
          <div style={cardStyle}>
            <h2 style={{ margin:"0 0 12px", fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:1 }}>
              🎯 AZ Quick Targets
            </h2>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {[
                ["Phoenix", "AZ", "Epoxy Flooring", "yellowpages"],
                ["Scottsdale","AZ","Epoxy Flooring","yellowpages"],
                ["Tucson","AZ","Concrete Polishing","yelp"],
                ["Mesa","AZ","Garage Floor Coating","yelp"],
                ["Gilbert","AZ","Decorative Concrete","yellowpages"],
              ].map(([c,s,i,src]) => (
                <button key={c+i} onClick={() => {
                  setSelectedCity(c); setSelectedState(s)
                  setSelectedIndustry(i); setSelectedSource(src); setUseCustomUrl(false)
                }}
                  style={{
                    textAlign:"left", padding:"7px 10px", borderRadius:7, border:"1px solid rgba(255,255,255,0.05)",
                    background:"#1a1d26", color: selectedCity===c&&selectedState===s ? "#60a5fa" : "rgba(255,255,255,0.45)",
                    fontSize:11, cursor:"pointer",
                  }}>
                  {c}, {s} — {i}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ──────────────────────────────── */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Job queue */}
          {jobs.length > 0 && (
            <div style={cardStyle}>
              <h2 style={{ margin:"0 0 14px", fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:1 }}>
                🔄 Job Queue
              </h2>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {jobs.slice(0,5).map(job => (
                  <div key={job.id} style={{ background:"#1a1d26", border:"1px solid rgba(255,255,255,0.05)", borderRadius:9, padding:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ fontSize:11, color:"rgba(255,255,255,0.5)", maxWidth:"80%", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{job.url}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:STATUS_COLOR[job.status], textTransform:"uppercase" }}>{job.status}</span>
                    </div>
                    <div style={{ display:"flex", gap:16, fontSize:11, color:"rgba(255,255,255,0.3)", marginBottom:6 }}>
                      <span>Pages: {job.pages}</span>
                      <span>Leads: <span style={{ color:"#4ade80", fontWeight:700 }}>{job.leads}</span></span>
                      {job.duration_ms && <span>{(job.duration_ms/1000).toFixed(1)}s</span>}
                    </div>
                    <div style={{ fontFamily:"monospace", fontSize:10, color:"rgba(255,255,255,0.25)", maxHeight:56, overflowY:"auto" }}>
                      {job.log.map((l,i) => <div key={i}>{l}</div>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leads table */}
          <div style={{ ...cardStyle, flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
              <h2 style={{ margin:0, fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:1 }}>
                📋 Leads ({leads.length})
              </h2>
              <button onClick={fetchLeads} style={{ fontSize:11, color:"#60a5fa", background:"none", border:"none", cursor:"pointer" }}>↻ Refresh</button>
            </div>
            {leads.length === 0 ? (
              <p style={{ textAlign:"center", color:"rgba(255,255,255,0.2)", fontSize:12, padding:"32px 0" }}>
                No leads yet — select a location and run a scrape job
              </p>
            ) : (
              <div style={{ overflowX:"auto", maxHeight:600, overflowY:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead>
                    <tr style={{ color:"rgba(255,255,255,0.25)", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                      {["Company","City","State","Phone","Category","Source"].map(h => (
                        <th key={h} style={{ textAlign:"left", paddingBottom:8, fontWeight:500, paddingRight:12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead, i) => (
                      <tr key={i} style={{ borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding:"7px 12px 7px 0", fontWeight:600, color:"white" }}>{lead.company_name}</td>
                        <td style={{ padding:"7px 12px 7px 0", color:"rgba(255,255,255,0.45)" }}>{lead.city || "—"}</td>
                        <td style={{ padding:"7px 12px 7px 0", color:"rgba(255,255,255,0.45)" }}>{lead.state || "—"}</td>
                        <td style={{ padding:"7px 12px 7px 0", color:"rgba(255,255,255,0.45)" }}>{lead.phone || "—"}</td>
                        <td style={{ padding:"7px 12px 7px 0" }}>
                          <span style={{ background:"#1e3a8a", color:"#93c5fd", padding:"2px 7px", borderRadius:4, fontSize:10 }}>
                            {lead.category || "—"}
                          </span>
                        </td>
                        <td style={{ padding:"7px 0", color:"rgba(255,255,255,0.25)", fontSize:10 }}>
                          {lead.source_url ? (() => { try { return new URL(lead.source_url).hostname.replace("www.","") } catch { return "—" } })() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
