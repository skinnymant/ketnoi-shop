// Check the live backend, never the cached catalogue, before receiving orders.
export interface StoreStatus {
  available: boolean;
  capabilities: { effectivePriceFilters: boolean; productFreeShipping: boolean };
}
const unavailable: StoreStatus = { available: false, capabilities: { effectivePriceFilters: false, productFreeShipping: false } };

export async function probeStoreStatus(apiBase: string): Promise<StoreStatus> {
  try {
    const response = await fetch(`${apiBase.replace(/\/$/, '')}/health`, {
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return unavailable;
    const body: unknown = await response.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return unavailable;
    const health = body as Record<string, unknown>;
    if (health.status !== 'ok' || health.database !== 'connected') return unavailable;
    const capabilities = health.capabilities as Record<string, unknown> | undefined;
    return { available: true, capabilities: {
      effectivePriceFilters: capabilities?.effectivePriceFilters === true,
      productFreeShipping: capabilities?.productFreeShipping === true,
    } };
  } catch { return unavailable; }
}

export async function probeStoreAvailability(apiBase: string): Promise<boolean> {
  return (await probeStoreStatus(apiBase)).available;
}
