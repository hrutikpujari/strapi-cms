'use client';

import { ErrorState } from '@/components/ui/ErrorState';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <ErrorState
        title="Something went wrong"
        message="We could not load this page. The CMS may be unreachable — please try again."
        onRetry={reset}
      />
    </div>
  );
}
