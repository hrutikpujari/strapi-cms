/**
 * Pings the Next.js frontend's /api/revalidate endpoint after content
 * changes so ISR caches are invalidated immediately instead of waiting
 * for the revalidation interval.
 */
export function notifyFrontend() {
  const base = process.env.FRONTEND_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!base || !secret) return;

  fetch(`${base}/api/revalidate?secret=${encodeURIComponent(secret)}`, {
    method: 'POST',
  }).catch((err) =>
    strapi.log.warn(`[revalidate] Failed to reach frontend: ${err.message}`)
  );
}
