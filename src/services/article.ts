import { db, schema } from "../db";
import { eq, inArray, sql, and, like, notLike, gte, lte, desc, type SQL } from "drizzle-orm";
import { AppError } from "../lib/appError";
import { fetchArticleDetails } from "./fetcher";

function formatBody(body: string | null): string | null {
  if (!body) return body;
  if (body.includes("<p>") || body.includes("<br>")) return body;
  const paragraphs = body.split(/\n\n+/).map((p) => {
    const inline = p.replace(/\n/g, "<br>");
    return `<p>${inline}</p>`;
  });
  return paragraphs.join("\n");
}

export interface ArticleRow {
  uuid: string;
  title: string;
  publisher: string | null;
  publishedAt: string | null;
  thumbnail: string | null;
  originalUrl: string | null;
  authors: string[] | null;
  detailsFetched: boolean;
  categories: string[];
}

export interface ArticleDetailRow extends ArticleRow {
  body: string | null;
}

export async function listArticles(params: {
  category?: string;
  search?: string;
  publishedFrom?: string;
  publishedTo?: string;
  page: number;
  limit: number;
  mutedKeywords?: string[];
}): Promise<{ articles: ArticleRow[]; total: number }> {
  const { category, search, publishedFrom, publishedTo, page, limit, mutedKeywords } = params;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [];

  if (category) {
    const matchingUuids = db
      .select({ uuid: schema.articleCategories.articleUuid })
      .from(schema.articleCategories)
      .where(eq(schema.articleCategories.category, category));

    conditions.push(inArray(schema.articles.uuid, matchingUuids));
  }

  if (search && search.trim()) {
    conditions.push(like(schema.articles.title, `%${search.trim()}%`));
  }

  if (publishedFrom) {
    conditions.push(gte(schema.articles.publishedAt, publishedFrom));
  }
  if (publishedTo) {
    conditions.push(lte(schema.articles.publishedAt, publishedTo));
  }

  if (mutedKeywords && mutedKeywords.length > 0) {
    for (const keyword of mutedKeywords) {
      conditions.push(
        and(notLike(schema.articles.title, `%${keyword}%`), notLike(schema.articles.publisher, `%${keyword}%`))!
      );
    }
  }

  conditions.push(eq(schema.articles.detailsFetched, true))

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ count: total }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.articles)
    .where(whereClause);

  const rows = await db
    .select({
      uuid: schema.articles.uuid,
      title: schema.articles.title,
      publisher: schema.articles.publisher,
      publishedAt: schema.articles.publishedAt,
      thumbnail: schema.articles.thumbnail,
      originalUrl: schema.articles.originalUrl,
      authors: schema.articles.authors,
      detailsFetched: schema.articles.detailsFetched,
    })
    .from(schema.articles)
    .where(whereClause)
    .orderBy(desc(schema.articles.publishedAt))
    .limit(limit)
    .offset(offset);

  const uuids = rows.map((r) => r.uuid);
  const allCats = uuids.length > 0
    ? await db
        .select()
        .from(schema.articleCategories)
        .where(inArray(schema.articleCategories.articleUuid, uuids))
    : [];

  const catMap = new Map<string, string[]>();
  for (const c of allCats) {
    const list = catMap.get(c.articleUuid) ?? [];
    list.push(c.category);
    catMap.set(c.articleUuid, list);
  }

  const articles = rows.map((row) => ({
    ...row,
    detailsFetched: row.detailsFetched ?? false,
    categories: catMap.get(row.uuid) ?? [],
  }));

  return { articles, total };
}

export async function getArticleDetails(uuid: string): Promise<ArticleDetailRow> {
  const existing = await db.query.articles.findFirst({
    where: eq(schema.articles.uuid, uuid),
  });

  if (!existing) {
    throw new AppError(404, "Artigo não encontrado");
  }

  let updated = existing;
  if (!existing.detailsFetched) {
    const detail = await fetchArticleDetails(uuid);
    await db
      .update(schema.articles)
      .set({
        body: detail.body,
        thumbnail: detail.thumbnail,
        originalUrl: detail.original_url,
        authors: detail.authors,
        detailsFetched: true,
        fetchedAt: new Date().toISOString(),
      })
      .where(eq(schema.articles.uuid, uuid));

    updated = (await db.query.articles.findFirst({
      where: eq(schema.articles.uuid, uuid),
    }))!;
  }

  const cats = await db
    .select({ category: schema.articleCategories.category })
    .from(schema.articleCategories)
    .where(eq(schema.articleCategories.articleUuid, uuid));

  return {
    ...updated,
    body: formatBody(updated.body),
    detailsFetched: updated.detailsFetched ?? false,
    categories: cats.map((c) => c.category),
  };
}
