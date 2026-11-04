import type { BlockNode } from '@/types/strapi';

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Extract plain text from a Strapi Blocks tree. */
export function blocksToText(nodes: BlockNode[] | undefined | null): string {
  if (!nodes) return '';
  const walk = (items: unknown[]): string =>
    items
      .map((n) => {
        const node = n as { text?: string; children?: unknown[] };
        return `${node.text ?? ''} ${node.children ? walk(node.children) : ''}`;
      })
      .join(' ');
  return walk(nodes as unknown[]).replace(/\s+/g, ' ').trim();
}

/** Table-of-contents entries collected from heading blocks. */
export function extractHeadings(nodes: BlockNode[] | undefined | null) {
  if (!nodes) return [];
  return nodes
    .filter((n) => n.type === 'heading')
    .map((n) => {
      const text = blocksToText(n.children as BlockNode[]);
      return { level: n.level ?? 2, text, id: slugify(text) };
    })
    .filter((h) => h.text);
}
