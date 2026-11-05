import type { Core } from '@strapi/strapi';

/**
 * Ensures a super-admin account exists when ADMIN_EMAIL and
 * ADMIN_PASSWORD are set in the environment.
 *
 * - No admin user with that email → creates one with the
 *   super-admin role.
 * - Admin already exists → resets its password and reactivates it.
 *
 * Useful on hosts without shell access (e.g. Render free tier)
 * where `strapi admin:reset-user-password` can't be run. Password
 * changes are applied on every boot while the env vars are set —
 * remove them once access is restored if you prefer UI-only resets.
 */
export async function ensureAdminUser(strapi: Core.Strapi) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const userService = strapi.service('admin::user') as any;
  const existing = await strapi.db
    .query('admin::user')
    .findOne({ where: { email } });

  if (existing) {
    await userService.updateById(existing.id, { password, isActive: true });
    strapi.log.info(`[bootstrap] Admin credentials refreshed for ${email}`);
    return;
  }

  const superAdminRole = await strapi.db
    .query('admin::role')
    .findOne({ where: { code: 'strapi-super-admin' } });

  if (!superAdminRole) {
    strapi.log.warn('[bootstrap] Super admin role not found — cannot create admin user');
    return;
  }

  await userService.create({
    email,
    password,
    firstname: 'Admin',
    isActive: true,
    registrationToken: null,
    roles: [superAdminRole.id],
  });
  strapi.log.info(`[bootstrap] Admin user created: ${email}`);
}
