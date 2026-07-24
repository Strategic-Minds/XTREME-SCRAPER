import Link from 'next/link'
import type { ReactNode } from 'react'

export function Brand() {
  return (
    <Link href="/" className="xps-brand" aria-label="XPS Intelligence home">
      <span className="xps-brand-mark"><span className="xps-brand-x">X</span></span>
      <span>XPS INTELLIGENCE</span>
    </Link>
  )
}

export default function PublicShell({ children }: { children: ReactNode }) {
  return (
    <main className="xps-shell">
      <header className="xps-header">
        <div className="xps-container xps-nav">
          <Brand />
          <nav className="xps-nav-links" aria-label="Primary navigation">
            <Link href="/product">Product</Link>
            <Link href="/solutions">Solutions</Link>
            <Link href="/industries">Industries</Link>
            <Link href="/pricing">Pricing</Link>
          </nav>
          <div className="xps-actions">
            <Link className="xps-button" href="/login">Sign in</Link>
            <Link className="xps-button primary" href="/signup">Start free</Link>
          </div>
        </div>
      </header>
      {children}
      <footer className="xps-footer">
        <div className="xps-container xps-footer-row">
          <Brand />
          <span>© 2026 Strategic Minds. Evidence before claims.</span>
        </div>
      </footer>
    </main>
  )
}
