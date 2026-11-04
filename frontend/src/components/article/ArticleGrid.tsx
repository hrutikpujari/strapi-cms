import type { Article } from '@/types/strapi';
import { ArticleCard } from './ArticleCard';
import { EmptyState } from '@/components/ui/EmptyState';

interface ArticleGridProps {
  articles: Article[];
  priorityCount?: number;
  emptyMessage?: string;
}

export function ArticleGrid({ articles, priorityCount = 0, emptyMessage }: ArticleGridProps) {
  if (articles.length === 0) {
    return <EmptyState title="No articles yet" message={emptyMessage ?? 'Check back soon — new stories are published regularly.'} />;
  }
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article, i) => (
        <ArticleCard key={article.documentId} article={article} priority={i < priorityCount} />
      ))}
    </div>
  );
}
