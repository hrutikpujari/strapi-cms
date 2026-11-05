import type { Core } from '@strapi/strapi';
import { configurePublicPermissions } from './bootstrap/permissions';
import { ensureFrontendToken } from './bootstrap/api-token';
import { ensureAdminUser } from './bootstrap/admin-user';
import { seedDemoData } from './bootstrap/seed';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * On every start it:
   *  1. Grants the Public role read access to published content
   *     plus the two public mutations (view count, newsletter subscribe).
   *  2. Ensures a scoped Content API token exists for the Next.js app.
   *  3. Seeds realistic demo content when the database is empty.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await configurePublicPermissions(strapi);
    await ensureFrontendToken(strapi);
    await ensureAdminUser(strapi);
    await seedDemoData(strapi);
  },
};
