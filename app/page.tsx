'use client'

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import './intelora.css'
import {
  ArrowRight,
  Grid2X2,
  Loader2,
  MapPin,
  Menu,
  Moon,
  Search,
  Sun,
  X,
} from 'lucide-react'

type Theme = 'dark' | 'light'

type Lead = {
  company_name: string
  phone?: string
  email?: string
  website?: string
  address?: string
  city?: string
  state?: string
  rating?: number
  review_count?: number
  source?: string
}

type SearchResponse = {
  ok: boolean
  error?: string
  total_results?: number
  duration_ms?: number
  results?: Lead[]
}

const LOCATIONS = [
  { label: 'Global', city: 'United States', state: '' },
  { label: 'Phoenix, AZ', city: 'Phoenix', state: 'AZ' },
  { label: 'Miami, FL', city: 'Miami', state: 'FL' },
  { label: 'Dallas, TX', city: 'Dallas', state: 'TX' },
  { label: 'New York, NY', city: 'New York', state: 'NY' },
  { label: 'Los Angeles, CA', city: 'Los Angeles', state: 'CA' },
]

const CATEGORIES = [
  'All Categories',
  'Companies',
  'People',
  'Industries',
  'Products',
  'Markets',
  'Technologies',
  'Opportunities',
]

const SUGGESTION_LIBRARY = [
  'Companies developing solid-state batteries in Europe',
  'Market trends in autonomous logistics 2025',
  'Top materials for next-generation AI chips',
  'Fast-growing construction companies in Florida',
  'Decision makers at renewable energy companies',
  'Businesses with verified phones but no website',
  'Emerging technologies receiving recent investment',
  'Local service companies expanding into new markets',
]

function ElectricGlobe({ pulse }: { pulse: number }) {
  const arcs = [
    'M110 330 C180 220 250 165 345 122',
    'M118 420 C240 360 350 330 455 210',
    'M160 520 C270 450 430 470 565 330',
    'M245 135 C340 230 480 185 650 110',
    'M330 630 C410 510 560 510 690 400',
    'M390 195 C455 290 565 300 710 250',
    'M505 160 C560 245 655 270 745 350',
    'M465 430 C540 390 625 415 744 515',
  ]

  const bolts = [
    'M390 398 L360 330 L386 344 L372 280 L420 355 L394 342 Z',
    'M390 398 L304 404 L328 386 L270 368 L358 372 L340 392 Z',
    'M390 398 L432 462 L428 430 L478 480 L420 412 L450 420 Z',
    'M390 398 L468 350 L438 356 L505 300 L414 374 L446 370 Z',
    'M390 398 L402 300 L384 328 L404 230 L418 354 L428 326 Z',
  ]

  return (
    <div className="globe-stage" aria-hidden="true">
      <svg className="globe-svg" viewBox="0 0 800 800" role="img">
        <defs>
          <radialGradient id="planet" cx="36%" cy="30%" r="72%">
            <stop offset="0%" stopColor="#173b68" />
            <stop offset="46%" stopColor="#071a34" />
            <stop offset="100%" stopColor="#01050c" />
          </radialGradient>
          <radialGradient id="impact" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="24%" stopColor="#7ee8ff" stopOpacity="1" />
            <stop offset="62%" stopColor="#009dff" stopOpacity=".68" />
            <stop offset="100%" stopColor="#009dff" stopOpacity="0" />
          </radialGradient>
          <pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#58c8ff" opacity=".6" />
          </pattern>
          <filter id="blueGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
          <clipPath id="sphereClip">
            <circle cx="400" cy="400" r="292" />
          </clipPath>
        </defs>

        <circle cx="400" cy="400" r="335" fill="#007aff" opacity=".16" filter="url(#softGlow)" />
        <circle cx="400" cy="400" r="304" fill="url(#planet)" stroke="#22b7ff" strokeWidth="5" />
        <circle cx="400" cy="400" r="314" fill="none" stroke="#4ad7ff" strokeOpacity=".34" strokeWidth="2" />

        <g clipPath="url(#sphereClip)">
          <path className="continent" d="M255 188 L325 154 L385 174 L428 225 L402 270 L354 278 L332 330 L285 312 L238 260 Z" />
          <path className="continent continent-dots" d="M310 332 L384 310 L432 342 L455 405 L430 472 L395 535 L350 560 L322 505 L294 446 L280 390 Z" />
          <path className="continent" d="M424 176 L512 148 L620 182 L670 245 L640 300 L575 315 L538 365 L464 338 L435 276 Z" />
          <path className="continent continent-dots" d="M560 340 L642 328 L700 374 L688 438 L620 462 L568 420 Z" />
          <path className="continent" d="M165 250 L245 220 L275 270 L240 318 L188 300 Z" />
          <path className="continent continent-dots" d="M190 340 L245 350 L260 430 L224 496 L176 455 L158 392 Z" />
          <path className="continent" d="M625 520 L682 532 L704 580 L660 610 L610 585 Z" />

          {arcs.map((path) => (
            <path key={path} d={path} className="network-line" />
          ))}

          {Array.from({ length: 72 }).map((_, index) => {
            const angle = (index / 72) * Math.PI * 2
            const radius = 105 + ((index * 37) % 165)
            const x = 400 + Math.cos(angle) * radius
            const y = 400 + Math.sin(angle) * radius * 0.86
            return <circle key={index} cx={x} cy={y} r={index % 5 === 0 ? 2.4 : 1.2} fill="#73d9ff" opacity={index % 4 === 0 ? .95 : .48} />
          })}
        </g>

        <g key={pulse} className="electric-burst" filter="url(#blueGlow)">
          {bolts.map((path) => <path key={path} d={path} className="bolt" />)}
          <circle cx="390" cy="398" r="92" fill="url(#impact)" opacity=".9" />
          <circle cx="390" cy="398" r="12" fill="#ffffff" />
        </g>
      </svg>
    </div>
  )
}

