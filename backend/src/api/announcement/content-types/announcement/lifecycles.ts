import { notifyFrontend } from '../../../../utils/notify-frontend';

/**
 * Notify the Next.js frontend to revalidate cached pages whenever
 * entries are created, updated, published, or deleted.
 */
export default {
  afterCreate: notifyFrontend,
  afterUpdate: notifyFrontend,
  afterDelete: notifyFrontend,
};
