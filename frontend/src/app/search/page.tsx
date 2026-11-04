import type { Metadata } from 'next';
import { searchArticles } from '@/services/api';
import { ArticleGrid } from '@/components/article/ArticleGrid';
import { Pagination } from '@/components/ui/Pagination';
import { SearchBar } from '@/components/ui/SearchBar';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { EmptyState } from '@/components/ui/EmptyState';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Search',
  description: 'Search articles by title, topic, and tag.',
  path: '/search',
});

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';
  const page = Math.max(1, Number(sp.page) || 1);

  const result = q ? await searchArticles(q, page) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Search' }]} />

      <div className="mx-auto mt-10 max-w-2xl text-center">
        <h1 className="font-serif text-4xl font-semibold tracking-tight">Search</h1>
        <div className="mt-6">
          <SearchBar defaultValue={q} autoFocus large />
        </div>
      </div>

      <div className="mt-14">
        {!q ? (
          <EmptyState
            title="What are you looking for?"
            message="Search across titles, descriptions, and tags."
            actionHref="/blog"
            actionLabel="Browse all articles"
          />
        ) : !result || result.data.length === 0 ? (
          <EmptyState
            title={`No results for “${q}”`}
            message="Try a different keyword, check your spelling, or browse by category instead."
            actionHref="/blog"
            actionLabel="Browse all articles"
          />
        ) : (
          <>
            <p className="text-sm text-faint">
              {result.meta.pagination.total} result{result.meta.pagination.total === 1 ? '' : 's'} for{' '}
              <span className="font-medium text-foreground">“{q}”</span>
            </p>
            <div className="mt-6">
              <ArticleGrid articles={result.data} />
            </div>
            <Pagination
              pagination={result.meta.pagination}
              buildHref={(p) => `/search?q=${encodeURIComponent(q)}${p > 1 ? `&page=${p}` : ''}`}
            />
          </>
        )}
      </div>
    </div>
  );
}