export default function Home() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [query, setQuery] = useState('')
  const [locationIndex, setLocationIndex] = useState(0)
  const [category, setCategory] = useState(CATEGORIES[0])
  const [suggestionsOpen, setSuggestionsOpen] = useState(true)
  const [activeSuggestion, setActiveSuggestion] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<SearchResponse | null>(null)
  const [pulse, setPulse] = useState(0)
  const abortRef = useRef<AbortController | null>(null)
  const heroRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const stored = window.localStorage.getItem('intelora-theme') as Theme | null
    const systemTheme: Theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    setTheme(stored || systemTheme)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('intelora-theme', theme)
  }, [theme])

  const suggestions = useMemo(() => {
    const normalized = query.toLowerCase().trim()
    if (!normalized) return SUGGESTION_LIBRARY.slice(0, 3)
    const matched = SUGGESTION_LIBRARY.filter((item) => item.toLowerCase().includes(normalized))
    const inferred = [
      `${query} with verified contacts`,
      `${query} showing recent growth signals`,
      `${query} hidden from ordinary search`,
    ]
    return [...matched, ...inferred].filter((item, index, all) => all.indexOf(item) === index).slice(0, 5)
  }, [query])

  useEffect(() => {
    setActiveSuggestion(0)
  }, [query])

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 14
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 12
    event.currentTarget.style.setProperty('--pointer-x', `${x}px`)
    event.currentTarget.style.setProperty('--pointer-y', `${y}px`)
  }

  const resetPointer = (event: React.PointerEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty('--pointer-x', '0px')
    event.currentTarget.style.setProperty('--pointer-y', '0px')
  }

  const runSearch = async (value?: string) => {
    const finalQuery = (value || query).trim()
    if (finalQuery.length < 2) {
      setError('Type at least two characters.')
      return
    }

    const selectedLocation = LOCATIONS[locationIndex]
    const categorySuffix = category === 'All Categories' ? '' : ` ${category.toLowerCase()}`
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setQuery(finalQuery)
    setSuggestionsOpen(false)
    setLoading(true)
    setError('')
    setResult(null)
    setPulse((current) => current + 1)

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          query: `${finalQuery}${categorySuffix}`.trim(),
          city: selectedLocation.city,
          state: selectedLocation.state,
          mode: 'quick',
          intelligence_mode: 'flash',
          limit: 40,
        }),
      })

      const data = await response.json() as SearchResponse
      if (!response.ok || !data.ok) throw new Error(data.error || 'Search failed')
      setResult(data)
      setPulse((current) => current + 1)
    } catch (searchError) {
      if ((searchError as Error).name !== 'AbortError') {
        setError((searchError as Error).message || 'Search failed. Try again.')
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void runSearch()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!suggestionsOpen || suggestions.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveSuggestion((current) => (current + 1) % suggestions.length)
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveSuggestion((current) => (current - 1 + suggestions.length) % suggestions.length)
    }
    if (event.key === 'Escape') setSuggestionsOpen(false)
    if (event.key === 'Enter' && suggestionsOpen) {
      event.preventDefault()
      void runSearch(suggestions[activeSuggestion])
    }
  }

  const topResults = result?.results?.slice(0, 6) || []

  return (
    <main className={`intelora-shell ${theme}`}>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="Intelora home">
          <span className="brand-orbit" />
          <span>INTELORA</span>
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link href="/dashboard">Product</Link>
          <Link href="/dashboard">Solutions</Link>
          <Link href="/memory">Resources</Link>
          <Link href="/dashboard">Pricing</Link>
        </nav>

        <div className="header-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <Moon size={17} />
            <span className={theme === 'light' ? 'toggle-thumb light' : 'toggle-thumb'}>
              <Sun size={17} />
            </span>
          </button>
          <Link href="/auth" className="sign-in">Sign in</Link>
          <Link href="/dashboard" className="primary-cta">Get Started Free</Link>
          <button type="button" className="mobile-menu-button" onClick={() => setMobileMenu(true)} aria-label="Open menu">
            <Menu />
          </button>
        </div>
      </header>

      {mobileMenu && (
        <div className="mobile-menu">
          <button type="button" onClick={() => setMobileMenu(false)} aria-label="Close menu"><X /></button>
          <Link href="/dashboard">Product</Link>
          <Link href="/dashboard">Solutions</Link>
          <Link href="/memory">Resources</Link>
          <Link href="/dashboard">Pricing</Link>
          <Link href="/auth">Sign in</Link>
        </div>
      )}

      <section
        ref={heroRef}
        className="hero"
        onPointerMove={handlePointerMove}
        onPointerLeave={resetPointer}
      >
        <div className="hero-copy">
          <h1>
            <span>Go Beyond Google.</span>
            <strong>Find What Others Can’t.</strong>
          </h1>
          <p>AI that understands. Answers that matter.</p>

          <form className="search-stack" onSubmit={handleSubmit}>
            <div className="search-field">
              <Search size={29} strokeWidth={2} />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setSuggestionsOpen(true)
                }}
                onFocus={() => setSuggestionsOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder="What are you looking for?"
                aria-label="Search"
                autoComplete="off"
              />
              <button type="submit" disabled={loading} aria-label="Run search">
                {loading ? <Loader2 className="spin" size={27} /> : <ArrowRight size={29} />}
              </button>
            </div>

            <div className="filter-row">
              <label>
                <MapPin size={22} />
                <select value={locationIndex} onChange={(event) => setLocationIndex(Number(event.target.value))} aria-label="Location">
                  {LOCATIONS.map((location, index) => <option key={location.label} value={index}>{location.label}</option>)}
                </select>
              </label>
              <label>
                <Grid2X2 size={22} />
                <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Category">
                  {CATEGORIES.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
            </div>

            {suggestionsOpen && (
              <div className="suggestions" role="listbox" aria-label="Search suggestions">
                {suggestions.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={suggestion}
                    type="button"
                    role="option"
                    aria-selected={activeSuggestion === index}
                    className={activeSuggestion === index ? 'active' : ''}
                    onMouseEnter={() => setActiveSuggestion(index)}
                    onClick={() => void runSearch(suggestion)}
                  >
                    <span className="suggestion-icon" />
                    <span>{suggestion}</span>
                    <ArrowRight size={21} />
                  </button>
                ))}
              </div>
            )}
          </form>

          {error && <p className="search-message error">{error}</p>}
          {result?.ok && <p className="search-message success">{result.total_results || topResults.length} results found in {result.duration_ms || 0}ms.</p>}
        </div>

        <button
          type="button"
          className="globe-button"
          onClick={() => setPulse((current) => current + 1)}
          aria-label="Activate globe intelligence pulse"
        >
          <ElectricGlobe pulse={pulse} />
        </button>
      </section>

      {result?.ok && topResults.length > 0 && (
        <section className="results-drawer" aria-live="polite">
          <div className="results-header">
            <div>
              <span>LIVE RESULTS</span>
              <h2>{result.total_results || topResults.length} matches</h2>
            </div>
            <button type="button" onClick={() => setResult(null)} aria-label="Close results"><X /></button>
          </div>
          <div className="results-grid">
            {topResults.map((lead) => (
              <article key={`${lead.company_name}-${lead.phone || lead.website || ''}`}>
                <h3>{lead.company_name}</h3>
                <p>{lead.city}{lead.state ? `, ${lead.state}` : ''}</p>
                <div>
                  {lead.phone && <a href={`tel:${lead.phone}`}>{lead.phone}</a>}
                  {lead.website && <a href={lead.website} target="_blank" rel="noreferrer">Website</a>}
                </div>
              </article>
            ))}
          </div>
          <Link href="/dashboard" className="view-all">Open full search workspace <ArrowRight size={18} /></Link>
        </section>
      )}
    </main>
  )
}
