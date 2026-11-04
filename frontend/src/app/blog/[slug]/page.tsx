import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight, Clock, Mail } from 'lucide-react';
import {
  getAdjacentArticles,
  getAllArticleSlugs,
  getArticleBySlug,
  getRelatedArticles,
  getSettings,
} from '@/services/api';
import { BlocksRenderer } from '@/components/article/BlocksRenderer';
import { TableOfContents } from '@/components/article/TableOfContents';
import { SocialShare } from '@/components/article/SocialShare';
import { ViewCounter } from '@/components/article/ViewCounter';
import { NewsletterForm } from '@/components/article/NewsletterForm';
import { ArticleCard } from '@/components/article/ArticleCard';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { mediaUrl } from '@/lib/strapi';
import { config } from '@/lib/config';
import { articleJsonLd, buildMetadata, breadcrumbJsonLd } from '@/lib/seo';
import { extractHeadings, formatDate } from '@/lib/utils';

export const revalidate = 60;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const res = await getAllArticleSlugs().catch(() => ({ data: [] }));
  return res.data.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug).catch(() => null);
  if (!article) return { title: 'Article not found' };

  const meta = buildMetadata({
    title: article.seoTitle ?? article.title,
    description: article.seoDescription ?? article.excerpt,
    path: `/blog/${article.slug}`,
    image: article.ogImage?.url ?? article.featuredImage?.url,
    type: 'article',
    absolute: Boolean(article.seoTitle),
  });

  if (article.canonicalUrl) {
    meta.alternates = { canonical: article.canonicalUrl };
  }
  return meta;
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const [article, settings] = await Promise.all([
    getArticleBySlug(slug).catch(() => null),
    getSettings().catch(() => ({ data: null })),
  ]);
  if (!article) notFound();

  const [related, adjacent] = await Promise.all([
    getRelatedArticles(article),
    getAdjacentArticles(article),
  ]);

  const heroImage = mediaUrl(article.featuredImage?.url ?? article.thumbnailImage?.url);
  const avatar = mediaUrl(article.author?.avatar?.url);
  const headings = extractHeadings(article.content);
  const url = `${config.siteUrl}/blog/${article.slug}`;

  const jsonLd = [
    articleJsonLd(article, settings.data),
    breadcrumbJsonLd([
      { name: 'Home', url: config.siteUrl },
      { name: 'Articles', url: `${config.siteUrl}/blog` },
      { name: article.title, url },
    ]),
  ];

  return (
    <article className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Articles', href: '/blog' },
          ...(article.category
            ? [{ label: article.category.name, href: `/category/${article.category.slug}` }]
            : []),
          { label: article.title },
        ]}
      />

      {/* Header */}
      <header className="mx-auto mt-8 max-w-3xl text-center">
        {article.category && (
          <Link
            href={`/category/${article.category.slug}`}
            className="text-xs font-semibold uppercase tracking-wider text-accent hover:underline"
          >
            {article.category.name}
          </Link>
        )}
        <h1 className="mt-3 font-serif text-4xl font-semibold leading-[1.15] tracking-tight sm:text-5xl">
          {article.title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl font-serif text-xl italic leading-relaxed text-muted">
          {article.excerpt}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted">
          {article.author && (
            <Link href={`/author/${article.author.slug}`} className="flex items-center gap-2 font-medium text-foreground">
              {avatar && (
                <Image src={avatar} alt={article.author.name} width={32} height={32} className="rounded-full object-cover" />
              )}
              {article.author.name}
            </Link>
          )}
          <time dateTime={article.publishedDate}>{formatDate(article.publishedDate)}</time>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> {article.readingTime} min read
          </span>
          <ViewCounter documentId={article.documentId} initialCount={article.viewCount} />
        </div>
      </header>

      {/* Hero image */}
      {heroImage && (
        <figure className="mx-auto mt-10 max-w-4xl">
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-stone-100">
            <Image
              src={heroImage}
              alt={article.featuredImage?.alternativeText ?? article.title}
              fill
              priority
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover"
            />
          </div>
          {article.featuredImage?.caption && (
            <figcaption className="mt-3 text-center text-sm text-faint">
              {article.featuredImage.caption}
            </figcaption>
          )}
        </figure>
      )}

      {/* Body + TOC */}
      <div className="mx-auto mt-12 grid max-w-4xl gap-10 lg:grid-cols-[1fr_200px]">
        <div className="min-w-0">
          <BlocksRenderer content={article.content} />

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-8">
              {article.tags.map((tag) => (
                <Link
                  key={tag.documentId}
                  href={`/search?q=${encodeURIComponent(tag.name)}`}
                  className="rounded-full bg-stone-100 px-3.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-stone-200 hover:text-foreground"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
            <SocialShare url={url} title={article.title} />
          </div>

          {/* Author card */}
          {article.author && (
            <aside className="mt-8 flex gap-4 rounded-2xl border border-border bg-surface p-6">
              {avatar && (
                <Image
                  src={avatar}
                  alt={article.author.name}
                  width={64}
                  height={64}
                  className="h-16 w-16 shrink-0 rounded-full object-cover"
                />
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-faint">Written by</p>
                <Link href={`/author/${article.author.slug}`} className="mt-1 block font-serif text-lg font-semibold hover:text-accent">
                  {article.author.name}
                </Link>
                {article.author.designation && (
                  <p className="text-xs text-faint">{article.author.designation}</p>
                )}
                {article.author.bio && (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{article.author.bio}</p>
                )}
              </div>
            </aside>
          )}
        </div>

        {/* TOC sidebar */}
        <aside className="hidden lg:block">
          <TableOfContents headings={headings} />
        </aside>
      </div>

      {/* Prev / Next */}
      <nav aria-label="More articles" className="mx-auto mt-16 grid max-w-4xl gap-4 border-t border-border pt-10 sm:grid-cols-2">
        {adjacent.older ? (
          <Link href={`/blog/${adjacent.older.slug}`} className="group rounded-2xl border border-border bg-surface p-5 transition-shadow hover:shadow-md">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-faint">
              <ArrowLeft className="h-3.5 w-3.5" /> Older
            </span>
            <p className="mt-2 font-serif text-lg font-semibold leading-snug group-hover:text-accent">
              {adjacent.older.title}
            </p>
          </Link>
        ) : <div />}
        {adjacent.newer ? (
          <Link href={`/blog/${adjacent.newer.slug}`} className="group rounded-2xl border border-border bg-surface p-5 text-right transition-shadow hover:shadow-md">
            <span className="flex items-center justify-end gap-1.5 text-xs font-semibold uppercase tracking-wider text-faint">
              Newer <ArrowRight className="h-3.5 w-3.5" />
            </span>
            <p className="mt-2 font-serif text-lg font-semibold leading-snug group-hover:text-accent">
              {adjacent.newer.title}
            </p>
          </Link>
        ) : <div />}
      </nav>

      {/* Related */}
      {related.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl">
          <h2 className="font-serif text-2xl font-semibold tracking-tight">Related reading</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((a) => (
              <ArticleCard key={a.documentId} article={a} />
            ))}
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="mx-auto mt-16 max-w-3xl rounded-3xl border border-border bg-surface px-6 py-12 text-center sm:px-12">
        <Mail className="mx-auto h-7 w-7 text-accent" />
        <h2 className="mt-4 font-serif text-2xl font-semibold sm:text-3xl">
          Enjoyed this? Get the next one in your inbox.
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          One thoughtful email a week. Unsubscribe anytime.
        </p>
        <div className="mx-auto mt-6 max-w-md">
          <NewsletterForm compact />
        </div>
      </section>
    </article>
  );
}
