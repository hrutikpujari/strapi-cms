'use client';

import { useEffect, useRef, useState } from 'react';
import { Eye } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

/**
 * Increments the article's public view counter once per mount
 * (idempotent per session via sessionStorage) and displays the total.
 */
export function ViewCounter({
  documentId,
  initialCount,
}: {
  documentId: string;
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const key = `viewed:${documentId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');

    fetch(`/api/articles/${documentId}/view`, { method: 'POST' })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const next = json?.data?.viewCount;
        if (typeof next === 'number') setCount(next);
      })
      .catch(() => {});
  }, [documentId]);

  return (
    <span className="flex items-center gap-1.5 text-sm text-faint">
      <Eye className="h-4 w-4" /> {formatNumber(count)} reads
    </span>
  );
}
