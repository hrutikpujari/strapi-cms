'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SearchBar({
  defaultValue = '',
  autoFocus = false,
  large = false,
}: {
  defaultValue?: string;
  autoFocus?: boolean;
  large?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  };

  return (
    <form onSubmit={submit} role="search" className="w-full">
      <div
        className={cn(
          'flex items-center gap-3 rounded-full border border-border bg-surface px-5 transition-colors focus-within:border-foreground',
          large ? 'h-14' : 'h-11'
        )}
      >
        <Search className={cn('shrink-0 text-faint', large ? 'h-5 w-5' : 'h-4 w-4')} />
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search articles, topics, authors…"
          aria-label="Search articles"
          autoFocus={autoFocus}
          className={cn(
            'w-full bg-transparent outline-none placeholder:text-faint',
            large ? 'text-base' : 'text-sm'
          )}
        />
      </div>
    </form>
  );
}
