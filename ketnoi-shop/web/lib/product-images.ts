import catalogImages from './catalog-product-images.json';
import type { ProductImage } from './types';

const imagesBySku: Record<string, ProductImage> = catalogImages;

function isPlaceholder(url: string): boolean {
  if (!url.trim()) return true;
  try {
    return new URL(url).hostname.toLowerCase() === 'placehold.co';
  } catch {
    // Local images (including the catalog assets) are valid image paths.
    return false;
  }
}

/** Supply verified model photos only for catalog entries with no real photos. */
export function withProductImages<
  T extends { sku: string; name: string; images: ProductImage[] },
>(product: T): T {
  const photo = imagesBySku[product.sku.trim().toUpperCase()];
  if (!photo) return product;

  const uploaded = (product.images ?? []).filter((image) => !isPlaceholder(image.url));
  return {
    ...product,
    images: uploaded.length ? uploaded : [{ ...photo, alt: photo.alt || product.name }],
  };
}
