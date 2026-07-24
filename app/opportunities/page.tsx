import WorkspacePage from '@/components/WorkspacePage'

export default function OpportunitiesPage() {
  return <WorkspacePage title="Opportunities" eyebrow="Explainable prioritization" description="Opportunity scores organize available evidence. They do not guarantee purchase intent, revenue, responsiveness, or commercial success." cards={[{title:'Fit and contactability',copy:'Industry fit, geography, contact fields, and the completeness of the source-backed record.'},{title:'Signals and freshness',copy:'Dated hiring, expansion, project, leadership, licensing, or market events when those signals are actually present.'},{title:'Next best action',copy:'Call, email, enrich, monitor, research, or disqualify, with a reason and uncertainty statement.'}]} emptyTitle="No scored opportunities yet" emptyCopy="Run a search to calculate transparent scores from returned evidence. Outcome tracking is required before any score can be called predictive." actionLabel="Find opportunities" />
}
