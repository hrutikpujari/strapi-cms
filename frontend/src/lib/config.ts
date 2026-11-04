/**
 * Centralized environment configuration.
 * Server-only values must never be prefixed NEXT_PUBLIC_.
 */
export const config = {
  strapiUrl: (
    process.env.STRAPI_URL ??
    process.env.NEXT_PUBLIC_STRAPI_URL ??
    'http://localhost:1337'
  ).replace(/\/$/, ''),
  publicStrapiUrl: (
    process.env.NEXT_PUBLIC_STRAPI_URL ?? 'http://localhost:1337'
  ).replace(/\/$/, ''),
  apiToken: process.env.STRAPI_API_TOKEN ?? '',
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
  revalidate: Number(process.env.REVALIDATE_SECONDS ?? 60),
};
