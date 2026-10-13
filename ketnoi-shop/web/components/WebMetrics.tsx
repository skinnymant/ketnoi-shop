'use client';

import { useEffect } from 'react';
import { useReportWebVitals } from 'next/web-vitals';
import { sendWebVital, trackStoreEvent } from '@/lib/metrics-client';
import { isMetricPage, routeGroupOf } from '@/lib/metrics';

// Web Vitals describe the initial document, not each Next.js client navigation.
// Retain only its coarse group; IDs, entries, URLs and query strings are dropped.
const initialRouteGroup = typeof window === 'undefined' ? 'other' : routeGroupOf(window.location.pathname);
const initialPageAllowed = typeof window !== 'undefined' && isMetricPage(window.location.pathname);
const reportVitals: Parameters<typeof useReportWebVitals>[0] = (metric) => {
  if (initialPageAllowed) sendWebVital(metric, initialRouteGroup);
};

export default function WebMetrics() {
  useReportWebVitals(reportVitals);
  return null;
}

export function ProductViewMetric() {
  useEffect(() => {
    // Delay one tick so React's development effect replay cancels the first
    // attempt. No path, product ID or query is written to storage or transmitted.
    const timer = window.setTimeout(() => trackStoreEvent('product_view', 'product'), 0);
    return () => window.clearTimeout(timer);
  }, []);
  return null;
}
