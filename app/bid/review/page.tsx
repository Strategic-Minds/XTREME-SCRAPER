'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type LineItem = {
  category: 'material' | 'labor' | 'equipment' | 'misc'
  description: string
  quantity: number
  unit: string
  unit_cost: number
  total: number
}

type BidResult = {
  proposal_number: string
  duration_ms: number
  job: {
    client_name: string
    client_email: string
    client_phone: string
    client_company: string
    job_address: string
    job_city: string
    job_state: string
    job_type: string
    job_description: string
    sqft_mentioned: number | null
    timeline_mentioned: string
    urgency_level: 'low' | 'medium' | 'high' | 'emergency'
    ai_confidence: number
    materials_mentioned: string[]
  }
  takeoff: {
    sqft: number
    sqft_source: 'stated' | 'estimated'
    labor_hours: number
    material_cost: number
    subtotal: number
    line_items: LineItem[]
  }
  pricing: {
    subtotal: number
    overhead_amount: number
    overhead_pct: number
    margin_amount: number
    margin_pct: number
    pretax_total: number
    tax_rate: number
    tax_amount: number
    total: number
    price_per_sqft: number
  }
  html: string
}

const JOB_TYPE_LABELS: Record<string, string> = {
  epoxy: 'Epoxy Floor Coating',
  polished_concrete: 'Polished Concrete',
  painting: 'Interior / Exterior Painting',
  roofing: 'Roofing',
  flooring: 'Flooring Installation',
  hvac: 'HVAC Services',
  general_contractor: 'General Construction',
  other: 'General Services'
}

const URGENCY_CONFIG = {
  emergency: { label: 'Emergency', bg: '#FEE2E2', color: '#DC2626' },
  high: { label: 'High', bg: '#FEF3C7', color: '#D97706' },
  medium: { label: 'Medium', bg: '#FEF9C3', color: '#CA8A04' },
  low: { label: 'Low', bg: '#DCFCE7', color: '#16A34A' }
}

const CATEGORY_CONFIG = {
  material: { label: 'Material', bg: '#DBEAFE', color: '#1D4ED8' },
  labor: { label: 'Labor', bg: '#F3F4F6', color: '#374151' },
  equipment: { label: 'Equipment', bg: '#FEF3C7', color: '#D97706' },
  misc: { label: 'Misc', bg: '#EDE9FE', color: '#7C3AED' }
}

