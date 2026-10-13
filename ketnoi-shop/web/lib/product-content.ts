import content from './product-content.json';
import type { ProductDetail, ProductSpec } from './types';

interface VerifiedProductContent {
  brand: string;
  model: string;
  shortDesc: string;
  description: string;
  specs: ProductSpec[];
  source: { title: string; url: string; checkedAt: string };
}

const verifiedContent: Record<string, VerifiedProductContent> = content;

function specKey(name: string): string {
  return name.normalize('NFC').trim().toLocaleLowerCase('vi');
}

export function getVerifiedProductContent(sku: string): VerifiedProductContent | undefined {
  return verifiedContent[sku];
}

// Enrich only exact SKUs that were checked against first-party product pages.
// Price, inventory, sales, reviews, warranty and commercial terms stay from API.
export function withProductContent<T extends ProductDetail>(product: T): T {
  const entry = getVerifiedProductContent(product.sku);
  if (!entry || (product.brand && product.brand.name.toLowerCase() !== entry.brand.toLowerCase())) {
    return product;
  }
  const verifiedSpecNames = new Set(entry.specs.map((spec) => specKey(spec.specName)));
  const specs = (product.specs ?? []).filter((spec) => !verifiedSpecNames.has(specKey(spec.specName)));
  return {
    ...product,
    shortDesc: entry.shortDesc,
    description: entry.description,
    specs: [...specs, ...entry.specs],
  };
}
