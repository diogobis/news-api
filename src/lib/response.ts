import { Response } from "express";

export function sendSuccess(res: Response, data: unknown, meta?: Record<string, unknown>) {
  const body: Record<string, unknown> = { data };
  if (meta) body.meta = meta as Record<string, unknown>;
  res.json(body);
}

export function sendError(res: Response, status: number, message: string) {
  res.status(status).json({ error: { message } });
}
