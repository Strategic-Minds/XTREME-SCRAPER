# Source Policy

A source may enter production only when its owner, purpose, allowed paths, robots posture, terms posture, authentication requirements, jurisdiction, data classes and approval status are recorded.

Prohibited by default: bypassing access controls, CAPTCHA circumvention, authenticated/private scraping without approval, harvesting sensitive personal data, and navigation outside approved domains.

Every retrieval must preserve source URL, timestamp, policy decision, correlation ID and evidence lineage. Policy denial blocks dispatch and cannot be overridden by automatic retry.