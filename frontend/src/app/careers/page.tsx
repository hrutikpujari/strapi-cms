import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Briefcase, Clock, ArrowRight } from 'lucide-react';
import { getJobPosts } from '@/services/api';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';
import { formatDate } from '@/lib/utils';

export const revalidate = 3600;
export const metadata: Metadata = buildMetadata({
  title: 'Careers',
  description: 'Open roles at Meridian — engineering, editorial, and design.',
  path: '/careers',
});

function deadlineBadge(deadline?: string | null) {
  if (!deadline) return null;
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: 'Closed', cls: 'bg-stone-200 text-stone-600' };
  if (days <= 7) return { label: `Closes in ${days}d`, cls: 'bg-red-50 text-red-700' };
  return { label: `Apply by ${formatDate(deadline)}`, cls: 'bg-stone-100 text-stone-600' };
}

export default async function CareersPage() {
  const jobs = await getJobPosts().catch(() => ({ data: [], meta: {} as any }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Careers' }]} />
      <h1 className="mt-8 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
        Careers at Meridian
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        We are a small editorial team that takes craft seriously. If you care about how
        things are made — and read the footnotes — we would like to hear from you.
      </p>

      <div className="mt-10 space-y-4">
        {jobs.data.length === 0 && (
          <p className="rounded-xl border border-border bg-stone-50 p-6 text-muted">
            No open roles right now. Check back soon — or write to us anyway.
          </p>
        )}
        {jobs.data.map((job) => {
          const badge = deadlineBadge(job.applicationDeadline);
          return (
            <Link
              key={job.documentId}
              href={`/careers/${job.slug}`}
              className="group block rounded-xl border border-border p-6 transition-colors hover:border-foreground/30 hover:bg-stone-50"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-xl font-semibold group-hover:underline">
                    {job.title}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" /> {job.department}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> {job.location}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> {job.employmentType}
                      {job.workMode ? ` · ${job.workMode}` : ''}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{job.excerpt}</p>
                </div>
                <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
              </div>
              <div className="mt-4 flex items-center gap-3">
                {job.salaryRange && (
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                    {job.salaryRange}
                  </span>
                )}
                {job.experienceLevel && (
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                    {job.experienceLevel} level
                  </span>
                )}
                {badge && (
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.cls}`}>
                    {badge.label}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
