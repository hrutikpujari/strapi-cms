import { factories } from '@strapi/strapi';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default factories.createCoreController(
  'api::newsletter-subscriber.newsletter-subscriber',
  ({ strapi }) => ({
    /**
     * POST /api/newsletter-subscribers/subscribe
     * Body: { "data": { "email": "user@example.com" } }
     *
     * Validates the email, silently deduplicates existing subscribers
     * (idempotent — re-subscribing an active email is a no-op), and
     * re-activates previously unsubscribed emails.
     */
    async subscribe(ctx) {
      const email = String(ctx.request.body?.data?.email ?? '')
        .trim()
        .toLowerCase();

      if (!EMAIL_RE.test(email) || email.length > 254) {
        return ctx.badRequest('A valid email address is required');
      }

      const existing = await strapi
        .documents('api::newsletter-subscriber.newsletter-subscriber')
        .findFirst({ filters: { email } });

      if (existing) {
        if (existing.status === 'unsubscribed') {
          await strapi
            .documents('api::newsletter-subscriber.newsletter-subscriber')
            .update({
              documentId: existing.documentId,
              data: { status: 'active', subscribedAt: new Date() },
            });
        }
        ctx.body = { data: { email, status: 'active' } };
        return;
      }

      const subscriber = await strapi
        .documents('api::newsletter-subscriber.newsletter-subscriber')
        .create({
          data: { email, status: 'active', subscribedAt: new Date() },
        });

      ctx.body = { data: { email: subscriber.email, status: subscriber.status } };
    },
  })
);
