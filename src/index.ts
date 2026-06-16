import express from "express";
import cors from "cors";
import { CronJob } from "cron";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import newsRouter from "./routes/news";
import detailsRouter from "./routes/details";
import authRouter from "./routes/auth";
import meRouter from "./routes/me";
import commentsRouter from "./routes/comments";
import debugRouter from "./routes/debug";
import { errorHandler } from "./middleware/error";
import { syncAll } from "./services/sync";
import { db, schema } from "./db";
import { swaggerSpec } from "./swagger";

const app = express();
const PORT = env.PORT;

const allowedOrigins = env.CORS_ORIGINS.split(",");
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api-docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use("/news", newsRouter);
app.use("/details", detailsRouter);
app.use("/auth", authRouter);
app.use("/me", meRouter);
app.use("/comments", commentsRouter);
app.use("/debug", debugRouter);

app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  const existing = db.select().from(schema.syncLog).limit(1).get();
  if (!existing) {
    console.log("[sync] First run detected — running initial sync...");
    await syncAll();
  } else {
    console.log("[sync] Sync log exists — relying on cron schedule");
  }

  const job = new CronJob(
    "0 */6 * * *",
    () => { syncAll().catch(console.error); },
    null,
    true,
    "America/Sao_Paulo"
  );

  console.log(`[cron] Sync scheduled every 6 hours (${job.nextDate().toISO()})`);
});
