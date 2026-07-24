import WorkspacePage from '@/components/WorkspacePage'

export default function AlertsPage() {
  return <WorkspacePage title="Alerts" eyebrow="Monitor meaningful change" description="Alerts are designed to surface new, deduplicated, source-backed events that match a user's saved criteria." cards={[{title:'Change record',copy:'Entity, event type, event date, retrieval date, previous state, current state, and supporting evidence.'},{title:'Priority context',copy:'User-specific fit, urgency, confidence, and the reason the event matched the alert rule.'},{title:'Review action',copy:'Monitor, enrich, dismiss, or adjust the rule. External actions remain human-controlled.'}]} emptyTitle="No active alerts" emptyCopy="The alert interface is installed. Durable scheduling and organization-scoped persistence require the proposed development database migration and queue tests." notice="Preview mode does not send external notifications or communications." />
}
