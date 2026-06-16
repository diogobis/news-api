import { z, ZodError } from "zod";
import { AppError } from "./appError";

export class ValidationError extends AppError {
  constructor(status: number, message: string) {
    super(status, message);
    this.name = "ValidationError";
  }
}

export function validate<T extends z.ZodType>(schema: T, params: unknown): z.infer<T> {
  try {
    return schema.parse(params);
  } catch (err) {
    if (err instanceof ZodError) {
      const message = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
      throw new ValidationError(400, message);
    }
    throw err;
  }
}
