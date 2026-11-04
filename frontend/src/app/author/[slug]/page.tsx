import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Globe } from 'lucide-react';
import { GitHubIcon, InstagramIcon, LinkedInIcon, XIcon } from '@/components/ui/BrandIcons';
import { getArticlesByAuthor, getAuthorBySlug, getAuthorSlugs } from '@/services/api';
import { ArticleGrid } from '@/components/article/ArticleGrid';
import { Pagination } from '@/components/ui/Pagination';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { buildMetadata, breadcrumbJsonLd } from '@/lib/seo';
import { mediaUrl } from '@/lib/strapi';
import { config } from '@/lib/config';

export const revalidate = 60;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateStaticParams() {
  const res = await getAuthorSlugs().catch(() => ({ data: [] }));
  return res.data.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug).catch(() => null);
  if (!author) return { title: 'Author not found' };
  return buildMetadata({
    title: author.name,
    description: author.bio ?? `Articles by ${author.name}.`,
    path: `/author/${author.slug}`,
    image: author.avatar?.url,
  });
}

export default async function AuthorPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [author, result] = await Promise.all([
    getAuthorBySlug(slug).catch(() => null),
    getArticlesByAuthor(slug, page),
  ]);
  if (!author) notFound();

  const avatar = mediaUrl(author.avatar?.url);
  const social = author.socialLinks;
  const socials = [
    { href: social?.twitter, icon: XIcon, label: 'X / Twitter' },
    { href: social?.linkedin, icon: LinkedInIcon, label: 'LinkedIn' },
    { href: social?.github, icon: GitHubIcon, label: 'GitHub' },
    { href: social?.instagram, icon: InstagramIcon, label: 'Instagram' },
    { href: social?.website, icon: Globe, label: 'Website' },
  ].filter((s) => s.href);

  const jsonLd = [
    breadcrumbJsonLd([
      { name: 'Home', url: config.siteUrl },
      { name: 'Authors', url: `${config.siteUrl}/blog` },
      { name: author.name, url: `${config.siteUrl}/author/${author.slug}` },
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: author.name,
      url: `${config.siteUrl}/author/${author.slug}`,
      image: avatar ?? undefined,
      jobTitle: author.designation ?? undefined,
      description: author.bio ?? undefined,
      sameAs: socials.map((s) => s.href),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: 'Articles', href: '/blog' }, { label: author.name }]}
      />

      <header className="mt-8 flex flex-col items-start gap-6 rounded-3xl border border-border bg-surface p-8 sm:flex-row sm:items-center sm:p-10">
        {avatar ? (
          <Image
            src={avatar}
            alt={author.name}
            width={112}
            height={112}
            priority
            className="h-28 w-28 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-stone-100 font-serif text-4xl text-faint">
            {author.name.charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">Author</p>
          <h1 className="mt-1 font-serif text-4xl font-semibold tracking-tight">{author.name}</h1>
          {author.designation && <p className="mt-1 text-sm text-faint">{author.designation}</p>}
          {author.bio && (
            <p className="mt-4 max-w-2xl leading-relaxed text-muted">{author.bio}</p>
          )}
          {socials.length > 0 && (
            <div className="mt-5 flex gap-2">
              {socials.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-foreground hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="mt-12">
        <h2 className="font-serif text-2xl font-semibold tracking-tight">
          Articles by {author.name.split(' ')[0]}
          <span className="ml-3 text-base font-normal text-faint">
            {result.meta.pagination.total} total
          </span>
        </h2>
        <div className="mt-6">
          <ArticleGrid
            articles={result.data}
            priorityCount={3}
            emptyMessage={`${author.name} has not published anything yet.`}
          />
          <Pagination
            pagination={result.meta.pagination}
            buildHref={(p) => `/author/${slug}${p > 1 ? `?page=${p}` : ''}`}
          />
        </div>
      </div>
    </div>
  );
}
