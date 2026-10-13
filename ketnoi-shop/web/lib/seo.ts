// One public origin for canonical URLs, structured data and crawl directives.
// The production site redirects the old apex hostname to www.
export const PRODUCTION_SITE_URL = 'https://www.swevietnam.com';

export function normalizeSiteUrl(value?: string): string {
  if (!value?.trim()) return PRODUCTION_SITE_URL;
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
      return PRODUCTION_SITE_URL;
    }
    if (['swevietnam.com', 'www.swevietnam.com'].includes(url.hostname)) {
      return PRODUCTION_SITE_URL;
    }
    return url.origin;
  } catch {
    return PRODUCTION_SITE_URL;
  }
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

export function absoluteUrl(path = '/'): string {
  return new URL(path, `${SITE_URL}/`).toString();
}

export function serializeJsonLd(value: unknown): string {
  // Prevent text supplied by an API from closing a JSON-LD script element.
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
