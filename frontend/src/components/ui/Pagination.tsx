import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Pagination as PaginationMeta } from '@/types/strapi';

interface PaginationProps {
  pagination: PaginationMeta;
  /** Function that returns the href for a given page number. */
  buildHref: (page: number) => string;
}

export function Pagination({ pagination, buildHref }: PaginationProps) {
  const { page, pageCount } = pagination;
  if (pageCount <= 1) return null;

  const pages: (number | 'gap')[] = [];
  const windowStart = Math.max(1, Math.min(page - 2, pageCount - 4));
  const windowEnd = Math.min(pageCount, windowStart + 4);
  if (windowStart > 1) pages.push(1, 'gap');
  for (let i = windowStart; i <= windowEnd; i++) pages.push(i);
  if (windowEnd < pageCount) pages.push('gap', pageCount);

  const btn =
    'flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-medium transition-colors';

  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={buildHref(page - 1)} className={cn(btn, 'text-muted hover:bg-stone-100')} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span className={cn(btn, 'cursor-not-allowed text-faint')} aria-hidden>
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}

      {pages.map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 text-faint">…</span>
        ) : (
          <Link
            key={p}
            href={buildHref(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              btn,
              p === page ? 'bg-foreground text-background' : 'text-muted hover:bg-stone-100'
            )}
          >
            {p}
          </Link>
        )
      )}

      {page < pageCount ? (
        <Link href={buildHref(page + 1)} className={cn(btn, 'text-muted hover:bg-stone-100')} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className={cn(btn, 'cursor-not-allowed text-faint')} aria-hidden>
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
