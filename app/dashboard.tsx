"use client"
import { useState, useEffect, useRef } from "react"

/* ── Types ─────────────────────────────────────────── */
interface Lead {
  company_name: string; phone?: string; email?: string
  website?: string; city?: string; state?: string
  category?: string; source_url?: string; scraped_at?: string
}
interface Job {
  id: string; source: Source; status: "running"|"complete"|"error"
  leads: number; duration_ms?: number; log: string[]
}
interface Source {
  id: string; name: string; icon: string
  description: string; build: (i:string,c:string,s:string)=>string
}

/* ── The 10 Sources ────────────────────────────────── */
const SOURCES: Source[] = [
  {
    id: "yellowpages", name: "Yellow Pages", icon: "📒",
    description: "Largest US business directory",
    build: (i,c,s) => `https://www.yellowpages.com/${c.toLowerCase().replace(/\s+/g,"-")}-${s.toLowerCase()}/mip/${i.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}`,
  },
  {
    id: "yelp", name: "Yelp", icon: "⭐",
    description: "Reviews + local business discovery",
    build: (i,c,s) => `https://www.yelp.com/search?find_desc=${encodeURIComponent(i)}&find_loc=${encodeURIComponent(c+", "+s)}`,
  },
  {
    id: "googlemaps", name: "Google Maps", icon: "📍",
    description: "Google Places + local SEO ranking",
    build: (i,c,s) => `https://www.google.com/maps/search/${encodeURIComponent(i+" near "+c+" "+s)}`,
  },
  {
    id: "angi", name: "Angi", icon: "🔧",
    description: "Home services — high-intent buyers",
    build: (i,c,s) => `https://www.angi.com/companylist/us/${s.toLowerCase()}/${c.toLowerCase().replace(/\s+/g,"-")}/${i.toLowerCase().replace(/[^a-z0-9]+/g,"-")}-reviews-6988.htm`,
  },
  {
    id: "bbb", name: "Better Business Bureau", icon: "🏆",
    description: "Verified, trusted businesses only",
    build: (i,c,s) => `https://www.bbb.org/search?find_country=USA&find_text=${encodeURIComponent(i)}&find_loc=${encodeURIComponent(c+", "+s)}`,
  },
  {
    id: "homeadvisor", name: "HomeAdvisor", icon: "🏠",
    description: "Home improvement pros — pre-qualified",
    build: (i,c,s) => `https://www.homeadvisor.com/c.${i.replace(/\s+/g,"-")}.${c.replace(/\s+/g,"-")}-${s}.html`,
  },
  {
    id: "thumbtack", name: "Thumbtack", icon: "📌",
    description: "On-demand service professionals",
    build: (i,c,s) => `https://www.thumbtack.com/k/${encodeURIComponent(i.toLowerCase().replace(/\s+/g,"-"))}/${encodeURIComponent(c.toLowerCase().replace(/\s+/g,"-"))}/`,
  },
  {
    id: "manta", name: "Manta", icon: "🔍",
    description: "Small business profiles & contacts",
    build: (i,c,s) => `https://www.manta.com/mb_46_${s.toUpperCase()}_${c.toLowerCase().replace(/\s+/g,"_")}/search?search_term=${encodeURIComponent(i)}`,
  },
  {
    id: "chamberofcommerce", name: "Chamber of Commerce", icon: "🏛️",
    description: "Local chamber business listings",
    build: (i,c,s) => `https://www.chamberofcommerce.com/search?q=${encodeURIComponent(i)}&location=${encodeURIComponent(c+", "+s)}`,
  },
  {
    id: "facebook", name: "Facebook Business", icon: "📘",
    description: "FB Pages — phone + website + reviews",
    build: (i,c,s) => `https://www.facebook.com/search/pages/?q=${encodeURIComponent(i+" "+c+" "+s)}`,
  },
]

/* ── Status colors ─────────────────────────────────── */
const STATUS: Record<string,string> = {
  running: "var(--blue)", complete: "var(--green)", error: "var(--red)"
}

/* ── Helpers ───────────────────────────────────────── */
function hostname(url: string) {
  try { return new URL(url).hostname.replace("www.","") } catch { return "—" }
}

