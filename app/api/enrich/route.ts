import { NextRequest, NextResponse } from 'next/server'
import { enrichBusiness, EnrichedBusiness } from '@/lib/enrichment-engine'

export const dynamic     = 'force-dynamic'
export const maxDuration = 60

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Single business enrichment
    if (body.company_name) {
      const result = await enrichBusiness(body.company_name, {
        city:    body.city,
        state:   body.state,
        phone:   body.phone,
        website: body.website,
        layers:  body.layers,
      })
      return json({ ok: true, result })
    }

    // Batch enrichment — top N leads from a search
    if (Array.isArray(body.leads)) {
      const topN  = Math.min(body.top_n || 5, 10)  // cap at 10 to manage API quota
      const batch = body.leads.slice(0, topN)
      const results = await Promise.allSettled(
        batch.map((lead: { company_name: string; city?: string; state?: string; phone?: string; website?: string }) =>
          enrichBusiness(lead.company_name, {
            city:    lead.city,
            state:   lead.state,
            phone:   lead.phone,
            website: lead.website,
            layers:  body.layers,
          })
        )
      )
      const enriched: EnrichedBusiness[] = results
        .filter((r): r is PromiseFulfilledResult<EnrichedBusiness> => r.status === 'fulfilled')
        .map(r => r.value)
      return json({ ok: true, enriched, count: enriched.length })
    }

    return json({ ok: false, error: 'Provide company_name or leads array' }, 400)
  } catch (e) {
    console.error('[enrich]', e)
    return json({ ok: false, error: 'Enrichment failed' }, 500)
  }
}
