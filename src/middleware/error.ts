import { Request, Response, NextFunction } from "express";
import { sendError } from "../lib/response";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err && typeof err === "object" && "status" in err) {
    const e = err as { status: number; message: string };
    sendError(res, e.status, e.message);
    return;
  }

  console.error("[erro]", err);
  sendError(res, 500, "Erro interno do servidor");
}
