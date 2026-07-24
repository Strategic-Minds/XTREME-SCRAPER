# System Architecture

| Component | Status | Evidence / boundary |
|---|---|---|
| Source registration | PROPOSED | No canonical registry proven in repo |
| Policy, robots and terms validation | BLOCKED | No enforceable policy gate verified |
| Scrape job queue | NOT CONNECTED | Durable queue not proven |
| Five-minute workflow heartbeat | PROPOSED | No project cron configuration changed or verified |
| Browser Worker retrieval | VERIFIED IN CODE / NOT TESTED END TO END | Client, health route and scraper references exist |
| Approved API retrieval | PROPOSED | Provider contracts not established |
| Raw artifact storage | NOT CONNECTED | No canonical bucket/table mapping proven |
| Normalization | PARTIAL | Route performs lightweight lead mapping |
| Duplicate detection | BLOCKED | No durable idempotency/dedupe proof |
| Entity and fact extraction | PARTIAL / NOT TESTED | AI extraction code exists; factual validation absent |
| Confidence scoring | PROPOSED | No governed scoring pipeline proven |
| Quarantine and approval | NOT CONNECTED | Existing shared tables exist but app mapping unverified |
| Supabase intelligence tables | PARTIAL / BLOCKED | REST writes exist in code; canonical project and safe RLS mapping unverified |
| Drive, CRM or AUTO BUILDER handoff | PROPOSED | No live handoff configured in this mission |
| Validation receipt | PROPOSED | No end-to-end receipt emitted by scraper verified |

## Intended governed flow

Source Registration → Policy and Robots Validation → Scrape Job Queue → Five-Minute Workflow Heartbeat → Browser Worker or Approved API Retrieval → Raw Artifact Storage → Normalization → Duplicate Detection → Entity and Fact Extraction → Confidence Scoring → Quarantine or Approval → Supabase Intelligence Tables → Drive, CRM or AUTO BUILDER Handoff → Validation Receipt

This document is a target architecture, not an implementation claim.