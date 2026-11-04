export function CardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="aspect-[16/10] bg-stone-200" />
      <div className="p-5">
        <div className="h-3 w-20 rounded bg-stone-200" />
        <div className="mt-3 h-5 w-4/5 rounded bg-stone-200" />
        <div className="mt-2 h-5 w-3/5 rounded bg-stone-200" />
        <div className="mt-4 h-3 w-full rounded bg-stone-100" />
        <div className="mt-1.5 h-3 w-2/3 rounded bg-stone-100" />
      </div>
    </div>
  );
}

export function ArticleGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