/* ── Main Component ────────────────────────────────── */
export default function ScraperDashboard() {

  /* Search state */
  const [city,     setCity]     = useState("")
  const [state,    setState_]   = useState("")
  const [industry, setIndustry] = useState("")
  const [amount,   setAmount]   = useState("50")

  /* Sources — all 10 on by default */
  const [active, setActive] = useState<Set<string>>(new Set(SOURCES.map(s => s.id)))

  /* Data */
  const [jobs,  setJobs]  = useState<Job[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState({ total: 0, today: 0, runs: 0 })
  const [loading, setLoading] = useState(false)

  /* Theme */
  const [dark, setDark] = useState(true)
  useEffect(() => {
    const saved = localStorage.getItem("xscraper-theme")
    const pref  = window.matchMedia("(prefers-color-scheme: dark)").matches
    const isDark = saved ? saved === "dark" : pref
    setDark(isDark)
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light")
  }, [])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light")
    localStorage.setItem("xscraper-theme", next ? "dark" : "light")
  }

  /* Data fetch */
  useEffect(() => { fetchStats(); fetchLeads() }, [])

  async function fetchStats() {
    try { const r = await fetch("/api/stats"); if (r.ok) { const d = await r.json(); setStats({ total: d.total_leads??0, today: d.new_today??0, runs: d.total_runs??0 }) } } catch {}
  }
  async function fetchLeads() {
    try { const r = await fetch("/api/leads?limit=200"); if (r.ok) { const d = await r.json(); setLeads(Array.isArray(d)?d:(d.leads??[])) } } catch {}
  }

  function toggle(id: string) {
    setActive(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  /* ── RUN SCRAPE ─────────────────────────────────── */
  async function run() {
    const sel = SOURCES.filter(s => active.has(s.id))
    if (!sel.length || !industry.trim()) return
    setLoading(true)

    for (const src of sel) {
      const url   = src.build(industry.trim(), city.trim()||"USA", state.trim()||"US")
      const jobId = Date.now().toString() + Math.random()
      const job: Job = {
        id: jobId, source: src, status: "running", leads: 0,
        log: [`▶ ${src.name} — ${city||"all locations"}`],
      }
      setJobs(prev => [job, ...prev])

      try {
        const r = await fetch("/api/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, industry: industry.trim(), city: city.trim(), state: state.trim(), max_pages: Math.max(1, parseInt(amount)||50) }),
        })
        const d = await r.json()
        setJobs(prev => prev.map(j => j.id !== jobId ? j : {
          ...j,
          status: r.ok ? "complete" : "error",
          leads:  d.leads_saved ?? d.leads_found ?? 0,
          duration_ms: d.duration_ms,
          log: [...j.log, r.ok ? `✅ ${d.leads_saved??0} leads saved (${((d.duration_ms||0)/1000).toFixed(1)}s)` : `❌ ${d.error||"Error"}`],
        }))
        if (r.ok) { fetchStats(); fetchLeads() }
      } catch (e: unknown) {
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status:"error", log:[...j.log,`❌ ${String(e)}`] } : j))
      }
      await new Promise(res => setTimeout(res, 400))
    }
    setLoading(false)
  }

  const selCount = active.size
  const canRun   = !loading && !!industry.trim() && selCount > 0

  /* ── Styles ─────────────────────────────────────── */
  const card = {
    background: "var(--bg2)", border: "1px solid var(--border)",
    borderRadius: 14, padding: 20,
    boxShadow: "0 2px 16px var(--shadow)",
  } as React.CSSProperties

  const lbl = {
    display: "block", fontSize: 11, fontWeight: 600,
    color: "var(--text3)", textTransform: "uppercase" as const,
    letterSpacing: "0.8px", marginBottom: 6,
  } as React.CSSProperties

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", color:"var(--text)" }}>

      {/* ── HEADER ──────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "var(--bg2)", borderBottom: "1px solid var(--border)",
        padding: "0 24px", height: 58,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        backdropFilter: "blur(12px)",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:22 }}>⚡</span>
          <div>
            <h1 style={{ fontSize:15, fontWeight:800, letterSpacing:-0.5, lineHeight:1 }}>XTREME SCRAPER</h1>
            <p style={{ fontSize:10, color:"var(--text3)", marginTop:1 }}>Lead Discovery Engine</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:"flex", gap:24, alignItems:"center" }}>
          {[["Leads", stats.total, "var(--green)"],["Today", stats.today, "var(--blue)"],["Runs", stats.runs, "var(--purple)"]].map(([l,v,c])=>(
            <div key={String(l)} style={{ textAlign:"center" }}>
              <p style={{ fontSize:18, fontWeight:800, color:String(c), lineHeight:1 }}>{v}</p>
              <p style={{ fontSize:9, color:"var(--text3)", textTransform:"uppercase", letterSpacing:1 }}>{l}</p>
            </div>
          ))}
          {/* Theme toggle */}
          <button onClick={toggleTheme} style={{
            background:"var(--bg3)", border:"1px solid var(--border)",
            borderRadius:20, padding:"6px 12px", fontSize:14,
            color:"var(--text2)", cursor:"pointer",
          }}>
            {dark ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      <div style={{ maxWidth:1200, margin:"0 auto", padding:24, display:"flex", flexDirection:"column", gap:20 }}>

        {/* ── SEARCH BAR — the whole point ────────────── */}
        <div style={{ ...card, border:"1px solid var(--accent)", background:"var(--bg2)", boxShadow:"0 0 0 1px var(--card-glow), 0 4px 24px var(--shadow)" }}>
          <p style={{ fontSize:11, fontWeight:700, color:"var(--accent)", textTransform:"uppercase", letterSpacing:1, marginBottom:16 }}>
            🎯 What are you looking for?
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 160px 140px 120px", gap:12 }}>
            <div>
              <label style={lbl}>Industry / Business Type</label>
              <input
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                onKeyDown={e => e.key === "Enter" && canRun && run()}
                placeholder="e.g. Epoxy Flooring, HVAC, Roofing, Dentist..."
                style={{ fontSize:15, fontWeight:500 }}
                autoFocus
              />
            </div>
            <div>
              <label style={lbl}>City</label>
              <input
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Phoenix"
              />
            </div>
            <div>
              <label style={lbl}>State</label>
              <input
                value={state}
                onChange={e => setState_(e.target.value)}
                placeholder="AZ"
                style={{ textTransform:"uppercase" }}
              />
            </div>
            <div>
              <label style={lbl}>Results Limit</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min={5} max={500}
                placeholder="50"
              />
            </div>
          </div>
          {/* Big run button */}
          <button
            onClick={run}
            disabled={!canRun}
            style={{
              marginTop:16, width:"100%", padding:"16px 0",
              background: canRun ? "linear-gradient(135deg, var(--accent), var(--accent2))" : "var(--bg3)",
              color: canRun ? "white" : "var(--text3)",
              border:"none", borderRadius:10, fontSize:15, fontWeight:800,
              cursor: canRun ? "pointer" : "not-allowed",
              letterSpacing:0.5, transition:"all 0.2s",
              boxShadow: canRun ? "0 4px 20px rgba(37,99,235,0.35)" : "none",
            }}
          >
            {loading
              ? `⏳ Scraping ${selCount} source${selCount!==1?"s":""}...`
              : canRun
                ? `⚡ Search ${selCount} Source${selCount!==1?"s":""} for "${industry}"${city ? ` in ${city}` : ""}${state ? `, ${state.toUpperCase()}` : ""}`
                : "Enter an industry above to begin"
            }
          </button>
        </div>

        {/* ── SOURCES grid ────────────────────────────── */}
        <div style={card}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:1 }}>📡 Sources</p>
              <p style={{ fontSize:11, color:"var(--text3)", marginTop:3 }}>{selCount} of {SOURCES.length} selected</p>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              {[["All", ()=>setActive(new Set(SOURCES.map(s=>s.id)))], ["None", ()=>setActive(new Set())]].map(([l,fn])=>(
                <button key={String(l)} onClick={fn as ()=>void} style={{
                  fontSize:11, padding:"4px 10px", borderRadius:6,
                  border:"1px solid var(--border)", background:"var(--bg3)",
                  color:"var(--text2)", cursor:"pointer",
                }}>{String(l)}</button>
              ))}
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px,1fr))", gap:8 }}>
            {SOURCES.map(src => {
              const on = active.has(src.id)
              return (
                <button key={src.id} onClick={() => toggle(src.id)} style={{
                  display:"flex", alignItems:"center", gap:10, padding:"10px 12px",
                  borderRadius:9, cursor:"pointer", textAlign:"left",
                  border: on ? "1px solid rgba(37,99,235,0.5)" : "1px solid var(--border)",
                  background: on ? "rgba(37,99,235,0.08)" : "var(--bg3)",
                  transition:"all 0.15s",
                }}>
                  {/* Checkbox */}
                  <div style={{
                    width:16, height:16, borderRadius:4, flexShrink:0,
                    border: on ? "none" : "1.5px solid var(--text3)",
                    background: on ? "var(--accent)" : "transparent",
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>
                    {on && <span style={{ fontSize:10, color:"white", lineHeight:1 }}>✓</span>}
                  </div>
                  <span style={{ fontSize:16 }}>{src.icon}</span>
                  <div style={{ minWidth:0 }}>
                    <p style={{ fontSize:12, fontWeight:600, color: on ? "var(--text)" : "var(--text2)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{src.name}</p>
                    <p style={{ fontSize:10, color:"var(--text3)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{src.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── JOB QUEUE ───────────────────────────────── */}
        {jobs.length > 0 && (
          <div style={card}>
            <p style={{ fontSize:11, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>🔄 Job Queue</p>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {jobs.slice(0,8).map(job => (
                <div key={job.id} style={{
                  display:"flex", alignItems:"center", gap:12,
                  background:"var(--bg3)", border:"1px solid var(--border2)",
                  borderRadius:8, padding:"10px 14px",
                }}>
                  <span style={{ fontSize:18 }}>{job.source.icon}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                      <span style={{ fontSize:12, fontWeight:600 }}>{job.source.name}</span>
                      <span style={{ fontSize:10, fontWeight:700, color:STATUS[job.status], textTransform:"uppercase" }}>{job.status}</span>
                    </div>
                    <p style={{ fontSize:10, color:"var(--text3)", fontFamily:"monospace" }}>{job.log[job.log.length-1]}</p>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <p style={{ fontSize:16, fontWeight:800, color:"var(--green)" }}>{job.leads}</p>
                    <p style={{ fontSize:9, color:"var(--text3)" }}>leads</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── LEADS TABLE ─────────────────────────────── */}
        <div style={{ ...card, flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <p style={{ fontSize:11, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:1 }}>
              📋 Leads ({leads.length})
            </p>
            <button onClick={fetchLeads} style={{
              fontSize:11, color:"var(--blue)", background:"none",
              border:"none", cursor:"pointer", padding:"4px 8px",
            }}>↻ Refresh</button>
          </div>

          {leads.length === 0 ? (
            <div style={{ textAlign:"center", padding:"48px 0" }}>
              <p style={{ fontSize:36, marginBottom:12 }}>🔍</p>
              <p style={{ fontSize:15, fontWeight:600, color:"var(--text2)", marginBottom:6 }}>No leads yet</p>
              <p style={{ fontSize:12, color:"var(--text3)" }}>Type what you're looking for above and hit Search</p>
            </div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid var(--border)" }}>
                    {["Company","City","State","Phone","Industry","Source"].map(h => (
                      <th key={h} style={{ textAlign:"left", paddingBottom:10, paddingRight:16, fontSize:10, fontWeight:600, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.6px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead,i) => (
                    <tr key={i} style={{ borderBottom:"1px solid var(--border2)" }}>
                      <td style={{ padding:"9px 16px 9px 0", fontWeight:600 }}>{lead.company_name}</td>
                      <td style={{ padding:"9px 16px 9px 0", color:"var(--text2)" }}>{lead.city||"—"}</td>
                      <td style={{ padding:"9px 16px 9px 0", color:"var(--text2)" }}>{lead.state||"—"}</td>
                      <td style={{ padding:"9px 16px 9px 0", color:"var(--text2)" }}>{lead.phone||"—"}</td>
                      <td style={{ padding:"9px 16px 9px 0" }}>
                        <span style={{ background:"var(--tag-bg)", color:"var(--tag-text)", padding:"2px 8px", borderRadius:4, fontSize:10, fontWeight:600 }}>
                          {lead.category||"—"}
                        </span>
                      </td>
                      <td style={{ padding:"9px 0", color:"var(--text3)", fontSize:11 }}>{hostname(lead.source_url||"")}</td>
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
