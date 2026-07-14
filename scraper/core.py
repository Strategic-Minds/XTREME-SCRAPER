"""
XTREME-SCRAPER Core Engine
Exact pipeline used to extract Apollo.io intelligence
Asyncio-powered, concurrent, with circuit breaker + retry logic
"""

import asyncio
import aiohttp
import json
import os
import re
import time
from typing import Any, Optional
from dataclasses import dataclass, field, asdict
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup

@dataclass
class ScrapeConfig:
    target_url: str
    max_pages: int = 200
    max_concurrent: int = 10
    timeout: int = 30
    retry_attempts: int = 3
    delay_between_requests: float = 0.5
    extract_js_secrets: bool = True
    extract_api_endpoints: bool = True
    extract_design_tokens: bool = True
    extract_sitemap: bool = True
    user_agents: list = field(default_factory=lambda: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36',
    ])

@dataclass
class ScrapedPage:
    url: str
    status: int
    title: str = ''
    description: str = ''
    h1: list = field(default_factory=list)
    h2: list = field(default_factory=list)
    h3: list = field(default_factory=list)
    links: list = field(default_factory=list)
    images: list = field(default_factory=list)
    js_files: list = field(default_factory=list)
    css_files: list = field(default_factory=list)
    api_endpoints: list = field(default_factory=list)
    colors: list = field(default_factory=list)
    fonts: list = field(default_factory=list)
    prices: list = field(default_factory=list)
    forms: list = field(default_factory=list)
    meta_tags: dict = field(default_factory=dict)
    og_tags: dict = field(default_factory=dict)
    schema_markup: list = field(default_factory=list)
    tracking_ids: dict = field(default_factory=dict)
    text_sample: str = ''
    html_length: int = 0
    load_time_ms: int = 0
    error: Optional[str] = None

@dataclass
class ScrapedSite:
    target_url: str
    started_at: str = ''
    completed_at: str = ''
    pages: dict = field(default_factory=dict)
    sitemap_urls: list = field(default_factory=list)
    js_secrets: dict = field(default_factory=dict)
    api_map: dict = field(default_factory=dict)
    design_tokens: dict = field(default_factory=dict)
    infrastructure: dict = field(default_factory=dict)
    subdomains: list = field(default_factory=list)
    bundle_urls: list = field(default_factory=list)
    intelligence_report: str = ''
    score: dict = field(default_factory=dict)

