import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

const TARGET_URL = 'https://xtreme-scraper-git-auto-builder-5df621-strategic-minds-advisory.vercel.app'

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 0.5 },
  tablet: { width: 768, height: 1024, deviceScaleFactor: 0.5 },
  mobile: { width: 390, height: 844, deviceScaleFactor: 1 },
} as const

type ViewportName = keyof typeof VIEWPORTS

type BrowserWorkerResponse = {
  ok?: boolean
  status?: string
  worker_version?: string
  browser?: { name?: string; version?: string }
  timing?: { duration_ms?: number }
  navigation?: { final_url?: string }
  steps?: unknown[]
  artifacts?: {
    screenshots?: string[]
    console_errors?: string[]
    network_errors?: string[]
  }
  errors?: string[]
  warnings?: string[]
  receipt_id?: string
}

export async function GET(request: NextRequest) {
  const viewportName = (request.nextUrl.searchParams.get('viewport') || 'desktop') as ViewportName
  const format = request.nextUrl.searchParams.get('format') || 'png'
  const viewport = VIEWPORTS[viewportName]

  if (!viewport) {
    return Response.json({ ok: false, error: 'Unsupported viewport' }, { status: 400 })
  }

  const workerUrl = (process.env.BROWSER_WORKER_URL || 'https://browserworker.vercel.app').replace(/\/$/, '')
  const workerSecret = process.env.BROWSER_WORKER_SECRET || process.env.BROWSER_WORKER_TOKEN || ''

  if (!workerSecret) {
    return Response.json({ ok: false, error: 'BrowserWorker secret is not configured' }, { status: 503 })
  }

  const payload = {
    version: '1.0',
    job_id: `xtreme-scraper-parity-${viewportName}-${Date.now()}`,
    correlation_id: 'xtreme-scraper-pr3-parity',
    objective: `Validate XTREME-SCRAPER Intelora homepage at ${viewport.width}x${viewport.height}`,
    url: TARGET_URL,
    viewport,
    timeout_ms: 90000,
    capture: { screenshot: true, console: true, network_errors: true },
    steps: [
      { action: 'goto', url: TARGET_URL, timeout_ms: 60000 },
      { action: 'wait_for_selector', selector: 'body', timeout_ms: 15000 },
      { action: 'wait', milliseconds: 2500 },
      { action: 'get_title' },
      { action: 'get_viewport' },
      { action: 'evaluate_safe', operation: 'performance' },
      { action: 'screenshot', fullPage: false },
      { action: 'capture_console' },
      { action: 'capture_network_errors' },
    ],
  }

  const response = await fetch(`${workerUrl}/api/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${workerSecret}`,
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })

  const result = (await response.json()) as BrowserWorkerResponse

  if (!response.ok || !result.ok) {
    return Response.json({ ok: false, worker_http_status: response.status, result }, { status: 502 })
  }

  const screenshot = result.artifacts?.screenshots?.[0]

  if (format === 'json') {
    return Response.json({
      ok: true,
      viewport: viewportName,
      configured_viewport: viewport,
      worker_status: result.status,
      worker_version: result.worker_version,
      browser: result.browser,
      duration_ms: result.timing?.duration_ms,
      final_url: result.navigation?.final_url,
      steps: result.steps,
      screenshot_available: Boolean(screenshot),
      console_errors: result.artifacts?.console_errors || [],
      network_errors: result.artifacts?.network_errors || [],
      errors: result.errors || [],
      warnings: result.warnings || [],
      receipt_id: result.receipt_id,
    }, { headers: { 'Cache-Control': 'no-store' } })
  }

  if (!screenshot?.startsWith('data:image/png;base64,')) {
    return Response.json({
      ok: false,
      error: 'BrowserWorker completed but did not return an inline screenshot',
      viewport: viewportName,
      result,
    }, { status: 422 })
  }

  const png = Buffer.from(screenshot.slice('data:image/png;base64,'.length), 'base64')

  return new Response(png, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store',
      'X-BrowserWorker-Status': result.status || 'unknown',
      'X-BrowserWorker-Receipt': result.receipt_id || '',
      'X-Console-Errors': String(result.artifacts?.console_errors?.length || 0),
      'X-Network-Errors': String(result.artifacts?.network_errors?.length || 0),
    },
  })
}
