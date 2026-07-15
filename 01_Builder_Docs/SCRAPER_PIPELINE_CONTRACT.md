# Scraper Pipeline Contract

## Core contracts

1. **Source registration:** every domain receives a source ID, owner, purpose, legal basis, allowed paths and review state.
2. **Policy review:** robots, terms, authentication, rate limits and restricted-data rules are evaluated before dispatch.
3. **Crawl request:** includes source ID, objective, allowed URLs, page cap, timeout, correlation ID and approval ID where required.
4. **Job creation:** job ID and idempotency key are unique; duplicate active jobs are rejected.
5. **Queue state:** `draft → approved → queued → leased → running → succeeded | quarantined | failed | dead_letter`.
6. **Worker lease:** lease owner, acquired time and expiry are recorded; expired leases may be safely reclaimed.
7. **Retrieval:** Browser Worker or approved API returns status, navigation, artifacts, errors and timing.
8. **Artifact creation:** raw evidence is immutable, hashed and linked to source/job IDs.
9. **Normalization:** preserve raw values and produce normalized fields with transformation metadata.
10. **Deduplication:** deterministic fingerprints prevent duplicate entities, artifacts and exports.
11. **Entity extraction:** each entity retains source evidence and extraction method.
12. **Claim extraction:** each claim records exact provenance, confidence and validation state.
13. **Confidence scoring:** scoring rubric and model version are recorded; low scores quarantine.
14. **Approval:** restricted exports and ambiguous claims require operator approval.
15. **Export:** only approved records move to CRM, Drive or AUTO BUILDER consumers.
16. **Failure handling:** retry only transient failures; policy failures never auto-retry.
17. **Retry limit:** default maximum three attempts with exponential backoff.
18. **Dead letter:** exhausted jobs preserve error, inputs and rollback guidance.
19. **Receipts:** every transition emits correlation ID, actor, timestamp, result and evidence references.

This contract is documentation only and creates no jobs or tables.