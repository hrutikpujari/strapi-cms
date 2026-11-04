import Link from 'next/link';
import Image from 'next/image';
import { Clock, Eye } from 'lucide-react';
import type { Article } from '@/types/strapi';
import { mediaUrl } from '@/lib/strapi';
import { cn, formatDate, formatNumber } from '@/lib/utils';

interface ArticleCardProps {
  article: Article;
  priority?: boolean;
  variant?: 'default' | 'horizontal' | 'compact';
}

export function ArticleCard({ article, priority, variant = 'default' }: ArticleCardProps) {
  const image = article.thumbnailImage ?? article.featuredImage;
  const imageUrl = mediaUrl(image?.url);

  const meta = (
    <div className="flex items-center gap-3 text-xs text-faint">
      <time dateTime={article.publishedDate}>{formatDate(article.publishedDate)}</time>
      <span className="flex items-center gap-1">
        <Clock className="h-3 w-3" /> {article.readingTime} min
      </span>
      {article.viewCount > 0 && (
        <span className="flex items-center gap-1">
          <Eye className="h-3 w-3" /> {formatNumber(article.viewCount)}
        </span>
      )}
    </div>
  );

  if (variant === 'compact') {
    return (
      <article className="group">
        <Link href={`/blog/${article.slug}`} className="block">
          <h3 className="font-serif text-lg font-medium leading-snug text-foreground transition-colors group-hover:text-accent">
            {article.title}
          </h3>
        </Link>
        <div className="mt-1.5">{meta}</div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        'group flex overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)]',
        variant === 'horizontal' ? 'flex-row' : 'flex-col'
      )}
    >
      <Link
        href={`/blog/${article.slug}`}
        className={cn(
          'relative block shrink-0 overflow-hidden bg-stone-100',
          variant === 'horizontal' ? 'aspect-[4/3] w-40 sm:w-56' : 'aspect-[16/10] w-full'
        )}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={image?.alternativeText ?? article.title}
            fill
            priority={priority}
            sizes={variant === 'horizontal' ? '224px' : '(max-width: 768px) 100vw, 33vw'}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-faint">No image</div>
        )}
      </Link>

      <div className={cn('flex flex-1 flex-col', variant === 'horizontal' ? 'p-4 sm:p-5' : 'p-5')}>
        {article.category && (
          <Link
            href={`/category/${article.category.slug}`}
            className="mb-2 w-fit text-xs font-semibold uppercase tracking-wider text-accent hover:underline"
          >
            {article.category.name}
          </Link>
        )}
        <Link href={`/blog/${article.slug}`}>
          <h3 className="font-serif text-xl font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
            {article.title}
          </h3>
        </Link>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">
          {article.excerpt}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted">
            {article.author && (
              <Link href={`/author/${article.author.slug}`} className="font-medium hover:text-foreground">
                {article.author.name}
              </Link>
            )}
          </div>
          {meta}
        </div>
      </div>
    </article>
  );
}
