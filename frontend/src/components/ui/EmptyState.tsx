import Link from 'next/link';
import { FileSearch } from 'lucide-react';

export function EmptyState({
  title = 'Nothing here yet',
  message,
  actionHref = '/blog',
  actionLabel = 'Browse all articles',
}: {
  title?: string;
  message?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-faint">
        <FileSearch className="h-6 w-6" />
      </div>
      <h3 className="mt-5 font-serif text-xl font-semibold">{title}</h3>
      {message && <p className="mt-2 max-w-sm text-sm text-muted">{message}</p>}
      {actionHref && (
        <Link
          href={actionHref}
          className="mt-6 rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-85"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
