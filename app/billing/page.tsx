'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import styles from '@/components/AppShell.module.css'

type Plan = { key:string; name:string; tagline:string; price_monthly:number; searches_per_day:number; results_per_search:number; highlight:boolean }

export default function BillingPage() {
  const [plans,setPlans]=useState<Plan[]>([])
  const [session,setSession]=useState<any>(null)
  const [error,setError]=useState('')
  useEffect(()=>{Promise.all([fetch('/api/billing/plans').then(r=>r.json()),fetch('/api/session').then(r=>r.json())]).then(([p,s])=>{setPlans(p.plans||[]);setSession(s)}).catch(()=>setError('Billing configuration could not be loaded.'))},[])
  return <AppShell title="Billing"><section className={styles.pageHeader}><div><div className={styles.eyebrow}>Plans, usage, and portal</div><h1 className={styles.title}>Billing</h1><p className={styles.description}>Plan values are loaded from the active server configuration. No checkout or billing-portal action is executed without an authenticated user and an explicit click.</p></div></section>{error&&<div className={styles.error}>{error}</div>}<div className={styles.warning}>{session?.authenticated?`Signed in on the ${session.user?.plan||'unknown'} plan.`:'Preview authentication is incomplete. Checkout and portal actions remain unavailable.'}</div><section className={styles.grid} style={{marginTop:20}}>{plans.map(plan=><article className={styles.card} key={plan.key}><span className={styles.status}>{plan.highlight?'MOST POPULAR':plan.key.toUpperCase()}</span><h2 className={styles.cardTitle}>{plan.name}</h2><p className={styles.cardCopy}>{plan.tagline}</p><div style={{fontSize:38,fontWeight:900,margin:'18px 0'}}>${plan.price_monthly}<span style={{fontSize:13,color:'#777'}}>/mo</span></div><ul className={styles.list}><li>{plan.searches_per_day===-1?'Unlimited':plan.searches_per_day} searches per day</li><li>Up to {plan.results_per_search} results per search</li></ul><button className={styles.button} disabled={!session?.authenticated} title={session?.authenticated?'Checkout requires explicit confirmation':'Sign in after preview JWT configuration'}>{session?.authenticated?'Select plan':'Authentication required'}</button></article>)}</section></AppShell>
}
