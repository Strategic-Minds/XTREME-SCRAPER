'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(event: FormEvent) { event.preventDefault(); setLoading(true); const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }).catch(() => null); if (!response) setStatus('Account setup could not be started.'); else { const data = await response.json(); setStatus(response.ok ? 'Check your email to activate your secure trial account.' : data.error || 'Account setup could not be started.') } setLoading(false) }
  return <main className="xps-shell"><div className="xps-container" style={{ minHeight: '100svh', display: 'grid', placeItems: 'center', padding: '40px 0' }}><section className="xps-card" style={{ width: 'min(560px, 100%)' }}><Link href="/" className="xps-brand"><span className="xps-brand-mark"><span className="xps-brand-x">X</span></span><span>XPS INTELLIGENCE</span></Link><div className="xps-eyebrow" style={{ marginTop: 36 }}>Start with evidence</div><h1 style={{ fontSize: 42, letterSpacing: '-.04em', margin: '12px 0' }}>Run your first intelligence mission.</h1><p className="xps-section-copy" style={{ fontSize: 16 }}>Create a trial account with a secure email link. No password is stored.</p><form onSubmit={submit} style={{ display: 'grid', gap: 12, marginTop: 24 }}><input className="xps-input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com"/><button className="xps-button primary" disabled={loading}>{loading ? 'Creating…' : 'Start free trial'}</button></form>{status && <div className="xps-search-note" style={{ marginTop: 14 }}>{status}</div>}<p className="xps-search-note">Already have access? <Link href="/login" style={{ color: 'var(--xps-gold)', fontWeight: 800 }}>Sign in</Link></p></section></div></main>
}
