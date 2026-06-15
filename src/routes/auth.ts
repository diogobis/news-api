import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validate } from "../lib/validate";
import { sendSuccess } from "../lib/response";
import { register, login } from "../services/auth";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  emailOrUsername: z.string().min(1),
  password: z.string().min(1),
});

router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, username, password } = validate(registerSchema, req.body);
    const result = await register(email, username, password);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { emailOrUsername, password } = validate(loginSchema, req.body);
    const result = await login(emailOrUsername, password);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
