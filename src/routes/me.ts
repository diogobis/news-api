import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validate } from "../lib/validate";
import { sendSuccess } from "../lib/response";
import { buildMeta } from "../lib/paginate";
import { requireAuth } from "../middleware/auth";
import { addKeyword, removeKeyword, listKeywords } from "../services/muting";
import { saveArticle, removeArticle, listQueue } from "../services/readLater";
import { saveFavorite, removeFavorite, listFavorites } from "../services/favorites";
import { listArticles } from "../services/article";

const router = Router();

router.use(requireAuth);

const addMuteSchema = z.object({
  keyword: z.string().min(3).max(100),
});

const removeMuteSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const addReadLaterSchema = z.object({
  articleUuid: z.string().uuid(),
});

const removeReadLaterSchema = z.object({
  articleUuid: z.string().uuid(),
});

const addFavoriteSchema = z.object({
  articleUuid: z.string().uuid(),
});

const removeFavoriteSchema = z.object({
  articleUuid: z.string().uuid(),
});

const favoriteQuerySchema = z.object({
  search: z.string().optional(),
  publishedFrom: z.string().optional(),
  publishedTo: z.string().optional(),
  category: z.string().optional(),
});

const readLaterQuerySchema = z.object({
  search: z.string().optional(),
  publishedFrom: z.string().optional(),
  publishedTo: z.string().optional(),
  category: z.string().optional(),
});

const newsQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  publishedFrom: z.string().optional(),
  publishedTo: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(15),
});

router.get("/news", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = validate(newsQuerySchema, req.query);
    const muted = await listKeywords(req.user!.userId);
    const mutedKeywords = muted.map((k) => k.keyword);
    const { articles, total } = await listArticles({ ...params, mutedKeywords });
    sendSuccess(res, articles, buildMeta(total, params.page, params.limit));
  } catch (err) {
    next(err);
  }
});

router.post("/mutes", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keyword } = validate(addMuteSchema, req.body);
    const result = await addKeyword(req.user!.userId, keyword);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/mutes", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const keywords = await listKeywords(req.user!.userId);
    sendSuccess(res, keywords);
  } catch (err) {
    next(err);
  }
});

router.delete("/mutes/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = validate(removeMuteSchema, req.params);
    await removeKeyword(req.user!.userId, id);
    sendSuccess(res, { removed: true });
  } catch (err) {
    next(err);
  }
});

router.post("/read-later", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { articleUuid } = validate(addReadLaterSchema, req.body);
    const result = await saveArticle(req.user!.userId, articleUuid);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/read-later", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = validate(readLaterQuerySchema, req.query);
    const items = await listQueue(req.user!.userId, filters);
    sendSuccess(res, items);
  } catch (err) {
    next(err);
  }
});

router.delete("/read-later/:articleUuid", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { articleUuid } = validate(removeReadLaterSchema, req.params);
    await removeArticle(req.user!.userId, articleUuid);
    sendSuccess(res, { removed: true });
  } catch (err) {
    next(err);
  }
});

router.post("/favorites", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { articleUuid } = validate(addFavoriteSchema, req.body);
    const result = await saveFavorite(req.user!.userId, articleUuid);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/favorites", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = validate(favoriteQuerySchema, req.query);
    const items = await listFavorites(req.user!.userId, filters);
    sendSuccess(res, items);
  } catch (err) {
    next(err);
  }
});

router.delete("/favorites/:articleUuid", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { articleUuid } = validate(removeFavoriteSchema, req.params);
    await removeFavorite(req.user!.userId, articleUuid);
    sendSuccess(res, { removed: true });
  } catch (err) {
    next(err);
  }
});

export default router;