function currency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export default function BidReviewPage() {
  const router = useRouter()
  const [result, setResult] = useState<BidResult | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [sendTo, setSendTo] = useState('')
  const [sendSubject, setSendSubject] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendSuccess, setSendSuccess] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('bid_result')
    if (!raw) { router.push('/bid'); return }
    try {
      const parsed = JSON.parse(raw) as BidResult
      setResult(parsed)
      setSendTo(parsed.job.client_email || '')
      setSendSubject(`Your Project Proposal #${parsed.proposal_number}`)
    } catch { router.push('/bid') }
  }, [router])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  function handleDownload() {
    if (!result) return
    const blob = new Blob([result.html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank')
    if (win) win.focus()
  }

  async function handleSend() {
    if (!result || !sendTo) return
    setSending(true)
    setSendError(null)
    try {
      const res = await fetch(`/api/bid/${result.proposal_number}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: sendTo, subject: sendSubject, html: result.html })
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Send failed')
      setSendSuccess(sendTo)
      setShowModal(false)
      showToast(`✅ Proposal sent to ${sendTo}`)
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setSending(false)
    }
  }

  function handleStartOver() {
    sessionStorage.removeItem('bid_result')
    router.push('/bid')
  }

  if (!result) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: '#6B7280' }}>Loading...</div>
  )

  const { job, takeoff, pricing } = result
  const urgency = URGENCY_CONFIG[job.urgency_level] || URGENCY_CONFIG.low

  return (
    <div style={{ position: 'relative' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 100,
          background: '#111', color: '#fff', padding: '12px 20px',
          borderRadius: 10, fontSize: 14, fontWeight: 600,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>{toast}</div>
      )}

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#FFBE00', marginBottom: 4 }}>Proposal Ready</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111', letterSpacing: '-0.5px' }}>#{result.proposal_number}</h1>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>Generated in {(result.duration_ms / 1000).toFixed(1)}s</div>
        </div>
        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
          <button onClick={handleStartOver} style={{ padding: '10px 18px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            ← Start Over
          </button>
          <button onClick={handleDownload} style={{ padding: '10px 18px', border: '1px solid #111', borderRadius: 8, background: '#fff', color: '#111', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Download PDF
          </button>
          <button onClick={() => setShowModal(true)} style={{ padding: '10px 24px', background: '#FFBE00', border: 'none', borderRadius: 8, color: '#111', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
            Send to Client →
          </button>
        </div>
      </div>

      {/* BLOCK A — Job Summary */}
      <div style={{ border: '1px solid #E5E7EB', borderRadius: 14, padding: '28px 28px 24px', marginBottom: 24, background: '#fff' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#FFBE00', marginBottom: 16 }}>Job Summary</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px 32px' }}>
          {[
            { label: 'Client', value: job.client_name || '—' },
            { label: 'Email', value: job.client_email || '—' },
            { label: 'Phone', value: job.client_phone || '—' },
            { label: 'Company', value: job.client_company || '—' },
            { label: 'Address', value: `${job.job_address}, ${job.job_city}, ${job.job_state}` },
            { label: 'Job Type', value: JOB_TYPE_LABELS[job.job_type] || job.job_type },
            { label: 'Timeline', value: job.timeline_mentioned || 'Not specified' },
          ].map(f => (
            <div key={f.label}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 2 }}>{f.label}</div>
              <div style={{ fontSize: 14, color: '#111', fontWeight: 500 }}>{f.value}</div>
            </div>
          ))}
        </div>

        {/* Badges row */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' as const, alignItems: 'center' }}>
          {/* Urgency */}
          <span style={{ background: urgency.bg, color: urgency.color, fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>
            {urgency.label} Priority
          </span>
          {/* Sqft */}
          <span style={{ background: '#F3F4F6', color: '#374151', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20 }}>
            {takeoff.sqft.toLocaleString()} sqft · {takeoff.sqft_source === 'stated' ? 'Client stated' : 'AI estimated'}
          </span>
          {/* AI confidence */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>AI Confidence</span>
            <div style={{ width: 80, height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${job.ai_confidence}%`, height: '100%', background: job.ai_confidence >= 70 ? '#16A34A' : job.ai_confidence >= 40 ? '#D97706' : '#DC2626', borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>{job.ai_confidence}%</span>
          </div>
        </div>
      </div>

      {/* BLOCK B — Line Items */}
      <div style={{ border: '1px solid #E5E7EB', borderRadius: 14, marginBottom: 24, overflow: 'hidden' }}>
        <div style={{ padding: '18px 28px', borderBottom: '1px solid #F3F4F6', background: '#fff' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#FFBE00' }}>Itemized Takeoff</span>
          <span style={{ marginLeft: 12, fontSize: 12, color: '#9CA3AF' }}>{takeoff.line_items.length} line items · {takeoff.labor_hours.toFixed(1)} labor hours</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#111' }}>
              {['Type', 'Description', 'Qty', 'Unit Price', 'Total'].map((h, i) => (
                <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#fff', textAlign: i > 1 ? 'right' : 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {takeoff.line_items.map((item, idx) => {
              const cat = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.misc
              return (
                <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ background: cat.bg, color: cat.color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12, whiteSpace: 'nowrap' as const }}>
                      {cat.label}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: '#111' }}>{item.description}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: '#555', textAlign: 'right' }}>{item.quantity} {item.unit}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: '#555', textAlign: 'right' }}>{currency(item.unit_cost)}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, color: '#111', textAlign: 'right' }}>{currency(item.total)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* BLOCK C — Pricing Summary */}
      <div style={{ border: '1px solid #E5E7EB', borderRadius: 14, padding: '28px', marginBottom: 32, background: '#fff' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#FFBE00', marginBottom: 20 }}>Pricing Summary</div>
        <div style={{ maxWidth: 360, marginLeft: 'auto' }}>
          {[
            { label: 'Subtotal', val: pricing.subtotal, bold: false },
            { label: `Overhead (${pricing.overhead_pct}%)`, val: pricing.overhead_amount, bold: false },
            { label: `Margin (${pricing.margin_pct}%)`, val: pricing.margin_amount, bold: false },
            { label: `Tax (${pricing.tax_rate}%)`, val: pricing.tax_amount, bold: false },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6', fontSize: 14, color: '#555' }}>
              <span>{row.label}</span>
              <span>{currency(row.val)}</span>
            </div>
          ))}
          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFBE00', borderRadius: 10, padding: '14px 18px', marginTop: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#111' }}>TOTAL</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#111' }}>{currency(pricing.total)}</span>
          </div>
          <div style={{ textAlign: 'right', fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>
            {currency(pricing.price_per_sqft)}/sqft · {takeoff.sqft.toLocaleString()} sqft
          </div>
        </div>
      </div>

      {/* Send Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 36, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#111', marginBottom: 6 }}>Send Proposal</h2>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>Review the details below then hit send.</p>

            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#6B7280', marginBottom: 6 }}>To</label>
            <input
              value={sendTo}
              onChange={e => setSendTo(e.target.value)}
              style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '10px 14px', fontSize: 14, marginBottom: 16, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />

            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#6B7280', marginBottom: 6 }}>Subject</label>
            <input
              value={sendSubject}
              onChange={e => setSendSubject(e.target.value)}
              style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '10px 14px', fontSize: 14, marginBottom: 20, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />

            {sendError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626', marginBottom: 16 }}>
                ⚠ {sendError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowModal(false); setSendError(null) }} style={{ flex: 1, padding: '12px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSend} disabled={sending} style={{ flex: 2, padding: '12px', background: sending ? '#D1D5DB' : '#FFBE00', border: 'none', borderRadius: 8, color: '#111', fontSize: 14, fontWeight: 800, cursor: sending ? 'not-allowed' : 'pointer' }}>
                {sending ? 'Sending...' : 'Send Proposal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
