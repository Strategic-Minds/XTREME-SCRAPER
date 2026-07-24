'use client'
import Link from 'next/link'

export default function BidLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      {/* Header bar */}
      <div style={{
        borderBottom: '1px solid #E5E7EB',
        padding: '16px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <Link href="/dashboard" style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none', fontWeight: 600 }}>
          ← Dashboard
        </Link>
        <span style={{ fontSize: 20, fontWeight: 900, color: '#111', letterSpacing: '-0.5px' }}>
          BidGenius
        </span>
        <span style={{
          background: '#FFBE00',
          color: '#111',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '1px',
          padding: '4px 12px',
          borderRadius: 20,
          textTransform: 'uppercase' as const
        }}>
          AI Bid System
        </span>
      </div>
      {/* Content */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>
        {children}
      </div>
    </div>
  )
}
