'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowRight, Check, Moon, Search, ShieldCheck, Sparkles, Sun, Target, Zap } from 'lucide-react'

type Theme = 'light' | 'dark'
type Goal = 'customers' | 'decision-makers' | 'growth' | 'market' | 'competitors' | 'people'

type IntelligenceResult = {
  company_name: string
  opportunity_score: number
  score_confidence: string
  evidence: Array<{ label: string; value: string }>
  recommended_action: { label: string; reason: string }
  lead: { phone?: string; email?: string; website?: string; city?: string; state?: string; source?: string }
}

type SearchResponse = {
  ok: boolean
  error?: string
  total_results?: number
  duration_ms?: number
  intelligence_results?: IntelligenceResult[]
  warnings?: string[]
  quarantined_count?: number
}

const goals: Array<{ id: Goal; label: string; prompt: string }> = [
  { id: 'customers', label: 'Find Customers', prompt: 'Find companies likely to need my services' },
  { id: 'decision-makers', label: 'Find Decision-Makers', prompt: 'Find owners and decision-makers at target companies' },
  { id: 'growth', label: 'Find Growth', prompt: 'Find companies showing expansion or growth signals' },
  { id: 'market', label: 'Research a Market', prompt: 'Map a market and identify commercial opportunities' },
  { id: 'competitors', label: 'Analyze Competitors', prompt: 'Find and compare competitors in a market' },
  { id: 'people', label: 'Find Professionals', prompt: 'Find professionals and specialists in an industry' },
]

function IntelligenceGlobe() {
  return (
    <div className="xps-globe-wrap" aria-hidden="true">
      <div className="xps-globe-halo" />
      <svg className="xps-globe" viewBox="0 0 400 400" role="img">
        <defs>
          <radialGradient id="sphere" cx="34%" cy="28%" r="72%">
            <stop offset="0" stopColor="#fff8dc" />
            <stop offset=".42" stopColor="#d7b55c" />
            <stop offset="1" stopColor="#80601d" />
          </radialGradient>
          <linearGradient id="silver" x1="0" x2="1">
            <stop offset="0" stopColor="#d7dade" />
            <stop offset=".5" stopColor="#81878d" />
            <stop offset="1" stopColor="#f2f3f4" />
          </linearGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <clipPath id="clip"><circle cx="200" cy="200" r="123"/></clipPath>
        </defs>
        <circle cx="200" cy="200" r="127" fill="url(#sphere)" stroke="#c39c3e" strokeWidth="2" />
        <g clipPath="url(#clip)" opacity=".92">
          <path d="M95 158c36-62 77-83 120-77 37 5 58 22 91 44-27 16-40 39-73 42-32 3-39 25-67 31-29 6-50-10-71-40Z" fill="#101010" opacity=".86"/>
          <path d="M159 194c33-11 63-7 81 17 14 19 7 44-8 67-17 26-29 45-49 62-9-30-30-52-36-82-5-24-3-47 12-64Z" fill="#171717" opacity=".88"/>
          <path d="M253 182c25-19 58-17 81 5 15 14 20 35 18 58-30-2-49-11-71-26-12-8-22-20-28-37Z" fill="#101010" opacity=".82"/>
          {Array.from({ length: 42 }).map((_, i) => {
            const a = i * 2.399
            const r = 26 + ((i * 17) % 96)
            return <circle key={i} cx={200 + Math.cos(a) * r} cy={200 + Math.sin(a) * r * .72} r={i % 7 === 0 ? 2.4 : 1.3} fill="#fff4c2" opacity={i % 3 === 0 ? .95 : .58}/>
          })}
          <path d="M82 215C148 142 251 137 326 196M93 256c80-40 161-38 228 6M128 109c52 59 78 130 71 221M242 80c-31 72-32 157 8 238" fill="none" stroke="#f8e7a9" strokeWidth="1.5" opacity=".68"/>
        </g>
        <g className="xps-orbit" fill="none" stroke="url(#silver)" strokeWidth="2">
          <ellipse cx="200" cy="200" rx="174" ry="56" transform="rotate(20 200 200)" />
          <ellipse cx="200" cy="200" rx="174" ry="56" transform="rotate(-30 200 200)" />
          <circle cx="356" cy="258" r="5" fill="#f2cf72" stroke="#7c642b" filter="url(#glow)"/>
        </g>
        <g className="xps-orbit slow" fill="none" stroke="#aeb3b7" strokeWidth="1.2" opacity=".8">
          <ellipse cx="200" cy="200" rx="155" ry="42" transform="rotate(72 200 200)" />
          <circle cx="171" cy="47" r="4" fill="#e6c869" stroke="none"/>
        </g>
      </svg>
    </div>
  )
}

