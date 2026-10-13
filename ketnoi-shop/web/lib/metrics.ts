export const ROUTE_GROUPS = ['home', 'product', 'category', 'search', 'cart', 'checkout', 'other'] as const;
export const STORE_EVENTS = ['product_view', 'add_to_cart', 'begin_checkout', 'order_created'] as const;
export const WEB_VITALS = ['LCP', 'INP', 'CLS', 'TTFB', 'FCP'] as const;
export const METRIC_RATINGS = ['good', 'needs-improvement', 'poor'] as const;
export const MAX_METRIC_BODY_BYTES = 1024;

export type RouteGroup = typeof ROUTE_GROUPS[number];
export type StoreEvent = typeof STORE_EVENTS[number];
export type WebVitalName = typeof WEB_VITALS[number];
export type MetricRating = typeof METRIC_RATINGS[number];
export type MetricPayload =
  | { type: 'event'; routeGroup: RouteGroup; event: StoreEvent; count: number }
  | { type: 'vital'; routeGroup: RouteGroup; metric: WebVitalName; value: number; rating: MetricRating };

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

function known<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === 'string' && options.includes(value as T);
}

function exactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}

export function parseMetricPayload(raw: unknown): MetricPayload | null {
  const value = record(raw);
  if (!value || !known(value.routeGroup, ROUTE_GROUPS)) return null;
  if (value.type === 'event' && exactKeys(value, ['type', 'routeGroup', 'event', 'count']) &&
      known(value.event, STORE_EVENTS) && typeof value.count === 'number' &&
      Number.isInteger(value.count) && value.count >= 1 && value.count <= 20) {
    return { type: 'event', routeGroup: value.routeGroup, event: value.event, count: value.count };
  }
  if (value.type === 'vital' && exactKeys(value, ['type', 'routeGroup', 'metric', 'value', 'rating']) &&
      known(value.metric, WEB_VITALS) && known(value.rating, METRIC_RATINGS) &&
      typeof value.value === 'number' && Number.isFinite(value.value) && value.value >= 0 &&
      value.value <= (value.metric === 'CLS' ? 10 : 120_000)) {
    return { type: 'vital', routeGroup: value.routeGroup, metric: value.metric,
      value: value.value, rating: value.rating };
  }
  return null;
}

export function routeGroupOf(pathname: string): RouteGroup {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/san-pham/')) return 'product';
  if (pathname.startsWith('/danh-muc/')) return 'category';
  if (pathname === '/tim-kiem') return 'search';
  if (pathname === '/gio-hang') return 'cart';
  if (pathname === '/thanh-toan') return 'checkout';
  return 'other';
}

export function isMetricPage(pathname: string): boolean {
  return !['/admin', '/dang-nhap', '/dang-ky', '/tai-khoan'].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

// Bound accepted logs per warm function instance without retaining IPs or IDs.
// This is a cost guard, not a distributed firewall or a unique-visitor counter.
let budgetWindowStart = 0;
let budgetUsed = 0;
export function takeMetricBudget(now = Date.now()): boolean {
  if (now - budgetWindowStart >= 60_000 || now < budgetWindowStart) {
    budgetWindowStart = now;
    budgetUsed = 0;
  }
  if (budgetUsed >= 120) return false;
  budgetUsed += 1;
  return true;
}

interface MetricsRequestOptions {
  allowedOrigins: readonly string[];
  log?: (payload: MetricPayload) => void;
  takeBudget?: () => boolean;
}

function response(status: number, extraHeaders: Record<string, string> = {}) {
  return new Response(null, { status, headers: { 'Cache-Control': 'no-store', ...extraHeaders } });
}

export async function handleMetricsRequest(request: Request, options: MetricsRequestOptions): Promise<Response> {
  const origin = request.headers.get('origin');
  // Next.js may expose its internal listener origin in request.url. Match the
  // public Host to an explicitly allowed Origin; never use X-Forwarded-Host.
  const publicHost = (request.headers.get('host') || new URL(request.url).host).toLowerCase();
  let originHost: string | undefined;
  try { if (origin) originHost = new URL(origin).host.toLowerCase(); } catch { /* Reject malformed origins below. */ }
  if (!origin || !options.allowedOrigins.includes(origin) || originHost !== publicHost) {
    return response(403);
  }
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') return response(403);
  if (request.headers.get('dnt') === '1' || request.headers.get('sec-gpc') === '1') return response(204);
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return response(415);
  }
  const length = request.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_METRIC_BODY_BYTES)) return response(413);
  const reader = request.body?.getReader();
  if (!reader) return response(400);
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > MAX_METRIC_BODY_BYTES) {
        await reader.cancel();
        return response(413);
      }
      chunks.push(chunk.value);
    }
  } catch {
    return response(400);
  }
  const body = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let raw: unknown;
  try {
    raw = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body));
  } catch {
    return response(400);
  }
  const payload = parseMetricPayload(raw);
  if (!payload) return response(400);
  if (!(options.takeBudget ?? takeMetricBudget)()) return response(429, { 'Retry-After': '60' });
  // Only the parsed whitelist reaches the logger. No request headers or raw body.
  (options.log ?? ((sample) => console.info(JSON.stringify({ scope: 'swe_web_metrics', ...sample }))))(payload);
  return response(204);
}
