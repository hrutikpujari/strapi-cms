import React from 'react';
import Image from 'next/image';
import type { BlockInlineChild, BlockNode, BlockTextChild } from '@/types/strapi';
import { mediaUrl } from '@/lib/strapi';
import { slugify, blocksToText } from '@/lib/utils';

/**
 * Safe renderer for Strapi Blocks rich text.
 * Renders a typed AST to semantic HTML — no dangerouslySetInnerHTML.
 */

function renderInline(children: (BlockInlineChild | BlockNode)[] | undefined): React.ReactNode {
  if (!children) return null;
  return children.map((child, i) => {
    if (child.type === 'link') {
      const link = child as { url: string; children: BlockTextChild[] };
      const external = /^https?:\/\//.test(link.url);
      return (
        <a
          key={i}
          href={link.url}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {renderInline(link.children)}
        </a>
      );
    }
    if (child.type === 'text') {
      const t = child as BlockTextChild;
      let node: React.ReactNode = t.text;
      if (t.code) node = <code>{node}</code>;
      if (t.bold) node = <strong>{node}</strong>;
      if (t.italic) node = <em>{node}</em>;
      if (t.underline) node = <u>{node}</u>;
      if (t.strikethrough) node = <s>{node}</s>;
      return <React.Fragment key={i}>{node}</React.Fragment>;
    }
    return null;
  });
}

function Block({ node }: { node: BlockNode }) {
  switch (node.type) {
    case 'paragraph':
      return <p>{renderInline(node.children as BlockInlineChild[])}</p>;

    case 'heading': {
      const level = Math.min(Math.max(node.level ?? 2, 2), 4);
      const Tag = `h${level}` as 'h2' | 'h3' | 'h4';
      const id = slugify(blocksToText(node.children as BlockNode[]));
      return <Tag id={id}>{renderInline(node.children as BlockInlineChild[])}</Tag>;
    }

    case 'list': {
      const Tag = node.format === 'ordered' ? 'ol' : 'ul';
      return (
        <Tag>
          {(node.children as BlockNode[])
            ?.filter((c) => c.type === 'list-item')
            .map((item, i) => <li key={i}>{renderInline(item.children as BlockInlineChild[])}</li>)}
        </Tag>
      );
    }

    case 'quote':
      return <blockquote>{renderInline(node.children as BlockInlineChild[])}</blockquote>;

    case 'code': {
      const text = blocksToText(node.children as BlockNode[]);
      return (
        <pre>
          <code>{text}</code>
        </pre>
      );
    }

    case 'image': {
      const img = node.image;
      const src = mediaUrl(img?.url ?? (node as { url?: string }).url);
      if (!src) return null;
      return (
        <figure className="my-8">
          <Image
            src={src}
            alt={img?.alternativeText ?? ''}
            width={img?.width ?? 1200}
            height={img?.height ?? 800}
            className="rounded-xl"
          />
          {img?.alternativeText && (
            <figcaption className="mt-2 text-center text-sm text-faint">
              {img.alternativeText}
            </figcaption>
          )}
        </figure>
      );
    }

    default:
      return null;
  }
}

export function BlocksRenderer({ content }: { content: BlockNode[] | null | undefined }) {
  if (!content?.length) return null;
  return (
    <div className="prose-body">
      {content.map((node, i) => (
        <Block key={i} node={node} />
      ))}
    </div>
  );
}
