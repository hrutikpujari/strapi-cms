/**
 * Article lifecycle hooks.
 *
 * - Automatically calculates `readingTime` (words / 200 wpm) from the
 *   Blocks rich-text content whenever an article is created or updated.
 * - Falls back to `publishedDate` = now when none is provided so
 *   listings can always sort on a real timestamp.
 * - Notifies the Next.js frontend to revalidate its ISR cache whenever
 *   articles are created, updated, published, unpublished, or deleted,
 *   so published changes go live immediately instead of waiting for
 *   the revalidation interval.
 */

type BlockNode = {
  type?: string;
  text?: string;
  children?: BlockNode[];
};

function extractText(nodes: unknown): string {
  if (!Array.isArray(nodes)) return '';
  return (nodes as BlockNode[])
    .map((node) => `${node.text ?? ''} ${extractText(node.children)}`)
    .join(' ');
}

function computeReadingTime(content: unknown): number {
  const words = extractText(content).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function fillDefaults(data: Record<string, unknown>) {
  if (data.content) {
    data.readingTime = computeReadingTime(data.content);
  }
  if (!data.publishedDate) {
    data.publishedDate = new Date();
  }
}

function notifyFrontend() {
  const base = process.env.FRONTEND_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!base || !secret) return;

  fetch(`${base}/api/revalidate?secret=${encodeURIComponent(secret)}`, {
    method: 'POST',
  }).catch((err) =>
    strapi.log.warn(`[revalidate] Failed to reach frontend: ${err.message}`)
  );
}

const revalidate = () => notifyFrontend();

export default {
  beforeCreate(event: { params: { data: Record<string, unknown> } }) {
    fillDefaults(event.params.data);
  },
  beforeUpdate(event: { params: { data: Record<string, unknown> } }) {
    fillDefaults(event.params.data);
  },
  afterCreate: revalidate,
  afterUpdate: revalidate,
  afterDelete: revalidate,
};
