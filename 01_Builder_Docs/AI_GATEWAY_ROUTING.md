# AI Gateway Routing Policy

Status: **CURRENT AI-GENERATED LEAD PATH PRESENT; RUNTIME QUALITY UNPROVEN**.

## Current behavior

`/api/scrape` may ask the configured model to list real companies from training knowledge when deterministic scraping returns too few leads. When those AI-produced records outnumber scraped records, the route may select them and persist them to the scraper lead output table.

This path is high-risk because model-generated company names, phone numbers and websites are not source-verified evidence. Records produced by this path must be labeled `ai_generated`, retain model and prompt provenance, and remain quarantined until independently verified against an approved source. They must not be exported, contacted or scored as verified leads by default.

## Permitted governed tasks

Classification, normalization, entity detection, claim extraction, confidence assistance and summarization. AI output must never be treated as verified source evidence by itself.

## Routing rules

- Use deterministic parsing before a model when possible.
- Use the lowest-cost approved model that meets a tested quality threshold.
- Require structured JSON schemas and reject malformed output.
- Preserve provider, model, prompt version, token use, latency and cost in a receipt.
- Apply per-job and daily budgets with a hard stop.
- Fallback only to approved providers; never silently widen providers or spend.
- Redact secrets and unnecessary personal data before requests.
- Quarantine fabricated, unsupported, AI-generated or low-confidence claims.
- Release of AI-generated lead data requires independent source verification and operator-approved policy.

No model call, AI Gateway configuration or key mutation occurred in this documentation mission.