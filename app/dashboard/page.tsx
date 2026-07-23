'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Lead {
  company_name: string
  phone?: string
  email?: string
  website?: string
  address?: string
  city?: string
  state?: string
  rating?: number
  review_count?: number
  category?: string
  source?: string
  confidence?: number
  owner_name?: string
}

interface SearchResult {
  ok: boolean
  query?: string
  city?: string
  state?: string
  mode?: string
  total_results?: number
  leads_found?: number
  duration_ms?: number
  sources_used?: string[]
  sources_skipped?: { source: string; reason: string }[]
  keywords_expanded?: string[]
  results?: Lead[]
  leads?: Lead[]
  error?: string
}

const MODES = [
  { id: 'quick', label: 'Quick', desc: '~3s · 40 results', color: '#16A34A' },
  { id: 'deep', label: 'Deep', desc: '~15s · 150 results', color: '#2563EB' },
  { id: 'max', label: 'Max', desc: '~30s · 200 results', color: '#9333EA' },
  { id: 'level5', label: 'Level 5 ⚡', desc: '~60s · 250+ results', color: '#FFBE00' },
]

const EXAMPLE_QUERIES = [
  { query: 'Epoxy flooring', city: 'Phoenix', state: 'AZ' },
  { query: 'Plumbers', city: 'Dallas', state: 'TX' },
  { query: 'Roofing contractors', city: 'Denver', state: 'CO' },
  { query: 'Wedding photographers', city: 'Austin', state: 'TX' },
  { query: 'Accountants', city: 'Chicago', state: 'IL' },
  { query: 'HVAC companies', city: 'Miami', state: 'FL' },
]

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

