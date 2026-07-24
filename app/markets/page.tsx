import WorkspacePage from '@/components/WorkspacePage'

export default function MarketsPage() {
  return <WorkspacePage title="Markets" eyebrow="Evidence-backed market view" description="Build a structured picture of a region or industry without presenting a search result count as total market size." cards={[{title:'Coverage',copy:'Returned entities, contributing sources, query variations, and geographic boundaries.'},{title:'Competitive structure',copy:'Public ratings, categories, locations, and visible service positioning, clearly separated from inferred conclusions.'},{title:'Gaps to investigate',copy:'Missing data, contradictory records, low source coverage, and opportunities that require additional validation.'}]} emptyTitle="No market briefing selected" emptyCopy="Start a Market Mode search. The resulting briefing will state its source coverage and limitations instead of claiming a complete census." actionLabel="Research a market" />
}
