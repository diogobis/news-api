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
