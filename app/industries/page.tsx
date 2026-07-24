import PublicShell from '@/components/PublicShell'

const industries = ['Construction and contracting','Local services','Manufacturing','Distribution','Professional services','Healthcare','Technology','Recruiting','Real estate','Logistics','Hospitality','Financial services']

export default function IndustriesPage() {
  return <PublicShell><section className="xps-static-hero"><div className="xps-container"><div className="xps-eyebrow">Industries</div><h1>Universal search. Industry-aware intelligence.</h1><p className="xps-section-copy">XPS Intelligence does not hard-code one trade into the core. It applies industry-specific language and workflows through controlled modes and templates.</p></div></section><section className="xps-container xps-static-grid">{industries.map((title, i) => <article className="xps-card" key={title}><div className="xps-card-number">{String(i + 1).padStart(2, '0')}</div><h3>{title}</h3><p>Find relevant companies, people, contacts, signals, markets, and opportunities with source-backed evidence.</p></article>)}</section></PublicShell>
}
