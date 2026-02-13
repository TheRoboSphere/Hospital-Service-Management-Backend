import { Router } from "express";
import { db } from "../db";
import { equipments, tickets } from "../db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router = Router();

/*
===========================================
📊 DASHBOARD SUMMARY (UNIT-WISE)
GET /api/dashboard?unitId=1
===========================================
*/
router.get("/", requireAuth, async (req, res) => {
  try {
    const unitId = Number(req.query.unitId);

    if (!unitId) {
      return res.status(400).json({ message: "unitId is required" });
    }

    /* =========================
       EQUIPMENT DATA
    ========================= */
    const equipmentList = await db
      .select()
      .from(equipments)
      .where(eq(equipments.unitId, unitId));

    const equipmentStats = {
      total: equipmentList.length,
      active: equipmentList.filter(e => e.status === "Active").length,
      maintenance: equipmentList.filter(e => e.status === "Maintenance").length,
      outOfOrder: equipmentList.filter(e => e.status === "Out of Order").length,
      totalValue: equipmentList.reduce(
        (sum, e) => sum + Number(e.cost),
        0
      ),
    };

    const recentEquipments = [...equipmentList]
      .sort(
        (a, b) =>
          new Date(b.purchaseDate ?? 0).getTime() -
          new Date(a.purchaseDate ?? 0).getTime()
      )
      .slice(0, 5);

    /* =========================
       DEPARTMENT COUNTS
       (from location field)
    ========================= */
    const departmentMap: Record<string, number> = {};

    equipmentList.forEach(eq => {
      const dept = eq.location || "Unknown";
      departmentMap[dept] = (departmentMap[dept] || 0) + 1;
    });

    /* =========================
       TICKET DATA
    ========================= */
    const ticketList = await db
      .select()
      .from(tickets)
      .where(eq(tickets.unitId, unitId));

    const ticketStats = {
      total: ticketList.length,
      
      pending: ticketList.filter(t => t.status === "Pending").length,
      inProgress: ticketList.filter(t => t.status === "In Progress").length,
      resolved: ticketList.filter(t => t.status === "Resolved").length,
      closed: ticketList.filter(t => t.status === "Closed").length,
    };

    /* =========================
       RESPONSE
    ========================= */
    return res.json({
      equipmentStats,
      recentEquipments,
      departmentStats: departmentMap,
      ticketStats,
    });

  } catch (error) {
    console.error("DASHBOARD ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
