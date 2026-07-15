/**
 * BrowserWorker Client — XTREME-SCRAPER
 * Server-side only. Authenticates via BROWSER_WORKER_TOKEN ?? BROWSER_WORKER_SECRET.
 */
const BW_URL = process.env.BROWSER_WORKER_URL || 'https://browserworker.vercel.app';
const BW_SECRET = process.env.BROWSER_WORKER_TOKEN || process.env.BROWSER_WORKER_SECRET || '';

export async function bwHealth(): Promise<{ ok: boolean; status: string; configured: boolean }> {
  try {
    const res = await fetch(BW_URL + '/api/health');
    const data = await res.json();
    return { ok: data.ok, status: data.status || 'ok', configured: true };
  } catch {
    return { ok: false, status: 'unreachable', configured: !!BW_SECRET };
  }
}

export async function bwLaunchCheck(): Promise<boolean> {
  if (!BW_SECRET) return false;
  try {
    const res = await fetch(BW_URL + '/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + BW_SECRET },
      body: JSON.stringify({ version: '1.0', type: 'launch-check', job_id: 'scraper-launch-' + Date.now() }),
    });
    const data = await res.json();
    return data.status === 'pass';
  } catch { return false; }
}

export async function bwScrape(url: string, jobId?: string): Promise<{
  ok: boolean; status?: string; title?: string; finalUrl?: string; error?: string;
}> {
  if (!BW_SECRET) return { ok: false, error: 'BROWSER_WORKER_SECRET not configured' };
  const correlationId = jobId || 'scraper-' + Date.now();
  try {
    const res = await fetch(BW_URL + '/api/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + BW_SECRET,
        'X-Correlation-Id': correlationId,
      },
      body: JSON.stringify({
        version: '1.0',
        job_id: correlationId,
        steps: [
          { action: 'goto', url },
          { action: 'get_title' },
          { action: 'get_url' },
        ],
        timeout_ms: 30000,
      }),
    });
    const data = await res.json();
    return {
      ok: data.status === 'pass',
      status: data.status,
      title: data.navigation?.title,
      finalUrl: data.navigation?.final_url,
      error: data.errors?.[0],
    };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
