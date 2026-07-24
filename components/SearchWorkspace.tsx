'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Download, Search, ShieldCheck, Sparkles } from 'lucide-react'
import AppShell from './AppShell'
import styles from './AppShell.module.css'

type Evidence = { label: string; value: string }
type Result = { company_name: string; opportunity_score: number; score_confidence: string; evidence: Evidence[]; recommended_action: { label: string; reason: string }; lead: { phone?: string; email?: string; website?: string; city?: string; state?: string; source?: string } }
type Payload = { ok: boolean; error?: string; dry_run?: boolean; total_results?: number; duration_ms?: number; intelligence_results?: Result[]; quarantined_count?: number; sources_used?: string[]; warnings?: string[] }

export default function SearchWorkspace({ title = 'Intelligence Search', initialQuery = '' }: { title?: string; initialQuery?: string }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [query, setQuery] = useState(initialQuery)
  const [city, setCity] = useState('Miami')
  const [state, setState] = useState('FL')
  const [mode, setMode] = useState('deep')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<Payload | null>(null)

  useEffect(() => { fetch('/api/session').then(r => r.json()).then(d => setAuthenticated(Boolean(d.authenticated))).catch(() => setAuthenticated(false)) }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (query.trim().length < 2) { setError('Describe the business result you need.'); return }
    setLoading(true); setError(''); setData(null)
    try {
      const response = await fetch('/api/v1/searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ query: query.trim(), city, state, mode, intelligence_mode: 'deep', limit: 50, dry_run: !authenticated }),
      })
      const payload = await response.json() as Payload
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Search failed')
      setData(payload)
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : 'Search failed')
    } finally { setLoading(false) }
  }

  async function exportResults() {
    const records = data?.intelligence_results?.map(item => ({ ...item.lead, company_name: item.company_name, opportunity_score: item.opportunity_score })) || []
    if (!records.length) return
    const response = await fetch('/api/v1/exports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ format: 'csv', records, dry_run: !authenticated }) })
    if (!response.ok) { const payload = await response.json().catch(() => ({})); setError(payload.error || 'Export failed'); return }
    const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'xps-intelligence-results.csv'; link.click(); URL.revokeObjectURL(url)
  }

  const results = data?.intelligence_results || []
  return <AppShell title={title}>
    <section className={styles.pageHeader}><div><div className={styles.eyebrow}>Goal → evidence → score → action</div><h1 className={styles.title}>{title}</h1><p className={styles.description}>Describe the result you need in plain language. XPS Intelligence expands the mission, combines approved sources, quarantines AI-only candidates, and explains each priority.</p></div></section>
    {!authenticated && <div className={styles.warning}>You are in read-only preview mode. Searches run with persistence disabled until secure authentication is configured.</div>}
    <form onSubmit={submit} className="xps-search-panel" style={{ marginTop: 20 }}>
      <div className="xps-search-main"><input className="xps-input" value={query} onChange={e => setQuery(e.target.value)} placeholder="Example: Find commercial property managers responsible for concrete-floor facilities"/><input className="xps-input" value={city} onChange={e => setCity(e.target.value)} placeholder="City"/><input className="xps-input" value={state} onChange={e => setState(e.target.value.toUpperCase().slice(0,2))} placeholder="ST"/><button className="xps-search-submit" disabled={loading}>{loading ? <Sparkles size={18}/> : <Search size={19}/>}</button></div>
      <div className="xps-goals">{['quick','deep','max','level5'].map(item => <button type="button" className={`xps-goal ${mode === item ? 'active' : ''}`} onClick={() => setMode(item)} key={item}>{item}</button>)}</div>
      {error && <div className="xps-error">{error}</div>}
    </form>
    {loading && <div className={styles.empty} style={{ marginTop: 24 }}><Sparkles/><h2>Building the intelligence picture</h2><p>Searching approved sources, normalizing entities, checking policy, and calculating evidence-bounded scores.</p></div>}
    {data && <section style={{ marginTop: 26 }}>
      <div className={styles.pageHeader}><div><span className={styles.status}><ShieldCheck size={14}/> {data.total_results || 0} source-backed results</span><p className={styles.cardCopy}>{data.sources_used?.join(' · ') || 'No sources returned'} · {data.duration_ms || 0}ms · {data.quarantined_count || 0} quarantined</p></div><button className={styles.button} onClick={exportResults}><Download size={14} style={{ display:'inline', marginRight:6 }}/>Export verified rows</button></div>
      {results.length ? <div className={styles.grid}>{results.map(item => <article className={styles.card} key={`${item.company_name}-${item.opportunity_score}`}><div style={{ display:'flex',justifyContent:'space-between',gap:12 }}><div><h2 className={styles.cardTitle}>{item.company_name}</h2><p className={styles.cardCopy}>{item.lead.city}{item.lead.state ? `, ${item.lead.state}` : ''} · {item.lead.source || 'source unknown'}</p></div><span className="xps-score">{item.opportunity_score}</span></div><ul className={styles.list}>{item.evidence.slice(0,4).map((e,i)=><li key={i}>{e.label}: {e.value}</li>)}</ul><div className={styles.success} style={{ marginTop:14 }}><strong>Next:</strong> {item.recommended_action.label}<br/>{item.recommended_action.reason}</div></article>)}</div> : <div className={styles.empty}><h2>No source-backed results yet</h2><p>Try a broader category, a different location, or Quick mode. AI-only candidates are not promoted into verified results.</p></div>}
      {data.warnings?.map(warning => <div className={styles.warning} style={{ marginTop:10 }} key={warning}>{warning}</div>)}
    </section>}
  </AppShell>
}
