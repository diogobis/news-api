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
    throw new AppError(404, "Artigo não encontrado");
  }

  if (parentId) {
    const parent = db
      .select()
      .from(schema.comments)
      .where(eq(schema.comments.id, parentId))
      .get();

    if (!parent) {
      throw new AppError(404, "Comentário pai não encontrado");
    }

    if (parent.parentId !== null) {
      throw new AppError(400, "Não é possível responder a uma resposta (apenas 1 nível de aninhamento)");
    }

    if (parent.articleUuid !== articleUuid) {
      throw new AppError(400, "Comentário pai não pertence a este artigo");
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

export async function updateComment(
  userId: number,
  commentId: number,
  content: string
): Promise<CommentRow> {
  const comment = db
    .select()
    .from(schema.comments)
    .where(eq(schema.comments.id, commentId))
    .get();

  if (!comment) {
    throw new AppError(404, "Comentário não encontrado");
  }

  if (comment.userId !== userId) {
    throw new AppError(403, "Você só pode editar seus próprios comentários");
  }

  db.update(schema.comments)
    .set({ content })
    .where(eq(schema.comments.id, commentId))
    .run();

  return { ...comment, content };
}

export async function deleteComment(userId: number, commentId: number): Promise<void> {
  const comment = db
    .select()
    .from(schema.comments)
    .where(eq(schema.comments.id, commentId))
    .get();

  if (!comment) {
    throw new AppError(404, "Comentário não encontrado");
  }

  if (comment.userId !== userId) {
    throw new AppError(403, "Você só pode deletar seus próprios comentários");
  }

  db.delete(schema.comments).where(eq(schema.comments.id, commentId)).run();
}

export async function listComments(articleUuid: string) {
  const article = await db.query.articles.findFirst({
    where: eq(schema.articles.uuid, articleUuid),
  });

  if (!article) {
    throw new AppError(404, "Artigo não encontrado");
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
