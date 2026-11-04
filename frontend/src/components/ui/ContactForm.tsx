'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = 'idle' | 'loading' | 'success' | 'error';

const inputClasses =
  'w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors placeholder:text-faint focus:border-foreground';

export function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<Status>('idle');
  const [feedback, setFeedback] = useState('');

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (status === 'error') setStatus('idle');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setStatus('error');
      setFeedback('Please tell us your name.');
      return;
    }
    if (!EMAIL_RE.test(form.email.trim())) {
      setStatus('error');
      setFeedback('Please enter a valid email address.');
      return;
    }
    if (!form.message.trim()) {
      setStatus('error');
      setFeedback('Please write a message.');
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? 'Submission failed');
      }
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setFeedback(err instanceof Error && err.message !== 'Submission failed'
        ? err.message
        : 'Something went wrong — please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-5 text-sm text-green-800">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">Message received.</p>
          <p className="mt-1 text-green-700">
            Thanks for reaching out — we read everything and typically reply within a few days.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          type="text"
          value={form.name}
          onChange={update('name')}
          placeholder="Your name"
          aria-label="Your name"
          required
          maxLength={120}
          className={inputClasses}
        />
        <input
          type="email"
          value={form.email}
          onChange={update('email')}
          placeholder="you@example.com"
          aria-label="Email address"
          required
          className={inputClasses}
        />
      </div>
      <input
        type="text"
        value={form.subject}
        onChange={update('subject')}
        placeholder="Subject (optional — put [PITCH] here for story ideas)"
        aria-label="Subject"
        maxLength={200}
        className={inputClasses}
      />
      <textarea
        value={form.message}
        onChange={update('message')}
        placeholder="Your message…"
        aria-label="Your message"
        required
        rows={6}
        maxLength={5000}
        className={`${inputClasses} resize-y`}
      />
      <div className="flex items-center gap-4">
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
          Send message
        </button>
        {status === 'error' && <p className="text-sm text-red-600">{feedback}</p>}
      </div>
    </form>
  );
}
