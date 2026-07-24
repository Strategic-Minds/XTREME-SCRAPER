'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { Bell, Building2, CircleDollarSign, Contact, Download, Gauge, Landmark, LayoutDashboard, ListChecks, Search, Settings, ShieldCheck, Sparkles, UserRound, UsersRound, Wrench } from 'lucide-react'
import styles from './AppShell.module.css'

type Session = { authenticated?: boolean; user?: { email?: string; plan?: string } }

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/results', label: 'Results', icon: ListChecks },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/people', label: 'People', icon: UserRound },
  { href: '/contacts', label: 'Contacts', icon: Contact },
  { href: '/opportunities', label: 'Opportunities', icon: Sparkles },
  { href: '/markets', label: 'Markets', icon: Landmark },
  { href: '/signals', label: 'Signals', icon: Gauge },
  { href: '/saved', label: 'Saved', icon: UsersRound },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/exports', label: 'Exports', icon: Download },
  { href: '/contractor', label: 'Contractor Mode', icon: Wrench },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/billing', label: 'Billing', icon: CircleDollarSign },
  { href: '/admin', label: 'Admin', icon: ShieldCheck },
]

export default function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = usePathname()
  const [session, setSession] = useState<Session | null>(null)
  useEffect(() => { fetch('/api/session').then(response => response.json()).then(setSession).catch(() => setSession({ authenticated: false })) }, [])

  const nav = <>{links.map(item => { const Icon = item.icon; const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`)); return <Link key={item.href} href={item.href} className={`${styles.link} ${active ? styles.active : ''}`}><Icon size={16}/><span>{item.label}</span></Link> })}</>

  return <div className={styles.shell}>
    <aside className={styles.sidebar}>
      <Link href="/" className={styles.brand}><span className={styles.mark}>X</span><span>XPS INTELLIGENCE</span></Link>
      <nav className={styles.nav}><div className={styles.navLabel}>Workspace</div>{nav}</nav>
      <div className={styles.sideFooter}><div className={styles.preview}>{session?.authenticated ? 'AUTHENTICATED WORKSPACE' : 'PREVIEW MODE'}</div><div className={styles.session}>{session?.authenticated ? `${session.user?.email || 'Member'} · ${session.user?.plan || 'plan unknown'}` : 'JWT preview configuration is required before secure sign-in can complete.'}</div></div>
    </aside>
    <div className={styles.main}>
      <header className={styles.topbar}><div className={styles.topTitle}>{title}</div><div className={styles.topActions}><span className={styles.chip}>{session?.authenticated ? session.user?.plan || 'Member' : 'Read-only preview'}</span><Link className={styles.button} href="/search">New search</Link></div></header>
      <nav className={styles.mobileNav}>{nav}</nav>
      <div className={styles.content}>{children}</div>
    </div>
  </div>
}

export { styles as appShellStyles }
