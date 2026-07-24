'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DEFAULT_CONFIG = {
  labor_rate: 65,
  material_markup_pct: 25,
  overhead_pct: 15,
  margin_pct: 20,
  tax_rate: 0
}

export default function BidPage() {
  const router = useRouter()
  const [emailText, setEmailText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!emailText || emailText.trim().length < 20) {
      setError('Please paste a client email with at least 20 characters.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/bid/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_text: emailText.trim(), config: DEFAULT_CONFIG })
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `Server error ${res.status}`)
      }
      sessionStorage.setItem('bid_result', JSON.stringify(data))
      router.push('/bid/review')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          display: 'inline-block',
          background: '#FFBE00',
          color: '#111',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '2px',
          padding: '4px 14px',
          borderRadius: 20,
          textTransform: 'uppercase',
          marginBottom: 16
        }}>
          AI-Powered · 60 Seconds
        </div>
        <h1 style={{ fontSize: 42, fontWeight: 900, color: '#111', letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 12 }}>
          Turn Any Bid Request<br />Into a Finished Proposal
        </h1>
        <p style={{ fontSize: 16, color: '#6B7280', maxWidth: 520, margin: '0 auto' }}>
          Paste the client&apos;s email. Our AI reads it, builds the takeoff, prices the job,
          and generates a fully branded proposal — ready to send in under a minute.
        </p>
      </div>

      {/* Upload card */}
      <div style={{
        background: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: 16,
        padding: '40px 40px 32px',
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)'
      }}>
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#6B7280', marginBottom: 10 }}>
            Paste Client Email Here
          </label>
          <textarea
            value={emailText}
            onChange={e => setEmailText(e.target.value)}
            disabled={loading}
            placeholder={`Paste the full email from your client here...\n\nExample:\n"Hi, we need epoxy flooring done in our 3-car garage (approx 900 sqft) in Phoenix, AZ. Looking to get this done by end of month. Budget around $3,500. Please send a quote. — Mike Johnson, mike@example.com"`}
            style={{
              width: '100%',
              minHeight: 200,
              border: '2px solid #E5E7EB',
              borderRadius: 10,
              padding: '16px 18px',
              fontSize: 14,
              fontFamily: 'inherit',
              color: '#111',
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 0.15s',
              background: loading ? '#F9FAFB' : '#fff'
            }}
            onFocus={e => { e.target.style.borderColor = '#FFBE00' }}
            onBlur={e => { e.target.style.borderColor = '#E5E7EB' }}
          />

          {/* Error */}
          {error && (
            <div style={{
              marginTop: 12,
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              color: '#DC2626',
              fontWeight: 500
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Submit */}
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? '#D1D5DB' : '#FFBE00',
                color: '#111',
                border: 'none',
                borderRadius: 10,
                padding: '14px 32px',
                fontSize: 15,
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                letterSpacing: '-0.3px'
              }}
            >
              {loading ? 'Analyzing email...' : 'Generate Proposal →'}
            </button>
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>
              {loading
                ? '🔍 Reading email · building takeoff · pricing job · generating proposal...'
                : 'Powered by XTREME AI — average 45 seconds'}
            </span>
          </div>
        </form>
      </div>

      {/* How it works */}
      <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
        {[
          { step: '1', title: 'Paste Email', desc: 'Drop in the raw client email exactly as received.' },
          { step: '2', title: 'AI Forensics', desc: 'We extract client, address, scope, sqft, materials, and urgency.' },
          { step: '3', title: 'Auto Takeoff', desc: 'Trade matrix calculates labor hours, materials, and equipment.' },
          { step: '4', title: 'Proposal Ready', desc: 'Branded PDF with your logo, line items, and pricing — done.' },
        ].map(card => (
          <div key={card.step} style={{ padding: '20px 22px', border: '1px solid #F3F4F6', borderRadius: 12, background: '#FAFAFA' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: '#FFBE00',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 14, color: '#111', marginBottom: 10
            }}>{card.step}</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#111', marginBottom: 4 }}>{card.title}</div>
            <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>{card.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
