import type { Metadata } from 'next';
import { Inter, Newsreader } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { getCategories, getSettings } from '@/services/api';
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo';
import { mediaUrl } from '@/lib/strapi';
import { config } from '@/lib/config';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] });
const newsreader = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
  style: ['normal', 'italic'],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings().then((r) => r.data).catch(() => null);
  const favicon = mediaUrl(settings?.favicon?.url);
  return {
    metadataBase: new URL(config.siteUrl),
    title: {
      default: settings?.defaultSeoTitle ?? 'Meridian — Ideas worth reading',
      template: `%s — ${settings?.siteName ?? 'Meridian'}`,
    },
    description: settings?.defaultSeoDescription ?? undefined,
    icons: favicon ? { icon: favicon } : undefined,
  };
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const [settingsData, categories] = await Promise.all([
    getSettings().then((r) => r.data).catch(() => null),
    getCategories().catch(() => ({ data: [] })),
  ]);

  const jsonLd = [organizationJsonLd(settingsData), websiteJsonLd(settingsData)];

  return (
    <html
      lang="en"
      className={`${inter.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Navbar settings={settingsData} categories={categories.data} />
        <main className="flex-1">{children}</main>
        <Footer settings={settingsData} categories={categories.data} />
      </body>
    </html>
  );
}
