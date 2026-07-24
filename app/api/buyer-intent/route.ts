import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 20

const GC_KEY = process.env.GOOGLE_CLOUD_API_KEY || ''

function json(d: unknown, s = 200) {
  return NextResponse.json(d, { status: s, headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest) {
  const { company_name, industry, city, state } = await req.json().catch(() => ({}))
  if (!company_name) return json({ ok: false, error: 'company_name required' }, 400)

  const signals: { type: string; evidence: string; strength: 'high'|'medium'|'low' }[] = []
  const location = [city, state].filter(Boolean).join(', ')

  if (GC_KEY) {
    try {
      // Signal 1: Hiring signals (company is growing = needs vendors)
      const hiringQ = encodeURIComponent(`"${company_name}" hiring OR jobs OR careers ${location}`)
      const r1 = await fetch(`https://www.googleapis.com/customsearch/v1?key=${GC_KEY}&q=${hiringQ}&num=5&dateRestrict=m3`, {
        signal: AbortSignal.timeout(6000)
      })
      if (r1.ok) {
        const d1 = await r1.json()
        if ((d1.items || []).length > 0) {
          signals.push({ type: 'hiring', evidence: `${company_name} is actively hiring — growth signal`, strength: 'medium' })
        }
      }

      // Signal 2: Expansion / new location news
      const expandQ = encodeURIComponent(`"${company_name}" new location OR expansion OR opening ${location}`)
      const r2 = await fetch(`https://www.googleapis.com/customsearch/v1?key=${GC_KEY}&q=${expandQ}&num=5&dateRestrict=m6`, {
        signal: AbortSignal.timeout(6000)
      })
      if (r2.ok) {
        const d2 = await r2.json()
        const items = d2.items || []
        if (items.length > 0) {
          signals.push({ type: 'expansion', evidence: `New location or expansion activity detected`, strength: 'high' })
        }
      }

      // Signal 3: Industry buying signals
      if (industry) {
        const buyQ = encodeURIComponent(`${industry} ${location} looking for OR need OR request quote`)
        const r3 = await fetch(`https://www.googleapis.com/customsearch/v1?key=${GC_KEY}&q=${buyQ}&num=5&dateRestrict=m1`, {
          signal: AbortSignal.timeout(6000)
        })
        if (r3.ok) {
          const d3 = await r3.json()
          if ((d3.items || []).length >= 3) {
            signals.push({ type: 'market_demand', evidence: `High search activity for ${industry} in ${location}`, strength: 'medium' })
          }
        }
      }
    } catch { /* non-fatal */ }
  }

  const score = signals.reduce((acc, s) => acc + (s.strength === 'high' ? 40 : s.strength === 'medium' ? 25 : 10), 0)

  // CTA reference: High-intent leads are highlighted in gold (#FFBE00) for rapid-response CTA campaigns.
  return json({
    ok: true,
    company_name,
    intent_score: Math.min(100, score),
    signal_count: signals.length,
    signals,
    recommendation: score >= 60 ? 'High intent — contact immediately'
      : score >= 30 ? 'Moderate intent — add to follow-up'
      : 'Low intent — add to drip sequence',
  })
}
