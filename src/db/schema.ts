import { sqliteTable, text, integer, primaryKey, foreignKey } from "drizzle-orm/sqlite-core";

export const articles = sqliteTable("articles", {
  uuid: text("uuid").primaryKey(),
  title: text("title").notNull(),
  publisher: text("publisher"),
  publishedAt: text("published_at"),
  thumbnail: text("thumbnail"),
  originalUrl: text("original_url"),
  body: text("body"),
  authors: text("authors", { mode: "json" }).$type<string[]>(),
  language: text("language").default("pt-419"),
  country: text("country").default("BR"),
  fetchedAt: text("fetched_at"),
  detailsFetched: integer("details_fetched", { mode: "boolean" }).default(false),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: text("created_at").notNull(),
});

export const userMutedKeywords = sqliteTable("user_muted_keywords", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  createdAt: text("created_at").notNull(),
});

export const userReadLater = sqliteTable("user_read_later", {
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  articleUuid: text("article_uuid").notNull().references(() => articles.uuid, { onDelete: "cascade" }),
  savedAt: text("saved_at").notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.articleUuid] }),
}));

export const userFavorites = sqliteTable("user_favorites", {
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  articleUuid: text("article_uuid").notNull().references(() => articles.uuid, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.articleUuid] }),
}));

export const syncLog = sqliteTable("sync_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  lastSyncedAt: text("last_synced_at").notNull(),
});

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  articleUuid: text("article_uuid").notNull().references(() => articles.uuid, { onDelete: "cascade" }),
  parentId: integer("parent_id"),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => ({
  parentFk: foreignKey({ columns: [table.parentId], foreignColumns: [table.id] }).onDelete("cascade"),
}));

export const articleCategories = sqliteTable("article_categories", {
  articleUuid: text("article_uuid").notNull().references(() => articles.uuid, { onDelete: "cascade" }),
  category: text("category").notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.articleUuid, table.category] }),
}));
