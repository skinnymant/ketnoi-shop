'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getStoreContact } from '@/lib/store-info';
import type { StoreStatus } from '@/lib/store-status';

type Status = 'checking' | 'available' | 'unavailable';
const noCapabilities = { effectivePriceFilters: false, productFreeShipping: false };
const StoreContext = createContext<{ status: Status; capabilities: StoreStatus['capabilities']; retry: () => void }>({ status: 'checking', capabilities: noCapabilities, retry: () => {} });
export function useStoreAvailability() { return useContext(StoreContext); }

export function StoreAvailabilityProvider({ children, initialStatus }: { children: React.ReactNode; initialStatus?: StoreStatus }) {
  const [status, setStatus] = useState<Status>(initialStatus ? (initialStatus.available ? 'available' : 'unavailable') : 'checking');
  const [capabilities, setCapabilities] = useState(initialStatus?.available ? initialStatus.capabilities : noCapabilities);
  const [revision, setRevision] = useState(0);
  const retry = useCallback(() => setRevision((n) => n + 1), []);
  useEffect(() => {
    let disposed = false;
    let inFlight = false;
    let controller: AbortController | undefined;
    async function check() {
      if (inFlight || disposed) return;
      inFlight = true;
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 6000);
      try {
        const response = await fetch('/api/store-status', { cache: 'no-store', signal: controller.signal });
        const data = await response.json();
        if (!disposed) {
          const available = response.ok && data.available === true;
          setStatus(available ? 'available' : 'unavailable');
          setCapabilities(available ? {
            effectivePriceFilters: data.capabilities?.effectivePriceFilters === true,
            productFreeShipping: data.capabilities?.productFreeShipping === true,
          } : noCapabilities);
        }
      } catch {
        if (!disposed) { setStatus('unavailable'); setCapabilities(noCapabilities); }
      } finally { clearTimeout(timeout); inFlight = false; }
    }
    // SSR has just checked live health. Keep manual retry immediate and refresh
    // on visibility / each minute without repeating the first request.
    if (!initialStatus || revision > 0) void check();
    const interval = setInterval(() => { if (!document.hidden) void check(); }, 60000);
    const onVisible = () => { if (!document.hidden) void check(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      disposed = true;
      controller?.abort();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [initialStatus, revision]);
  const contact = getStoreContact();
  return (
    <StoreContext.Provider value={{ status, capabilities, retry }}>
      {status === 'unavailable' && (
        <div role="status" className="border-y border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-1">
            <p className="flex-1">Nhận đơn trực tuyến đang tạm gián đoạn. Liên hệ SWE để xác nhận giá và tồn kho.</p>
            <a className="font-semibold underline" href={contact.tel}>Gọi SWE</a>
            <a className="font-semibold underline" href={contact.zalo} target="_blank" rel="noopener noreferrer">Zalo</a>
            <button type="button" onClick={retry} className="min-h-9 underline">Kiểm tra lại</button>
          </div>
        </div>
      )}
      {children}
    </StoreContext.Provider>
  );
}

export function FreeShippingBadge({ eligible, className = '' }: { eligible: boolean; className?: string }) {
  const { status, capabilities } = useStoreAvailability();
  if (!eligible || status !== 'available' || !capabilities.productFreeShipping) return null;
  return <span className={className}>Miễn phí vận chuyển</span>;
}

export function ProductStock({ stock }: { stock: number }) {
  const { status } = useStoreAvailability();
  return (
    <p className="mt-3 text-sm font-medium text-teal-700" aria-live="polite">
      {status !== 'available' ? 'Liên hệ xác nhận tồn kho' : stock > 0 ? 'Có hàng — xác nhận số lượng khi đặt đơn' : 'Tạm hết hàng — liên hệ đặt trước'}
    </p>
  );
}
