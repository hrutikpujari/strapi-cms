import { ArticleGridSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10 h-10 w-64 animate-pulse rounded-lg bg-stone-200" />
      <ArticleGridSkeleton />
    </div>
  );
}
