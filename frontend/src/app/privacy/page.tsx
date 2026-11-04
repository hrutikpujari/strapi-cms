import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Privacy Policy',
  description: 'How Meridian collects, uses, and protects your data.',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Privacy Policy' }]} />
      <h1 className="mt-8 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
        Privacy Policy
      </h1>
      <p className="mt-3 text-sm text-faint">Last updated: November 2026</p>

      <div className="prose-body mt-8">
        <p>
          This policy explains what information Meridian collects when you use this site,
          why we collect it, and the choices you have. The short version: we collect as
          little as possible and we never sell your data.
        </p>
        <h2>Information we collect</h2>
        <p>
          <strong>Newsletter email.</strong> If you subscribe to our newsletter we store
          your email address and subscription date so we can send you the newsletter. That
          is the only personal data we ask for.
        </p>
        <p>
          <strong>Reading metrics.</strong> Article view counts are recorded anonymously
          to power our &quot;trending&quot; features. No account or identity is attached.
        </p>
        <p>
          <strong>Server logs.</strong> Like every website, our servers may temporarily log
          IP addresses and browser information for security and debugging purposes.
        </p>
        <h2>How we use information</h2>
        <ul>
          <li>To send the newsletter you explicitly subscribed to</li>
          <li>To understand which articles readers find useful</li>
          <li>To keep the site secure and running</li>
        </ul>
        <h2>What we never do</h2>
        <ul>
          <li>Sell or rent your personal information</li>
          <li>Share your email with third-party marketers</li>
          <li>Use invasive cross-site tracking</li>
        </ul>
        <h2>Your choices</h2>
        <p>
          You can unsubscribe from the newsletter at any time using the link in any email.
          To request deletion of your data, contact us at{' '}
          <a href="mailto:hello@meridian.press">hello@meridian.press</a>.
        </p>
        <h2>Changes to this policy</h2>
        <p>
          If we change this policy in a material way, we will note it prominently on this
          page before the change takes effect.
        </p>
      </div>
    </div>
  );
}
