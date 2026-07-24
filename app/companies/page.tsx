import WorkspacePage from '@/components/WorkspacePage'

export default function CompaniesPage() {
  return <WorkspacePage title="Companies" eyebrow="Entity workspace" description="Review source-backed organizations discovered through XPS Intelligence. Company records will remain separate from people, contacts, evidence, and opportunity scores." cards={[{title:'Canonical identity',copy:'Company name, location, category, website, source identifiers, and entity-match confidence.'},{title:'Evidence graph',copy:'Claims remain linked to the URL, retrieval time, source adapter, and verification state that produced them.'},{title:'Commercial context',copy:'Signals and opportunity scores appear only when supporting evidence exists.'}]} emptyTitle="No company collection selected" emptyCopy="Run an intelligence search to populate this workspace with source-backed company records. Preview searches remain non-persistent until authentication and RLS are approved." />
}
