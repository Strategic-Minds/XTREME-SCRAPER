import { NextResponse } from 'next/server'
import { PLANS } from '@/lib/stripe'
export const dynamic = 'force-dynamic'
export async function GET() {
  const plans = Object.entries(PLANS).map(([key, p]) => ({
    key,
    name: p.name,
    tagline: p.tagline,
    price_monthly: p.price_monthly,
    price_annual: p.price_annual,
    searches_per_day: p.searches_per_day,
    results_per_search: p.results_per_search,
    enrichments_per_day: p.enrichments_per_day,
    person_searches_per_day: p.person_searches_per_day,
    intelligence_modes: p.intelligence_modes,
    csv_export: p.csv_export,
    crm_export: p.crm_export,
    api_access: p.api_access,
    highlight: p.highlight,
    cta: p.cta,
  }))
  return NextResponse.json({ ok: true, plans })
}