class XtremeScraper:
    def __init__(self, config: ScrapeConfig):
        self.config = config
        self.visited = set()
        self.queue = asyncio.Queue()
        self.results: ScrapedSite = ScrapedSite(target_url=config.target_url)
        self.semaphore = asyncio.Semaphore(config.max_concurrent)
        self._ua_index = 0

    def _next_ua(self) -> str:
        ua = self.config.user_agents[self._ua_index % len(self.config.user_agents)]
        self._ua_index += 1
        return ua

    def _extract_api_endpoints(self, html: str, base_url: str) -> list:
        endpoints = []
        # Extract from JS source
        patterns = [
            r'['"`](/api/[a-zA-Z0-9/_-]+)['"`]',
            r'fetch\(['"`]([^'"`]+)['"`]',
            r'axios\.[a-z]+\(['"`]([^'"`]+)['"`]',
            r'url:\s*['"`]([^'"`]+)['"`]',
            r'endpoint:\s*['"`]([^'"`]+)['"`]',
        ]
        for pat in patterns:
            found = re.findall(pat, html)
            for f in found:
                if f.startswith('/api/') or 'api.' in f:
                    endpoints.append(f)
        return list(set(endpoints))[:50]

    def _extract_js_secrets(self, js_content: str) -> dict:
        secrets = {}
        patterns = {
            'stripe_pk': r'pk_(?:live|test)_[A-Za-z0-9]+',
            'google_analytics': r'G-[A-Z0-9]{10}',
            'gtm': r'GTM-[A-Z0-9]{7}',
            'hubspot_portal': r'portal[_-]?id["\s]*:["\s]*(\d+)',
            'sentry_dsn': r'https://[a-f0-9]+@[a-z0-9.]+/\d+',
            'intercom_app_id': r'intercomSettings.*app_id["\s]*:["\s]*["']([a-z0-9]+)["']',
            'fullstory_org': r'FS\.identify|fullstory',
            'amplitude_key': r'amplitude.*["']([A-Fa-f0-9]{32})["']',
            'mixpanel_token': r'mixpanel.*["']([A-Fa-f0-9]{32})["']',
            'segment_write_key': r'analytics\.load\(["']([^"']*)["']+',
            'clearbit': r'clearbit',
            'env_vars': r'process\.env\.([A-Z_]{3,})',
            'next_public': r'NEXT_PUBLIC_([A-Z_]+)',
        }
        for key, pat in patterns.items():
            found = re.findall(pat, js_content, re.IGNORECASE)
            if found:
                secrets[key] = list(set(found))[:5]
        return secrets

    def _extract_colors(self, html: str) -> list:
        colors = set()
        patterns = [
            r'#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b',
            r'rgb\(([\d, ]+)\)',
            r'rgba\(([\d, .]+)\)',
            r'hsl\(([\d, %]+)\)',
        ]
        for pat in patterns:
            for m in re.finditer(pat, html):
                colors.add(m.group(0))
        return list(colors)[:30]

    def _extract_design_tokens(self, html: str) -> dict:
        tokens = {}
        # CSS custom properties
        css_props = re.findall(r'--([a-zA-Z-]+):\s*([^;\n}]+)', html)
        for prop, val in css_props[:50]:
            tokens[f'--{prop}'] = val.strip()
        # Font families
        fonts = re.findall(r'font-family:\s*([^;\n}]+)', html)
        tokens['fonts'] = list(set(f.strip() for f in fonts))[:10]
        # Border radius
        radii = re.findall(r'border-radius:\s*([^;\n}]+)', html)
        tokens['border_radius'] = list(set(r.strip() for r in radii))[:10]
        return tokens

    def _extract_tracking(self, html: str) -> dict:
        tracking = {}
        if 'GTM-' in html:
            m = re.search(r'GTM-([A-Z0-9]{7})', html)
            if m: tracking['gtm'] = f'GTM-{m.group(1)}'
        if 'G-' in html:
            m = re.search(r'G-([A-Z0-9]{10})', html)
            if m: tracking['ga4'] = f'G-{m.group(1)}'
        if 'hubspot' in html.lower():
            m = re.search(r'portal[_-]?id[^\d]*(\d{7,9})', html, re.IGNORECASE)
            if m: tracking['hubspot_portal'] = m.group(1)
        if 'intercom' in html.lower():
            m = re.search(r'app_id["\s]*:["\s]*["']([a-z0-9]+)["']', html, re.IGNORECASE)
            if m: tracking['intercom'] = m.group(1)
        return tracking

    async def _fetch_page(self, session: aiohttp.ClientSession, url: str) -> ScrapedPage:
        start = time.time()
        page = ScrapedPage(url=url, status=0)
        headers = {
            'User-Agent': self._next_ua(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
        }
        for attempt in range(self.config.retry_attempts):
            try:
                async with self.semaphore:
                    async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=self.config.timeout), ssl=False, allow_redirects=True) as resp:
                        page.status = resp.status
                        if resp.status == 200:
                            html = await resp.text(errors='replace')
                            page.html_length = len(html)
                            page.load_time_ms = int((time.time()-start)*1000)
                            soup = BeautifulSoup(html, 'html.parser')
                            # Extract structured data
                            page.title = (soup.find('title') or soup.new_tag('x')).get_text(strip=True)[:200]
                            desc = soup.find('meta', attrs={'name':'description'})
                            page.description = desc.get('content','')[:300] if desc else ''
                            page.h1 = [t.get_text(strip=True)[:100] for t in soup.find_all('h1')][:5]
                            page.h2 = [t.get_text(strip=True)[:100] for t in soup.find_all('h2')][:10]
                            page.h3 = [t.get_text(strip=True)[:100] for t in soup.find_all('h3')][:10]
                            page.links = list(set(a.get('href','') for a in soup.find_all('a', href=True)))[:50]
                            page.js_files = [s.get('src','') for s in soup.find_all('script', src=True)][:30]
                            page.css_files = [l.get('href','') for l in soup.find_all('link', rel='stylesheet')][:20]
                            page.colors = self._extract_colors(html)
                            page.api_endpoints = self._extract_api_endpoints(html, url)
                            page.tracking_ids = self._extract_tracking(html)
                            # Prices
                            prices = re.findall(r'\$[\d,]+(?:\.\d{2})?', html)
                            page.prices = list(set(prices))[:20]
                            # OG tags
                            for tag in soup.find_all('meta', property=re.compile('^og:')):
                                page.og_tags[tag.get('property','')] = tag.get('content','')[:200]
                            # Schema markup
                            for script in soup.find_all('script', type='application/ld+json'):
                                try:
                                    page.schema_markup.append(json.loads(script.string or '{}'))
                                except: pass
                            # Forms
                            for form in soup.find_all('form'):
                                inputs = [i.get('name','') for i in form.find_all('input') if i.get('name')]
                                page.forms.append({'action': form.get('action',''), 'method': form.get('method','get'), 'inputs': inputs})
                            # Text sample
                            page.text_sample = soup.get_text(separator=' ', strip=True)[:500]
                            # Discover new URLs
                            base = urlparse(url)
                            for link in page.links:
                                abs_url = urljoin(url, link)
                                parsed = urlparse(abs_url)
                                if parsed.netloc == base.netloc and abs_url not in self.visited:
                                    if not any(abs_url.endswith(ext) for ext in ['.pdf','.jpg','.png','.gif','.svg','.ico','.woff','.css','.js']):
                                        await self.queue.put(abs_url)
                        return page
            except asyncio.TimeoutError:
                page.error = 'timeout'
            except Exception as e:
                page.error = str(e)[:100]
            if attempt < self.config.retry_attempts-1:
                await asyncio.sleep(2 ** attempt)
        return page

    async def _fetch_sitemap(self, session: aiohttp.ClientSession) -> list:
        urls = []
        base = self.config.target_url.rstrip('/')
        for sitemap_path in ['/sitemap.xml', '/sitemap_index.xml', '/robots.txt']:
            try:
                async with session.get(base+sitemap_path, timeout=aiohttp.ClientTimeout(total=10), ssl=False) as r:
                    if r.status == 200:
                        text = await r.text()
                        found = re.findall(r'<loc>([^<]+)</loc>', text)
                        loc_urls = re.findall(r'https?://[^\s"\'>]+', text)
                        urls.extend(found)
                        urls.extend(loc_urls)
            except: pass
        return list(set(u for u in urls if self.config.target_url.split('/')[2] in u))[:200]

    async def run(self) -> ScrapedSite:
        import datetime
        self.results.started_at = datetime.datetime.utcnow().isoformat()
        conn = aiohttp.TCPConnector(limit=20, ssl=False, ttl_dns_cache=300)
        async with aiohttp.ClientSession(connector=conn) as session:
            # Step 1: Sitemap
            if self.config.extract_sitemap:
                sitemap = await self._fetch_sitemap(session)
                self.results.sitemap_urls = sitemap
                for url in sitemap[:self.config.max_pages]:
                    if url not in self.visited:
                        await self.queue.put(url)
            # Add root
            await self.queue.put(self.config.target_url)
            # Step 2: Crawl
            workers = []
            for _ in range(min(self.config.max_concurrent, 10)):
                workers.append(asyncio.create_task(self._worker(session)))
            await self.queue.join()
            for w in workers:
                w.cancel()
            await asyncio.gather(*workers, return_exceptions=True)
        # Step 3: Aggregate intel
        all_endpoints = set()
        all_secrets = {}
        all_tokens = {}
        for page in self.results.pages.values():
            all_endpoints.update(page.api_endpoints)
            if page.js_files:
                self.results.bundle_urls.extend(page.js_files)
        self.results.api_map = {'endpoints': list(all_endpoints)}
        self.results.bundle_urls = list(set(self.results.bundle_urls))[:100]
        # Intelligence report
        self.results.intelligence_report = self._generate_report()
        self.results.completed_at = datetime.datetime.utcnow().isoformat()
        return self.results

    async def _worker(self, session: aiohttp.ClientSession):
        while True:
            try:
                url = await asyncio.wait_for(self.queue.get(), timeout=5.0)
                if url not in self.visited and len(self.visited) < self.config.max_pages:
                    self.visited.add(url)
                    page = await self._fetch_page(session, url)
                    self.results.pages[url] = page
                    await asyncio.sleep(self.config.delay_between_requests)
                self.queue.task_done()
            except asyncio.TimeoutError:
                break
            except asyncio.CancelledError:
                break

    def _generate_report(self) -> str:
        pages = self.results.pages
        ok = [p for p in pages.values() if p.status == 200]
        all_colors = set()
        all_prices = set()
        all_endpoints = set()
        for p in ok:
            all_colors.update(p.colors)
            all_prices.update(p.prices)
            all_endpoints.update(p.api_endpoints)
        return f"""XTREME-SCRAPER Intelligence Report
Target: {self.config.target_url}
Pages crawled: {len(pages)} | Successful: {len(ok)}
Sitemap URLs: {len(self.results.sitemap_urls)}
API endpoints found: {len(all_endpoints)}
Colors extracted: {len(all_colors)}
Prices found: {len(all_prices)}
JS bundles: {len(self.results.bundle_urls)}

Top endpoints:
{''.join(f'  - {e}' + chr(10) for e in list(all_endpoints)[:20])}
Colors: {', '.join(list(all_colors)[:15])}
Prices: {', '.join(list(all_prices)[:15])}
"""

async def scrape(url: str, **kwargs) -> dict:
    config = ScrapeConfig(target_url=url, **kwargs)
    scraper = XtremeScraper(config)
    result = await scraper.run()
    pages_data = {}
    for url, page in result.pages.items():
        d = asdict(page)
        pages_data[url] = d
    return {
        'target_url': result.target_url,
        'started_at': result.started_at,
        'completed_at': result.completed_at,
        'pages_count': len(result.pages),
        'sitemap_urls': result.sitemap_urls,
        'api_map': result.api_map,
        'design_tokens': result.design_tokens,
        'bundle_urls': result.bundle_urls[:50],
        'intelligence_report': result.intelligence_report,
        'pages': pages_data,
    }

if __name__ == '__main__':
    import sys
    target = sys.argv[1] if len(sys.argv) > 1 else 'https://apollo.io'
    result = asyncio.run(scrape(target, max_pages=50))
    print(result['intelligence_report'])
    with open('scrape_result.json', 'w') as f:
        json.dump(result, f, indent=2, default=str)
    print(f'Saved to scrape_result.json')
