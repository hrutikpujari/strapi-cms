import type { Metadata } from 'next';
import Image from 'next/image';
import { Trophy } from 'lucide-react';
import { getAwards } from '@/services/api';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { mediaUrl } from '@/lib/strapi';
import { buildMetadata } from '@/lib/seo';

export const revalidate = 3600;
export const metadata: Metadata = buildMetadata({
  title: 'Awards & Recognition',
  description: 'Awards and honors earned by the Meridian team.',
  path: '/awards',
});

export default async function AwardsPage() {
  const awards = await getAwards().catch(() => ({ data: [], meta: {} as any }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Awards' }]} />
      <h1 className="mt-8 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
        Awards &amp; Recognition
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        Honors our work has received along the way.
      </p>

      <div className="mt-10 space-y-4">
        {awards.data.length === 0 && (
          <p className="rounded-xl border border-border bg-stone-50 p-6 text-muted">
            No awards listed yet.
          </p>
        )}
        {awards.data.map((award) => {
          const badge = mediaUrl(award.badgeImage?.url);
          const inner = (
            <div className="flex items-center gap-5">
              {badge ? (
                <Image
                  src={badge}
                  alt={award.badgeImage?.alternativeText ?? award.title}
                  width={64}
                  height={64}
                  className="h-16 w-16 shrink-0 rounded-xl object-cover"
                  unoptimized
                />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                  <Trophy className="h-7 w-7 text-amber-600" />
                </span>
              )}
              <div>
                <h2 className="font-serif text-xl font-semibold group-hover:underline">
                  {award.title}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {award.issuer} · {award.year}
                </p>
                {award.description && (
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {award.description}
                  </p>
                )}
              </div>
            </div>
          );
          return award.linkUrl ? (
            <a
              key={award.documentId}
              href={award.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-xl border border-border p-6 transition-colors hover:border-foreground/30 hover:bg-stone-50"
            >
              {inner}
            </a>
          ) : (
            <div key={award.documentId} className="group rounded-xl border border-border p-6">
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
