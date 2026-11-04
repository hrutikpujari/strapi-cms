import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::article.article', ({ strapi }) => ({
  /**
   * POST /api/articles/:documentId/view
   * Atomically increments the public view counter of a published article.
   */
  async incrementView(ctx) {
    const { documentId } = ctx.params;

    const article = await strapi.documents('api::article.article').findOne({
      documentId,
      status: 'published',
    });

    if (!article) {
      return ctx.notFound('Article not found');
    }

    const updated = await strapi.documents('api::article.article').update({
      documentId,
      status: 'published',
      data: { viewCount: (article.viewCount ?? 0) + 1 },
    });

    ctx.body = { data: { viewCount: updated?.viewCount ?? null } };
  },
}));
