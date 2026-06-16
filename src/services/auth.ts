import { db, schema } from "../db";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../lib/appError";

const JWT_SECRET = env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  createdAt: string;
}

export interface AuthResult {
  user: AuthUser;
  token: string;
}

function toAuthUser(row: typeof schema.users.$inferSelect): AuthUser {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    createdAt: row.createdAt,
  };
}

function generateToken(user: AuthUser): string {
  return jwt.sign(
    { userId: user.id, email: user.email, username: user.username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export async function register(
  email: string,
  username: string,
  password: string
): Promise<AuthResult> {
  const existing = await db
    .select()
    .from(schema.users)
    .where(or(eq(schema.users.email, email), eq(schema.users.username, username)))
    .limit(1);

  if (existing.length > 0) {
    const conflict =
      existing[0].email === email ? "Email já cadastrado" : "Username já em uso";
    throw new AppError(409, conflict);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const now = new Date().toISOString();

  const [inserted] = await db
    .insert(schema.users)
    .values({ email, username, password: hashedPassword, createdAt: now })
    .returning();

  const user = toAuthUser(inserted);
  const token = generateToken(user);
  return { user, token };
}

export async function login(
  emailOrUsername: string,
  password: string
): Promise<AuthResult> {
  const [found] = await db
    .select()
    .from(schema.users)
    .where(
      or(
        eq(schema.users.email, emailOrUsername),
        eq(schema.users.username, emailOrUsername)
      )
    )
    .limit(1);

  if (!found) {
    throw new AppError(401, "Credenciais inválidas");
  }

  const valid = await bcrypt.compare(password, found.password);
  if (!valid) {
    throw new AppError(401, "Credenciais inválidas");
  }

  const user = toAuthUser(found);
  const token = generateToken(user);
  return { user, token };
}
