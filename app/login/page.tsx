'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setStatus('')
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const data = await response.json()
      setStatus(response.ok ? 'Check your email for a secure sign-in link.' : (data.error || 'Sign-in could not be started.'))
    } catch { setStatus('Sign-in could not be started.') } finally { setLoading(false) }
  }

  return <main className="xps-shell"><div className="xps-container" style={{ minHeight: '100svh', display: 'grid', placeItems: 'center', padding: '40px 0' }}><section className="xps-card" style={{ width: 'min(520px, 100%)' }}><Link href="/" className="xps-brand"><span className="xps-brand-mark"><span className="xps-brand-x">X</span></span><span>XPS INTELLIGENCE</span></Link><div className="xps-eyebrow" style={{ marginTop: 36 }}>Secure magic-link access</div><h1 style={{ fontSize: 42, letterSpacing: '-.04em', margin: '12px 0' }}>Welcome back.</h1><p className="xps-section-copy" style={{ fontSize: 16 }}>Enter your email. We will send a one-time link that expires in 15 minutes.</p><form onSubmit={submit} style={{ display: 'grid', gap: 12, marginTop: 24 }}><input className="xps-input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com"/><button className="xps-button primary" disabled={loading}>{loading ? 'Sending…' : 'Send secure link'}</button></form>{status && <div className="xps-search-note" style={{ marginTop: 14 }}>{status}</div>}<p className="xps-search-note">New to XPS Intelligence? <Link href="/signup" style={{ color: 'var(--xps-gold)', fontWeight: 800 }}>Start free</Link></p></section></div></main>
}
