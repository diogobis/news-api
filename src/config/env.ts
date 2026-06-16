import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NEWS_API_URL: z.string().url().default("https://api.freenewsapi.io/v1"),
  NEWS_API_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGINS: z.string().default("http://localhost:8081,http://localhost:3000,http://localhost:3001"),
});

export const env = envSchema.parse(process.env);
