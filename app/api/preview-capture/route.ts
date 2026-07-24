import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const VIEWPORTS = {
  desktop: { width: 1440, height: 1024, deviceScaleFactor: 0.5 },
  tablet: { width: 1024, height: 768, deviceScaleFactor: 0.5 },
  mobile: { width: 390, height: 844, deviceScaleFactor: 1 },
} as const

type ViewportName = keyof typeof VIEWPORTS

type WorkerReceipt = {
  ok?: boolean
  status?: string
  worker_version?: string
  browser?: { name?: string; version?: string }
  timing?: { duration_ms?: number }
  navigation?: { final_url?: string }
  steps?: Array<{ action?: string; status?: string; result?: Record<string, unknown>; error?: string }>
  artifacts?: { screenshots?: string[]; console_errors?: string[]; network_errors?: string[] }
  errors?: string[]
  warnings?: string[]
  receipt_id?: string
}

function stepResult(receipt: WorkerReceipt, action: string) {
  return receipt.steps?.find(step => step.action === action)?.result || null
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
  const workerUrl = process.env.BROWSER_WORKER_URL || 'https://browserworker.vercel.app'
  if (!secret) return NextResponse.json({ ok: false, error: 'BrowserWorker secret is not configured' }, { status: 503 })

  const targetUrl = `${req.nextUrl.origin}/api/theme-preview?theme=${theme}`
  const jobId = `xps-preview-${viewportName}-${theme}-${Date.now()}`
  const response = await fetch(`${workerUrl.replace(/\/$/, '')}/api/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
    body: JSON.stringify({
      version: '1.0',
      job_id: jobId,
      correlation_id: jobId,
      objective: `Validate XPS Intelligence ${viewportName} ${theme} preview`,
      url: targetUrl,
      viewport,
      timeout_ms: 100000,
      capture: { screenshot: true, console: true, network_errors: true },
      steps: [
        { action: 'goto', url: targetUrl, timeout_ms: 30000 },
        { action: 'wait', milliseconds: 3200 },
        { action: 'wait_for_selector', selector: 'body', timeout_ms: 15000 },
        { action: 'validate_text', selector: 'body', expected: 'Go Beyond Google' },
        { action: 'validate_element', selector: 'form' },
        { action: 'get_title' },
        { action: 'get_url' },
        { action: 'get_viewport' },
        { action: 'evaluate_safe', operation: 'bodyHeight' },
        { action: 'screenshot', fullPage: false },
        { action: 'capture_console' },
        { action: 'capture_network_errors' },
      ],
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(115000),
  })

  const receipt = await response.json().catch(() => null) as WorkerReceipt | null
  if (!response.ok || !receipt) {
    return NextResponse.json({ ok: false, worker_status: response.status, error: 'BrowserWorker request failed', receipt }, { status: 502 })
  }

  const screenshot = receipt.artifacts?.screenshots?.[0] || ''
  const screenshotBase64 = screenshot.startsWith('data:image/png;base64,') ? screenshot.slice('data:image/png;base64,'.length) : ''
  const imageBytes = screenshotBase64 ? Buffer.from(screenshotBase64, 'base64') : null
  const title = stepResult(receipt, 'get_title') as { title?: string } | null
  const viewportResult = stepResult(receipt, 'get_viewport') as { viewport?: unknown } | null
  const bodyHeight = stepResult(receipt, 'evaluate_safe') as { bodyHeight?: number } | null
  const screenshotStep = receipt.steps?.find(step => step.action === 'screenshot')

  const metadata = {
    ok: Boolean(receipt.ok) && receipt.status !== 'fail',
    status: receipt.status,
    viewport: viewportName,
    configured_viewport: viewport,
    actual_viewport: viewportResult?.viewport || null,
    theme,
    screenshot_available: Boolean(imageBytes),
    screenshot_bytes: imageBytes?.byteLength || 0,
    screenshot_step: screenshotStep?.result || null,
    worker_version: receipt.worker_version || null,
    browser_version: receipt.browser?.version || null,
    title: title?.title || null,
    final_url: receipt.navigation?.final_url || null,
    body_height: bodyHeight?.bodyHeight || null,
    duration_ms: receipt.timing?.duration_ms || 0,
    console_errors: receipt.artifacts?.console_errors?.length || 0,
    network_errors: receipt.artifacts?.network_errors?.length || 0,
    console_error_sample: receipt.artifacts?.console_errors?.slice(0, 5) || [],
    network_error_sample: receipt.artifacts?.network_errors?.slice(0, 5) || [],
    errors: receipt.errors || [],
    warnings: receipt.warnings || [],
    receipt_id: receipt.receipt_id || null,
    target_url: targetUrl,
    commit_sha: process.env.VERCEL_GIT_COMMIT_SHA || null,
  }

  if (format === 'image') {
    if (!imageBytes) return NextResponse.json({ ...metadata, error: 'Worker completed, but the screenshot exceeded its inline artifact limit.' }, { status: 422 })
    return new Response(imageBytes, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' } })
  }
  return NextResponse.json(metadata, { status: metadata.ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } })
}