export default function Dashboard() {
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('Phoenix')
  const [state, setState] = useState('AZ')
  const [mode, setMode] = useState('deep')
  const [limit, setLimit] = useState(200)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<{ total_runs?: number; total_leads?: number; last_run?: string } | null>(null)

  // Load stats on mount
  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => setStats(d)).catch(() => {})
  }, [])

  const runSearch = useCallback(async (q?: string, c?: string, s?: string, m?: string) => {
    const searchQuery = q || query
    const searchCity  = c || city
    const searchState = s || state
    const searchMode  = m || mode
    if (!searchQuery.trim()) { setError('Enter a search query'); return }
    setLoading(true); setError(''); setResult(null)
    try {
      // Try /api/search first (Level 5), fall back to /api/scrape
      let res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, city: searchCity, state: searchState, mode: searchMode, limit }),
      })
      if (!res.ok) {
        res = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ industry: searchQuery, city: searchCity, state: searchState, mode: searchMode === 'level5' ? 'max' : searchMode, limit }),
        })
      }
      const data: SearchResult = await res.json()
      setResult(data)
      if (!data.ok) setError(data.error || 'Search failed')
    } catch (e) {
      setError('Network error — check connection')
    } finally {
      setLoading(false)
    }
  }, [query, city, state, mode, limit])

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') runSearch() }

  const exportCSV = () => {
    const leads = result?.results || result?.leads || []
    if (!leads.length) return
    const headers = ['Company Name', 'Phone', 'Email', 'Website', 'Address', 'City', 'State', 'Rating', 'Reviews', 'Source', 'Confidence']
    const rows = leads.map(l => [l.company_name, l.phone || '', l.email || '', l.website || '', l.address || '', l.city || '', l.state || '', l.rating || '', l.review_count || '', l.source || '', l.confidence || ''].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `xtreme-scraper-${query.replace(/\s+/g, '-')}-${city}-${Date.now()}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const leads = result?.results || result?.leads || []
  const totalLeads = result?.total_results || result?.leads_found || leads.length
  const sourceBreakdown = leads.reduce((acc: Record<string, number>, l) => { const s = l.source || 'unknown'; acc[s] = (acc[s] || 0) + 1; return acc }, {})

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 bg-white z-50">
        <span className="font-black text-xl">XTREME SCRAPER</span>
        <Link href="/" className="text-sm font-semibold" style={{ color: '#FFBE00' }}>← Home</Link>
      </nav>

      {/* Stats bar */}
      <div className="border-b border-gray-100 px-8 py-3 flex items-center gap-8 text-sm text-gray-500 bg-gray-50">
        <span>Total Runs: <strong className="text-black">{stats?.total_runs ?? '—'}</strong></span>
        <span>Total Leads: <strong className="text-black">{stats?.total_leads ?? '—'}</strong></span>
        <span>Last Run: <strong className="text-black">{stats?.last_run ? new Date(stats.last_run).toLocaleString() : '—'}</strong></span>
        {result && <span style={{ color: '#16A34A' }} className="font-semibold">✓ {totalLeads} results in {result.duration_ms}ms</span>}
      </div>

      {/* Search Form */}
      <div className="max-w-5xl mx-auto px-8 py-12">
        <h1 className="font-black text-4xl mb-2">Level 5 Intelligence Search</h1>
        <p className="text-gray-500 mb-8">Any industry. Any city. Every source. <span className="font-semibold text-black">Google Maps · BBB · Apollo · Firecrawl · BrowserWorker · AI</span></p>

        {/* Query input */}
        <div className="flex gap-3 mb-4">
          <input
            type="text" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Search any industry... (plumbers, photographers, accountants)"
            className="flex-1 rounded-xl border-2 border-gray-200 px-5 py-3 text-base focus:outline-none focus:border-yellow-400"
          />
          <input
            type="text" value={city} onChange={e => setCity(e.target.value)}
            placeholder="City" className="w-36 rounded-xl border-2 border-gray-200 px-4 py-3 text-base focus:outline-none focus:border-yellow-400"
          />
          <select value={state} onChange={e => setState(e.target.value)}
            className="w-24 rounded-xl border-2 border-gray-200 px-3 py-3 text-base focus:outline-none">
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Mode selector */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {MODES.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className="rounded-xl px-5 py-2.5 text-sm font-bold transition-all border-2"
              style={mode === m.id ? { backgroundColor: m.color, borderColor: m.color, color: m.id === 'level5' ? '#111' : 'white' } : { backgroundColor: 'white', borderColor: '#E5E7EB', color: '#111' }}>
              {m.label} <span className="font-normal opacity-70 text-xs ml-1">{m.desc}</span>
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <label className="text-sm text-gray-500">Limit:</label>
            <select value={limit} onChange={e => setLimit(Number(e.target.value))} className="rounded-lg border border-gray-200 px-2 py-1 text-sm">
              {[50, 100, 200, 500, 0].map(v => <option key={v} value={v}>{v === 0 ? 'All' : v}</option>)}
            </select>
          </div>
        </div>

        {/* Search button */}
        <button onClick={() => runSearch()} disabled={loading}
          className="w-full rounded-xl py-4 font-black text-lg text-black transition-all hover:scale-[1.01] disabled:opacity-60"
          style={{ backgroundColor: '#FFBE00' }}>
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Searching all sources...
            </span>
          ) : `Search ${mode === 'level5' ? '⚡ Level 5' : mode.charAt(0).toUpperCase() + mode.slice(1)} →`}
        </button>

        {/* Example queries */}
        {!result && !loading && (
          <div className="mt-8">
            <p className="text-sm text-gray-400 mb-3">Try an example:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUERIES.map((ex, i) => (
                <button key={i} onClick={() => { setQuery(ex.query); setCity(ex.city); setState(ex.state); setTimeout(() => runSearch(ex.query, ex.city, ex.state, mode), 50) }}
                  className="rounded-full border border-gray-200 px-4 py-1.5 text-sm hover:border-yellow-400 transition-all font-medium">
                  {ex.query} in {ex.city}, {ex.state}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-5 py-3 text-red-700 text-sm">{error}</div>}

        {/* Results */}
        {result?.ok && leads.length > 0 && (
          <div className="mt-10">
            {/* Results header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h2 className="font-black text-2xl">{totalLeads} Results</h2>
                <p className="text-gray-500 text-sm">for &ldquo;{result.query}&rdquo; in {result.city}, {result.state} · {result.duration_ms}ms · {result.mode} mode</p>
              </div>
              <button onClick={exportCSV}
                className="rounded-xl px-5 py-2 font-bold text-sm border-2 border-gray-200 hover:border-yellow-400 transition-all">
                ⬇ Export CSV
              </button>
            </div>

            {/* Source breakdown */}
            <div className="flex flex-wrap gap-2 mb-6">
              {Object.entries(sourceBreakdown).map(([src, cnt]) => (
                <span key={src} className="rounded-full px-3 py-1 text-xs font-semibold border border-gray-200 bg-gray-50">
                  {src}: {cnt}
                </span>
              ))}
            </div>

            {/* Keywords expanded */}
            {result.keywords_expanded && result.keywords_expanded.length > 1 && (
              <div className="mb-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Keywords searched ({result.keywords_expanded.length})</p>
                <div className="flex flex-wrap gap-1">
                  {result.keywords_expanded.map((kw, i) => <span key={i} className="text-xs bg-white border border-gray-200 rounded-full px-2 py-0.5">{kw}</span>)}
                </div>
              </div>
            )}

            {/* Lead cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leads.map((lead, i) => (
                <div key={i} className="rounded-2xl border border-gray-200 p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-base leading-tight flex-1 mr-2">{lead.company_name}</h3>
                    {lead.confidence && (
                      <span className="text-xs font-bold rounded-full px-2 py-0.5 flex-shrink-0"
                        style={{ backgroundColor: lead.confidence >= 80 ? '#DCFCE7' : lead.confidence >= 60 ? '#FEF9C3' : '#F3F4F6', color: lead.confidence >= 80 ? '#16A34A' : lead.confidence >= 60 ? '#92400E' : '#6B7280' }}>
                        {lead.confidence}%
                      </span>
                    )}
                  </div>
                  {lead.rating && (
                    <p className="text-sm text-yellow-600 font-semibold mb-2">★ {lead.rating} {lead.review_count ? `(${lead.review_count} reviews)` : ''}</p>
                  )}
                  {lead.address && <p className="text-sm text-gray-500 mb-3 leading-tight">{lead.address}</p>}
                  <div className="flex gap-2 flex-wrap">
                    {lead.phone && (
                      <a href={`tel:${lead.phone.replace(/\D/g,'')}`}
                        className="rounded-lg px-3 py-1.5 text-sm font-bold text-black"
                        style={{ backgroundColor: '#FFBE00' }}>
                        📞 {lead.phone}
                      </a>
                    )}
                    {lead.website && (
                      <a href={lead.website} target="_blank" rel="noopener noreferrer"
                        className="rounded-lg px-3 py-1.5 text-sm font-semibold border border-gray-200 hover:border-gray-400 transition-all">
                        🌐 Website
                      </a>
                    )}
                    {lead.email && (
                      <a href={`mailto:${lead.email}`}
                        className="rounded-lg px-3 py-1.5 text-sm font-semibold border border-gray-200 hover:border-gray-400 transition-all">
                        ✉ Email
                      </a>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-400 bg-gray-50 rounded-full px-2 py-0.5">{lead.source}</span>
                    {lead.category && <span className="text-xs text-gray-400">{lead.category}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}