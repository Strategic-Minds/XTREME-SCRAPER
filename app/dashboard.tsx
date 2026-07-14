"use client"
import { useState, useEffect, useRef } from "react"

interface Lead {
  id?: string
  company_name: string
  phone?: string
  email?: string
  website?: string
  city?: string
  state?: string
  category?: string
  source_url?: string
  scraped_at?: string
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

export default function ScraperDashboard() {
  const [url, setUrl]           = useState("")
  const [industry, setIndustry] = useState("Epoxy Flooring")
  const [maxPages, setMaxPages] = useState(50)
  const [jobs, setJobs]         = useState<ScrapeJob[]>([])
  const [leads, setLeads]       = useState<Lead[]>([])
  const [stats, setStats]       = useState({ total: 0, today: 0, runs: 0 })
  const [loading, setLoading]   = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch stats on mount
  useEffect(() => {
    fetchStats()
    fetchLeads()
  }, [])

  async function fetchStats() {
    try {
      const r = await fetch("/api/stats")
      if (r.ok) {
        const d = await r.json()
        setStats({
          total: d.total_leads ?? 0,
          today: d.new_today   ?? 0,
          runs:  d.total_runs  ?? 0,
        })
      }
    } catch {}
  }

  async function fetchLeads() {
    try {
      const r = await fetch("/api/leads?limit=50")
      if (r.ok) {
        const d = await r.json()
        setLeads(Array.isArray(d) ? d : (d.leads ?? []))
      }
    } catch {}
  }

  async function runScrape() {
    if (!url.trim()) return
    setLoading(true)
    const jobId = Date.now().toString()
    const job: ScrapeJob = {
      id: jobId, url, status: "running",
      pages: 0, leads: 0, log: [`Starting scrape: ${url}`],
    }
    setJobs(prev => [job, ...prev])

    try {
      const r = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, industry, max_pages: maxPages }),
      })
      const data = await r.json()
      setJobs(prev => prev.map(j =>
        j.id === jobId ? {
          ...j,
          status: r.ok ? "complete" : "error",
          pages:  data.pages_scraped ?? data.pages_count ?? 0,
          leads:  data.leads_saved   ?? data.leads_found ?? 0,
          duration_ms: data.duration_ms,
          log: [...j.log, r.ok
            ? `✅ Done — ${data.leads_saved ?? 0} leads saved to Supabase in ${data.duration_ms}ms`
            : `❌ Error: ${data.error}`
          ],
        } : j
      ))
      if (r.ok) { fetchStats(); fetchLeads() }
    } catch (e: unknown) {
      setJobs(prev => prev.map(j =>
        j.id === jobId ? { ...j, status: "error", log: [...j.log, `❌ ${String(e)}`] } : j
      ))
    }
    setLoading(false)
  }

  const AZ_TARGETS = [
    "https://www.yellowpages.com/phoenix-az/mip/epoxy-flooring",
    "https://www.yellowpages.com/scottsdale-az/mip/epoxy-flooring",
    "https://www.yellowpages.com/tucson-az/mip/epoxy-flooring",
    "https://www.yelp.com/search?find_desc=epoxy+flooring&find_loc=Phoenix%2C+AZ",
    "https://www.yelp.com/search?find_desc=garage+floor+coating&find_loc=Scottsdale%2C+AZ",
    "https://www.angieslist.com/companylist/us/az/phoenix/epoxy-flooring-reviews-6988.htm",
  ]

  const STATUS_COLOR = {
    queued: "text-yellow-400", running: "text-blue-400",
    complete: "text-green-400", error: "text-red-400",
  }

  return (
    <div className="min-h-screen text-white" style={{ background: "#090B10", fontFamily: "system-ui" }}>
      {/* Header */}
      <header className="border-b border-white/10 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">⚡ XTREME SCRAPER</h1>
          <p className="text-xs text-white/40 mt-0.5">Asyncio Lead Discovery → Supabase</p>
        </div>
        <div className="flex gap-6 text-center">
          <div><p className="text-2xl font-bold text-green-400">{stats.total}</p><p className="text-xs text-white/40">Total Leads</p></div>
          <div><p className="text-2xl font-bold text-blue-400">{stats.today}</p><p className="text-xs text-white/40">Today</p></div>
          <div><p className="text-2xl font-bold text-purple-400">{stats.runs}</p><p className="text-xs text-white/40">Scrape Runs</p></div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6 p-8">
        {/* LEFT — Controls */}
        <div className="col-span-4 space-y-4">
          {/* Scrape form */}
          <div className="rounded-xl border border-white/10 p-5" style={{ background: "#0f1117" }}>
            <h2 className="text-sm font-semibold mb-4 text-white/70 uppercase tracking-wider">New Scrape Job</h2>
            <label className="block text-xs text-white/50 mb-1">Target URL</label>
            <input
              value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://yellowpages.com/..."
              className="w-full rounded-lg px-3 py-2 text-sm text-white border border-white/10 mb-3"
              style={{ background: "#1a1d26" }}
            />
            <label className="block text-xs text-white/50 mb-1">Industry / Category</label>
            <input
              value={industry} onChange={e => setIndustry(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm text-white border border-white/10 mb-3"
              style={{ background: "#1a1d26" }}
            />
            <label className="block text-xs text-white/50 mb-1">Max Pages</label>
            <input
              type="number" value={maxPages} onChange={e => setMaxPages(Number(e.target.value))}
              className="w-full rounded-lg px-3 py-2 text-sm text-white border border-white/10 mb-4"
              style={{ background: "#1a1d26" }}
            />
            <button
              onClick={runScrape} disabled={loading || !url.trim()}
              className="w-full rounded-lg py-2.5 text-sm font-semibold transition-all"
              style={{ background: loading ? "#1a1d26" : "#2563eb", color: "white", cursor: loading ? "not-allowed" : "pointer" }}
            >
              {loading ? "⏳ Scraping..." : "▶ Run Scrape"}
            </button>
          </div>

          {/* Quick targets */}
          <div className="rounded-xl border border-white/10 p-5" style={{ background: "#0f1117" }}>
            <h2 className="text-sm font-semibold mb-3 text-white/70 uppercase tracking-wider">AZ Quick Targets</h2>
            <div className="space-y-2">
              {AZ_TARGETS.map((t, i) => (
                <button key={i} onClick={() => setUrl(t)}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg border border-white/5 hover:border-blue-500/50 transition-all truncate"
                  style={{ background: "#1a1d26", color: url === t ? "#60a5fa" : "#9ca3af" }}
                  title={t}
                >
                  {t.replace("https://www.","").split("/").slice(0,2).join("/")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Jobs + Leads */}
        <div className="col-span-8 space-y-4">
          {/* Active jobs */}
          {jobs.length > 0 && (
            <div className="rounded-xl border border-white/10 p-5" style={{ background: "#0f1117" }}>
              <h2 className="text-sm font-semibold mb-3 text-white/70 uppercase tracking-wider">Job Queue</h2>
              <div className="space-y-3">
                {jobs.slice(0, 5).map(job => (
                  <div key={job.id} className="rounded-lg border border-white/5 p-4" style={{ background: "#1a1d26" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/60 truncate max-w-xs">{job.url}</span>
                      <span className={`text-xs font-bold uppercase ${STATUS_COLOR[job.status]}`}>{job.status}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-white/40 mb-2">
                      <span>Pages: {job.pages}</span>
                      <span>Leads: <span className="text-green-400 font-bold">{job.leads}</span></span>
                      {job.duration_ms && <span>{(job.duration_ms/1000).toFixed(1)}s</span>}
                    </div>
                    <div className="text-xs font-mono text-white/30 space-y-0.5 max-h-16 overflow-y-auto">
                      {job.log.map((l, i) => <div key={i}>{l}</div>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leads table */}
          <div className="rounded-xl border border-white/10 p-5" style={{ background: "#0f1117" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Latest Leads ({leads.length})</h2>
              <button onClick={fetchLeads} className="text-xs text-blue-400 hover:text-blue-300">↻ Refresh</button>
            </div>
            {leads.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-8">No leads yet — run a scrape job above</p>
            ) : (
              <div className="overflow-auto max-h-[500px]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-white/30 border-b border-white/5">
                      <th className="text-left pb-2 font-medium">Company</th>
                      <th className="text-left pb-2 font-medium">City</th>
                      <th className="text-left pb-2 font-medium">Phone</th>
                      <th className="text-left pb-2 font-medium">Category</th>
                      <th className="text-left pb-2 font-medium">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {leads.map((lead, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="py-2 pr-4 font-medium text-white">{lead.company_name}</td>
                        <td className="py-2 pr-4 text-white/50">{lead.city || "—"}</td>
                        <td className="py-2 pr-4 text-white/50">{lead.phone || "—"}</td>
                        <td className="py-2 pr-4">
                          <span className="px-2 py-0.5 rounded text-xs" style={{ background: "#1e3a8a", color: "#93c5fd" }}>
                            {lead.category || "unknown"}
                          </span>
                        </td>
                        <td className="py-2 text-white/30 truncate max-w-xs">
                          {lead.source_url ? new URL(lead.source_url).hostname.replace("www.","") : "—"}
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
