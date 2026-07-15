# Release Gates

Release is denied until evidence proves:

1. Canonical GitHub, Vercel, Supabase, Drive and Browser Worker mappings.
2. Source policy and robots/terms enforcement.
3. Secrets scan and server-only secret handling.
4. Safe RLS policies with tenant-isolation tests.
5. Queue idempotency, lease recovery and dead-letter handling.
6. Browser Worker and fallback behavior under bounded tests.
7. Scrape accuracy, deduplication, provenance and confidence validation.
8. Quarantine, approval and kill-switch behavior.
9. Five-minute heartbeat receipts without overlap.
10. Preview deployment smoke tests and documented rollback.
11. Operator approval for production.

This documentation branch does not satisfy implementation or release gates by itself.