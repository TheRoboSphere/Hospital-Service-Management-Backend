
import { Router } from "express";
import { db } from "../db";
import { users } from "../db/schema";
import { eq, or } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

export const userRouter = Router();

/**
 * GET /users/assignable?unitId=1
 * Returns:
 *  - all admins
 *  - employees from same unit
 */
userRouter.get("/assignable", requireAuth, async (req, res) => {
  try {
    const unitId = Number(req.query.unitId);

    if (!unitId) {
      return res.status(400).json({ message: "unitId is required" });
    }

    const usersList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        unitId: users.unitId,
      })
      .from(users)
      .where(
        or(
          eq(users.role, "admin"),
          eq(users.unitId, unitId)
        )
      )
      .orderBy(users.role);

    res.json({ users: usersList });
  } catch (error) {
    console.error("ASSIGNABLE USERS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default userRouter;
