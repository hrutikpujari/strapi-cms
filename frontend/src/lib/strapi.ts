import { config } from './config';

type QueryParams = Record<string, string | number | boolean | undefined>;

/**
 * Thin server-side fetch wrapper around the Strapi REST API.
 *
 * - Sends the scoped API token as a Bearer token when configured
 *   (the token stays server-side; public-role data is readable anyway).
 * - Uses Next.js ISR (`next.revalidate`) so pages are statically
 *   generated and refreshed in the background.
 */
export async function strapiFetch<T>(
  path: string,
  params: QueryParams = {},
  init: { revalidate?: number; tags?: string[] } = {}
): Promise<T> {
  const url = new URL(`/api/${path.replace(/^\//, '')}`, config.strapiUrl);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      url.searchParams.append(key, String(value));
    }
  }

  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (config.apiToken) {
    headers.Authorization = `Bearer ${config.apiToken}`;
  }

  const doFetch = () =>
    fetch(url.toString(), {
      headers,
      next: { revalidate: init.revalidate ?? config.revalidate, tags: init.tags },
    });

  let res = await doFetch();
  // Retry transient 429/5xx — SSG builds can burst past Strapi's rate limit.
  for (let attempt = 1; !res.ok && attempt <= 2; attempt++) {
    if (res.status !== 429 && res.status < 500) break;
    await new Promise((r) => setTimeout(r, 1000 * attempt + Math.random() * 500));
    res = await doFetch();
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Strapi ${path} → ${res.status} ${res.statusText} ${body.slice(0, 200)}`);
  }

  return res.json() as Promise<T>;
}

/** Resolve a Strapi media URL (relative `/uploads/...`) to an absolute URL. */
export function mediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${config.publicStrapiUrl}${url}`;
}
