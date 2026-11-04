import { NextResponse } from 'next/server';
import { config } from '@/lib/config';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/contact  { "name": "...", "email": "...", "subject": "...", "message": "..." }
 * Same-origin proxy → Strapi POST /api/contact-messages/submit.
 * Validates before forwarding; keeps the Strapi URL off the client.
 */
export async function POST(request: Request) {
  let body: { name?: string; email?: string; subject?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const name = String(body?.name ?? '').trim();
  const email = String(body?.email ?? '').trim().toLowerCase();
  const subject = String(body?.subject ?? '').trim();
  const message = String(body?.message ?? '').trim();

  if (!name || name.length > 120) {
    return NextResponse.json({ error: 'Your name is required' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
  }
  if (!message || message.length > 5000) {
    return NextResponse.json({ error: 'A message is required' }, { status: 400 });
  }

  try {
    const res = await fetch(`${config.strapiUrl}/api/contact-messages/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiToken ? { Authorization: `Bearer ${config.apiToken}` } : {}),
      },
      body: JSON.stringify({ data: { name, email, subject, message } }),
      cache: 'no-store',
    });
    const data = await res.json().catch(() => null);
    return NextResponse.json(data ?? { error: 'Submission failed' }, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Contact service unavailable' }, { status: 502 });
  }
}
