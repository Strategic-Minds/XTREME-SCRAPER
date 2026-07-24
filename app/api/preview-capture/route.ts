import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const VIEWPORTS = {
  desktop: { width: 1440, height: 1024, deviceScaleFactor: 0.5 },
  tablet: { width: 1024, height: 768, deviceScaleFactor: 0.5 },
  mobile: { width: 390, height: 844, deviceScaleFactor: 1 },
} as const

type ViewportName = keyof typeof VIEWPORTS

function decodeHeader(value: string | null) {
  if (!value) return null
  try { return decodeURIComponent(value) } catch { return value }
}

export async function GET(req: NextRequest) {
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'Preview capture is disabled in production.' }, { status: 404 })
  }

  const viewportName = (req.nextUrl.searchParams.get('viewport') || 'desktop') as ViewportName
  const viewport = VIEWPORTS[viewportName]
  if (!viewport) return NextResponse.json({ ok: false, error: 'Unsupported viewport' }, { status: 400 })
  const theme = req.nextUrl.searchParams.get('theme') === 'dark' ? 'dark' : 'light'
  const format = req.nextUrl.searchParams.get('format') || 'json'

  const secret = process.env.BROWSER_WORKER_SECRET || process.env.BROWSER_WORKER_TOKEN || ''
  const workerUrl = process.env.BROWSER_WORKER_CAPTURE_URL
    || process.env.BROWSER_WORKER_URL
    || 'https://browserworker-git-auto-builder-a782fc-strategic-minds-advisory.vercel.app'
  if (!secret) return NextResponse.json({ ok: false, error: 'BrowserWorker secret is not configured' }, { status: 503 })

  const targetUrl = `${req.nextUrl.origin}/api/theme-preview?theme=${theme}`
  const response = await fetch(`${workerUrl.replace(/\/$/, '')}/api/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
    body: JSON.stringify({
      url: targetUrl,
      viewport,
      wait_ms: 3200,
      full_page: true,
      image_type: 'jpeg',
      quality: 72,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(110000),
  })

  if (!response.ok) {
    const errorText = await response.text()
    return NextResponse.json({ ok: false, worker_status: response.status, error: errorText.slice(0, 2000) }, { status: 502 })
  }

  const bytes = new Uint8Array(await response.arrayBuffer())
  const contentType = response.headers.get('content-type') || 'image/jpeg'
  const metadata = {
    ok: true,
    viewport: viewportName,
    configured_viewport: viewport,
    theme,
    screenshot_bytes: bytes.byteLength,
    image_type: response.headers.get('x-capture-image-type') || contentType,
    image_quality: Number(response.headers.get('x-capture-quality') || 0),
    worker_version: response.headers.get('x-browserworker-version'),
    browser_version: response.headers.get('x-browser-version'),
    title: decodeHeader(response.headers.get('x-capture-title')),
    final_url: decodeHeader(response.headers.get('x-capture-final-url')),
    duration_ms: Number(response.headers.get('x-capture-duration-ms') || 0),
    console_errors: Number(response.headers.get('x-console-errors') || 0),
    network_errors: Number(response.headers.get('x-network-errors') || 0),
    console_error_sample: decodeHeader(response.headers.get('x-console-error-sample')),
    network_error_sample: decodeHeader(response.headers.get('x-network-error-sample')),
    target_url: targetUrl,
    commit_sha: process.env.VERCEL_GIT_COMMIT_SHA || null,
  }

  if (format === 'image') {
    return new Response(bytes, { headers: { 'Content-Type': contentType, 'Cache-Control': 'no-store' } })
  }
  return NextResponse.json(metadata, { headers: { 'Cache-Control': 'no-store' } })
}
