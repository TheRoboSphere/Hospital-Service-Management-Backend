// src/routes/tickets.ts
import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { db, tickets, units, users } from "../db";
import { eq, and,sql } from "drizzle-orm";

export const ticketRouter = Router();

// Raise ticket (employee + admin)

ticketRouter.post("/", requireAuth, async (req, res) => {
  try {
    console.log("Incoming Ticket Body:", req.body);

    const {
      title,
      description,
      priority,
      category,
      
      department,
      equipmentId,
      assignedTo,
      unitId,
    } = req.body;

    // Validate required fields
    if (!title) return res.status(400).json({ message: "Title is required" });
    if (!category) return res.status(400).json({ message: "Category is required" });
    if (!description) return res.status(400).json({ message: "Description is required" });
   
    if (!department) return res.status(400).json({ message: "Department is required" });

    const user = req.user!;
    let finalUnitId: number;

    // EMPLOYEE → use their assigned unit
    if (user.role === "employee") {
      if (!user.unitId)
        return res.status(400).json({ message: "Employee has no assigned unit" });

      finalUnitId = user.unitId;
    }

    // ADMIN → must send unitId from frontend
    else {
      if (!unitId)
        return res.status(400).json({ message: "Admin must provide unitId" });

      finalUnitId = Number(unitId);
    }
    let assignedToId: number | null = null;
    let assignedToName: string | null = null;
    
  

    if (assignedTo && assignedTo.trim() !== "") {
      const foundUser = await db
        .select()
        .from(users)
        .where(eq(users.name, assignedTo));

      if (foundUser.length > 0) {
        assignedToId = foundUser[0].id; // ALWAYS VALID NUMBER
        assignedToName = null;
      } else {
        assignedToId = null;             // NEVER NaN
        assignedToName = assignedTo;     // Store as string
      }
    }
    
    // Fix priority mapping
    const normalizedPriority = priority?.toLowerCase();
    const finalPriority =
      normalizedPriority === "critical" ? "high" : normalizedPriority || "medium";

    // Insert into DB
    const inserted = await db
      .insert(tickets)
      .values({
        title,
        description,
        category,
        priority: finalPriority,

        // NEW fields stored directly
      
        department,
        

        // system-controlled
        status: "pending",

        unitId: finalUnitId,
        equipmentId: equipmentId ? Number(equipmentId) : null,

        createdById: user.id,
        assignedToName,
        assignedToId,
      })
      .returning();

    return res.status(201).json({ ticket: inserted[0] });

  } catch (e) {
    console.error("CREATE TICKET ERROR:", e);
    return res.status(500).json({ message: "Server error" });
  }
});


// Dashboard counts for logged-in user
// ticketRouter.get("/count", requireAuth, async (req, res) => {
//   const user = req.user!;

//   try {
//     // For simplicity: total & pending counts
//     if (user.role === "admin") {
//       const total = await db
//         .select({ count: tickets.id })
//         .from(tickets);
//       const pending = await db
//         .select({ count: tickets.id })
//         .from(tickets)
//         .where(eq(tickets.status, "pending"));

//       return res.json({
//         total: Number(total[0]?.count ?? 0),
//         pending: Number(pending[0]?.count ?? 0),
//       });
//     } else {
//       // Employee: show tickets of their unit
//       if (!user.unitId) {
//         return res.json({ total: 0, pending: 0 });
//       }

//       const total = await db
//         .select({ count: tickets.id })
//         .from(tickets)
//         .where(eq(tickets.unitId, user.unitId));

//       const pending = await db
//         .select({ count: tickets.id })
//         .from(tickets)
//         .where(
//           and(
//             eq(tickets.unitId, user.unitId),
//             eq(tickets.status, "pending")
//           )
//         );

//       return res.json({
//         total: Number(total[0]?.count ?? 0),
//         pending: Number(pending[0]?.count ?? 0),
//       });
//     }
//   } catch (e) {
//     console.error(e);
//     return res.status(500).json({ message: "Server error" });
//   }
// });

