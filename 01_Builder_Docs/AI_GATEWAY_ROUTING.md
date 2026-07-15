# AI Gateway Routing Policy

Status: **PROPOSED / RUNTIME UNPROVEN**.

Permitted future tasks: classification, normalization, entity detection, claim extraction, confidence assistance and summarization. AI output must never be treated as verified source evidence by itself.

## Routing rules

- Use deterministic parsing before a model when possible.
- Use the lowest-cost approved model that meets a tested quality threshold.
- Require structured JSON schemas and reject malformed output.
- Preserve provider, model, prompt version, token use, latency and cost in a receipt.
- Apply per-job and daily budgets with a hard stop.
- Fallback only to approved providers; never silently widen providers or spend.
- Redact secrets and unnecessary personal data before requests.
- Quarantine fabricated, unsupported or low-confidence claims.

No model call, AI Gateway configuration or key mutation occurred in this mission.