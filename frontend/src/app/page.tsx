import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Briefcase,
  Flame,
  Mail,
  MapPin,
  Megaphone,
  Pin,
  Sparkles,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import {
  getAnnouncements,
  getAwards,
  getCategories,
  getFeaturedArticles,
  getJobPosts,
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
import { formatDate } from '@/lib/utils';

const ANNOUNCEMENT_STYLES: Record<string, string> = {
  Company: 'bg-blue-50 text-blue-700',
  Product: 'bg-violet-50 text-violet-700',
  Press: 'bg-amber-50 text-amber-700',
  Event: 'bg-emerald-50 text-emerald-700',
  Careers: 'bg-rose-50 text-rose-700',
};

function deadlineBadge(deadline?: string | null) {
  if (!deadline) return null;
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: 'Closed', cls: 'bg-stone-200 text-stone-600' };
  if (days <= 7) return { label: `Closes in ${days}d`, cls: 'bg-red-50 text-red-700' };
  return { label: `Apply by ${formatDate(deadline)}`, cls: 'bg-stone-100 text-stone-600' };
}

export const revalidate = 60;

export default async function HomePage() {
  const [featured, latest, popular, categories, announcements, jobs, awards] = await Promise.all([
    getFeaturedArticles(4).catch(() => ({ data: [], meta: { pagination: { page: 1, pageSize: 4, pageCount: 0, total: 0 } } })),
    getLatestArticles(1, 6),
    getPopularArticles(5),
    getCategories(),
    getAnnouncements().catch(() => ({ data: [], meta: {} as any })),
    getJobPosts().catch(() => ({ data: [], meta: {} as any })),
    getAwards().catch(() => ({ data: [], meta: {} as any })),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const homeAnnouncements = announcements.data
    .filter((a) => !a.expiresAt || a.expiresAt >= today)
    .slice(0, 3);
  const homeJobs = jobs.data.slice(0, 3);
  const homeAwards = awards.data.slice(0, 6);

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

      {/* Announcements */}
      {homeAnnouncements.length > 0 && (
        <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
          <FadeIn>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-accent">
                  <Megaphone className="h-4 w-4" /> From the team
                </p>
                <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight">
                  Latest announcements
                </h2>
              </div>
              <Link
                href="/announcements"
                className="hidden items-center gap-1.5 text-sm font-semibold transition-all hover:gap-2.5 sm:inline-flex"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </FadeIn>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {homeAnnouncements.map((a, i) => (
              <FadeIn key={a.documentId} delay={0.06 * i}>
                <Link
                  href={`/announcements/${a.slug}`}
                  className="group block h-full rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-foreground/30 hover:bg-stone-50"
                >
                  <div className="flex items-center gap-2">
                    {a.pinned && <Pin className="h-3.5 w-3.5 text-muted" />}
                    {a.category && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ANNOUNCEMENT_STYLES[a.category] ?? 'bg-stone-100 text-stone-700'}`}
                      >
                        {a.category}
                      </span>
                    )}
                    {a.publishDate && (
                      <span className="text-xs text-muted">{formatDate(a.publishDate)}</span>
                    )}
                  </div>
                  <h3 className="mt-3 font-serif text-lg font-semibold leading-snug group-hover:underline">
                    {a.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                    {a.summary}
                  </p>
                </Link>
              </FadeIn>
            ))}
          </div>
        </section>
      )}

      {/* We're hiring */}
      {homeJobs.length > 0 && (
        <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
          <FadeIn>
            <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-accent">
                    <Briefcase className="h-4 w-4" /> We&rsquo;re hiring
                  </p>
                  <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight">
                    Open positions
                  </h2>
                </div>
                <Link
                  href="/careers"
                  className="hidden items-center gap-1.5 text-sm font-semibold transition-all hover:gap-2.5 sm:inline-flex"
                >
                  All {jobs.data.length} roles <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="divide-y divide-border">
                {homeJobs.map((job) => {
                  const badge = deadlineBadge(job.applicationDeadline);
                  return (
                    <Link
                      key={job.documentId}
                      href={`/careers/${job.slug}`}
                      className="group flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <h3 className="font-serif text-[17px] font-medium leading-snug transition-colors group-hover:text-accent">
                          {job.title}
                        </h3>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                          <span className="inline-flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5" /> {job.department}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {job.location}
                          </span>
                          <span>{job.employmentType}</span>
                        </p>
                      </div>
                      {badge && (
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.cls}`}>
                          {badge.label}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
              <div className="mt-5 text-center sm:hidden">
                <Link href="/careers" className="text-sm font-semibold">
                  View all roles →
                </Link>
              </div>
            </div>
          </FadeIn>
        </section>
      )}

      {/* Awards */}
      {homeAwards.length > 0 && (
        <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
          <FadeIn>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-accent">
                  <Trophy className="h-4 w-4" /> Recognition
                </p>
                <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight">
                  Awards
                </h2>
              </div>
              <Link
                href="/awards"
                className="hidden items-center gap-1.5 text-sm font-semibold transition-all hover:gap-2.5 sm:inline-flex"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </FadeIn>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
            {homeAwards.map((award, i) => {
              const badge = mediaUrl(award.badgeImage?.url);
              return (
                <FadeIn key={award.documentId} delay={0.05 * i}>
                  <div className="flex h-full flex-col items-center rounded-2xl border border-border bg-surface p-5 text-center">
                    {badge ? (
                      <div className="relative h-16 w-16">
                        <Image
                          src={badge}
                          alt={award.badgeImage?.alternativeText ?? award.title}
                          fill
                          sizes="64px"
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <Trophy className="h-10 w-10 text-faint" />
                    )}
                    <h3 className="mt-3 font-serif text-sm font-semibold leading-snug">
                      {award.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted">
                      {award.issuer} · {award.year}
                    </p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </section>
      )}

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
