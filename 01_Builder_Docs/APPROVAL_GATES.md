# Approval Gates

Operator approval is mandatory before:

- Adding a new source domain to production.
- Authenticated scraping or use of private/restricted data.
- Paid data sources or increased browser/model spend.
- High-volume or high-frequency crawling.
- Contact-data export, CRM import or outreach.
- Production deployment or domain changes.
- Database migrations, table creation or data backfills.
- Enabling/changing RLS policies.
- Creating, rotating or exposing secrets.
- Widening AI providers, models or budgets.

Every approval must identify scope, owner, expiration, risk, rollback and evidence. Absence of an approval record means deny.