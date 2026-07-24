import WorkspacePage from '@/components/WorkspacePage'

export default function ContactsPage() {
  return <WorkspacePage title="Verified Contacts" eyebrow="Contactability" description="Review the business contact fields returned by approved providers. A returned field is evidence that a source supplied it, not a guarantee that it remains current." cards={[{title:'Phone fields',copy:'Normalized business numbers with source, retrieval time, and verification status.'},{title:'Email fields',copy:'Business email addresses with provider provenance and re-verification requirements.'},{title:'Web and social',copy:'Official websites and public professional profiles kept separate from direct contact fields.'}]} emptyTitle="No verified contact set" emptyCopy="Run a search and open a source-backed result. AI-generated contact values are quarantined and never exported as verified contacts." />
}
