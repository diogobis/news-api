import { db, schema } from "../db";
import { eq, desc } from "drizzle-orm";
import { AppError } from "../lib/appError";

export interface CommentRow {
  id: number;
  userId: number;
  articleUuid: string;
  parentId: number | null;
  content: string;
  createdAt: string;
}

export async function createComment(
  userId: number,
  articleUuid: string,
  content: string,
  parentId?: number | null
): Promise<CommentRow> {
  const article = await db.query.articles.findFirst({
    where: eq(schema.articles.uuid, articleUuid),
  });

  if (!article) {
    throw new AppError(404, "Article not found");
  }

  if (parentId) {
    const parent = db
      .select()
      .from(schema.comments)
      .where(eq(schema.comments.id, parentId))
      .get();

    if (!parent) {
      throw new AppError(404, "Parent comment not found");
    }

    if (parent.parentId !== null) {
      throw new AppError(400, "Cannot reply to a reply (only 1 level of nesting)");
    }

    if (parent.articleUuid !== articleUuid) {
      throw new AppError(400, "Parent comment does not belong to this article");
    }
  }

  const now = new Date().toISOString();
  const inserted = db
    .insert(schema.comments)
    .values({ userId, articleUuid, parentId: parentId ?? null, content, createdAt: now })
    .returning()
    .get();

  return inserted;
}

export async function deleteComment(userId: number, commentId: number): Promise<void> {
  const comment = db
    .select()
    .from(schema.comments)
    .where(eq(schema.comments.id, commentId))
    .get();

  if (!comment) {
    throw new AppError(404, "Comment not found");
  }

  if (comment.userId !== userId) {
    throw new AppError(403, "You can only delete your own comments");
  }

  db.delete(schema.comments).where(eq(schema.comments.id, commentId)).run();
}

export async function listComments(articleUuid: string) {
  const article = await db.query.articles.findFirst({
    where: eq(schema.articles.uuid, articleUuid),
  });

  if (!article) {
    throw new AppError(404, "Article not found");
  }

  const rows = db
    .select({
      id: schema.comments.id,
      userId: schema.comments.userId,
      articleUuid: schema.comments.articleUuid,
      parentId: schema.comments.parentId,
      content: schema.comments.content,
      createdAt: schema.comments.createdAt,
      username: schema.users.username,
    })
    .from(schema.comments)
    .innerJoin(schema.users, eq(schema.comments.userId, schema.users.id))
    .where(eq(schema.comments.articleUuid, articleUuid))
    .orderBy(desc(schema.comments.createdAt))
    .all();

  const topLevel = rows.filter((c) => c.parentId === null);
  const replies = rows.filter((c) => c.parentId !== null);

  return topLevel.map((comment) => ({
    id: comment.id,
    userId: comment.userId,
    articleUuid: comment.articleUuid,
    content: comment.content,
    createdAt: comment.createdAt,
    username: comment.username,
    replies: replies
      .filter((r) => r.parentId === comment.id)
      .map((r) => ({
        id: r.id,
        userId: r.userId,
        articleUuid: r.articleUuid,
        parentId: r.parentId,
        content: r.content,
        createdAt: r.createdAt,
        username: r.username,
      })),
  }));
}
