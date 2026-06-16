import { db, schema } from "../db";
import { eq } from "drizzle-orm";

export function deleteArticlesWithoutDetails() {
  const result = db
    .delete(schema.articles)
    .where(eq(schema.articles.detailsFetched, false))
    .run();

  console.log(`[debug] Deleted ${result.changes} articles without details`);
  return { deleted: result.changes };
}

export function wipeAll() {
  db.delete(schema.articleCategories).run();
  db.delete(schema.comments).run();
  db.delete(schema.userFavorites).run();
  db.delete(schema.userReadLater).run();
  db.delete(schema.userMutedKeywords).run();
  db.delete(schema.articles).run();
  db.delete(schema.users).run();
  db.delete(schema.syncLog).run();

  console.log("[debug] Database wiped");
  return { wiped: true };
}
