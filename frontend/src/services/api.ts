import { strapiFetch } from '@/lib/strapi';
import type {
  Article,
  Author,
  Category,
  StrapiListResponse,
  StrapiSingleResponse,
  Tag,
  WebsiteSettings,
} from '@/types/strapi';

/* ------------------------------------------------------------------ */
/* Shared populate/field parameters                                     */
/* ------------------------------------------------------------------ */

const ARTICLE_CARD_POPULATE = {
  'populate[thumbnailImage]': 'true',
  'populate[featuredImage]': 'true',
  'populate[category]': 'true',
  'populate[author][populate][0]': 'avatar',
} as const;

const ARTICLE_FULL_POPULATE = {
  ...ARTICLE_CARD_POPULATE,
  'populate[tags]': 'true',
  'populate[ogImage]': 'true',
  'populate[author][populate][0]': 'avatar',
  'populate[author][populate][1]': 'socialLinks',
} as const;

const ARTICLE_LIST_FIELDS = {
  'fields[0]': 'title',
  'fields[1]': 'slug',
  'fields[2]': 'excerpt',
  'fields[3]': 'publishedDate',
  'fields[4]': 'readingTime',
  'fields[5]': 'viewCount',
  'fields[6]': 'featured',
} as const;

export const PAGE_SIZE = 6;

/* ------------------------------------------------------------------ */
/* Articles                                                             */
/* ------------------------------------------------------------------ */

export function getLatestArticles(page = 1, pageSize = PAGE_SIZE) {
  return strapiFetch<StrapiListResponse<Article>>('articles', {
    ...ARTICLE_LIST_FIELDS,
    ...ARTICLE_CARD_POPULATE,
    'sort[0]': 'publishedDate:desc',
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
  });
}

export function getFeaturedArticles(limit = 4) {
  return strapiFetch<StrapiListResponse<Article>>('articles', {
    ...ARTICLE_LIST_FIELDS,
    ...ARTICLE_CARD_POPULATE,
    'filters[featured][$eq]': 'true',
    'sort[0]': 'publishedDate:desc',
    'pagination[pageSize]': limit,
  });
}

export function getPopularArticles(limit = 5) {
  return strapiFetch<StrapiListResponse<Article>>('articles', {
    ...ARTICLE_LIST_FIELDS,
    ...ARTICLE_CARD_POPULATE,
    'sort[0]': 'viewCount:desc',
    'pagination[pageSize]': limit,
  });
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const res = await strapiFetch<StrapiListResponse<Article>>('articles', {
    ...ARTICLE_FULL_POPULATE,
    'filters[slug][$eq]': slug,
    'pagination[pageSize]': 1,
  });
  return res.data[0] ?? null;
}

export function getAllArticleSlugs() {
  return strapiFetch<StrapiListResponse<Article>>('articles', {
    'fields[0]': 'slug',
    'fields[1]': 'updatedAt',
    'fields[2]': 'publishedDate',
    'pagination[pageSize]': 200,
  });
}

export async function getArticlesByCategory(categorySlug: string, page = 1, pageSize = PAGE_SIZE) {
  return strapiFetch<StrapiListResponse<Article>>('articles', {
    ...ARTICLE_LIST_FIELDS,
    ...ARTICLE_CARD_POPULATE,
    'filters[category][slug][$eq]': categorySlug,
    'sort[0]': 'publishedDate:desc',
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
  });
}

export function getArticlesByAuthor(authorSlug: string, page = 1, pageSize = PAGE_SIZE) {
  return strapiFetch<StrapiListResponse<Article>>('articles', {
    ...ARTICLE_LIST_FIELDS,
    ...ARTICLE_CARD_POPULATE,
    'filters[author][slug][$eq]': authorSlug,
    'sort[0]': 'publishedDate:desc',
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
  });
}

