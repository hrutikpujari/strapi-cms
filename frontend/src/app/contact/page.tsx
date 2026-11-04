import type { Metadata } from 'next';
import { Mail, MapPin, MessageSquare } from 'lucide-react';
import { getSettings } from '@/services/api';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const revalidate = 3600;
export const metadata: Metadata = buildMetadata({
  title: 'Contact Us',
  description: 'Get in touch with the Meridian editorial team.',
  path: '/contact',
});

export default async function ContactPage() {
  const settings = await getSettings().catch(() => ({ data: null }));
  const email = settings.data?.contactEmail ?? 'hello@meridian.press';

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Contact' }]} />
      <h1 className="mt-8 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
        Contact us
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
        Whether it is a story tip, a correction, a partnership idea, or just a hello —
        we read everything.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <a
          href={`mailto:${email}`}
          className="group rounded-2xl border border-border bg-surface p-6 transition-shadow hover:shadow-md"
        >
          <Mail className="h-6 w-6 text-accent" />
          <h2 className="mt-4 font-serif text-xl font-semibold">Email</h2>
          <p className="mt-1 text-sm text-muted group-hover:text-foreground">{email}</p>
        </a>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <MessageSquare className="h-6 w-6 text-accent" />
          <h2 className="mt-4 font-serif text-xl font-semibold">Press &amp; pitches</h2>
          <p className="mt-1 text-sm text-muted">
            Put <span className="font-medium text-foreground">[PITCH]</span> in the subject
            line for a faster reply.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 sm:col-span-2">
          <MapPin className="h-6 w-6 text-accent" />
          <h2 className="mt-4 font-serif text-xl font-semibold">Where we are</h2>
          <p className="mt-1 text-sm text-muted">
            Fully remote — our contributors write from four continents and counting.
          </p>
        </div>
      </div>
    </div>
  );
}
