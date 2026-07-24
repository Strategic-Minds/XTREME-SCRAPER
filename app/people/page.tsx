import WorkspacePage from '@/components/WorkspacePage'

export default function PeoplePage() {
  return <WorkspacePage title="People and Decision-Makers" eyebrow="Pro intelligence mode" description="Find owners, executives, professionals, and specialists while preserving the distinction between public professional evidence and unverified personal data." cards={[{title:'Professional identity',copy:'Name, role, organization, professional profile, and source references.'},{title:'Contact verification',copy:'Business email and phone fields remain confidence-labeled and are re-verified before outreach.'},{title:'Privacy boundary',copy:'Sensitive personal data, private profiles, and unsupported inferences are excluded.'}]} emptyTitle="No people search selected" emptyCopy="Start a decision-maker or professional search. Person records require Pro access and approved provider usage before persistent storage." actionLabel="Find decision-makers" />
}
