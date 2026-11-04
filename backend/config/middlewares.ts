import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Middlewares => [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      // Server-side Next.js fetches do not need CORS; this mainly governs
      // browser-originated calls. Override with CORS_ORIGIN (comma-separated).
      origin: env.array('CORS_ORIGIN', ['http://localhost:3000']),
      headers: ['Content-Type', 'Authorization'],
    },
  },
  {
    // In-memory rate limit for /api/* — tune via env in production.
    name: 'global::api-rate-limit',
    config: {
      windowMs: env.int('RATE_LIMIT_WINDOW_MS', 60_000),
      max: env.int('RATE_LIMIT_MAX', 120),
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;
