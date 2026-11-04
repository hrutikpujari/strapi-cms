/**
 * TypeScript types matching the Strapi 5 flattened REST API responses.
 * Strapi v5 returns entities without the v4 `attributes` wrapper.
 */

export interface StrapiImageFormat {
  url: string;
  width: number;
  height: number;
}

export interface StrapiImage {
  id: number;
  documentId: string;
  url: string;
  alternativeText: string | null;
  caption?: string | null;
  width: number;
  height: number;
  formats?: Record<string, StrapiImageFormat> | null;
}

export interface SocialLinks {
  id?: number;
  twitter?: string | null;
  linkedin?: string | null;
  github?: string | null;
  instagram?: string | null;
  website?: string | null;
}

export interface Tag {
  id: number;
  documentId: string;
  name: string;
  slug: string;
}

export interface Category {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  description: string | null;
  image?: StrapiImage | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface Author {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  avatar?: StrapiImage | null;
  bio?: string | null;
  designation?: string | null;
  socialLinks?: SocialLinks | null;
}

/* ---- Strapi Blocks rich text ---- */
export interface BlockTextChild {
  type: 'text';
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
}

export interface BlockLinkChild {
  type: 'link';
  url: string;
  children: BlockTextChild[];
}

export type BlockInlineChild = BlockTextChild | BlockLinkChild;

export interface BlockNode {
  type: 'paragraph' | 'heading' | 'list' | 'list-item' | 'quote' | 'code' | 'image';
  level?: number;
  format?: 'ordered' | 'unordered';
  children?: (BlockNode | BlockInlineChild)[];
  text?: string;
  url?: string;
  image?: { url: string; alternativeText?: string | null; width: number; height: number };
}

export interface Article {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  excerpt: string;
  content: BlockNode[];
  featuredImage?: StrapiImage | null;
  thumbnailImage?: StrapiImage | null;
  ogImage?: StrapiImage | null;
  author?: Author | null;
  category?: Category | null;
  tags?: Tag[] | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  featured: boolean;
  publishedDate: string;
  readingTime: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface WebsiteSettings {
  id: number;
  documentId: string;
  siteName: string;
  logo?: StrapiImage | null;
  favicon?: StrapiImage | null;
  siteDescription?: string | null;
  socialLinks?: SocialLinks | null;
  contactEmail?: string | null;
  footerContent?: string | null;
  defaultSeoTitle?: string | null;
  defaultSeoDescription?: string | null;
  defaultOgImage?: StrapiImage | null;
}

export interface Pagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface StrapiListResponse<T> {
  data: T[];
  meta: { pagination: Pagination };
}

export interface StrapiSingleResponse<T> {
  data: T | null;
  meta: Record<string, unknown>;
}
