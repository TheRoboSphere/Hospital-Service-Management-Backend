// // src/routes/ticket.routes.ts
// import { Router } from "express";
// import { db } from "../db";
// import { tickets } from "../db/schema";
// import { eq } from "drizzle-orm";
// import { requireAuth } from "../middleware/auth";

// export const ticketRouter = Router();

// /* =========================
// 1️⃣ CREATE TICKET
// ========================= */
// ticketRouter.post("/", requireAuth, async (req, res) => {
//   try {
//     const { title, description, category, priority, unitId, equipmentId } = req.body;

//     if (!title || !category || !priority || !unitId) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     const [ticket] = await db
//       .insert(tickets)
//       .values({
//         title,
//         description,
//         category,
//         priority,
//         unitId,
//         equipmentId,
//         status: "Pending", // ✅ FIXED
//         createdById: req.user.id,
//       })
//       .returning();

//     res.status(201).json({ ticket });
//   } catch (error) {
//     console.error("CREATE TICKET ERROR:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// /* =========================
// 2️⃣ GET ALL TICKETS
// ========================= */
// // ticketRouter.get("/", requireAuth, async (req, res) => {
// //   try {
// //     const { unitId, status, priority, category } = req.query;

// //     let query = db.select().from(tickets);

// //     if (unitId) query = query.where(eq(tickets.unitId, Number(unitId)));
// //     if (status) query = query.where(eq(tickets.status, String(status)));
// //     if (priority) query = query.where(eq(tickets.priority, String(priority)));
// //     if (category) query = query.where(eq(tickets.category, String(category)));

// //     const results = await query;
// //     res.json({ tickets: results });
// //   } catch (error) {
// //     console.error("FETCH ERROR:", error);
// //     res.status(500).json({ message: "Server error" });
// //   }
// // });

// /* =========================
// 3️⃣ GET SINGLE TICKET
// ========================= */
// ticketRouter.get("/:id", requireAuth, async (req, res) => {
//   const id = Number(req.params.id);

//   const [ticket] = await db
//     .select()
//     .from(tickets)
//     .where(eq(tickets.id, id));

//   res.json({ ticket });
// });

// /* =========================
// 4️⃣ UPDATE TICKET
// ========================= */
// ticketRouter.patch("/:id", requireAuth, async (req, res) => {
//   try {
//     const id = Number(req.params.id);

//     const [updated] = await db
//       .update(tickets)
//       .set({
//         ...req.body,
//         updatedAt: new Date(),
//       })
//       .where(eq(tickets.id, id))
//       .returning();

//     res.json({ ticket: updated });
//   } catch (error) {
//     console.error("UPDATE ERROR:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// /* =========================
// 5️⃣ DELETE TICKET
// ========================= */
// ticketRouter.delete("/:id", requireAuth, async (req, res) => {
//   const id = Number(req.params.id);
//   await db.delete(tickets).where(eq(tickets.id, id));
//   res.json({ message: "Ticket deleted" });
// });
