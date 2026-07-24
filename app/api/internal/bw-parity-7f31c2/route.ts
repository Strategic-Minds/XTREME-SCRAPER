import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

const TARGET_URL = 'https://xtreme-scraper-git-auto-builder-5df621-strategic-minds-advisory.vercel.app'
const WORKER_CAPTURE_URL = 'https://browserworker-git-auto-builder-a782fc-strategic-minds-advisory.vercel.app/api/capture'

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1 },
  tablet: { width: 768, height: 1024, deviceScaleFactor: 1 },
  mobile: { width: 390, height: 844, deviceScaleFactor: 1 },
} as const

type ViewportName = keyof typeof VIEWPORTS

export async function GET(request: NextRequest) {
  const viewportName = (request.nextUrl.searchParams.get('viewport') || 'desktop') as ViewportName
  const format = request.nextUrl.searchParams.get('format') || 'png'
  const viewport = VIEWPORTS[viewportName]

  if (!viewport) {
    return Response.json({ ok: false, error: 'Unsupported viewport' }, { status: 400 })
  }

  const workerSecret = process.env.BROWSER_WORKER_SECRET || process.env.BROWSER_WORKER_TOKEN || ''

  if (!workerSecret) {
    return Response.json({ ok: false, error: 'BrowserWorker secret is not configured' }, { status: 503 })
  }

  const response = await fetch(WORKER_CAPTURE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${workerSecret}`,
    },
    body: JSON.stringify({
      url: TARGET_URL,
      viewport,
      wait_ms: 2500,
      full_page: false,
    }),
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    return Response.json({
      ok: false,
      worker_http_status: response.status,
      worker_error: errorText.slice(0, 4000),
    }, { status: 502 })
  }

  const bytes = new Uint8Array(await response.arrayBuffer())
  const metadata = {
    ok: true,
    viewport: viewportName,
    configured_viewport: viewport,
    screenshot_bytes: bytes.byteLength,
    worker_version: response.headers.get('x-browserworker-version'),
    browser_version: response.headers.get('x-browser-version'),
    title: decodeURIComponent(response.headers.get('x-capture-title') || ''),
    final_url: decodeURIComponent(response.headers.get('x-capture-final-url') || ''),
    duration_ms: Number(response.headers.get('x-capture-duration-ms') || 0),
    console_errors: Number(response.headers.get('x-console-errors') || 0),
    network_errors: Number(response.headers.get('x-network-errors') || 0),
    console_error_sample: decodeURIComponent(response.headers.get('x-console-error-sample') || ''),
    network_error_sample: decodeURIComponent(response.headers.get('x-network-error-sample') || ''),
  }

  if (format === 'json') {
    return Response.json(metadata, { headers: { 'Cache-Control': 'no-store' } })
  }

  return new Response(bytes, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': String(bytes.byteLength),
      'Cache-Control': 'no-store',
      'X-BrowserWorker-Version': metadata.worker_version || '',
      'X-Browser-Version': metadata.browser_version || '',
      'X-Capture-Viewport': `${viewport.width}x${viewport.height}@${viewport.deviceScaleFactor}`,
      'X-Capture-Duration-Ms': String(metadata.duration_ms),
      'X-Console-Errors': String(metadata.console_errors),
      'X-Network-Errors': String(metadata.network_errors),
    },
  })
}
