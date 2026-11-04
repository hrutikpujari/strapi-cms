'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = 'idle' | 'loading' | 'success' | 'error';

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
      setMessage('You are in. Welcome to the newsletter.');
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Something went wrong — please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
        <CheckCircle2 className="h-4 w-4 shrink-0" /> {message}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={cn('w-full', compact ? 'max-w-md' : 'max-w-lg')}>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === 'error') setStatus('idle');
          }}
          placeholder="you@example.com"
          aria-label="Email address"
          required
          className="h-11 flex-1 rounded-full border border-border bg-surface px-5 text-sm outline-none transition-colors placeholder:text-faint focus:border-foreground"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-semibold text-background transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {status === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Subscribe
        </button>
      </div>
      {status === 'error' && <p className="mt-2 pl-2 text-sm text-red-600">{message}</p>}
    </form>
  );
}
