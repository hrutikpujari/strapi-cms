import { getLatestArticles, getSettings } from '@/services/api';
import { config } from '@/lib/config';
import { mediaUrl } from '@/lib/strapi';
import { blocksToText } from '@/lib/utils';

export const revalidate = 3600;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const [settings, articles] = await Promise.all([
    getSettings().catch(() => ({ data: null })),
    getLatestArticles(1, 20).catch(() => ({ data: [] })),
  ]);

  const siteName = settings.data?.siteName ?? 'Meridian';
  const description =
    settings.data?.siteDescription ?? 'Essays and reporting on technology, design, and culture.';

  const items = articles.data
    .map((a) => {
      const url = `${config.siteUrl}/blog/${a.slug}`;
      const img = mediaUrl(a.featuredImage?.url ?? a.thumbnailImage?.url);
      return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(a.publishedDate).toUTCString()}</pubDate>
      <description>${escapeXml(a.excerpt)}</description>
      ${a.author ? `<author>${escapeXml(a.author.name)}</author>` : ''}
      ${a.category ? `<category>${escapeXml(a.category.name)}</category>` : ''}
      ${img ? `<enclosure url="${img}" type="image/png" />` : ''}
      <content:encoded><![CDATA[${escapeXml(blocksToText(a.content).slice(0, 400))}…]]></content:encoded>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${config.siteUrl}</link>
    <description>${escapeXml(description)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${config.siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
