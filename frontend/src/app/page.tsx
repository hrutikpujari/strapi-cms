import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Flame, Mail, Sparkles, TrendingUp } from 'lucide-react';
import {
  getCategories,
  getFeaturedArticles,
  getLatestArticles,
  getPopularArticles,
} from '@/services/api';
import { HeroSection } from '@/components/home/HeroSection';
import { ArticleCard } from '@/components/article/ArticleCard';
import { ArticleGrid } from '@/components/article/ArticleGrid';
import { NewsletterForm } from '@/components/article/NewsletterForm';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { mediaUrl } from '@/lib/strapi';

export const revalidate = 60;

export default async function HomePage() {
  const [featured, latest, popular, categories] = await Promise.all([
    getFeaturedArticles(4).catch(() => ({ data: [], meta: { pagination: { page: 1, pageSize: 4, pageCount: 0, total: 0 } } })),
    getLatestArticles(1, 6),
    getPopularArticles(5),
    getCategories(),
  ]);

  // Fall back to latest articles when nothing is flagged as featured.
  const featuredList =
    featured.data.length > 0 ? featured.data : latest.data.slice(0, 4);
  const [lead, ...secondary] = featuredList;

  return (
    <div className="pb-20">
      {lead ? (
        <HeroSection lead={lead} secondary={secondary.slice(0, 3)} />
      ) : (
        <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
          <EmptyState
            title="No articles published yet"
            message="Publish your first article in the Strapi admin panel and it will appear here automatically."
          />
        </section>
      )}

      {/* Trending strip */}
      {popular.data.length > 0 && (
        <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
          <FadeIn>
            <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <div className="mb-5 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-semibold uppercase tracking-wider">Trending now</h2>
              </div>
              <ol className="grid gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                {popular.data.map((article, i) => (
                  <li key={article.documentId} className="flex gap-4">
                    <span className="font-serif text-3xl font-light text-faint">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <Link href={`/blog/${article.slug}`} className="group">
                      <h3 className="font-serif text-[17px] font-medium leading-snug transition-colors group-hover:text-accent">
                        {article.title}
                      </h3>
                      <p className="mt-1 text-xs text-faint">{article.author?.name}</p>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </FadeIn>
        </section>
      )}

      {/* Categories */}
      {categories.data.length > 0 && (
        <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
          <FadeIn>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-accent">
                  <Sparkles className="h-4 w-4" /> Topics
                </p>
                <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight">
                  Explore by category
                </h2>
              </div>
            </div>
          </FadeIn>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {categories.data.map((category, i) => {
              const img = mediaUrl(category.image?.url);
              return (
                <FadeIn key={category.documentId} delay={0.06 * i}>
                  <Link
                    href={`/category/${category.slug}`}
                    className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-stone-200"
                  >
                    {img && (
                      <Image
                        src={img}
                        alt={category.image?.alternativeText ?? category.name}
                        fill
                        sizes="(max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 p-5">
                      <h3 className="font-serif text-xl font-semibold text-white">{category.name}</h3>
                      {category.description && (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/75">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </Link>
                </FadeIn>
              );
            })}
          </div>
        </section>
      )}

      {/* Latest articles */}
      <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
        <FadeIn>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-accent">
                <Flame className="h-4 w-4" /> Fresh off the press
              </p>
              <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight">
                Latest articles
              </h2>
            </div>
            <Link
              href="/blog"
              className="hidden items-center gap-1.5 text-sm font-semibold transition-all hover:gap-2.5 sm:inline-flex"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </FadeIn>
        <ArticleGrid articles={latest.data} />
        <div className="mt-10 text-center sm:hidden">
          <Link href="/blog" className="text-sm font-semibold">
            View all articles →
          </Link>
        </div>
      </section>

      {/* Newsletter */}
      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <FadeIn>
          <div className="relative overflow-hidden rounded-3xl bg-foreground px-6 py-16 text-center text-background sm:px-12">
            <Mail className="mx-auto h-8 w-8 text-accent-soft" />
            <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Ideas worth reading, weekly.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-stone-400">
              One thoughtful email a week. No noise, no spam — unsubscribe anytime.
            </p>
            <div className="mx-auto mt-8 max-w-md [&_button]:bg-accent-soft [&_button]:text-foreground [&_input]:border-transparent">
              <NewsletterForm compact />
            </div>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
