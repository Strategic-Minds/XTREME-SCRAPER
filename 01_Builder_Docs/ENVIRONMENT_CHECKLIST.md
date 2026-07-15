# Environment Checklist

Values are intentionally omitted.

| Variable | Purpose | Status |
|---|---|---|
| `SUPABASE_URL` | Server-side Supabase endpoint | REQUIRED / NOT VERIFIED |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional public endpoint | OPTIONAL / NOT VERIFIED |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged server persistence | PRODUCTION-GATED / NOT VERIFIED |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public client access | OPTIONAL / NOT VERIFIED |
| `BROWSER_WORKER_URL` | Browser Worker base URL | REQUIRED / NOT VERIFIED |
| `BROWSER_WORKER_TOKEN` | Browser Worker authentication | REQUIRED / PRODUCTION-GATED / NOT VERIFIED |
| `BROWSER_WORKER_SECRET` | Compatibility authentication name | OPTIONAL / PRODUCTION-GATED / NOT VERIFIED |
| `AI_GATEWAY_BASE_URL` | AI Gateway endpoint | OPTIONAL / NOT VERIFIED |
| `AI_GATEWAY_API_KEY` | AI Gateway authentication | PRODUCTION-GATED / NOT VERIFIED |
| `AI_MODEL_FAST` | Approved fast model route | OPTIONAL / NOT VERIFIED |
| `BASE_URL_AGENT_KEY` | Current Base44 chat-agent credential | PRODUCTION-GATED / NOT VERIFIED |
| `OPENAI_API_KEY` | Current direct OpenAI chat fallback credential | PRODUCTION-GATED / NOT VERIFIED |
| `CRON_SECRET` | Authentication for current cron-triggering routes | REQUIRED FOR ACTIVE CRON ROUTES / NOT VERIFIED |
| `AUTO_BUILDER_OPERATOR_TOKEN` | Governed operator authorization | PRODUCTION-GATED / NOT VERIFIED |
| `AUTO_BUILDER_BRIDGE_TOKEN` | AUTO BUILDER bridge authentication | PRODUCTION-GATED / NOT VERIFIED |

## Release rule

- Any active cron-triggering route must fail closed when `CRON_SECRET` is absent or invalid.
- Direct Base44 and OpenAI chat paths must remain server-side, budgeted and included in connector and secret reviews.
- A missing optional credential may place the affected feature in disabled or mock mode, but must not silently bypass governance.

No secret value was read, displayed, copied, rotated or changed.