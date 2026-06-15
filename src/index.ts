import "dotenv/config";
import express from "express";
import cors from "cors";
import { CronJob } from "cron";
import swaggerUi from "swagger-ui-express";
import newsRouter from "./routes/news";
import detailsRouter from "./routes/details";
import authRouter from "./routes/auth";
import meRouter from "./routes/me";
import debugRouter from "./routes/debug";
import { errorHandler } from "./middleware/error";
import { syncAll } from "./services/sync";
import { swaggerSpec } from "./swagger";

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = ["http://localhost:8081", "http://localhost:3000", "http://localhost:3001"];
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
app.use("/debug", debugRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  const job = new CronJob(
    "0 */6 * * *",
    () => { syncAll().catch(console.error); },
    null,
    true,
    "America/Sao_Paulo"
  );

  console.log(`[cron] Sync scheduled every 6 hours (${job.nextDate().toISO()})`);
});
