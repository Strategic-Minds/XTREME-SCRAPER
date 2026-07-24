import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (process.env.VERCEL_ENV === 'production') return new Response('Not found', { status: 404 })
  const theme = req.nextUrl.searchParams.get('theme') === 'dark' ? 'dark' : 'light'
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex"></head><body><script>localStorage.setItem('xps-theme', ${JSON.stringify(theme)});location.replace('/?validation_theme=${theme}');</script></body></html>`
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })
}
