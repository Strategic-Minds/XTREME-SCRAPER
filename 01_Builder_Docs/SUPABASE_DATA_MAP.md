# Supabase Data Map

Active project observed: `azajysheebfhyzoyplpf` (`supabase-blue-zebra`). This is not yet established as Xtreme Scraper's canonical database.

| Table | Intended purpose | Current evidence | App connection | RLS | Proposed boundary | Risk / approval |
|---|---|---|---|---|---|---|
| `intel_sources` | Approved source registry | Exists, 0 rows | Not proven | Disabled | `xtreme_scraper` tenant/namespace | High; schema and RLS approval |
| `intel_jobs` | Scrape queue | Exists, 0 rows | Not proven | Disabled | Scoped queue | High; migration and worker tests |
| `intel_artifacts` | Raw/normalized artifacts | Exists, 0 rows | Not proven | Disabled | Immutable evidence | High; storage/retention approval |
| `scrape_runs` | Run summaries | Exists, 1 row; repo writes by REST | Partial code path | Disabled | Scraper-owned rows | Critical; policies before release |
| `browser_sessions` | Browser job/session evidence | Exists, 1 row | Not proven | Disabled | Worker-scoped access | Critical |
| `xps_sources` | XPS source catalog | Exists, 12 rows | Not proven | Disabled | Read-only reference or copied namespace | High |
| `xps_chunks` | Source chunks | Exists, 0 rows | Not proven | Disabled | Intelligence namespace | High |
| `xps_claims` | Extracted claims | Exists, 0 rows | Not proven | Disabled | Validated claims only | High |
| `factory_jobs` | Cross-system jobs | Exists, 7 rows | Not proven | Disabled | Parent control-plane only | Critical |
| `factory_receipts` | Factory receipts | Exists, 5 rows | Not proven | Disabled | Append-only control plane | Critical |
| `validation_runs` | Validation executions | Exists, 0 rows | Not proven | Disabled | Validator-owned | High |
| `cron_heartbeats` | Scheduler health | Exists, 0 rows | Not proven | Disabled | Service-role-only | High |
| `operator_decisions` | Human approvals | Exists, 14 rows | Not proven | Disabled | Operator-only | Critical |
| `kill_switches` | Emergency controls | Exists, 4 rows | Not proven | Disabled | Operator/service only | Critical |
| `xps_leads` | Current scraper write target | Exists, 0 rows; `/api/scrape` writes by REST | Partial code path | Disabled | Tenant-scoped leads | Critical |
| `leads` | Current UI, stats and health read target | Exists; `/api/leads`, `/api/stats` and `/api/health` query it | Active legacy/read path | Enabled in observed project, but canonical mapping unproven | Legacy compatibility until routes are migrated | High; drift and data-consistency risk |

## Current drift

The scraper writes to `xps_leads`, while UI and health routes still read `leads`. Until those routes are migrated or the data is synchronized through an approved design, counts and displayed records may not represent current scraper output.

## Release rule

Do not execute SQL or connect production until ownership, policies, service roles, table-drift remediation, regression tests and rollback are approved. Enabling RLS without matching policies may break current access.