import { db, schema } from "../db";
import { eq, and } from "drizzle-orm";
import { fetchNewsList, fetchArticleDetails } from "./fetcher";
import type { ArticleDetail } from "./fetcher";

const CATEGORIES = [
  "politics",
  "world",
  "business",
  "technology",
  "science",
  "gaming",
  "education",
  "travel",
  "sports",
];

const MAX_PAGES = 3;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchDetailsSequential(uuids: string[]) {
  const DELAY_MS = 1500;
  const results: Array<{ uuid: string; detail?: ArticleDetail }> = [];

  for (const uuid of uuids) {
    try {
      const detail = await fetchArticleDetails(uuid);
      results.push({ uuid, detail });
    } catch (err) {
      console.error(`[sync] Error fetching details for ${uuid}:`, err);
      results.push({ uuid });
    }

    if (results.length < uuids.length) {
      await sleep(DELAY_MS);
    }
  }

  return results;
}

export async function syncAll() {
  const now = new Date().toISOString();
  console.log(`[sync] Starting sync at ${now}`);

  const lastSyncRow = db.select().from(schema.syncLog).limit(1).get();
  const lastSyncedAt = lastSyncRow?.lastSyncedAt;
  if (lastSyncedAt) {
    console.log(`[sync] Fetching articles published after ${lastSyncedAt}`);
  }

  for (const category of CATEGORIES) {
    console.log(`[sync] Fetching category: ${category}`);
    let cursor: string | undefined;
    let page = 0;

    do {
      try {
        const response = await fetchNewsList(category, "pt-419", "BR", cursor, lastSyncedAt);
        for (const item of response.data) {
          db.insert(schema.articles)
            .values({
              uuid: item.uuid,
              title: item.title,
              publisher: item.publisher,
              publishedAt: item.published_at,
              fetchedAt: new Date().toISOString(),
              detailsFetched: false,
            })
            .onConflictDoUpdate({
              target: schema.articles.uuid,
              set: {
                title: item.title,
                publisher: item.publisher,
                publishedAt: item.published_at,
                fetchedAt: new Date().toISOString(),
              },
            })
            .run();

          db.insert(schema.articleCategories)
            .values({ articleUuid: item.uuid, category })
            .onConflictDoNothing()
            .run();
        }

        cursor = response.meta.next_cursor ?? undefined;
        page++;

        await sleep(1100);
      } catch (err) {
        console.error(`[sync] Error fetching listing for ${category}:`, err);
        break;
      }
    } while (cursor && page < MAX_PAGES);

    const articlesToDetail = db
      .select()
      .from(schema.articles)
      .innerJoin(
        schema.articleCategories,
        and(
          eq(schema.articles.uuid, schema.articleCategories.articleUuid),
          eq(schema.articleCategories.category, category)
        )
      )
      .where(eq(schema.articles.detailsFetched, false))
      .all();

    if (articlesToDetail.length > 0) {
      const uuids = articlesToDetail.map((r) => r.articles.uuid);
      console.log(`[sync] Fetching details for ${uuids.length} articles in ${category}`);
      await sleep(2000);
      const results = await fetchDetailsSequential(uuids);

      for (const { uuid, detail } of results) {
        if (!detail) continue;

        db.update(schema.articles)
          .set({
            thumbnail: detail.thumbnail,
            originalUrl: detail.original_url,
            body: detail.body,
            authors: detail.authors?.join(", ") ?? null,
            detailsFetched: true,
          })
          .where(eq(schema.articles.uuid, uuid))
          .run();
      }
    }
  }

  const existing = db.select().from(schema.syncLog).limit(1).get();
  if (existing) {
    db.update(schema.syncLog).set({ lastSyncedAt: now }).where(eq(schema.syncLog.id, existing.id)).run();
  } else {
    db.insert(schema.syncLog).values({ lastSyncedAt: now }).run();
  }

  console.log(`[sync] Sync complete at ${now}`);
}
