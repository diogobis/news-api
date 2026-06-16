import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { env } from "../config/env";
import { AppError } from "../lib/appError";
import { db, schema } from "../db";

const JWT_SECRET = env.JWT_SECRET;

export interface JwtPayload {
  userId: number;
  email: string;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError(401, "Header de autorização ausente ou inválido");
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const user = db.select().from(schema.users).where(eq(schema.users.id, payload.userId)).get();
    if (!user) {
      throw new AppError(401, "Usuário não encontrado. Faça login novamente.");
    }
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(401, "Token inválido ou expirado");
  }
}
