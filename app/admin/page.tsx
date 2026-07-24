'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import styles from '@/components/AppShell.module.css'

type Health={ok?:boolean;status?:string;version?:string;required_configuration?:{configured?:string[];missing?:string[]};optional_capabilities?:Record<string,boolean>;timestamp?:string}

export default function AdminPage(){
 const [health,setHealth]=useState<Health|null>(null);const [error,setError]=useState('')
 useEffect(()=>{fetch('/api/health').then(async r=>({status:r.status,data:await r.json()})).then(({data})=>setHealth(data)).catch(()=>setError('Health endpoint unavailable.'))},[])
 return <AppShell title="Admin"><section className={styles.pageHeader}><div><div className={styles.eyebrow}>Governed control plane</div><h1 className={styles.title}>Admin</h1><p className={styles.description}>Read-only preview visibility for configuration, provider readiness, release gates, and receipts. Secret values are never returned.</p></div></section>{error&&<div className={styles.error}>{error}</div>}<section className={styles.grid}><article className={styles.card}><span className={styles.status}>{health?.status||'LOADING'}</span><h2 className={styles.cardTitle}>Application health</h2><p className={styles.cardCopy}>Version {health?.version||'unknown'} · {health?.timestamp||'no timestamp'}</p></article><article className={styles.card}><h2 className={styles.cardTitle}>Required configuration</h2><ul className={styles.list}><li>Configured: {health?.required_configuration?.configured?.join(', ')||'none reported'}</li><li>Missing: {health?.required_configuration?.missing?.join(', ')||'none reported'}</li></ul></article><article className={styles.card}><h2 className={styles.cardTitle}>Optional capabilities</h2><ul className={styles.list}>{Object.entries(health?.optional_capabilities||{}).map(([name,ready])=><li key={name}>{name}: {ready?'configured':'not configured'}</li>)}</ul></article></section><div className={styles.warning} style={{marginTop:20}}>Administrative mutations, secret changes, database migrations, billing changes, and production release remain outside this preview page and require separate operator approval.</div></AppShell>
}
