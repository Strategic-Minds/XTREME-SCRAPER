import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  const { url, max_pages = 50, num_agents = 5, extract_js_secrets = true } = await req.json()

  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })

  try {
    const escaped = url.replace(/'/g, '')
    const cmd = `cd /app && python3 -c "
import asyncio, json, sys
sys.path.insert(0, '.')
from scraper.core import scrape
result = asyncio.run(scrape('${escaped}', max_pages=${max_pages}))
print(json.dumps({'pages_count': result['pages_count'], 'api_map': result['api_map'], 'intelligence_report': result['intelligence_report'], 'sitemap_count': len(result['sitemap_urls']), 'bundle_count': len(result['bundle_urls'])}))
" 2>&1`
    const { stdout } = await execAsync(cmd, { timeout: 120000 })
    const data = JSON.parse(stdout.trim().split('\n').pop() || '{}')
    return NextResponse.json({ ok: true, url, ...data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
