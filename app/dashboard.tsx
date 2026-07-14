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
  label: string
  status: "queued" | "running" | "complete" | "error"
  pages: number
  leads: number
  duration_ms?: number
  log: string[]
}

interface Target {
  label: string
  source: string
  industry: string
  url: string
  priority: "🔥" | "⭐" | "📌"
}

// ── State + City data ─────────────────────────────────────────────
const US_STATES: Record<string, string[]> = {
  AZ: ["Phoenix","Scottsdale","Tempe","Mesa","Chandler","Gilbert","Glendale","Peoria","Tucson","Flagstaff"],
  TX: ["Houston","Dallas","Austin","San Antonio","Fort Worth","El Paso","Arlington","Plano","Lubbock","Frisco"],
  CA: ["Los Angeles","San Diego","San Francisco","San Jose","Fresno","Sacramento","Long Beach","Anaheim","Riverside","Bakersfield"],
  FL: ["Miami","Orlando","Tampa","Jacksonville","Fort Lauderdale","St. Petersburg","Cape Coral","Tallahassee","Hialeah","Port St. Lucie"],
  GA: ["Atlanta","Columbus","Augusta","Savannah","Athens","Sandy Springs","Roswell","Macon","Warner Robins","Albany"],
  NY: ["New York City","Buffalo","Rochester","Yonkers","Syracuse","Albany","New Rochelle","Mount Vernon","Schenectady","Utica"],
  CO: ["Denver","Colorado Springs","Aurora","Fort Collins","Lakewood","Thornton","Arvada","Westminster","Pueblo","Centennial"],
  NV: ["Las Vegas","Henderson","Reno","North Las Vegas","Sparks","Carson City","Fernley","Elko","Mesquite","Boulder City"],
  WA: ["Seattle","Spokane","Tacoma","Vancouver","Bellevue","Kent","Everett","Renton","Kirkland","Marysville"],
  IL: ["Chicago","Aurora","Joliet","Naperville","Rockford","Springfield","Elgin","Peoria","Champaign","Waukegan"],
  OH: ["Columbus","Cleveland","Cincinnati","Toledo","Akron","Dayton","Parma","Canton","Youngstown","Lorain"],
  NC: ["Charlotte","Raleigh","Greensboro","Durham","Winston-Salem","Fayetteville","Cary","Wilmington","High Point","Concord"],
  MI: ["Detroit","Grand Rapids","Warren","Sterling Heights","Ann Arbor","Lansing","Flint","Dearborn","Livonia","Westland"],
  TN: ["Nashville","Memphis","Knoxville","Chattanooga","Clarksville","Murfreesboro","Jackson","Franklin","Johnson City","Bartlett"],
  PA: ["Philadelphia","Pittsburgh","Allentown","Erie","Reading","Scranton","Bethlehem","Lancaster","Harrisburg","Altoona"],
}

const STATE_NAMES: Record<string, string> = {
  AZ:"Arizona", TX:"Texas", CA:"California", FL:"Florida", GA:"Georgia",
  NY:"New York", CO:"Colorado", NV:"Nevada", WA:"Washington", IL:"Illinois",
  OH:"Ohio", NC:"North Carolina", MI:"Michigan", TN:"Tennessee", PA:"Pennsylvania",
}

