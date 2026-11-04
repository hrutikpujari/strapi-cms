import type { Metadata } from 'next';
import { getSettings } from '@/services/api';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const revalidate = 3600;
export const metadata: Metadata = buildMetadata({
  title: 'About Us',
  description: 'Who we are and why Meridian exists.',
  path: '/about',
});

export default async function AboutPage() {
  const settings = await getSettings().catch(() => ({ data: null }));
  const siteName = settings.data?.siteName ?? 'Meridian';

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'About' }]} />
      <h1 className="mt-8 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
        About {siteName}
      </h1>
      <div className="prose-body mt-8">
        <p>
          {settings.data?.siteDescription ??
            `${siteName} is an independent journal of technology, design, and culture.`}
        </p>
        <p>
          We believe the best writing on the web is slow, considered, and made to be read —
          not skimmed past in a feed. {siteName} publishes essays and reporting for the
          people who make things on the internet: engineers, designers, editors, and the
          incurably curious.
        </p>
        <h2>What we cover</h2>
        <p>
          Our pages span four territories: the technology that shapes how we build, the
          design that shapes how it feels, the productivity practices that shape the
          people doing the work, and the culture that all of this is quietly rewiring.
        </p>
        <h2>How we work</h2>
        <p>
          Every article is written by a human, edited by a human, and published through our
          headless CMS — the same stack we write about. We do not chase volume. We publish
          when something is worth your attention, and we would rather publish nothing than
          filler.
        </p>
        <h2>Get in touch</h2>
        <p>
          Story tips, corrections, and kind words are always welcome. Reach us at{' '}
          <a href={`mailto:${settings.data?.contactEmail ?? 'hello@meridian.press'}`}>
            {settings.data?.contactEmail ?? 'hello@meridian.press'}
          </a>{' '}
          or through our <a href="/contact">contact page</a>.
        </p>
      </div>
    </div>
  );
}
