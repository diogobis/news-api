import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validate } from "../lib/validate";
import { sendSuccess } from "../lib/response";
import { buildMeta } from "../lib/paginate";
import { listArticles } from "../services/article";

const router = Router();

const newsQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  publishedFrom: z.string().optional(),
  publishedTo: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(15),
});

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = validate(newsQuerySchema, req.query);
    const { articles, total } = await listArticles(params);
    sendSuccess(res, articles, buildMeta(total, params.page, params.limit));
  } catch (err) {
    next(err);
  }
});

export default router;
