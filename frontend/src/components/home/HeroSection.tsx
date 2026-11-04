import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock } from 'lucide-react';
import type { Article } from '@/types/strapi';
import { mediaUrl } from '@/lib/strapi';
import { formatDate } from '@/lib/utils';
import { FadeIn } from '@/components/ui/FadeIn';

interface HeroSectionProps {
  lead: Article;
  secondary: Article[];
}

export function HeroSection({ lead, secondary }: HeroSectionProps) {
  const leadImage = mediaUrl(lead.featuredImage?.url ?? lead.thumbnailImage?.url);

  return (
    <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 lg:pt-14">
      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:gap-12">
        {/* Lead story */}
        <FadeIn>
          <article className="group">
            <Link href={`/blog/${lead.slug}`} className="relative block aspect-[16/10] overflow-hidden rounded-2xl bg-stone-100">
              {leadImage && (
                <Image
                  src={leadImage}
                  alt={lead.featuredImage?.alternativeText ?? lead.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
              )}
            </Link>
            <div className="mt-5">
              {lead.category && (
                <Link
                  href={`/category/${lead.category.slug}`}
                  className="text-xs font-semibold uppercase tracking-wider text-accent hover:underline"
                >
                  {lead.category.name}
                </Link>
              )}
              <Link href={`/blog/${lead.slug}`}>
                <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight tracking-tight transition-colors group-hover:text-accent sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
                  {lead.title}
                </h1>
              </Link>
              <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-muted">
                {lead.excerpt}
              </p>
              <div className="mt-4 flex items-center gap-3 text-sm text-faint">
                {lead.author && (
                  <Link href={`/author/${lead.author.slug}`} className="font-medium text-muted hover:text-foreground">
                    {lead.author.name}
                  </Link>
                )}
                <span aria-hidden>·</span>
                <time dateTime={lead.publishedDate}>{formatDate(lead.publishedDate)}</time>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {lead.readingTime} min read
                </span>
              </div>
            </div>
          </article>
        </FadeIn>

        {/* Secondary stories */}
        <div className="flex flex-col gap-6 lg:border-l lg:border-border lg:pl-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-faint">
            Featured stories
          </p>
          {secondary.map((article, i) => (
            <FadeIn key={article.documentId} delay={0.08 * (i + 1)}>
              <article className="group">
                {article.category && (
                  <Link
                    href={`/category/${article.category.slug}`}
                    className="text-[11px] font-semibold uppercase tracking-wider text-accent hover:underline"
                  >
                    {article.category.name}
                  </Link>
                )}
                <Link href={`/blog/${article.slug}`}>
                  <h2 className="mt-1 font-serif text-xl font-semibold leading-snug transition-colors group-hover:text-accent">
                    {article.title}
                  </h2>
                </Link>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-faint">
                  {article.author?.name}
                  <span aria-hidden>·</span>
                  <time dateTime={article.publishedDate}>{formatDate(article.publishedDate)}</time>
                </div>
                {i < secondary.length - 1 && <hr className="mt-5 border-border" />}
              </article>
            </FadeIn>
          ))}
          <Link
            href="/blog"
            className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:gap-2.5 transition-all"
          >
            All articles <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
