import { handleMetricsRequest } from '@/lib/metrics';
import { SITE_URL } from '@/lib/seo';

export const runtime = 'nodejs';
export const maxDuration = 5;

function trustedOrigins(request: Request): string[] {
  const origins = new Set([SITE_URL, 'https://www.swevietnam.com', 'https://swevietnam.com']);
  for (const host of [process.env.VERCEL_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]) {
    if (host) {
      try { origins.add(new URL(`https://${host.trim()}`).origin); } catch { /* Ignore invalid deployment configuration. */ }
    }
  }
  const requestUrl = new URL(request.url);
  requestUrl.host = request.headers.get('host') || requestUrl.host;
  if (process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1', '[::1]'].includes(requestUrl.hostname)) {
    origins.add(requestUrl.origin);
  }
  return [...origins];
}

export function POST(request: Request) {
  return handleMetricsRequest(request, { allowedOrigins: trustedOrigins(request) });
}
