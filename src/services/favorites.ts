import { db, schema } from "../db";
import { eq, and, inArray, sql } from "drizzle-orm";
import { AppError } from "../lib/appError";

export interface FavoriteFilters {
  search?: string;
  publishedFrom?: string;
  publishedTo?: string;
  category?: string;
}

export interface FavoriteItem {
  userId: number;
  articleUuid: string;
  createdAt: string;
}

export async function saveFavorite(userId: number, articleUuid: string): Promise<FavoriteItem> {
  const article = await db.query.articles.findFirst({
    where: eq(schema.articles.uuid, articleUuid),
  });

  if (!article) {
    throw new AppError(404, "Article not found");
  }

  const existing = await db
    .select()
    .from(schema.userFavorites)
    .where(
      and(
        eq(schema.userFavorites.userId, userId),
        eq(schema.userFavorites.articleUuid, articleUuid)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new AppError(409, "Article already favorited");
  }

  const now = new Date().toISOString();
  const [inserted] = await db
    .insert(schema.userFavorites)
    .values({ userId, articleUuid, createdAt: now })
    .returning();

  return inserted;
}

export async function removeFavorite(userId: number, articleUuid: string): Promise<void> {
  const result = await db
    .delete(schema.userFavorites)
    .where(
      and(
        eq(schema.userFavorites.userId, userId),
        eq(schema.userFavorites.articleUuid, articleUuid)
      )
    );

  if (result.changes === 0) {
    throw new AppError(404, "Favorite not found");
  }
}

export async function listFavorites(userId: number, filters?: FavoriteFilters) {
  const conditions: any[] = [
    eq(schema.userFavorites.userId, userId),
  ];

  if (filters?.search) {
    conditions.push(sql`${schema.articles.title} LIKE ${`%${filters.search}%`}`);
  }

  if (filters?.publishedFrom) {
    conditions.push(sql`${schema.articles.publishedAt} >= ${filters.publishedFrom}`);
  }

  if (filters?.publishedTo) {
    conditions.push(sql`${schema.articles.publishedAt} <= ${filters.publishedTo}`);
  }

  if (filters?.category) {
    const matchingUuids = db
      .select({ uuid: schema.articleCategories.articleUuid })
      .from(schema.articleCategories)
      .where(eq(schema.articleCategories.category, filters.category));
    conditions.push(inArray(schema.articles.uuid, matchingUuids));
  }

  return db
    .select({
      userId: schema.userFavorites.userId,
      articleUuid: schema.userFavorites.articleUuid,
      createdAt: schema.userFavorites.createdAt,
      title: schema.articles.title,
      publisher: schema.articles.publisher,
      publishedAt: schema.articles.publishedAt,
      thumbnail: schema.articles.thumbnail,
    })
    .from(schema.userFavorites)
    .innerJoin(schema.articles, eq(schema.userFavorites.articleUuid, schema.articles.uuid))
    .where(and(...conditions))
    .orderBy(schema.userFavorites.createdAt);
}