export function searchArticles(
  query: string,
  page = 1,
  opts: { categorySlug?: string; sort?: 'latest' | 'popular'; pageSize?: number } = {}
) {
  const params: Record<string, string | number> = {
    ...ARTICLE_LIST_FIELDS,
    ...ARTICLE_CARD_POPULATE,
    'pagination[page]': page,
    'pagination[pageSize]': opts.pageSize ?? PAGE_SIZE,
    'sort[0]': opts.sort === 'popular' ? 'viewCount:desc' : 'publishedDate:desc',
    'filters[$or][0][title][$containsi]': query,
    'filters[$or][1][excerpt][$containsi]': query,
    'filters[$or][2][tags][name][$containsi]': query,
  };
  if (opts.categorySlug) {
    params['filters[category][slug][$eq]'] = opts.categorySlug;
  }
  return strapiFetch<StrapiListResponse<Article>>('articles', params);
}

export async function getRelatedArticles(article: Article, limit = 3) {
  const res = await strapiFetch<StrapiListResponse<Article>>('articles', {
    ...ARTICLE_LIST_FIELDS,
    ...ARTICLE_CARD_POPULATE,
    'filters[category][slug][$eq]': article.category?.slug ?? '',
    'filters[slug][$ne]': article.slug,
    'sort[0]': 'publishedDate:desc',
    'pagination[pageSize]': limit,
  });
  // Fall back to latest articles if the category has too few siblings.
  if (res.data.length >= limit) return res.data;
  const latest = await getLatestArticles(1, limit + 1);
  const merged = [...res.data];
  for (const a of latest.data) {
    if (merged.length >= limit) break;
    if (a.slug !== article.slug && !merged.some((m) => m.slug === a.slug)) merged.push(a);
  }
  return merged;
}

/** Previous (newer) and next (older) articles relative to a publish date. */
export async function getAdjacentArticles(article: Article) {
  const [newer, older] = await Promise.all([
    strapiFetch<StrapiListResponse<Article>>('articles', {
      'fields[0]': 'title',
      'fields[1]': 'slug',
      'filters[publishedDate][$gt]': article.publishedDate,
      'sort[0]': 'publishedDate:asc',
      'pagination[pageSize]': 1,
    }),
    strapiFetch<StrapiListResponse<Article>>('articles', {
      'fields[0]': 'title',
      'fields[1]': 'slug',
      'filters[publishedDate][$lt]': article.publishedDate,
      'sort[0]': 'publishedDate:desc',
      'pagination[pageSize]': 1,
    }),
  ]);
  return { newer: newer.data[0] ?? null, older: older.data[0] ?? null };
}

/* ------------------------------------------------------------------ */
/* Categories / tags / authors / settings                               */
/* ------------------------------------------------------------------ */

export function getCategories() {
  return strapiFetch<StrapiListResponse<Category>>('categories', {
    'populate[image]': 'true',
    'sort[0]': 'name:asc',
    'pagination[pageSize]': 50,
  });
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const res = await strapiFetch<StrapiListResponse<Category>>('categories', {
    'populate[image]': 'true',
    'filters[slug][$eq]': slug,
    'pagination[pageSize]': 1,
  });
  return res.data[0] ?? null;
}

export function getTags() {
  return strapiFetch<StrapiListResponse<Tag>>('tags', {
    'sort[0]': 'name:asc',
    'pagination[pageSize]': 100,
  });
}

export async function getAuthorBySlug(slug: string): Promise<Author | null> {
  const res = await strapiFetch<StrapiListResponse<Author>>('authors', {
    'populate[avatar]': 'true',
    'populate[socialLinks]': 'true',
    'filters[slug][$eq]': slug,
    'pagination[pageSize]': 1,
  });
  return res.data[0] ?? null;
}

export function getAuthorSlugs() {
  return strapiFetch<StrapiListResponse<Author>>('authors', {
    'fields[0]': 'slug',
    'pagination[pageSize]': 100,
  });
}

export function getSettings() {
  return strapiFetch<StrapiSingleResponse<WebsiteSettings>>('website-setting', {
    'populate[logo]': 'true',
    'populate[favicon]': 'true',
    'populate[defaultOgImage]': 'true',
    'populate[socialLinks]': 'true',
  });
}
