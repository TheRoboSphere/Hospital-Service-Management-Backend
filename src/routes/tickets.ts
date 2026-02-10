
// src/routes/tickets.ts
import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { db, ticketAssignments, tickets, units, users } from "../db";
import { eq, and, sql, desc } from "drizzle-orm";
// import { sendAssignmentEmail } from "../utils/email";
// import { sendAssignmentSMS } from "../utils/sms";

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
      Floor,
      Room,
      Bed,
      department,
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
        department,
        // system-controlled

        floor: Floor || null,
        room: Room || null,
        bed: Bed || null,
        status: "Pending",

        unitId: finalUnitId,
        equipmentId: null,

        createdById: user.id,
        assignedToName: null,
        assignedToId: null,
      })
      .returning();

    return res.status(201).json({ ticket: inserted[0] });

  } catch (e) {
    console.error("CREATE TICKET ERROR:", e);
    return res.status(500).json({ message: "Server error" });
  }
});





/* ------------------ GET ALL TICKETS ------------------ */


ticketRouter.get(
  "/unit/:unitId",
  requireAuth,
  async (req, res) => {
    try {
      const user = req.user!;
      const unitId = Number(req.params.unitId);

      if (isNaN(unitId)) {
        return res.status(400).json({ message: "Invalid unitId" });
      }

      // 🔐 EMPLOYEE SAFETY CHECK
      if (user.role !== "admin" && user.unitId !== unitId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const rows = await db
        .select({
          id: tickets.id,
          title: tickets.title,
          description: tickets.description,
          category: tickets.category,
          priority: tickets.priority,
          status: tickets.status,
          department: tickets.department,
          unitId: tickets.unitId,
          createdAt: tickets.createdAt,
          createdBy: users.name,
          assignedTo: tickets.assignedToName,
          assignedToId: tickets.assignedToId,
          assignedToDepartment: sql<string | null>`
            CASE 
              WHEN ${tickets.assignedToId} IS NOT NULL 
              THEN (SELECT department FROM users WHERE id = ${tickets.assignedToId})
              ELSE NULL 
            END
          `,
        })
        .from(tickets)
        .leftJoin(users, eq(tickets.createdById, users.id))
        .where(eq(tickets.unitId, unitId))
        .orderBy(desc(tickets.createdAt));

      return res.json({ tickets: rows });
    } catch (e) {
      console.error("FETCH ERROR:", e);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

/* ------------------ PENDING (ADMIN REVIEW) ------------------ */
ticketRouter.get("/pending", requireAuth, requireAdmin, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(tickets)
      .where(eq(tickets.status, "Pending"));

    return res.json({ tickets: rows });
  } catch (e) {
    console.error("PENDING ERROR:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

// ------------------ UPDATE TICKET ------------------

ticketRouter.patch("/:id", requireAuth, async (req, res) => {
  try {
    const ticketId = Number(req.params.id);
    const user = req.user!;

    const { status, priority, category, assignedTo, comment } = req.body;

    const existing = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId));

    if (!existing[0]) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const ticket = existing[0];

    if (user.role !== "admin" && user.unitId !== ticket.unitId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // ✅ SAFE STATUS CAST
    const VALID_STATUSES = [
  
      "In Progress",
      "Pending",
      "Resolved",
      "Verified",
      "Closed",
    ] as const;

    type TicketStatus = (typeof VALID_STATUSES)[number];

    const safeStatus: TicketStatus | undefined =
      status && VALID_STATUSES.includes(status as TicketStatus)
        ? (status as TicketStatus)
        : undefined;

    let assignedToId: number | null = null;
    let assignedToName: string | null = null;

    if (assignedTo && assignedTo.trim() !== "") {
      const foundUser = await db
        .select()
        .from(users)
        .where(eq(users.name, assignedTo));

      if (foundUser[0]) {
        assignedToId = foundUser[0].id;
      } else {
        assignedToName = assignedTo;
      }
    }

    const updated = await db
      .update(tickets)
      .set({
        status: safeStatus ?? ticket.status,
        priority: priority ?? ticket.priority,
        category: category ?? ticket.category,
        assignedToId,
        assignedToName,
        comment: comment ?? ticket.comment,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, ticketId))
      .returning();

    return res.json({ ticket: updated[0] });
  } catch (e) {
    console.error("UPDATE ERROR:", e);
    return res.status(500).json({ message: "Server error" });
  }
});
ticketRouter.patch(
  "/:id/status",
  requireAuth,
  async (req, res) => {
    try {
      const ticketId = Number(req.params.id);
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const [updated] = await db
        .update(tickets)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(tickets.id, ticketId))
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      return res.json({ ticket: updated });
    } catch (e) {
      console.error("STATUS UPDATE ERROR:", e);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// RBAC Assign: Admin → Manager or Manager → Employee
ticketRouter.post("/:id/assign", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.role !== "admin" && req.user.role !== "manager") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const ticketId = Number(req.params.id);
    const {
      assignedToId,
      requiredEquipmentIds = [],
      equipmentNote,
      deadline,
      extraCost = 0,
    } = req.body;

    if (!assignedToId) {
      return res.status(400).json({
        message: "assignedToId is required",
      });
    }

    // ✅ get employee
    const employee = await db
      .select()
      .from(users)
      .where(eq(users.id, assignedToId))
      .limit(1);

    if (!employee.length) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // ✅ update ticket
    const updateData: any = {
      assignedToId,
      assignedToName: employee[0].name,
      status: "In Progress",
      deadline: deadline ? new Date(deadline) : null,
      extraCost,
      updatedAt: new Date(),
    };

    // If manager is assigning, persist their ID so they keep visibility
    if (req.user.role === "manager" && req.user.id) {
      updateData.assignedManagerId = Number(req.user.id);
    }

    const [updated] = await db
      .update(tickets)
      .set(updateData)
      .where(eq(tickets.id, ticketId))
      .returning();

    if (!updated) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // 🔔 notifications (NON-BLOCKING)
    // try {
    //   await sendAssignmentEmail({
    //     to: employee[0].email,
    //     employeeName: employee[0].name,
    //     ticketId: updated.id,
    //     note: equipmentNote || "",
    //   });
    // } catch (e) {
    //   console.error("EMAIL FAILED:", e);
    // }

    // try {
    //   if (employee[0].phoneNumber) {
    //     await sendAssignmentSMS({
    //       phone: employee[0].phoneNumber,
    //       ticketId: updated.id,
    //     });
    //   }
    // } catch (e) {
    //   console.error("SMS FAILED:", e);
    // }

    return res.json({ ticket: updated });
  } catch (err) {
    console.error("ASSIGN ROUTE ERROR DETAILS:", err);
    // @ts-ignore
    const msg = err.message || String(err);
    return res.status(500).json({ message: "Server error", error: msg });
  }
});

//Employee: update comment on ticket (e.g. "Tried fixing, but part was broken")
// Employee / Manager / Admin: Update ticket (comments, progress, minor edits)
ticketRouter.patch("/:id/update", requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    const ticketId = Number(req.params.id);

    const { comment, status, priority, category } = req.body;

    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId));

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // 🔐 RBAC
    if (
      user.role === "employee" &&
      ticket.assignedToId !== user.id
    ) {
      return res.status(403).json({ message: "Not assigned to you" });
    }

    if (
      user.role === "manager" &&
      ticket.unitId !== user.unitId
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // ✅ SAFE STATUS TRANSITIONS
    const allowedStatusByRole: Record<string, string[]> = {
      employee: ["In Progress"],
      manager: ["Resolved"],
      admin: ["Pending", "In Progress", "Resolved", "Verified", "Closed"],
    };

    let nextStatus = ticket.status;

    if (status) {
      if (!allowedStatusByRole[user.role]?.includes(status)) {
        return res.status(400).json({ message: "Invalid status update" });
      }
      nextStatus = status;
    }

    const [updated] = await db
      .update(tickets)
      .set({
        comment: comment ?? ticket.comment,
        status: nextStatus,
        priority: priority ?? ticket.priority,
        category: category ?? ticket.category,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, ticketId))
      .returning();

    return res.json({ ticket: updated });

  } catch (err) {
    console.error("UPDATE ROUTE ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


// Employee: Mark ticket as done
ticketRouter.patch("/:id/mark-done", requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    const ticketId = Number(req.params.id);

    // Get ticket
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId));

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Verify employee owns this ticket
    if (ticket.assignedToId !== user.id) {
      return res.status(403).json({ message: "Not assigned to you" });
    }

    // Update status to Resolved
    const [updated] = await db
      .update(tickets)
      .set({ status: "Resolved" })
      .where(eq(tickets.id, ticketId))
      .returning();

    return res.json({ ticket: updated });
  } catch (err) {
    console.error("MARK-DONE ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Manager: Verify completed work
ticketRouter.patch("/:id/verify", requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    const ticketId = Number(req.params.id);

    if (user.role !== "manager") {
      return res.status(403).json({ message: "Manager only" });
    }

    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId));

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.status !== "Resolved") {
      return res.status(400).json({
        message: "Ticket must be resolved first"
      });
    }

    // Update status to Verified
    const [updated] = await db
      .update(tickets)
      .set({ status: "Verified" })
      .where(eq(tickets.id, ticketId))
      .returning();

    return res.json({ ticket: updated });
  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Admin: Close ticket
ticketRouter.patch("/:id/close", requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    const ticketId = Number(req.params.id);

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId));

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.status !== "Verified") {
      return res.status(400).json({
        message: "Ticket must be verified by manager first"
      });
    }

    // Update status to Closed
    const [updated] = await db
      .update(tickets)
      .set({ status: "Closed" })
      .where(eq(tickets.id, ticketId))
      .returning();

    return res.json({ ticket: updated });
  } catch (err) {
    console.error("CLOSE ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Admin: Get tickets assigned to them OR verified tickets needing closure
ticketRouter.get(
  "/admin/assigned",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const user = req.user!;

      // Fetch tickets where:
      // 1. Assigned directly to the admin (assignedToId = user.id)
      // 2. OR status is 'Verified' (waiting for admin closure)
      // 3. OR Created by the admin (so they can track what they raised)
      const rows = await db
        .select()
        .from(tickets)
        .where(
          sql`
            (${tickets.assignedToId} = ${user.id}) OR 
            (${tickets.status} = 'Verified') OR
            (${tickets.createdById} = ${user.id})
          `
        )
        .orderBy(desc(tickets.createdAt));

      return res.json({ tickets: rows });
    } catch (e) {
      console.error("ADMIN ASSIGNED FETCH ERROR:", e);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// Manager: Get tickets assigned to them
ticketRouter.get(
  "/manager/assigned",
  requireAuth,
  async (req, res) => {
    try { 
      const user = req.user!;
      if (user.role !== "manager") {
        return res.status(403).json({ message: "Manager only" });
      }

      // Fetch tickets where:
      // 1. Assigned directly to the manager (assignedToId = user.id)
      // 2. OR assigned BY the manager to an employee (assignedManagerId = user.id)
      // 3. OR ticket is in Manager's Unit AND is Resolved (needs verification)
      const rows = await db
        .select()
        .from(tickets)
        .where(
          sql`
            (${tickets.assignedToId} = ${user.id}) OR 
            (${tickets.assignedManagerId} = ${user.id}) OR 
            (${tickets.unitId} = ${user.unitId} AND ${tickets.status} = 'Resolved')
          `
        )
        .orderBy(desc(tickets.createdAt));

      return res.json({ tickets: rows });
    } catch (e) {
      console.error("MANAGER ASSIGNED FETCH ERROR:", e);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// Employee: Get tickets assigned to them
ticketRouter.get(
  "/employee/assigned",
  requireAuth,
  async (req, res) => {
    try {
      const user = req.user!;
      if (user.role !== "employee") {
        return res.status(403).json({ message: "Employee only" });
      }

      const ticketsList = await db
        .select({
          ticket: tickets,
          assignedToName: users.name,
        })
        .from(tickets)
        .leftJoin(users, eq(tickets.assignedToId, users.id))
        .where(eq(tickets.assignedToId, req.user!.id))
        .orderBy(desc(tickets.createdAt));

      const formatted = ticketsList.map(row => ({
        ...row.ticket,
        assignedToName: row.assignedToName,
      }));

      return res.json({ tickets: formatted });
    } catch (e) {
      console.error("EMPLOYEE ASSIGNED FETCH ERROR:", e);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// Admin: Get all tickets (System Override)
ticketRouter.get("/all", requireAuth, requireAdmin, async (req, res) => {
  try {
    const rows = await db.select().from(tickets).orderBy(desc(tickets.createdAt));
    return res.json({ tickets: rows });
  } catch (e) {
    return res.status(500).json({ message: "Server error" });
  }
});