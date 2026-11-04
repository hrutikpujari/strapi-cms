import type { Core } from '@strapi/strapi';

/**
 * Actions exposed to the unauthenticated Public role.
 *
 * Everything else (create / update / delete on any content type,
 * subscriber management, settings mutation) requires either the
 * admin panel session or a scoped API token.
 */
export const PUBLIC_ACTIONS = [
  'api::article.article.find',
  'api::article.article.findOne',
  'api::article.article.incrementView',
  'api::category.category.find',
  'api::category.category.findOne',
  'api::author.author.find',
  'api::author.author.findOne',
  'api::tag.tag.find',
  'api::tag.tag.findOne',
  'api::website-setting.website-setting.find',
  'api::newsletter-subscriber.newsletter-subscriber.subscribe',
  'api::contact-message.contact-message.submit',
];

/**
 * Idempotently grants PUBLIC_ACTIONS to the Public role.
 * Runs on every bootstrap — safe to re-run.
 */
export async function configurePublicPermissions(strapi: Core.Strapi) {
  const role = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });

  if (!role) {
    strapi.log.warn('[bootstrap] Public role not found — skipping permission setup');
    return;
  }

  for (const action of PUBLIC_ACTIONS) {
    const existing = await strapi.db
      .query('plugin::users-permissions.permission')
      .findOne({ where: { action, role: role.id } });

    if (!existing) {
      await strapi.db.query('plugin::users-permissions.permission').create({
        data: { action, role: role.id, enabled: true },
      });
    } else if (!existing.enabled) {
      await strapi.db
        .query('plugin::users-permissions.permission')
        .update({ where: { id: existing.id }, data: { enabled: true } });
    }
  }

  strapi.log.info(`[bootstrap] Public role configured with ${PUBLIC_ACTIONS.length} API permissions`);
}
