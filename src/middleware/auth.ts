// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/auth";
import { db, users } from "../db";
import { eq } from "drizzle-orm";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const decoded = verifyToken(token) as {
      id: number;
      role: "admin" | "employee";
      unitId: number | null;
    };

    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.id));
    const user = result[0];

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = {
      id: user.id,
      role: user.role,
      unitId: user.unitId ?? null,
      name: user.name,
      email: user.email,
    };

    next();
  } catch (err) {
    console.error("Auth error", err);
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  return next();
}
