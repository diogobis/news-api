import { db, schema } from "../db";
import { eq, and, sql, gte } from "drizzle-orm";

export interface ReadLaterItem {
  userId: number;
  articleUuid: string;
  savedAt: string;
}

export async function saveArticle(userId: number, articleUuid: string): Promise<ReadLaterItem> {
  const article = await db.query.articles.findFirst({
    where: eq(schema.articles.uuid, articleUuid),
  });

  if (!article) {
    throw { status: 404, message: "Article not found" };
  }

  const existing = await db
    .select()
    .from(schema.userReadLater)
    .where(
      and(
        eq(schema.userReadLater.userId, userId),
        eq(schema.userReadLater.articleUuid, articleUuid)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw { status: 409, message: "Article already in read-later queue" };
  }

  const now = new Date().toISOString();
  const [inserted] = await db
    .insert(schema.userReadLater)
    .values({ userId, articleUuid, savedAt: now })
    .returning();

  return inserted;
}

export async function removeArticle(userId: number, articleUuid: string): Promise<void> {
  const result = await db
    .delete(schema.userReadLater)
    .where(
      and(
        eq(schema.userReadLater.userId, userId),
        eq(schema.userReadLater.articleUuid, articleUuid)
      )
    );

  if (result.changes === 0) {
    throw { status: 404, message: "Article not in read-later queue" };
  }
}

export async function listQueue(userId: number) {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  return db
    .select({
      userId: schema.userReadLater.userId,
      articleUuid: schema.userReadLater.articleUuid,
      savedAt: schema.userReadLater.savedAt,
      title: schema.articles.title,
      publisher: schema.articles.publisher,
      publishedAt: schema.articles.publishedAt,
      thumbnail: schema.articles.thumbnail,
    })
    .from(schema.userReadLater)
    .innerJoin(schema.articles, eq(schema.userReadLater.articleUuid, schema.articles.uuid))
    .where(
      and(
        eq(schema.userReadLater.userId, userId),
        gte(schema.userReadLater.savedAt, cutoff)
      )
    )
    .orderBy(schema.userReadLater.savedAt);
}
