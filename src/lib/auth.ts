// src/lib/auth.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { users } from "../db";
import { db } from "../db";
import { eq } from "drizzle-orm";
import "dotenv/config";


const JWT_SECRET = process.env.JWT_SECRET||"your_jwt_secret_key";
const JWT_EXPIRES_IN = "7d";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: {
  id: number;
  role: "admin" | "employee";
  unitId: number | null;
}) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}

// Helper: find user by email
export async function findUserByEmail(email: string) {
  const result = await db.select().from(users).where(eq(users.email, email));
  return result[0] || null;
}
