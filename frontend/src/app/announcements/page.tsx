import type { Metadata } from 'next';
import Link from 'next/link';
import { Megaphone, Pin } from 'lucide-react';
import { getAnnouncements } from '@/services/api';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';
import { formatDate } from '@/lib/utils';

export const revalidate = 3600;
export const metadata: Metadata = buildMetadata({
  title: 'Announcements',
  description: 'News and notices from the Meridian team.',
  path: '/announcements',
});

const CATEGORY_STYLES: Record<string, string> = {
  Company: 'bg-blue-50 text-blue-700',
  Product: 'bg-violet-50 text-violet-700',
  Press: 'bg-amber-50 text-amber-700',
  Event: 'bg-emerald-50 text-emerald-700',
  Careers: 'bg-rose-50 text-rose-700',
};

export default async function AnnouncementsPage() {
  const res = await getAnnouncements().catch(() => ({ data: [], meta: {} as any }));
  const today = new Date().toISOString().slice(0, 10);
  const announcements = res.data.filter((a) => !a.expiresAt || a.expiresAt >= today);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Announcements' }]} />
      <h1 className="mt-8 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
        Announcements
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        News, launches, and notices from the team.
      </p>

      <div className="mt-10 space-y-4">
        {announcements.length === 0 && (
          <p className="rounded-xl border border-border bg-stone-50 p-6 text-muted">
            Nothing to announce right now.
          </p>
        )}
        {announcements.map((a) => (
          <Link
            key={a.documentId}
            href={`/announcements/${a.slug}`}
            className="group block rounded-xl border border-border p-6 transition-colors hover:border-foreground/30 hover:bg-stone-50"
          >
            <div className="flex items-center gap-2">
              {a.pinned && <Pin className="h-3.5 w-3.5 text-muted" />}
              {a.category && (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_STYLES[a.category] ?? 'bg-stone-100 text-stone-700'}`}
                >
                  {a.category}
                </span>
              )}
              {a.publishDate && (
                <span className="text-xs text-muted">{formatDate(a.publishDate)}</span>
              )}
            </div>
            <h2 className="mt-2 font-serif text-xl font-semibold group-hover:underline">
              {a.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{a.summary}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
