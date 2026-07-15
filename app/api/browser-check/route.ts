import { bwHealth, bwLaunchCheck } from '@/lib/browser-worker';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export async function GET() {
  const health = await bwHealth();
  let chromiumOk = false;
  if (health.ok) {
    chromiumOk = await bwLaunchCheck();
  }
  return Response.json({
    ok: health.ok,
    browserWorkerUrl: process.env.BROWSER_WORKER_URL || 'https://browserworker.vercel.app',
    browserWorkerConfigured: !!(process.env.BROWSER_WORKER_TOKEN || process.env.BROWSER_WORKER_SECRET),
    chromiumLaunched: chromiumOk,
    status: health.status,
    timestamp: new Date().toISOString(),
  });
}
