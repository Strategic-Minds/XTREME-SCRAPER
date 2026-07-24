import PublicShell from '@/components/PublicShell'

const systems = [
  ['Intent-first search', 'Describe the business outcome. XPS converts it into entities, industries, titles, geography, source selection, and evidence requirements.'],
  ['Evidence and provenance', 'Every material conclusion can show its discovery source, contact fields, location, reputation data, verification state, and freshness.'],
  ['Opportunity scoring', 'Scores are explainable, versioned, and confidence-labeled. Missing evidence lowers confidence instead of creating false certainty.'],
  ['Next best action', 'Call, email, enrich, monitor, export, or research. Each action explains why it is appropriate.'],
  ['Ask XPS', 'A grounded copilot for explaining results, comparing companies, finding similar targets, and drafting evidence-based outreach.'],
  ['Signals and monitoring', 'Track hiring, expansion, leadership changes, new locations, projects, licenses, and other verifiable business events.'],
]

export default function ProductPage() {
  return <PublicShell><section className="xps-static-hero"><div className="xps-container"><div className="xps-eyebrow">Product</div><h1>From scattered pages to commercial intelligence.</h1><p className="xps-section-copy">XPS Intelligence transforms a business goal into source-backed entities, explainable priorities, and actions your team can execute.</p></div></section><section className="xps-container xps-static-grid">{systems.map(([title, copy], i) => <article className="xps-card" key={title}><div className="xps-card-number">{String(i + 1).padStart(2, '0')}</div><h3>{title}</h3><p>{copy}</p></article>)}</section></PublicShell>
}
