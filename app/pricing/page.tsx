'use client'

import PublicShell from '@/components/PublicShell'
import { useEffect, useState } from 'react'

type Plan = { key: string; name: string; tagline: string; price_monthly: number; searches_per_day: number; results_per_search: number; intelligence_modes: string[]; csv_export: boolean; crm_export: boolean; api_access: boolean; highlight: boolean }

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [error, setError] = useState('')
  useEffect(() => { fetch('/api/billing/plans').then(r => r.json()).then(data => setPlans(data.plans || [])).catch(() => setError('Pricing is temporarily unavailable.')) }, [])
  return <PublicShell><section className="xps-static-hero"><div className="xps-container"><div className="xps-eyebrow">Pricing</div><h1>Start with intelligence. Expand when value is proven.</h1><p className="xps-section-copy">Plan values below are loaded from the active billing configuration, not invented marketing cards.</p></div></section><section className="xps-container xps-static-grid">{error && <div className="xps-error">{error}</div>}{plans.map(plan => <article className="xps-card" key={plan.key} style={plan.highlight ? { borderColor: 'var(--xps-gold)' } : undefined}><div className="xps-card-number">{plan.highlight ? 'MOST POPULAR' : plan.key.toUpperCase()}</div><h3>{plan.name}</h3><p>{plan.tagline}</p><div className="xps-price">${plan.price_monthly}<span style={{ fontSize: 14, color: 'var(--xps-muted)' }}>/mo</span></div><ul className="xps-list"><li>{plan.searches_per_day === -1 ? 'Unlimited' : plan.searches_per_day} searches per day</li><li>Up to {plan.results_per_search} results per search</li><li>{plan.intelligence_modes.join(', ')} intelligence</li><li>{plan.csv_export ? 'CSV export included' : 'CSV export not included'}</li><li>{plan.crm_export ? 'CRM export included' : 'CRM export not included'}</li></ul></article>)}</section></PublicShell>
}
