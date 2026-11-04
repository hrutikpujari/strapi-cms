import type { Metadata } from 'next';
import { config } from './config';
import { mediaUrl } from './strapi';
import type { Article, WebsiteSettings } from '@/types/strapi';

/** Build consistent page metadata with OG + Twitter cards. */
export function buildMetadata({
  title,
  description,
  path = '',
  image,
  type = 'website',
  absolute = false,
}: {
  title: string;
  description?: string | null;
  path?: string;
  image?: string | null;
  type?: 'website' | 'article';
  /** Set when `title` is a complete CMS-provided SEO title — bypasses the %s — Site template. */
  absolute?: boolean;
}): Metadata {
  const url = `${config.siteUrl}${path}`;
  const ogImage = mediaUrl(image) ?? `${config.siteUrl}/og-default.png`;

  return {
    title: absolute ? { absolute: title } : title,
    description: description ?? undefined,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: description ?? undefined,
      url,
      type,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description ?? undefined,
      images: [ogImage],
    },
  };
}

export function articleJsonLd(article: Article, settings: WebsiteSettings | null) {
  const image = mediaUrl(article.ogImage?.url ?? article.featuredImage?.url);
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: image ? [image] : undefined,
    datePublished: article.publishedDate,
    dateModified: article.updatedAt,
    author: article.author
      ? {
          '@type': 'Person',
          name: article.author.name,
          url: `${config.siteUrl}/author/${article.author.slug}`,
        }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: settings?.siteName ?? 'Meridian',
      logo: settings?.logo?.url
        ? { '@type': 'ImageObject', url: mediaUrl(settings.logo.url) }
        : undefined,
    },
    mainEntityOfPage: `${config.siteUrl}/blog/${article.slug}`,
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function organizationJsonLd(settings: WebsiteSettings | null) {
  const social = settings?.socialLinks;
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings?.siteName ?? 'Meridian',
    url: config.siteUrl,
    logo: settings?.logo?.url ? mediaUrl(settings.logo.url) : undefined,
    description: settings?.siteDescription ?? undefined,
    sameAs: [social?.twitter, social?.linkedin, social?.github, social?.instagram].filter(Boolean),
  };
}

export function websiteJsonLd(settings: WebsiteSettings | null) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: settings?.siteName ?? 'Meridian',
    url: config.siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${config.siteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}
