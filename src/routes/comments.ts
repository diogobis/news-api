import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validate } from "../lib/validate";
import { sendSuccess } from "../lib/response";
import { requireAuth } from "../middleware/auth";
import { createComment, deleteComment, listComments, updateComment } from "../services/comments";

const router = Router();

const createCommentSchema = z.object({
  articleUuid: z.string().uuid(),
  content: z.string().min(3).max(1000),
  parentId: z.number().int().positive().optional().nullable(),
});

const updateCommentSchema = z.object({
  id: z.coerce.number().int().positive(),
  content: z.string().min(3).max(1000),
});

const deleteCommentSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const listCommentsSchema = z.object({
  articleUuid: z.string().uuid(),
});

router.post("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { articleUuid, content, parentId } = validate(createCommentSchema, req.body);
    const result = await createComment(req.user!.userId, articleUuid, content, parentId);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/:articleUuid", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { articleUuid } = validate(listCommentsSchema, req.params);
    const comments = await listComments(articleUuid);
    sendSuccess(res, comments);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, content } = validate(updateCommentSchema, { ...req.params, ...req.body });
    const result = await updateComment(req.user!.userId, id, content);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = validate(deleteCommentSchema, req.params);
    await deleteComment(req.user!.userId, id);
    sendSuccess(res, { removed: true });
  } catch (err) {
    next(err);
  }
});

export default router;
