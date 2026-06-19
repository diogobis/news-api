import { db, schema } from "../db";
import { eq, and, inArray, like, gte, lte, type SQL } from "drizzle-orm";
import { AppError } from "../lib/appError";

// Filtros opcionais para listagem dos favoritos
export interface FavoriteFilters {
  search?: string;
  publishedFrom?: string;
  publishedTo?: string;
  category?: string;
}

// Representa um artigo favoritado pelo usuário
export interface FavoriteItem {
  userId: number;
  articleUuid: string;
  createdAt: string;
}

// Salva um artigo nos favoritos do usuário
export async function saveFavorite(userId: number, articleUuid: string): Promise<FavoriteItem> {
  // Verifica se o artigo existe antes de favoritar
  const article = await db.query.articles.findFirst({
    where: eq(schema.articles.uuid, articleUuid),
  });

  if (!article) {
    throw new AppError(404, "Artigo não encontrado");
  }

  // Impede duplicatas: verifica se o artigo já foi favoritado pelo usuário
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
    throw new AppError(409, "Artigo já favoritado");
  }

  // Insere o favorito com o timestamp atual
  const now = new Date().toISOString();
  const [inserted] = await db
    .insert(schema.userFavorites)
    .values({ userId, articleUuid, createdAt: now })
    .returning();

  return inserted;
}

// Remove um artigo dos favoritos do usuário
export async function removeFavorite(userId: number, articleUuid: string): Promise<void> {
  const result = await db
    .delete(schema.userFavorites)
    .where(
      and(
        eq(schema.userFavorites.userId, userId),
        eq(schema.userFavorites.articleUuid, articleUuid)
      )
    );

  // Lança erro se nenhum registro foi encontrado para deletar
  if (result.changes === 0) {
    throw new AppError(404, "Favorito não encontrado");
  }
}

// Lista os artigos favoritados pelo usuário
// Suporta filtros opcionais de busca, data de publicação e categoria
export async function listFavorites(userId: number, filters?: FavoriteFilters) {
  const conditions: SQL[] = [
    eq(schema.userFavorites.userId, userId),
  ];

  // Filtro por título do artigo
  if (filters?.search) {
    conditions.push(like(schema.articles.title, `%${filters.search}%`));
  }

  // Filtro por data de publicação inicial
  if (filters?.publishedFrom) {
    conditions.push(gte(schema.articles.publishedAt, filters.publishedFrom));
  }

  // Filtro por data de publicação final
  if (filters?.publishedTo) {
    conditions.push(lte(schema.articles.publishedAt, filters.publishedTo));
  }

  // Filtro por categoria: busca os UUIDs dos artigos que pertencem à categoria
  if (filters?.category) {
    const matchingUuids = db
      .select({ uuid: schema.articleCategories.articleUuid })
      .from(schema.articleCategories)
      .where(eq(schema.articleCategories.category, filters.category));
    conditions.push(inArray(schema.articles.uuid, matchingUuids));
  }

  // Retorna os favoritos com dados do artigo via join, ordenados por data de criação
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