import Link from 'next/link';
import { Globe, PenLine } from 'lucide-react';
import { GitHubIcon, InstagramIcon, LinkedInIcon, XIcon } from '@/components/ui/BrandIcons';
import type { Category, WebsiteSettings } from '@/types/strapi';

interface FooterProps {
  settings: WebsiteSettings | null;
  categories: Category[];
}

export function Footer({ settings, categories }: FooterProps) {
  const siteName = settings?.siteName ?? 'Meridian';
  const social = settings?.socialLinks;
  const year = new Date().getFullYear();

  const socialIcons = [
    { href: social?.twitter, icon: XIcon, label: 'X / Twitter' },
    { href: social?.linkedin, icon: LinkedInIcon, label: 'LinkedIn' },
    { href: social?.github, icon: GitHubIcon, label: 'GitHub' },
    { href: social?.instagram, icon: InstagramIcon, label: 'Instagram' },
    { href: social?.website, icon: Globe, label: 'Website' },
  ].filter((s) => s.href);

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2 font-serif text-xl font-semibold">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-background">
                <PenLine className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
              {siteName}
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              {settings?.footerContent ?? settings?.siteDescription}
            </p>
            {socialIcons.length > 0 && (
              <div className="mt-5 flex gap-2">
                {socialIcons.map(({ href, icon: Icon, label }) => (
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

          <nav aria-label="Categories">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Categories
            </h3>
            <ul className="mt-4 space-y-2.5">
              {categories.map((c) => (
                <li key={c.documentId}>
                  <Link href={`/category/${c.slug}`} className="text-sm text-muted hover:text-foreground">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Site">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Site
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/" className="text-sm text-muted hover:text-foreground">Home</Link></li>
              <li><Link href="/blog" className="text-sm text-muted hover:text-foreground">All Articles</Link></li>
              <li><Link href="/about" className="text-sm text-muted hover:text-foreground">About</Link></li>
              <li><Link href="/contact" className="text-sm text-muted hover:text-foreground">Contact</Link></li>
              <li><Link href="/feed.xml" className="text-sm text-muted hover:text-foreground">RSS Feed</Link></li>
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Legal
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/privacy" className="text-sm text-muted hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-muted hover:text-foreground">Terms &amp; Conditions</Link></li>
            </ul>
            {settings?.contactEmail && (
              <p className="mt-6 text-sm text-muted">
                <a href={`mailto:${settings.contactEmail}`} className="hover:text-foreground">
                  {settings.contactEmail}
                </a>
              </p>
            )}
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-sm text-faint sm:flex-row">
          <p>© {year} {siteName}. All rights reserved.</p>
          <p>Powered by Strapi &amp; Next.js</p>
        </div>
      </div>
    </footer>
  );
}
