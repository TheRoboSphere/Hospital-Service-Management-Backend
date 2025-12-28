
import { Router } from "express";
import { db, tickets } from "../db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

export const ticketRouter = Router();

/*
===========================================
1️⃣ CREATE TICKET (Raise Ticket)
===========================================
*/
ticketRouter.post("/", requireAuth, async (req, res) => {
  try {
    const { title, description, category, priority, unitId, equipmentId } = req.body;

    if (!title || !category || !priority || !unitId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const inserted = await db
      .insert(tickets )
      .values({
        title,
        description,
        category,
        priority,
        unitId,
        equipmentId,
        status: "review_pending",
        createdById: req.user.id,
      })
      .returning();

    return res.status(201).json({ ticket: inserted[0] });
  } catch (error) {
    console.error("CREATE TICKET ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

/*
===========================================
2️⃣ GET ALL TICKETS (Filter by unit, category, status, priority)
===========================================
*/
ticketRouter.get("/", requireAuth, async (req, res) => {
  const { unitId, status, priority, category } = req.query;

  try {
    let query = db.select().from(tickets);

    if (unitId) query = query.where(eq(tickets.unitId, Number(unitId)));
    if (status) query = query.where(eq(tickets.status, String(status)));
    if (priority) query = query.where(eq(tickets.priority, String(priority)));
    if (category) query = query.where(eq(tickets.category, String(category)));

    const results = await query;
    return res.json({ tickets: results });
  } catch (error) {
    console.error("FETCH ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

/*
===========================================
3️⃣ GET SINGLE TICKET
===========================================
*/
ticketRouter.get("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const result = await db.select().from(tickets).where(eq(tickets.id, id));
  return res.json({ ticket: result[0] });
});

/*
===========================================
4️⃣ UPDATE TICKET (Status, Assigned, etc)
===========================================
*/
ticketRouter.put("/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updateData = req.body;

    const updated = await db
      .update(tickets)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, id))
      .returning();

    return res.json({ ticket: updated[0] });
  } catch (error) {
    console.error("UPDATE ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

/*
===========================================
5️⃣ DELETE TICKET
===========================================
*/
ticketRouter.delete("/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    await db.delete(tickets).where(eq(tickets.id, id));

    return res.json({ message: "Ticket deleted" });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
});
