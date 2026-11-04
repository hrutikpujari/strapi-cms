import { NextResponse } from 'next/server';
import { config } from '@/lib/config';

/**
 * POST /api/articles/:documentId/view
 * Same-origin proxy → Strapi view counter.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
  if (!/^[a-z0-9]+$/i.test(documentId)) {
    return NextResponse.json({ error: 'Invalid document id' }, { status: 400 });
  }

  try {
    const res = await fetch(`${config.strapiUrl}/api/articles/${documentId}/view`, {
      method: 'POST',
      headers: config.apiToken ? { Authorization: `Bearer ${config.apiToken}` } : {},
      cache: 'no-store',
    });
    const body = await res.json().catch(() => null);
    return NextResponse.json(body ?? { error: 'View update failed' }, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 502 });
  }
}
