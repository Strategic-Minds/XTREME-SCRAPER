# Queue and Lease Contract

States: `draft`, `approved`, `queued`, `leased`, `running`, `succeeded`, `quarantined`, `failed`, `dead_letter`, `cancelled`.

- Every job has a unique ID, correlation ID and deterministic idempotency key.
- A worker lease records owner, acquisition time, expiry and heartbeat.
- Only the active lease owner may transition a running job.
- Expired leases may be reclaimed after an atomic compare-and-set.
- Default retries: three for transient failures with exponential backoff.
- Policy, authorization and schema failures do not auto-retry.
- Concurrency is capped per source, domain and worker.
- Duplicate active jobs are rejected or linked to the existing job.
- Dead-letter records preserve request, error class, attempts and recovery instruction.
- Kill switches block new dispatch and preserve read-only diagnostics.
- Evidence includes state-transition receipts, worker version, timings and artifact references.

No queue records were created.