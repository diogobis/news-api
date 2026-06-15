import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validate } from "../lib/validate";
import { sendSuccess } from "../lib/response";
import { getArticleDetails } from "../services/article";

const router = Router();

const detailsQuerySchema = z.object({
  uuid: z.string().uuid(),
});

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { uuid } = validate(detailsQuerySchema, req.query);
    const article = await getArticleDetails(uuid);
    sendSuccess(res, article);
  } catch (err) {
    next(err);
  }
});

export default router;
