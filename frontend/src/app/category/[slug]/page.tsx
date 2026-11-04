import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getArticlesByCategory, getCategories, getCategoryBySlug } from '@/services/api';
import { ArticleGrid } from '@/components/article/ArticleGrid';
import { Pagination } from '@/components/ui/Pagination';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { buildMetadata, breadcrumbJsonLd } from '@/lib/seo';
import { config } from '@/lib/config';

export const revalidate = 60;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateStaticParams() {
  const res = await getCategories().catch(() => ({ data: [] }));
  return res.data.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug).catch(() => null);
  if (!category) return { title: 'Category not found' };
  return buildMetadata({
    title: category.seoTitle ?? category.name,
    description: category.seoDescription ?? category.description ?? `Articles in ${category.name}.`,
    path: `/category/${category.slug}`,
    image: category.image?.url,
    absolute: Boolean(category.seoTitle),
  });
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [category, result] = await Promise.all([
    getCategoryBySlug(slug).catch(() => null),
    getArticlesByCategory(slug, page),
  ]);
  if (!category) notFound();

  const jsonLd = breadcrumbJsonLd([
    { name: 'Home', url: config.siteUrl },
    { name: 'Categories', url: `${config.siteUrl}/blog` },
    { name: category.name, url: `${config.siteUrl}/category/${category.slug}` },
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: 'Articles', href: '/blog' }, { label: category.name }]}
      />

      <header className="mt-6 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">Category</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight">{category.name}</h1>
        {category.description && (
          <p className="mt-3 text-lg leading-relaxed text-muted">{category.description}</p>
        )}
        <p className="mt-4 text-sm text-faint">
          {result.meta.pagination.total} {result.meta.pagination.total === 1 ? 'article' : 'articles'}
        </p>
      </header>

      <div className="mt-10">
        <ArticleGrid
          articles={result.data}
          priorityCount={3}
          emptyMessage={`No articles in ${category.name} yet.`}
        />
        <Pagination
          pagination={result.meta.pagination}
          buildHref={(p) => `/category/${slug}${p > 1 ? `?page=${p}` : ''}`}
        />
      </div>
    </div>
  );
}
