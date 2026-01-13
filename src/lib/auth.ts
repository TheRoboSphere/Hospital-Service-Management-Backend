
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { users } from "../db";
import { db } from "../db";
import { eq } from "drizzle-orm";
import "dotenv/config";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";

export interface JWTPayload {
  id: number;
  role: "admin" | "employee" | "manager";
  unitId: number | null;
  iat: number;
  exp: number;
  
}

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
  role: "admin" | "employee" | "manager";
  unitId: number | null;
}) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export async function findUserByEmail(email: string) {
  const result = await db.select().from(users).where(eq(users.email, email));
  return result[0] || null;
}

/* ===== ADMIN CODE VALIDATION ===== */
const adminCodes = (process.env.ADMIN_CODES ?? "").split(",");

export const isValidAdminCode = async (inputCode: string) => {
  return adminCodes.includes(inputCode);
};
