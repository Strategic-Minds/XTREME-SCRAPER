# Rate Limit Policy

- Enforce per-domain, per-source, per-tenant and global concurrency limits.
- Respect published limits and slow down on `429`, `403`, CAPTCHA or source distress signals.
- Use exponential backoff with jitter for transient errors.
- Never rotate identities or proxies to defeat a source restriction.
- High-volume crawling requires explicit operator approval and a documented budget.
- Repeated blocks quarantine the source and stop automatic dispatch.
- Every throttle decision and override approval must be receipted.

This policy is not activated by this documentation packet.