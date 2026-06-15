import { z, ZodError } from "zod";

export class ValidationError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
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
