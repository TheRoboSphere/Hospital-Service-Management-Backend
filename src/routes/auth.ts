// src/routes/auth.ts
import { Router } from "express";
import { db, users, units } from "../db";
import { eq } from "drizzle-orm";
import {
  comparePassword,
  findUserByEmail,
  hashPassword,
  signToken,
  isValidAdminCode,
} from "../lib/auth";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

// (Optional) Seed a first admin if needed
authRouter.post("/seed", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const passwordHash = await hashPassword(password);

    const inserted = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
        role: "admin",
        unitId: null,
      })
      .returning();

    const admin = inserted[0];
    return res.status(201).json({ admin });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
});

// REGISTER NEW USER (ADMIN ONLY)
authRouter.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, unitId, adminCode } = req.body;

    // Validate
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    type UserRole = "admin" | "employee";

    let role: UserRole = "employee";
    
    if (adminCode) {
      const isAdmin = await isValidAdminCode(adminCode);
      if (!isAdmin) {
        return res.status(401).json({ message: "Invalid admin code" });
      }
      role = "admin";
    }

    // Validate role
    if (!["admin", "employee"].includes(role)) {
      return res
        .status(400)
        .json({ message: "Role must be either 'admin' or 'employee'" });
    }

    // Employee MUST have a unit
    if (role === "employee" && !unitId) {
      return res.status(400).json({
        message: "Employee must be assigned to a unit",
      });
    }

    // Check if email already exists
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    const inserted = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
        phoneNumber: phone,
        role,
        unitId: role === "employee" ? unitId : null,
      })
      .returning();

    const createdUser = inserted[0];

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        unitId: createdUser.unitId,
        phoneNumber: createdUser.phoneNumber,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});


// Login
   

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body as {
    email: string;
    password: string;
  };

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // JWT
  const token = signToken({
    id: user.id,
    role: user.role,
    unitId: user.unitId ?? null,
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // --- NEW LOGIC BELOW --------------------------

  let needsUnitSelection = false;

  if (user.role === "admin") {
    // Admin must manually choose unit every login
    needsUnitSelection = true;
  }

  if (user.role === "employee") {
    // Employee MUST have a unit in DB
    if (!user.unitId) {
      return res.status(400).json({
        message:
          "Employee does not have a unit assigned. Please assign unit in database.",
      });
    }
  }

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      unitId: user.unitId ?? null,
      needsUnitSelection,
    },
  });
});


// Logout
authRouter.post("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ message: "Logged out" });
});

// Get current user
authRouter.get("/me", requireAuth, (req, res) => {
  return res.json({ user: req.user });
});
