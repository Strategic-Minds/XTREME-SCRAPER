# Proposed Vercel Workflow Five-Minute Heartbeat

Status: **PROPOSED ONLY**. No cron or Vercel setting was created.

- Schedule: every five minutes.
- Endpoint contract: authenticated internal validator endpoint; no user-supplied arbitrary actions.
- Authentication: dedicated server-side secret, constant-time comparison, rotation record and no value in logs.
- Checks: queued jobs, expired leases, Browser Worker health, failed jobs, dead-letter volume, receipt gaps, kill switches and budget limits.
- Receipt: one immutable heartbeat receipt containing correlation ID, counts, failures, duration and next action.
- Timeout: finish before platform limit; defer work rather than overlap.
- Kill switch: prevents dispatch while still allowing read-only health and receipt emission.
- Alerts: notify only on meaningful state transition or threshold breach.
- Failure: preserve error receipt, release expired leases safely and never auto-widen privileges.

Future implementation must be preview-tested and separately approved. Do not modify `vercel.json` from this document.