// ── Top 10 targets per state — pre-wired best sources ────────────
function getTopTargets(state: string, city: string): Target[] {
  const s = state.toLowerCase()
  const c = city.toLowerCase().replace(/\s+/g,"-")
  const cRaw = encodeURIComponent(city)
  const stRaw = encodeURIComponent(state)

  const epoxy   = encodeURIComponent("Epoxy Flooring")
  const polish  = encodeURIComponent("Concrete Polishing")
  const garage  = encodeURIComponent("Garage Floor Coating")
  const coating = encodeURIComponent("Industrial Coatings")
  const decor   = encodeURIComponent("Decorative Concrete")

  return [
    {
      label:    `Yellow Pages — Epoxy Flooring`,
      source:   "yellowpages",
      industry: "Epoxy Flooring",
      url:      `https://www.yellowpages.com/${c}-${s}/mip/epoxy-flooring`,
      priority: "🔥",
    },
    {
      label:    `Yelp — Epoxy Flooring`,
      source:   "yelp",
      industry: "Epoxy Flooring",
      url:      `https://www.yelp.com/search?find_desc=${epoxy}&find_loc=${cRaw}%2C+${stRaw}`,
      priority: "🔥",
    },
    {
      label:    `Yellow Pages — Garage Floor Coating`,
      source:   "yellowpages",
      industry: "Garage Floor Coating",
      url:      `https://www.yellowpages.com/${c}-${s}/mip/garage-floor-coating`,
      priority: "🔥",
    },
    {
      label:    `Yelp — Concrete Polishing`,
      source:   "yelp",
      industry: "Concrete Polishing",
      url:      `https://www.yelp.com/search?find_desc=${polish}&find_loc=${cRaw}%2C+${stRaw}`,
      priority: "⭐",
    },
    {
      label:    `Yellow Pages — Concrete Polishing`,
      source:   "yellowpages",
      industry: "Concrete Polishing",
      url:      `https://www.yellowpages.com/${c}-${s}/mip/concrete-polishing`,
      priority: "⭐",
    },
    {
      label:    `Angi — Epoxy Flooring`,
      source:   "angi",
      industry: "Epoxy Flooring",
      url:      `https://www.angi.com/companylist/us/${s}/${c}/epoxy-flooring-reviews-6988.htm`,
      priority: "⭐",
    },
    {
      label:    `Yelp — Garage Floor Coating`,
      source:   "yelp",
      industry: "Garage Floor Coating",
      url:      `https://www.yelp.com/search?find_desc=${garage}&find_loc=${cRaw}%2C+${stRaw}`,
      priority: "⭐",
    },
    {
      label:    `Yellow Pages — Industrial Coatings`,
      source:   "yellowpages",
      industry: "Industrial Coatings",
      url:      `https://www.yellowpages.com/${c}-${s}/mip/industrial-coatings`,
      priority: "📌",
    },
    {
      label:    `Yelp — Decorative Concrete`,
      source:   "yelp",
      industry: "Decorative Concrete",
      url:      `https://www.yelp.com/search?find_desc=${decor}&find_loc=${cRaw}%2C+${stRaw}`,
      priority: "📌",
    },
    {
      label:    `Angi — Concrete Polishing`,
      source:   "angi",
      industry: "Concrete Polishing",
      url:      `https://www.angi.com/companylist/us/${s}/${c}/concrete-polishing-reviews-6988.htm`,
      priority: "📌",
    },
  ]
}

const PRIORITY_COLOR: Record<string, string> = {
  "🔥": "#ef4444",
  "⭐": "#f59e0b",
  "📌": "#6b7280",
}

const STATUS_COLOR: Record<string, string> = {
  queued: "#facc15", running: "#60a5fa", complete: "#4ade80", error: "#f87171",
}

