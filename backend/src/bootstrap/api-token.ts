import { promises as fs } from 'fs';
import path from 'path';
import type { Core } from '@strapi/strapi';
import { PUBLIC_ACTIONS } from './permissions';

const TOKEN_NAME = 'frontend-content-api';
const TOKEN_FILE = path.join(process.cwd(), '.frontend-api-token');

/**
 * Ensures a scoped Content API token exists for the Next.js frontend.
 *
 * The token is "custom" scoped to exactly the actions the site needs —
 * nothing else. The plaintext key is only returned once by Strapi, so it
 * is written to `backend/.frontend-api-token` (gitignored) where it can
 * be copied into the frontend's STRAPI_API_TOKEN env var.
 */
export async function ensureFrontendToken(strapi: Core.Strapi) {
  const service = strapi.service('admin::api-token-content-api') as any;

  const existing = await service.getByName(TOKEN_NAME);
  if (existing) {
    try {
      await fs.access(TOKEN_FILE);
      return; // token + stored key both exist, nothing to do
    } catch {
      strapi.log.warn(
        `[bootstrap] API token "${TOKEN_NAME}" exists but its key was not stored. ` +
          'Regenerate it in Settings → API Tokens and update STRAPI_API_TOKEN.'
      );
      return;
    }
  }

  const created = await service.create({
    name: TOKEN_NAME,
    description: 'Scoped read + view-count/subscribe token used by the Next.js frontend',
    type: 'custom',
    lifespan: null,
    permissions: PUBLIC_ACTIONS,
  });

  if (created?.accessKey) {
    await fs.writeFile(TOKEN_FILE, created.accessKey, 'utf8');
    strapi.log.info(
      `[bootstrap] Created frontend API token — key stored in ${TOKEN_FILE}`
    );
  }
}
