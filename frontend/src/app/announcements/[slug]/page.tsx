import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { getAnnouncementBySlug, getAnnouncementSlugs } from '@/services/api';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BlocksRenderer } from '@/components/article/BlocksRenderer';
import { buildMetadata } from '@/lib/seo';
import { formatDate } from '@/lib/utils';

export const revalidate = 3600;

export async function generateStaticParams() {
  const res = await getAnnouncementSlugs().catch(() => ({ data: [] }));
  return res.data.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = await getAnnouncementBySlug(slug);
  if (!a) return {};
  return buildMetadata({
    title: a.seoTitle ?? a.title,
    description: a.seoDescription ?? a.summary,
    path: `/announcements/${a.slug}`,
  });
}

export default async function AnnouncementPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = await getAnnouncementBySlug(slug).catch(() => null);
  if (!a) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Announcements', href: '/announcements' },
          { label: a.title },
        ]}
      />

      <div className="mt-8 flex items-center gap-3 text-sm text-muted">
        {a.category && (
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
            {a.category}
          </span>
        )}
        {a.publishDate && <span>{formatDate(a.publishDate)}</span>}
      </div>

      <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
        {a.title}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">{a.summary}</p>

      <div className="prose-body mt-8">
        <BlocksRenderer content={a.body} />
      </div>

      {a.linkUrl && (
        <a
          href={a.linkUrl}
          className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-foreground hover:underline"
        >
          <ExternalLink className="h-4 w-4" /> Learn more
        </a>
      )}

      <div className="mt-10">
        <Link href="/announcements" className="text-sm text-muted hover:text-foreground">
          ← All announcements
        </Link>
      </div>
    </div>
  );
}
