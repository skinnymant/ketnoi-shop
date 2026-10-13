export const SHIPPING_FLAT = 30_000;
export const DEFAULT_FREESHIP_THRESHOLD = 2_000_000;

// Empty, malformed, zero, and negative settings must not accidentally waive
// shipping. This is the same fallback shown by the storefront.
export function resolveFreeshipThreshold(value: unknown): number {
  if (typeof value !== 'string' || !value.trim()) {
    return DEFAULT_FREESHIP_THRESHOLD;
  }
  const threshold = Number(value);
  return Number.isSafeInteger(threshold) && threshold > 0
    ? threshold
    : DEFAULT_FREESHIP_THRESHOLD;
}

export function calculateShippingFee(
  subtotal: number,
  products: readonly { freeShip?: boolean }[],
  threshold: number,
): number {
  const everyProductShipsFree =
    products.length > 0 &&
    products.every((product) => product.freeShip === true);
  return everyProductShipsFree || subtotal >= threshold ? 0 : SHIPPING_FLAT;
}
