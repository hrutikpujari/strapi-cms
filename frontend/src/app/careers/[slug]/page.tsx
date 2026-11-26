import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, Briefcase, Clock, Mail, ExternalLink, CalendarDays } from 'lucide-react';
import { getJobPostBySlug, getJobPostSlugs } from '@/services/api';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BlocksRenderer } from '@/components/article/BlocksRenderer';
import { buildMetadata } from '@/lib/seo';
import { formatDate } from '@/lib/utils';

export const revalidate = 3600;

export async function generateStaticParams() {
  const res = await getJobPostSlugs().catch(() => ({ data: [] }));
  return res.data.map((j) => ({ slug: j.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobPostBySlug(slug);
  if (!job) return {};
  return buildMetadata({
    title: job.seoTitle ?? `${job.title} — Careers`,
    description: job.seoDescription ?? job.excerpt,
    path: `/careers/${job.slug}`,
  });
}

export default async function JobPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await getJobPostBySlug(slug).catch(() => null);
  if (!job) notFound();

  const closed =
    job.applicationDeadline && new Date(job.applicationDeadline).getTime() < Date.now();
  const applyHref = job.applyUrl ?? (job.applyEmail ? `mailto:${job.applyEmail}` : null);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Careers', href: '/careers' },
          { label: job.title },
        ]}
      />

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
          {job.department}
        </span>
        {job.experienceLevel && (
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
            {job.experienceLevel} level
          </span>
        )}
        {closed ? (
          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
            Applications closed
          </span>
        ) : (
          job.applicationDeadline && (
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
              Apply by {formatDate(job.applicationDeadline)}
            </span>
          )
        )}
      </div>

      <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
        {job.title}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-4 w-4" /> {job.location}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-4 w-4" /> {job.employmentType}
          {job.workMode ? ` · ${job.workMode}` : ''}
        </span>
        {job.salaryRange && (
          <span className="inline-flex items-center gap-1.5">
            <Briefcase className="h-4 w-4" /> {job.salaryRange}
          </span>
        )}
        {job.postedDate && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" /> Posted {formatDate(job.postedDate)}
          </span>
        )}
      </div>

      <p className="mt-6 text-lg leading-relaxed text-muted">{job.excerpt}</p>

      <div className="prose-body mt-8">
        <BlocksRenderer content={job.description} />
        {job.requirements?.length ? (
          <>
            <h2>Requirements</h2>
            <BlocksRenderer content={job.requirements} />
          </>
        ) : null}
      </div>

      {!closed && applyHref && (
        <div className="mt-10 rounded-xl border border-border bg-stone-50 p-6">
          <h2 className="font-serif text-xl font-semibold">Interested?</h2>
          <p className="mt-2 text-sm text-muted">
            {job.applyEmail
              ? `Send your resume and a short note to ${job.applyEmail}.`
              : 'Apply through the link below.'}
          </p>
          <a
            href={applyHref}
            {...(job.applyUrl ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {job.applyEmail ? <Mail className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
            Apply for this role
          </a>
        </div>
      )}

      <div className="mt-10">
        <Link href="/careers" className="text-sm text-muted hover:text-foreground">
          ← All open roles
        </Link>
      </div>
    </div>
  );
}
