import type { MetadataRoute } from 'next';
import { getAllArticleSlugs, getAuthorSlugs, getCategories } from '@/services/api';
import { config } from '@/lib/config';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, categories, authors] = await Promise.all([
    getAllArticleSlugs().catch(() => ({ data: [] })),
    getCategories().catch(() => ({ data: [] })),
    getAuthorSlugs().catch(() => ({ data: [] })),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/blog',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/search',
  ].map((path) => ({
    url: `${config.siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));

  const articleRoutes: MetadataRoute.Sitemap = articles.data.map((a) => ({
    url: `${config.siteUrl}/blog/${a.slug}`,
    lastModified: new Date(a.updatedAt ?? a.publishedDate ?? Date.now()),
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.data.map((c) => ({
    url: `${config.siteUrl}/category/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const authorRoutes: MetadataRoute.Sitemap = authors.data.map((a) => ({
    url: `${config.siteUrl}/author/${a.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  return [...staticRoutes, ...articleRoutes, ...categoryRoutes, ...authorRoutes];
}
