# Data Classification

| Data class | Classification | Access recommendation | Retention recommendation |
|---|---|---|---|
| Public source data | Public-derived | Service and analyst read | Keep source URL and retrieval timestamp |
| Restricted source data | Restricted | Approved worker only | Minimum necessary; honor source terms |
| Lead information | Confidential business data | Tenant-scoped roles | Purpose-limited retention |
| Contact information | Personal/confidential | Least privilege; export gated | Delete when no lawful purpose remains |
| Raw scraped artifacts | Restricted evidence | Worker, validator, auditor | Short retention unless approved evidence |
| Normalized content | Internal | Scoped application roles | Retain with lineage |
| Extracted entities | Internal intelligence | Scoped application roles | Retain with confidence and source IDs |
| Factual claims | Unverified until validated | Validator and approved consumers | Retain provenance and review state |
| Authentication data | Secret | Server-side only | Never log; rotate under incident policy |
| Secrets | Critical secret | Secret manager only | Never store in repo or receipts |
| Receipts | Internal audit | Operator and auditor | Durable according to audit policy |
| Audit events | Internal audit | Append-only roles | Durable, tamper-evident retention |
| Quarantined content | Restricted | Validator/operator only | Delete or release through approval |

These are recommendations only. No access control or retention rule was activated.