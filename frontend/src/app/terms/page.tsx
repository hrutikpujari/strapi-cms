import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Terms & Conditions',
  description: 'The terms that govern use of the Meridian website.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Terms & Conditions' }]} />
      <h1 className="mt-8 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
        Terms &amp; Conditions
      </h1>
      <p className="mt-3 text-sm text-faint">Last updated: November 2026</p>

      <div className="prose-body mt-8">
        <p>
          By accessing this website you agree to these terms. If you do not agree, please
          do not use the site.
        </p>
        <h2>Content</h2>
        <p>
          All articles, images, and design on this site are the property of Meridian or
          their respective authors and are protected by copyright. You may share links and
          quote short excerpts with attribution. You may not republish full articles
          without written permission.
        </p>
        <h2>Acceptable use</h2>
        <ul>
          <li>Do not scrape or bulk-download site content</li>
          <li>Do not attempt to disrupt or overload the service</li>
          <li>Do not misrepresent our content as your own</li>
        </ul>
        <h2>Newsletter</h2>
        <p>
          Newsletter subscriptions are free and can be cancelled at any time. We reserve
          the right to remove subscribers who abuse the service.
        </p>
        <h2>Disclaimer</h2>
        <p>
          Articles are provided for information and commentary. They do not constitute
          professional, legal, or financial advice. Opinions expressed are those of the
          authors.
        </p>
        <h2>Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, Meridian is not liable for damages
          arising from use of, or inability to use, this website.
        </p>
        <h2>Contact</h2>
        <p>
          Questions about these terms? Email{' '}
          <a href="mailto:hello@meridian.press">hello@meridian.press</a>.
        </p>
      </div>
    </div>
  );
}
