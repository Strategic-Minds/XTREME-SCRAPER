# Vercel Five-Minute Cron and Validator Contract

Status: **EXISTING CRON VERIFIED; GOVERNANCE HARDENING REQUIRED**.

## Current implementation

- `vercel.json` currently schedules `/api/validator` every five minutes using `*/5 * * * *`.
- `app/api/validator/route.ts` currently returns a lightweight status payload.
- This existing validator route does not yet prove authenticated execution, durable queue checks, receipt persistence, kill-switch enforcement or dead-letter monitoring.
- `app/api/cron/discover/route.ts` is a separate scrape-triggering route. It reads `CRON_SECRET`, but only rejects unauthenticated calls when that variable is configured.

## Required hardened contract

- Keep the current five-minute schedule unless superseded through an approved change.
- Require an authenticated internal validator endpoint with no user-supplied arbitrary actions.
- Treat missing `CRON_SECRET` as a release blocker for any active cron-triggering route.
- Check queued jobs, expired leases, Browser Worker health, failed jobs, dead-letter volume, receipt gaps, kill switches and budget limits.
- Emit one immutable heartbeat receipt containing correlation ID, counts, failures, duration and next action.
- Finish before the platform timeout and defer work rather than overlap.
- A kill switch must prevent dispatch while still allowing read-only health and receipt emission.
- Alert only on meaningful state transitions or threshold breaches.
- Preserve failure receipts and never auto-widen privileges.

No cron, route or Vercel setting was changed by this documentation update. Any runtime hardening requires a separate approved implementation phase.