export default function ScraperDashboard() {
  const [selectedState,  setSelectedState]  = useState("AZ")
  const [selectedCity,   setSelectedCity]   = useState("Phoenix")
  const [maxPages,       setMaxPages]       = useState(30)
  const [jobs,           setJobs]           = useState<ScrapeJob[]>([])
  const [leads,          setLeads]          = useState<Lead[]>([])
  const [stats,          setStats]          = useState({ total: 0, today: 0, runs: 0 })
  const [loading,        setLoading]        = useState(false)
  const [activeTargets,  setActiveTargets]  = useState<Set<number>>(new Set([0,1,2]))
  const [customUrl,      setCustomUrl]      = useState("")
  const [showCustom,     setShowCustom]     = useState(false)

  const cities  = US_STATES[selectedState] || []
  const targets = getTopTargets(selectedState, selectedCity)

  // Auto-reset city + re-select top 3 when state changes
  useEffect(() => {
    const c = US_STATES[selectedState]
    if (c && !c.includes(selectedCity)) setSelectedCity(c[0])
    setActiveTargets(new Set([0,1,2]))
  }, [selectedState])

  useEffect(() => {
    setActiveTargets(new Set([0,1,2]))
  }, [selectedCity])

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

  function toggleTarget(i: number) {
    setActiveTargets(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  function selectAll()   { setActiveTargets(new Set(targets.map((_,i) => i))) }
  function selectHot()   { setActiveTargets(new Set(targets.map((_,i)=>i).filter(i => targets[i].priority === "🔥"))) }
  function selectNone()  { setActiveTargets(new Set()) }

  async function runSelected() {
    const selected = [...activeTargets].map(i => targets[i])
    if (selected.length === 0) return
    setLoading(true)

    for (const target of selected) {
      const url    = target.url
      const jobId  = Date.now().toString() + Math.random()
      const job: ScrapeJob = {
        id: jobId, url, label: target.label,
        status: "running", pages: 0, leads: 0,
        log: [`▶ ${target.label}`, `📍 ${selectedCity}, ${selectedState}`],
      }
      setJobs(prev => [job, ...prev])

      try {
        const r = await fetch("/api/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, industry: target.industry, city: selectedCity, state: selectedState, max_pages: maxPages }),
        })
        const data = await r.json()
        setJobs(prev => prev.map(j => j.id !== jobId ? j : {
          ...j,
          status: r.ok ? "complete" : "error",
          pages:  data.pages_scraped ?? 0,
          leads:  data.leads_saved ?? data.leads_found ?? 0,
          duration_ms: data.duration_ms,
          log: [...j.log,
            r.ok
              ? `✅ ${data.leads_saved ?? 0} leads saved — ${((data.duration_ms||0)/1000).toFixed(1)}s`
              : `❌ ${data.error}`
          ],
        }))
        if (r.ok) { fetchStats(); fetchLeads() }
      } catch (e: unknown) {
        setJobs(prev => prev.map(j => j.id === jobId
          ? { ...j, status: "error", log: [...j.log, `❌ ${String(e)}`] } : j
        ))
      }
      // Small delay between jobs
      await new Promise(res => setTimeout(res, 500))
    }
    setLoading(false)
  }

  async function runCustom() {
    if (!customUrl.trim()) return
    setLoading(true)
    const jobId = Date.now().toString()
    const job: ScrapeJob = {
      id: jobId, url: customUrl, label: "Custom URL",
      status: "running", pages: 0, leads: 0,
      log: [`▶ Custom: ${customUrl}`],
    }
    setJobs(prev => [job, ...prev])
    try {
      const r = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: customUrl, industry: "Epoxy Flooring", city: selectedCity, state: selectedState, max_pages: maxPages }),
      })
      const data = await r.json()
      setJobs(prev => prev.map(j => j.id !== jobId ? j : {
        ...j,
        status: r.ok ? "complete" : "error",
        leads:  data.leads_saved ?? 0,
        duration_ms: data.duration_ms,
        log: [...j.log, r.ok ? `✅ ${data.leads_saved ?? 0} leads saved` : `❌ ${data.error}`],
      }))
      if (r.ok) { fetchStats(); fetchLeads() }
    } catch (e: unknown) {
      setJobs(prev => prev.map(j => j.id === jobId
        ? { ...j, status: "error", log: [...j.log, `❌ ${String(e)}`] } : j
      ))
    }
    setLoading(false)
  }

  const card: React.CSSProperties = { background:"#0f1117", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20 }
  const input: React.CSSProperties = { width:"100%", background:"#1a1d26", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"8px 10px", color:"white", fontSize:13, outline:"none" }
  const lbl: React.CSSProperties  = { display:"block", fontSize:10, color:"rgba(255,255,255,0.35)", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.8px" }

  const hot    = targets.filter(t => t.priority === "🔥").length
  const sel    = activeTargets.size

  return (
    <div style={{ minHeight:"100vh", background:"#090B10", color:"white", fontFamily:"system-ui,-apple-system,sans-serif" }}>

      {/* ── Header ───────────────────────────────────────────── */}
      <header style={{ borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"14px 28px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <h1 style={{ margin:0, fontSize:17, fontWeight:700, letterSpacing:-0.5 }}>⚡ XTREME SCRAPER</h1>
          <p style={{ margin:"2px 0 0", fontSize:10, color:"rgba(255,255,255,0.3)" }}>Asyncio Lead Discovery → Supabase</p>
        </div>
        <div style={{ display:"flex", gap:20 }}>
          {[["Total Leads", stats.total, "#4ade80"],["Today", stats.today, "#60a5fa"],["Runs", stats.runs, "#a78bfa"]].map(([l,v,c]) => (
            <div key={String(l)} style={{ textAlign:"center" }}>
              <p style={{ margin:0, fontSize:20, fontWeight:700, color:String(c) }}>{v}</p>
              <p style={{ margin:0, fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:1 }}>{l}</p>
            </div>
          ))}
        </div>
      </header>

      <div style={{ display:"grid", gridTemplateColumns:"360px 1fr", gap:20, padding:20 }}>

        {/* ── LEFT ───────────────────────────────────────────── */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* 📍 Location */}
          <div style={{ ...card, border:"1px solid rgba(96,165,250,0.2)" }}>
            <h2 style={{ margin:"0 0 14px", fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:1 }}>📍 Location</h2>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                <label style={lbl}>State</label>
                <select value={selectedState} onChange={e => setSelectedState(e.target.value)} style={{ ...input, cursor:"pointer" }}>
                  {Object.entries(STATE_NAMES).map(([code,name]) => (
                    <option key={code} value={code}>{name} ({code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>City</label>
                <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} style={{ ...input, cursor:"pointer" }}>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop:10, padding:"6px 10px", background:"#0a0c14", borderRadius:6, fontSize:10, color:"rgba(255,255,255,0.3)" }}>
              📌 Targets auto-fill for <span style={{ color:"#60a5fa" }}>{selectedCity}, {selectedState}</span> — top 3 pre-selected
            </div>
          </div>

          {/* 🎯 Top 10 Targets */}
          <div style={card}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <h2 style={{ margin:0, fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:1 }}>
                🎯 Top 10 Targets
              </h2>
              <div style={{ display:"flex", gap:6 }}>
                {[["🔥 Hot", selectHot],["All", selectAll],["None", selectNone]].map(([label, fn]) => (
                  <button key={String(label)} onClick={fn as () => void}
                    style={{ fontSize:10, padding:"3px 8px", borderRadius:5, border:"1px solid rgba(255,255,255,0.1)", background:"#1a1d26", color:"rgba(255,255,255,0.5)", cursor:"pointer" }}>
                    {String(label)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              {targets.map((t, i) => {
                const on = activeTargets.has(i)
                return (
                  <button key={i} onClick={() => toggleTarget(i)}
                    style={{
                      display:"flex", alignItems:"center", gap:10,
                      padding:"8px 10px", borderRadius:8, cursor:"pointer",
                      border: on ? `1px solid ${PRIORITY_COLOR[t.priority]}40` : "1px solid rgba(255,255,255,0.04)",
                      background: on ? `${PRIORITY_COLOR[t.priority]}10` : "#1a1d26",
                      textAlign:"left", transition:"all 0.15s",
                    }}>
                    {/* Checkbox */}
                    <div style={{
                      width:14, height:14, borderRadius:3, flexShrink:0,
                      border: on ? "none" : "1px solid rgba(255,255,255,0.2)",
                      background: on ? PRIORITY_COLOR[t.priority] : "transparent",
                      display:"flex", alignItems:"center", justifyContent:"center",
                    }}>
                      {on && <span style={{ fontSize:9, color:"white", lineHeight:1 }}>✓</span>}
                    </div>
                    {/* Priority badge */}
                    <span style={{ fontSize:12 }}>{t.priority}</span>
                    {/* Label */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ margin:0, fontSize:11, fontWeight:500, color: on ? "white" : "rgba(255,255,255,0.5)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                        {t.label}
                      </p>
                      <p style={{ margin:0, fontSize:9, color:"rgba(255,255,255,0.2)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                        {t.url.replace("https://","").substring(0,55)}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>

            <p style={{ margin:"10px 0 0", fontSize:10, color:"rgba(255,255,255,0.25)", textAlign:"center" }}>
              {sel} of 10 selected ({hot} 🔥 high-priority)
            </p>
          </div>

          {/* ⚙️ Settings + Run */}
          <div style={card}>
            <label style={lbl}>Max Pages per Target</label>
            <input type="number" value={maxPages} min={1} max={100}
              onChange={e => setMaxPages(Number(e.target.value))}
              style={{ ...input, marginBottom:14 }} />

            <button onClick={runSelected} disabled={loading || sel === 0}
              style={{
                width:"100%", padding:"13px 0", borderRadius:10, border:"none",
                background: loading || sel===0 ? "#1a1d26" : "linear-gradient(135deg,#2563eb,#7c3aed)",
                color: loading||sel===0 ? "rgba(255,255,255,0.3)" : "white",
                fontSize:13, fontWeight:700, cursor: loading||sel===0 ? "not-allowed" : "pointer",
                letterSpacing:0.3, transition:"all 0.2s",
              }}>
              {loading ? "⏳ Scraping..." : `▶ Run ${sel} Target${sel!==1?"s":""} — ${selectedCity}, ${selectedState}`}
            </button>
          </div>

          {/* Custom URL */}
          <div style={card}>
            <button onClick={() => setShowCustom(!showCustom)}
              style={{ background:"none", border:"none", color:"rgba(255,255,255,0.35)", fontSize:11, cursor:"pointer", padding:0, marginBottom: showCustom ? 10 : 0 }}>
              {showCustom ? "▾" : "▸"} Custom URL (advanced)
            </button>
            {showCustom && (
              <div>
                <input value={customUrl} onChange={e => setCustomUrl(e.target.value)}
                  placeholder="https://..." style={{ ...input, marginBottom:8 }} />
                <button onClick={runCustom} disabled={loading || !customUrl.trim()}
                  style={{ width:"100%", padding:"9px 0", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"#1a1d26", color:"rgba(255,255,255,0.6)", fontSize:12, cursor:"pointer" }}>
                  ▶ Scrape Custom URL
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT ──────────────────────────────────────────── */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* Job Queue */}
          {jobs.length > 0 && (
            <div style={card}>
              <h2 style={{ margin:"0 0 12px", fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:1 }}>🔄 Job Queue</h2>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {jobs.slice(0,6).map(job => (
                  <div key={job.id} style={{ background:"#1a1d26", border:"1px solid rgba(255,255,255,0.04)", borderRadius:8, padding:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:12, fontWeight:600, color:"white" }}>{job.label}</span>
                      <span style={{ fontSize:10, fontWeight:700, color:STATUS_COLOR[job.status], textTransform:"uppercase" }}>{job.status}</span>
                    </div>
                    <div style={{ display:"flex", gap:14, fontSize:10, color:"rgba(255,255,255,0.3)", marginBottom:4 }}>
                      <span>Pages: {job.pages}</span>
                      <span>Leads: <span style={{ color:"#4ade80", fontWeight:700 }}>{job.leads}</span></span>
                      {job.duration_ms && <span>{(job.duration_ms/1000).toFixed(1)}s</span>}
                    </div>
                    <div style={{ fontFamily:"monospace", fontSize:9, color:"rgba(255,255,255,0.2)", maxHeight:44, overflowY:"auto" }}>
                      {job.log.map((l,i) => <div key={i}>{l}</div>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leads Table */}
          <div style={{ ...card, flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <h2 style={{ margin:0, fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:1 }}>
                📋 Leads ({leads.length})
              </h2>
              <button onClick={fetchLeads} style={{ fontSize:11, color:"#60a5fa", background:"none", border:"none", cursor:"pointer" }}>↻ Refresh</button>
            </div>
            {leads.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 0" }}>
                <p style={{ color:"rgba(255,255,255,0.15)", fontSize:13, margin:"0 0 6px" }}>No leads yet</p>
                <p style={{ color:"rgba(255,255,255,0.1)", fontSize:11, margin:0 }}>Select targets above and click Run</p>
              </div>
            ) : (
              <div style={{ overflowX:"auto", maxHeight:580, overflowY:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead>
                    <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                      {["Company","City","State","Phone","Category","Source"].map(h => (
                        <th key={h} style={{ textAlign:"left", paddingBottom:8, paddingRight:14, fontWeight:500, fontSize:10, color:"rgba(255,255,255,0.25)", textTransform:"uppercase", letterSpacing:"0.6px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead, i) => (
                      <tr key={i} style={{ borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding:"7px 14px 7px 0", fontWeight:600, color:"white" }}>{lead.company_name}</td>
                        <td style={{ padding:"7px 14px 7px 0", color:"rgba(255,255,255,0.4)" }}>{lead.city||"—"}</td>
                        <td style={{ padding:"7px 14px 7px 0", color:"rgba(255,255,255,0.4)" }}>{lead.state||"—"}</td>
                        <td style={{ padding:"7px 14px 7px 0", color:"rgba(255,255,255,0.4)" }}>{lead.phone||"—"}</td>
                        <td style={{ padding:"7px 14px 7px 0" }}>
                          <span style={{ background:"#1e3a8a", color:"#93c5fd", padding:"2px 7px", borderRadius:4, fontSize:9, fontWeight:600 }}>
                            {lead.category||"—"}
                          </span>
                        </td>
                        <td style={{ padding:"7px 0", color:"rgba(255,255,255,0.2)", fontSize:10 }}>
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
