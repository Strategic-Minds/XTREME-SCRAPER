'use client'

import Link from 'next/link'
import { useEffect, useState, type FormEvent } from 'react'
import { Bell, Download, Search, ShieldCheck } from 'lucide-react'

type IntelligenceResult = { company_name: string; opportunity_score: number; score_confidence: string; evidence: Array<{ label: string; value: string }>; recommended_action: { label: string; reason: string }; lead: { phone?: string; email?: string; website?: string; city?: string; state?: string; source?: string } }
type SearchResponse = { ok: boolean; error?: string; total_results?: number; duration_ms?: number; intelligence_results?: IntelligenceResult[]; quarantined_count?: number; warnings?: string[] }

export default function DashboardPage() {
  const [session, setSession] = useState<any>(null)
  const [query, setQuery] = useState('Commercial property managers who may need flooring services')
  const [city, setCity] = useState('Miami')
  const [state, setState] = useState('FL')
  const [data, setData] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { fetch('/api/session').then(r => r.json()).then(setSession).catch(() => setSession({ authenticated: false })) }, [])

  async function search(event: FormEvent) { event.preventDefault(); setLoading(true); setError(''); const response = await fetch('/api/v1/searches', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ query, city, state, mode: 'deep', intelligence_mode: 'deep', limit: 50 }) }).catch(() => null); if (!response) { setError('Network error'); setLoading(false); return } const payload = await response.json(); if (!response.ok) setError(payload.error || 'Search failed'); else setData(payload); setLoading(false) }
  const results = data?.intelligence_results || []

  return <main className="xps-shell"><header className="xps-header"><div className="xps-container xps-nav"><Link href="/" className="xps-brand"><span className="xps-brand-mark"><span className="xps-brand-x">X</span></span><span>XPS INTELLIGENCE</span></Link><div className="xps-actions"><span className="xps-pill">{session?.authenticated ? session.user?.plan : 'Preview'}</span><Link className="xps-button" href="/pricing">Plans</Link></div></div></header><div className="xps-container" style={{ padding: '48px 0 80px' }}><div className="xps-eyebrow">Intelligence workspace</div><h1 style={{ fontSize: 'clamp(42px,5vw,68px)', letterSpacing: '-.05em', margin: '12px 0' }}>What are you trying to accomplish?</h1><p className="xps-section-copy">Describe the customer, company, professional, market, or opportunity you need. XPS will return source-backed evidence, an explainable score, and the next useful action.</p><form className="xps-search-panel" onSubmit={search}><div className="xps-search-main"><input className="xps-input" value={query} onChange={e => setQuery(e.target.value)}/><input className="xps-input" value={city} onChange={e => setCity(e.target.value)}/><input className="xps-input" value={state} onChange={e => setState(e.target.value.toUpperCase().slice(0,2))}/><button className="xps-search-submit" disabled={loading}>{loading ? '…' : <Search size={20}/>}</button></div>{error && <div className="xps-error">{error}</div>}</form><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '22px 0' }}><span className="xps-pill"><ShieldCheck size={14}/> Evidence-backed</span><span className="xps-pill"><Bell size={14}/> Save and monitor after preview validation</span><span className="xps-pill"><Download size={14}/> CSV remains available in legacy results</span></div>{data && <section className="xps-results"><div className="xps-results-head"><strong>{data.total_results || 0} source-backed results</strong><span className="xps-status">{data.duration_ms}ms · {data.quarantined_count || 0} quarantined</span></div><div className="xps-results-grid">{results.slice(0, 12).map(item => <article className="xps-result-card" key={`${item.company_name}-${item.opportunity_score}`}><div className="xps-result-top"><div><h3>{item.company_name}</h3><div className="xps-result-meta">{item.lead.city}, {item.lead.state} · {item.score_confidence} score confidence</div></div><div className="xps-score">{item.opportunity_score}</div></div><ul className="xps-evidence">{item.evidence.slice(0,4).map((e,i)=><li key={i}>{e.label}: {e.value}</li>)}</ul><div className="xps-next-action">Next: {item.recommended_action.label}</div></article>)}</div>{data.warnings?.map(w => <p className="xps-search-note" key={w}>{w}</p>)}</section>}</div></main>
}
