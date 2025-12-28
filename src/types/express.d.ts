// src/types/express.d.ts
import "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: number;
      role: "admin" | "employee";
      unitId: number | null;
      name: string;
      email: string;
    };
  }
}
