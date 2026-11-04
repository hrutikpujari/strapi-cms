import { EmptyState } from '@/components/ui/EmptyState';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <EmptyState
        title="404 — Page not found"
        message="The page you are looking for does not exist or was moved."
        actionHref="/"
        actionLabel="Back to homepage"
      />
    </div>
  );
}
