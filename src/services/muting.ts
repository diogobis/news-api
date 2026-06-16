import { db, schema } from "../db";
import { eq, and } from "drizzle-orm";
import { AppError } from "../lib/appError";

export interface MutedKeyword {
  id: number;
  userId: number;
  keyword: string;
  createdAt: string;
}

export async function addKeyword(userId: number, keyword: string): Promise<MutedKeyword> {
  const trimmed = keyword.trim().toLowerCase();
  if (!trimmed) {
    throw new AppError(400, "Keyword cannot be empty");
  }

  const existing = await db
    .select()
    .from(schema.userMutedKeywords)
    .where(
      and(
        eq(schema.userMutedKeywords.userId, userId),
        eq(schema.userMutedKeywords.keyword, trimmed)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new AppError(409, "Keyword already muted");
  }

  const now = new Date().toISOString();
  const [inserted] = await db
    .insert(schema.userMutedKeywords)
    .values({ userId, keyword: trimmed, createdAt: now })
    .returning();

  return inserted;
}

export async function removeKeyword(userId: number, keywordId: number): Promise<void> {
  const result = await db
    .delete(schema.userMutedKeywords)
    .where(
      and(
        eq(schema.userMutedKeywords.id, keywordId),
        eq(schema.userMutedKeywords.userId, userId)
      )
    );

  if (result.changes === 0) {
    throw new AppError(404, "Muted keyword not found");
  }
}

export async function listKeywords(userId: number): Promise<MutedKeyword[]> {
  return db
    .select()
    .from(schema.userMutedKeywords)
    .where(eq(schema.userMutedKeywords.userId, userId))
    .orderBy(schema.userMutedKeywords.createdAt);
}
