# RLS Remediation Plan

## Release blocker

The inspected active Supabase project reports many public tables with Row Level Security disabled, including scraper, lead, intelligence, queue, receipt, approval and kill-switch tables. This is release-blocking.

## Safety warning

Enabling RLS without complete policies may immediately block legitimate application access. No RLS change is authorized in this mission.

## Required future sequence

1. Confirm the canonical Supabase project and data ownership.
2. Create an isolated Supabase development branch.
3. Inventory every role and access path.
4. Write least-privilege policies and service-role boundaries.
5. Run migration dry run, API regression, tenant-isolation, denial and rollback tests.
6. Review evidence and obtain operator approval.
7. Apply to preview/staging first.
8. Revalidate before any production change.

Production SQL, policies and data mutations require explicit operator approval and separate receipts.