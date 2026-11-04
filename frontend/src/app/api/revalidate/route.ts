import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/revalidate?secret=...
 *
 * Called by Strapi lifecycle hooks whenever article content changes.
 * Invalidates every cached page (articles flow through the home page,
 * listings, category/author pages, search, sitemap, and RSS).
 */
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const expected = process.env.REVALIDATE_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  revalidatePath('/', 'layout');

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
