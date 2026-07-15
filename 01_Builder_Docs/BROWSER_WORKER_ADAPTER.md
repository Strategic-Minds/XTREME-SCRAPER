# Browser Worker Adapter Contract

Status: **CODE PRESENT; END-TO-END NOT PROVEN**.

## Current request semantics

- `version` and `job_id` are sent in the request body.
- The reusable client sends the correlation identifier in the `X-Correlation-Id` header and typically uses the same value for `job_id`.
- The scraper route's current validation call sends `job_id` without a separate correlation header.
- Therefore, the current compatibility rule is: use `X-Correlation-Id` when present; otherwise fall back to `job_id`.
- A body-level `correlation_id` may be introduced only as an additive, backward-compatible field.

Authentication uses a server-side bearer token. Idempotency is keyed by the resolved correlation identifier plus source/URL fingerprint.

## Allowed actions

Navigation to approved URLs, title/URL retrieval, bounded text extraction, bounded scrolling and approved screenshots.

## Forbidden actions

Login, payment, posting, messaging, downloads, uploads, CAPTCHA bypass, access-control bypass, credential collection and navigation outside the approved domain set without operator approval.

## Limits

- Explicit timeout per step and job.
- Page and domain caps from the approved source policy.
- Concurrency limited by worker capacity and queue lease.
- Screenshots disabled by default and retained only with evidence need.

## Response

Return status, final URL, title, step results, artifact references, network errors, timing, policy result and receipt ID. Never return secrets.

## Failure handling

Transient failures may retry within policy. Policy blocks, authentication failures and repeated source blocks quarantine the job. Every call records the resolved correlation ID, worker version, outcome and rollback/no-op status.

No Browser Worker job was called by this documentation mission.