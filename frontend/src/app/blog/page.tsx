import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowDownWideNarrow } from 'lucide-react';
import { getCategories, getLatestArticles, getArticlesByCategory, getPopularArticles } from '@/services/api';
import { ArticleGrid } from '@/components/article/ArticleGrid';
import { Pagination } from '@/components/ui/Pagination';
import { SearchBar } from '@/components/ui/SearchBar';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';
import { cn } from '@/lib/utils';

export const revalidate = 60;
export const metadata: Metadata = buildMetadata({
  title: 'All Articles',
  description: 'Browse every essay and story — filter by category or sort by what readers love.',
  path: '/blog',
});

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function BlogPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const categorySlug = typeof sp.category === 'string' ? sp.category : undefined;
  const sort = sp.sort === 'popular' ? 'popular' : 'latest';

  const [categories, result] = await Promise.all([
    getCategories(),
    categorySlug
      ? getArticlesByCategory(categorySlug, page)
      : sort === 'popular'
        ? strapiPopular(page)
        : getLatestArticles(page),
  ]);

  const qs = (p: number) => {
    const params = new URLSearchParams();
    if (categorySlug) params.set('category', categorySlug);
    if (sort === 'popular') params.set('sort', 'popular');
    if (p > 1) params.set('page', String(p));
    const s = params.toString();
    return `/blog${s ? `?${s}` : ''}`;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Articles' }]} />

      <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-serif text-4xl font-semibold tracking-tight">All articles</h1>
          <p className="mt-2 text-muted">
            {result.meta.pagination.total} {result.meta.pagination.total === 1 ? 'story' : 'stories'}
            {categorySlug && ' in this category'}
          </p>
        </div>
        <div className="w-full md:w-80">
          <SearchBar />
        </div>
      </div>

      {/* Filters */}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <FilterChip href="/blog" active={!categorySlug}>All</FilterChip>
        {categories.data.map((c) => (
          <FilterChip
            key={c.documentId}
            href={`/blog?category=${c.slug}${sort === 'popular' ? '&sort=popular' : ''}`}
            active={categorySlug === c.slug}
          >
            {c.name}
          </FilterChip>
        ))}
        <div className="ml-auto flex items-center gap-2 text-sm">
          <ArrowDownWideNarrow className="h-4 w-4 text-faint" />
          <Link
            href={categorySlug ? `/blog?category=${categorySlug}` : '/blog'}
            className={cn('font-medium', sort === 'latest' ? 'text-foreground' : 'text-faint hover:text-muted')}
          >
            Latest
          </Link>
          <span className="text-faint">·</span>
          <Link
            href={`/blog?sort=popular${categorySlug ? `&category=${categorySlug}` : ''}`}
            className={cn('font-medium', sort === 'popular' ? 'text-foreground' : 'text-faint hover:text-muted')}
          >
            Popular
          </Link>
        </div>
      </div>

      <div className="mt-10">
        <ArticleGrid articles={result.data} priorityCount={3} />
        <Pagination pagination={result.meta.pagination} buildHref={qs} />
      </div>
    </div>
  );
}

async function strapiPopular(page: number) {
  const res = await getPopularArticles(200);
  const pageSize = 9;
  const start = (page - 1) * pageSize;
  return {
    data: res.data.slice(start, start + pageSize),
    meta: {
      pagination: {
        page,
        pageSize,
        pageCount: Math.max(1, Math.ceil(res.data.length / pageSize)),
        total: res.data.length,
      },
    },
  };
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-foreground bg-foreground text-background'
          : 'border-border bg-surface text-muted hover:border-faint hover:text-foreground'
      )}
    >
      {children}
    </Link>
  );
}