export default function Home() {
  const [theme, setTheme] = useState<Theme>('light')
  const [goal, setGoal] = useState<Goal>('customers')
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('Miami')
  const [state, setState] = useState('FL')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [response, setResponse] = useState<SearchResponse | null>(null)

  useEffect(() => {
    const stored = window.localStorage.getItem('xps-theme') as Theme | null
    const preferred: Theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    setTheme(stored || preferred)
  }, [])

  useEffect(() => { window.localStorage.setItem('xps-theme', theme) }, [theme])

  const activeGoal = useMemo(() => goals.find(item => item.id === goal) || goals[0], [goal])

  async function runSearch(event: FormEvent) {
    event.preventDefault()
    const mission = query.trim() || activeGoal.prompt
    setLoading(true)
    setError('')
    setResponse(null)
    try {
      const result = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: mission, city, state, mode: 'deep', intelligence_mode: 'deep', limit: 24 }),
      })
      const data = await result.json() as SearchResponse
      if (!result.ok || !data.ok) throw new Error(data.error || 'Search could not be completed')
      setResponse(data)
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : 'Search could not be completed')
    } finally {
      setLoading(false)
    }
  }

  const topResults = response?.intelligence_results?.slice(0, 3) || []

  return (
    <main className={`xps-shell ${theme}`}>
      <header className="xps-header">
        <div className="xps-container xps-nav">
          <Link href="/" className="xps-brand" aria-label="XPS Intelligence home">
            <span className="xps-brand-mark"><span className="xps-brand-x">X</span></span>
            <span>XPS INTELLIGENCE</span>
          </Link>
          <nav className="xps-nav-links" aria-label="Primary navigation">
            <Link href="/product">Product</Link><Link href="/solutions">Solutions</Link><Link href="/industries">Industries</Link><Link href="/pricing">Pricing</Link>
          </nav>
          <div className="xps-actions">
            <button className="xps-button xps-icon-button" aria-label="Toggle theme" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>} 
            </button>
            <Link className="xps-button" href="/login">Sign in</Link>
            <Link className="xps-button primary" href="/signup">Start free</Link>
          </div>
        </div>
      </header>

      <section className="xps-hero">
        <div className="xps-container xps-hero-grid">
          <div>
            <div className="xps-eyebrow">Verified business intelligence, built for action</div>
            <h1 className="xps-title">Go Beyond Google.<span>Find What Others Can’t.</span></h1>
            <p className="xps-lead">Find companies, people, contacts, markets, signals, and opportunities. See the evidence, understand why each result matters, and know what to do next.</p>
            <div className="xps-promise">
              <span className="xps-pill">Cross-source discovery</span><span className="xps-pill">Evidence-backed scoring</span><span className="xps-pill">Recommended actions</span><span className="xps-pill">Universal industries</span>
            </div>

            <form className="xps-search-panel" onSubmit={runSearch}>
              <div className="xps-search-main">
                <input className="xps-input" value={query} onChange={e => setQuery(e.target.value)} placeholder="Describe the result you need..." aria-label="Search mission" />
                <input className="xps-input" value={city} onChange={e => setCity(e.target.value)} placeholder="City" aria-label="City" />
                <input className="xps-input" value={state} onChange={e => setState(e.target.value.toUpperCase().slice(0, 2))} placeholder="ST" aria-label="State" />
                <button className="xps-search-submit" disabled={loading} aria-label="Run intelligence search">{loading ? <Sparkles size={20}/> : <Search size={21}/>}</button>
              </div>
              <div className="xps-goals" aria-label="Search goals">
                {goals.map(item => <button type="button" key={item.id} onClick={() => { setGoal(item.id); if (!query) setQuery(item.prompt) }} className={`xps-goal ${goal === item.id ? 'active' : ''}`}>{item.label}</button>)}
              </div>
              <p className="xps-search-note">XPS Intelligence separates source-backed results from AI-only candidates and explains score confidence.</p>
              {error && <div className="xps-error">{error}</div>}
              {(loading || response) && (
                <div className="xps-results" aria-live="polite">
                  <div className="xps-results-head">
                    <strong>{loading ? 'Building the intelligence picture…' : `${response?.total_results || 0} source-backed results`}</strong>
                    {!loading && <span className="xps-status">{response?.duration_ms || 0}ms · {response?.quarantined_count || 0} AI-only candidates quarantined</span>}
                  </div>
                  {!loading && topResults.length > 0 && <div className="xps-results-grid">
                    {topResults.map(item => (
                      <article className="xps-result-card" key={`${item.company_name}-${item.opportunity_score}`}>
                        <div className="xps-result-top"><div><h3>{item.company_name}</h3><div className="xps-result-meta">{item.lead.city}{item.lead.state ? `, ${item.lead.state}` : ''} · {item.lead.source?.replaceAll('_', ' ')}</div></div><div className="xps-score" title={`Score confidence: ${item.score_confidence}`}>{item.opportunity_score}</div></div>
                        <ul className="xps-evidence">{item.evidence.slice(0, 3).map((e, index) => <li key={index}>{e.label}: {e.value}</li>)}</ul>
                        <div className="xps-next-action">Next: {item.recommended_action.label}</div>
                      </article>
                    ))}
                  </div>}
                  {!loading && response?.warnings?.map(warning => <div className="xps-search-note" key={warning}>{warning}</div>)}
                </div>
              )}
            </form>
          </div>
          <IntelligenceGlobe />
        </div>
      </section>

      <section className="xps-section alt" id="difference">
        <div className="xps-container">
          <div className="xps-eyebrow">The difference is what happens after search</div>
          <h2>Pages are not intelligence.</h2>
          <p className="xps-section-copy">Traditional search leaves you to open tabs, verify companies, locate contacts, compare evidence, and decide what matters. XPS Intelligence structures that work into one traceable decision flow.</p>
          <div className="xps-compare">
            <div><h3>Traditional search</h3><ul className="xps-list"><li>Links, ads, and scattered pages</li><li>Manual contact discovery</li><li>Manual verification and prioritization</li><li>No consistent next action</li></ul></div>
            <div><h3>XPS Intelligence</h3><ul className="xps-list"><li>Structured companies, people, and contacts</li><li>Evidence and source lineage</li><li>Explainable opportunity scores</li><li>Recommended next actions</li></ul></div>
          </div>
        </div>
      </section>

      <section className="xps-section">
        <div className="xps-container">
          <div className="xps-eyebrow">One system, multiple commercial outcomes</div>
          <h2>Find it. Understand it. Act on it.</h2>
          <div className="xps-grid-3">
            <article className="xps-card"><Target/><div className="xps-card-number">01 · DISCOVER</div><h3>Intent-first intelligence</h3><p>Start with what you are trying to accomplish, not a technical query syntax. XPS translates goals into industries, titles, locations, sources, and search depth.</p></article>
            <article className="xps-card"><ShieldCheck/><div className="xps-card-number">02 · VERIFY</div><h3>Evidence before claims</h3><p>See what source produced a result, which contact details exist, how fresh the record is, and when more research is required.</p></article>
            <article className="xps-card"><Zap/><div className="xps-card-number">03 · ACT</div><h3>Next best action</h3><p>Call, email, enrich, save, monitor, export, or disqualify. Recommendations explain why the action is appropriate instead of pretending certainty.</p></article>
          </div>
        </div>
      </section>

      <section className="xps-section alt">
        <div className="xps-container">
          <div className="xps-eyebrow">For contractors and every business that sells</div>
          <h2>Stop losing opportunities while you are doing the work.</h2>
          <p className="xps-section-copy">Contractor Mode connects intelligence to the practical tools owners care about: a lead-generating presence, fast response, qualification, estimates, reviews, and visible lead attribution. The universal core remains useful for agencies, recruiters, manufacturers, distributors, consultants, and sales teams.</p>
          <div className="xps-grid-3">
            {['Find customers and decision-makers','Recover missed calls and follow up','Build estimates and proposals faster','Collect reviews after completed work','Monitor markets and competitor movement','See where every lead came from'].map((label, index) => <div className="xps-card" key={label}><div className="xps-card-number">{String(index + 1).padStart(2, '0')}</div><h3>{label}</h3><p>Designed as a connected business outcome, not an isolated AI novelty.</p></div>)}
          </div>
        </div>
      </section>

      <section className="xps-section">
        <div className="xps-container">
          <div className="xps-eyebrow">Trust architecture</div>
          <h2>AI helps investigate. Evidence earns the label.</h2>
          <p className="xps-section-copy">AI-only business candidates are quarantined until corroborated. Unknown cities never silently inherit another city’s coordinates. Scores expose their evidence and confidence. These safeguards turn a dramatic promise into a defensible product.</p>
          <div className="xps-promise"><span className="xps-pill"><Check size={14}/> Source policy</span><span className="xps-pill"><Check size={14}/> AI quarantine</span><span className="xps-pill"><Check size={14}/> Location safety</span><span className="xps-pill"><Check size={14}/> Explainable scoring</span></div>
          <div style={{ marginTop: 34 }}><Link href="/signup" className="xps-button primary">Start with a real search <ArrowRight size={16} style={{ display: 'inline', marginLeft: 6 }}/></Link></div>
        </div>
      </section>

      <footer className="xps-footer"><div className="xps-container xps-footer-row"><span className="xps-brand"><span className="xps-brand-mark"><span className="xps-brand-x">X</span></span><span>XPS INTELLIGENCE</span></span><span>© 2026 Strategic Minds · Evidence before claims.</span></div></footer>
    </main>
  )
}