// // Pending tickets list (REVIEW PAGE) – admin only
// ticketRouter.get("/pending", requireAuth, requireAdmin, async (req, res) => {
//   try {
//     const rows = await db
//       .select({
//         id: tickets.id,
//         title: tickets.title,
//         description: tickets.description,
//         status: tickets.status,
//         priority: tickets.priority,
//         createdAt: tickets.createdAt,
//         unitId: tickets.unitId,
//       })
//       .from(tickets)
//       .where(eq(tickets.status, "pending"));

//     return res.json({ tickets: rows });
//   } catch (e) {
//     console.error(e);
//     return res.status(500).json({ message: "Server error" });
//   }
// });

// // Update ticket status (review action) – admin only
// ticketRouter.patch(
//   "/:id/status",
//   requireAuth,
//   requireAdmin,
//   async (req, res) => {
//     try {
//       const ticketId = Number(req.params.id);
//       const { status, assignedToId } = req.body as {
//         status: "pending" | "in_progress" | "resolved" | "closed";
//         assignedToId?: number;
//       };

//       if (!status) {
//         return res.status(400).json({ message: "Status is required" });
//       }

//       // Optional: validate assignedToId exists
//       if (assignedToId) {
//         const userResult = await db
//           .select()
//           .from(users)
//           .where(eq(users.id, assignedToId));
//         if (!userResult[0]) {
//           return res.status(400).json({ message: "Assigned user not found" });
//         }
//       }

//       const updated = await db
//         .update(tickets)
//         .set({
//           status,
//           assignedToId: assignedToId ?? null,
//           updatedAt: new Date(),
//         })
//         .where(eq(tickets.id, ticketId))
//         .returning();

//       if (!updated[0]) {
//         return res.status(404).json({ message: "Ticket not found" });
//       }

//       return res.json({ ticket: updated[0] });
//     } catch (e) {
//       console.error(e);
//       return res.status(500).json({ message: "Server error" });
//     }
//   }
// );


/* ------------------ DASHBOARD COUNTS ------------------ */
ticketRouter.get("/count", requireAuth, async (req, res) => {
  try {
    const user = req.user!;

    const baseWhere =
      user.role === "admin"
        ? undefined
        : user.unitId
        ? eq(tickets.unitId, user.unitId)
        : undefined;

    if (!baseWhere && user.role !== "admin") {
      return res.json({
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
      });
    }

    const [total] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tickets)
      .where(baseWhere);

    const [pending] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tickets)
      .where(
        baseWhere
          ? and(baseWhere, eq(tickets.status, "pending"))
          : eq(tickets.status, "pending")
      );

    const [inProgress] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tickets)
      .where(
        baseWhere
          ? and(baseWhere, eq(tickets.status, "in_progress"))
          : eq(tickets.status, "in_progress")
      );

    const [resolved] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tickets)
      .where(
        baseWhere
          ? and(baseWhere, eq(tickets.status, "resolved"))
          : eq(tickets.status, "resolved")
      );

    return res.json({
      total: Number(total.count),
      pending: Number(pending.count),
      inProgress: Number(inProgress.count),
      resolved: Number(resolved.count),
    });
  } catch (e) {
    console.error("COUNT ERROR:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ------------------ GET ALL TICKETS ------------------ */
ticketRouter.get("/", requireAuth, async (req, res) => {
  try {
    const user = req.user!;

    let rows;

    if (user.role === "admin") {
      rows = await db.select().from(tickets);
    } else {
      if (!user.unitId) return res.json({ tickets: [] });

      rows = await db
        .select()
        .from(tickets)
        .where(eq(tickets.unitId, user.unitId));
    }

    return res.json({ tickets: rows });
  } catch (e) {
    console.error("FETCH ERROR:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ------------------ PENDING (ADMIN REVIEW) ------------------ */
ticketRouter.get("/pending", requireAuth, requireAdmin, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(tickets)
      .where(eq(tickets.status, "pending"));

    return res.json({ tickets: rows });
  } catch (e) {
    console.error("PENDING ERROR:", e);
    return res.status(500).json({ message: "Server error" });
  }
});
