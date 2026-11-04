import { NextResponse } from 'next/server';
import { config } from '@/lib/config';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/newsletter  { "email": "user@example.com" }
 * Same-origin proxy → Strapi POST /api/newsletter-subscribers/subscribe.
 * Keeps the Strapi URL off the client and avoids CORS entirely.
 */
export async function POST(request: Request) {
  let email: string;
  try {
    email = String((await request.json())?.email ?? '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
  }

  try {
    const res = await fetch(`${config.strapiUrl}/api/newsletter-subscribers/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiToken ? { Authorization: `Bearer ${config.apiToken}` } : {}),
      },
      body: JSON.stringify({ data: { email } }),
      cache: 'no-store',
    });
    const body = await res.json().catch(() => null);
    return NextResponse.json(body ?? { error: 'Subscription failed' }, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Newsletter service unavailable' }, { status: 502 });
  }
}
