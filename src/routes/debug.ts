import { Router, Request, Response, NextFunction } from "express";
import { sendSuccess } from "../lib/response";
import { deleteArticlesWithoutDetails, wipeAll } from "../services/debug";

const router = Router();

router.delete("/cleanup", (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = deleteArticlesWithoutDetails();
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.delete("/wipe", (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = wipeAll();
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
