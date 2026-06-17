import { Response } from "express";

export function sendSuccess<T, M = undefined>(
  res: Response,
  data: T,
  meta?: M
) {
  res.json({
    data,
    ...(meta !== undefined && { meta }),
  });
}

export function sendError(res: Response, status: number, message: string) {
  res.status(status).json({ error: { message } });
}
