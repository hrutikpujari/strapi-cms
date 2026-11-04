import { factories } from '@strapi/strapi';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default factories.createCoreController(
  'api::contact-message.contact-message',
  ({ strapi }) => ({
    /**
     * POST /api/contact-messages/submit
     * Body: { "data": { "name": "...", "email": "...", "subject": "...", "message": "..." } }
     *
     * Validates and stores a contact-form submission. Rate-limited at
     * the API middleware level like every other public endpoint.
     */
    async submit(ctx) {
      const data = ctx.request.body?.data ?? {};
      const name = String(data.name ?? '').trim();
      const email = String(data.email ?? '').trim().toLowerCase();
      const subject = String(data.subject ?? '').trim();
      const message = String(data.message ?? '').trim();

      if (!name || name.length > 120) {
        return ctx.badRequest('A name (max 120 characters) is required');
      }
      if (!EMAIL_RE.test(email) || email.length > 254) {
        return ctx.badRequest('A valid email address is required');
      }
      if (!message || message.length > 5000) {
        return ctx.badRequest('A message (max 5000 characters) is required');
      }

      const entry = await strapi
        .documents('api::contact-message.contact-message')
        .create({
          data: {
            name,
            email,
            subject: subject.slice(0, 200),
            message,
            status: 'new',
            submittedAt: new Date(),
          },
        });

      ctx.body = { data: { documentId: entry.documentId, status: 'received' } };
    },
  })
);
