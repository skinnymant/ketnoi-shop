'use client';

import { isMetricPage, parseMetricPayload, routeGroupOf, type MetricPayload, type RouteGroup, type StoreEvent } from './metrics';

let sentCount = 0;

export function metricsAllowed(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const browser = navigator as Navigator & { globalPrivacyControl?: boolean };
  const legacyWindow = window as Window & { doNotTrack?: string };
  return browser.globalPrivacyControl !== true &&
    !['1', 'yes'].includes(browser.doNotTrack ?? '') && legacyWindow.doNotTrack !== '1';
}

function sendMetric(payload: MetricPayload): void {
  if (!metricsAllowed() || !isMetricPage(window.location.pathname) || sentCount >= 100) return;
  if (!parseMetricPayload(payload)) return;
  sentCount += 1;
  // keepalive survives page exit. Unlike sendBeacon, fetch lets this request
  // explicitly omit cookies and the full same-origin Referrer URL.
  try {
    void fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      cache: 'no-store',
    }).catch(() => {});
  } catch {
    // Measurement is optional and must never interrupt checkout or navigation.
  }
}

export function trackStoreEvent(event: StoreEvent, routeGroup?: RouteGroup): void {
  if (typeof window === 'undefined') return;
  sendMetric({ type: 'event', routeGroup: routeGroup ?? routeGroupOf(window.location.pathname), event, count: 1 });
}

export function sendWebVital(metric: { name: string; value: number; rating: string }, routeGroup: RouteGroup): void {
  const payload = parseMetricPayload({ type: 'vital', routeGroup,
    metric: metric.name,
    value: Math.round(metric.value * (metric.name === 'CLS' ? 10_000 : 10)) / (metric.name === 'CLS' ? 10_000 : 10),
    rating: metric.rating });
  if (payload) sendMetric(payload);
}
