
import { Router } from "express";
import { db } from "../db";
import { users } from "../db/schema";
import { eq, or, and } from "drizzle-orm";
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
    const user = req.user!;
    const unitId = Number(req.query.unitId);

    if (!unitId) {
      return res.status(400).json({ message: "unitId is required" });
    }

    let usersList: any[] = [];

    // Admin can only assign to managers
    if (user.role === 'admin') {
      usersList = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          unitId: users.unitId,
        })
        .from(users)
        .where(
          eq(users.role, "manager")
        )
        .orderBy(users.name);
    }
    // Manager can only assign to employees
    else if (user.role === 'manager') {
      usersList = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          unitId: users.unitId,
        })
        .from(users)
        .where(
          and(
            eq(users.role, "employee"),
            eq(users.unitId, unitId)
          )
        )
        .orderBy(users.name);
    }
    // Employees don't assign
    else {
      usersList = [];
    }


    console.log("ASSIGNABLE USERS REQUEST:", {
      userRole: user.role,
      unitId,
      foundCount: usersList.length,
      userNames: usersList.map(u => u.name)
    });

    res.json({ users: usersList });
  } catch (error) {
    console.error("ASSIGNABLE USERS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default userRouter;
