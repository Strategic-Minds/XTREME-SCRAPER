import PublicShell from '@/components/PublicShell'

const solutions = [
  ['Contractors', 'Find property managers, developers, general contractors, commercial buyers, and local project opportunities. Connect discovery to response, estimates, reviews, and follow-up.'],
  ['Sales teams', 'Build target lists, locate decision-makers, prioritize source-backed records, and export qualified opportunities.'],
  ['Recruiters', 'Find employers, professionals, role changes, hiring signals, and market movement without losing the evidence trail.'],
  ['Agencies', 'Identify companies with weak digital presence, expansion signals, contactable owners, and clear service-fit hypotheses.'],
  ['Manufacturers and distributors', 'Map territories, locate resellers and contractors, monitor market coverage, and identify partnership targets.'],
  ['Researchers and operators', 'Build structured market pictures using multiple sources, confidence labels, and explicit uncertainty.'],
]

export default function SolutionsPage() {
  return <PublicShell><section className="xps-static-hero"><div className="xps-container"><div className="xps-eyebrow">Solutions</div><h1>Intelligence for people who need to make a move.</h1><p className="xps-section-copy">The universal core adapts to the job, while vertical modes provide the language, scoring presets, and workflow integrations each industry needs.</p></div></section><section className="xps-container xps-static-grid">{solutions.map(([title, copy], i) => <article className="xps-card" key={title}><div className="xps-card-number">MODE {i + 1}</div><h3>{title}</h3><p>{copy}</p></article>)}</section></PublicShell>
}
