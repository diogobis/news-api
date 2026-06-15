import { db, schema } from "../db";
import { eq, and } from "drizzle-orm";

export interface MutedKeyword {
  id: number;
  userId: number;
  keyword: string;
  createdAt: string;
}

export async function addKeyword(userId: number, keyword: string): Promise<MutedKeyword> {
  const trimmed = keyword.trim().toLowerCase();
  if (!trimmed) {
    throw { status: 400, message: "Keyword cannot be empty" };
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
    throw { status: 409, message: "Keyword already muted" };
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
    throw { status: 404, message: "Muted keyword not found" };
  }
}

export async function listKeywords(userId: number): Promise<MutedKeyword[]> {
  return db
    .select()
    .from(schema.userMutedKeywords)
    .where(eq(schema.userMutedKeywords.userId, userId))
    .orderBy(schema.userMutedKeywords.createdAt);
}
