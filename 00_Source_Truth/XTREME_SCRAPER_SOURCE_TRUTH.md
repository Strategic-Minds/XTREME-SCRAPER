# Xtreme Scraper Source Truth

- System: Xtreme Scraper
- Canonical repository: `Strategic-Minds/XTREME-SCRAPER`
- Default branch: `main`
- Alignment branch: `auto-builder/xtreme-scraper-system-alignment-001`
- Vercel project: `xtreme-scraper`
- Vercel project ID: `prj_3Wug8Zppqp4NjRKsRxFxK5sAhBeu`
- Parent control plane: Strategic Minds AUTO BUILDER OS
- Role: Intelligence Acquisition and Lead Discovery Subsystem

## Verified state

- The repository exists and is public.
- The current main-line code contains a Next.js scraper API route, BrowserWorker client and browser health route.
- The scraper route references Supabase REST persistence, BrowserWorker, AI Gateway and a Python fallback.
- Vercel reports a READY production deployment for the project.

## Unverified or incomplete state

- End-to-end scraping accuracy, policy compliance, queue durability, deduplication, approval flow and receipt persistence are not independently proven.
- A canonical Supabase project mapping for Xtreme Scraper is not documented.
- Environment variable presence was not inspected beyond code references.
- BrowserWorker launch success was not executed during this documentation mission.

## Source-truth conflict

Google Drive contains an older consolidation workbook that locks `Strategic-Minds/AUTOBUILDER-V2` as a separate target. That workbook is not authoritative for this repository mission.

## Release status

Production release remains blocked for governance alignment. This branch changes documentation only. Any code, database, environment, workflow, secret or production change requires a separate approval.