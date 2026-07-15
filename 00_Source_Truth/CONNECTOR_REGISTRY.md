# Connector Registry

| Connector | Purpose | Current status | Read scope | Proposed future write scope | Secrets | Approval | Failure behavior | Receipt |
|---|---|---|---|---|---|---|---|---|
| GitHub | Source, docs, PRs | VERIFIED | Repository and branch metadata | Branch commits and draft PRs | GitHub token | Protected branch/merge | Stop and export patch | Commit and PR receipt |
| Google Drive | Workbooks and handoffs | PARTIAL | Search/read relevant artifacts | Approved folder/package writes | Workspace credentials | Live Drive write | Fall back to repo docs | Drive receipt |
| Vercel | Runtime and deployments | VERIFIED READ-ONLY | Project/deployment metadata | Preview configuration only after approval | Vercel token | Env/production changes | Block release | Deployment receipt |
| Supabase | Intelligence, queues, receipts | NOT CANONICALLY MAPPED | Project/table metadata | Isolated namespace after schema approval | URL and scoped keys | SQL/RLS/data writes | Quarantine and stop | Migration/query receipt |
| Browser Worker | Browser-backed retrieval | CODE PRESENT, RUNTIME UNPROVEN | Health contract and code | Approved job dispatch | Worker token/secret | Live browser jobs | Direct/API fallback with warning | Browser job receipt |
| Vercel AI Gateway | Structured extraction | CODE PRESENT, RUNTIME UNPROVEN | Routing contract | Approved model requests | Gateway key | Spend/provider widening | Return no AI results | Model/cost receipt |
| AUTO BUILDER bridge | Governance and orchestration | PARTIAL | Policy and dry-run validation | Governed work packets | Operator/bridge token | Execute-mode mutations | Manual receipt fallback | MCP receipt |

No connector was configured or mutated by this documentation mission.