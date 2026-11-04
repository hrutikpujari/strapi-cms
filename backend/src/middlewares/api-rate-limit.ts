import type { Core } from '@strapi/strapi';

/**
 * Simple in-memory rate limiter for the public Content API (`/api/*`).
 *
 * Per-instance and best-effort — for production deployments behind a CDN
 * or platform edge (Vercel, Cloudflare, an API gateway), prefer enforcing
 * limits there and keep this as a second line of defense.
 */
export default (
  config: { windowMs?: number; max?: number },
  { strapi }: { strapi: Core.Strapi }
) => {
  const windowMs = config.windowMs ?? 60_000;
  const max = config.max ?? 120;
  const hits = new Map<string, { count: number; reset: number }>();
  let lastSweep = Date.now();

  return async (ctx: any, next: () => Promise<void>) => {
    if (!ctx.path.startsWith('/api/')) {
      return next();
    }

    const now = Date.now();

    // Periodically drop expired entries so the map does not grow forever.
    if (now - lastSweep > windowMs) {
      for (const [key, entry] of hits) {
        if (now > entry.reset) hits.delete(key);
      }
      lastSweep = now;
    }

    const key = ctx.ip;
    const entry = hits.get(key) ?? { count: 0, reset: now + windowMs };
    if (now > entry.reset) {
      entry.count = 0;
      entry.reset = now + windowMs;
    }
    entry.count += 1;
    hits.set(key, entry);

    if (entry.count > max) {
      strapi.log.warn(`[rate-limit] ${key} exceeded ${max} req/${windowMs}ms on ${ctx.path}`);
      ctx.status = 429;
      ctx.body = {
        error: {
          status: 429,
          name: 'TooManyRequests',
          message: 'Rate limit exceeded. Please retry later.',
        },
      };
      return;
    }

    return next();
  };
};
