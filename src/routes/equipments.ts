import { Router } from "express";
import { db, equipments } from "../db";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { eq, desc ,sql} from "drizzle-orm";

export const equipmentRouter = Router();
equipmentRouter.get("/", requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    const queryUnitId = req.query.unitId
      ? Number(req.query.unitId)
      : null;

    let rows;

    // ADMIN → unitId MUST come from params/query
    if (user.role === "admin") {
      if (!queryUnitId || isNaN(queryUnitId)) {
        return res.json({ equipments: [] });
      }

      rows = await db
        .select()
        .from(equipments)
        .where(eq(equipments.unitId, queryUnitId))
        .orderBy(desc(equipments.createdAt));
    }

    // EMPLOYEE → use assigned unit
    else {
      if (!user.unitId) {
        return res.json({ equipments: [] });
      }

      rows = await db
        .select()
        .from(equipments)
        .where(eq(equipments.unitId, user.unitId))
        .orderBy(desc(equipments.createdAt));
    }

    return res.json({ equipments: rows });
  } catch (e) {
    console.error("FETCH EQUIPMENT ERROR:", e);
    return res.status(500).json({ message: "Server error" });
  }
});


equipmentRouter.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      category,
      manufacturer,
      model,
      serialNumber,
      location,
      status,
      nextMaintenance,
      purchaseDate,
      warrantyExpiry,
      lastMaintenance,
      cost,
      unitId,
    } = req.body;

    if (!name || !category || !manufacturer || !model || !serialNumber)
      return res.status(400).json({ message: "Missing required fields" });

    if (!unitId)
      return res.status(400).json({ message: "unitId is required" });

    const [created] = await db
      .insert(equipments)
      .values({
        name,
        category,
        manufacturer,
        model,
        serialNumber,
        location,
        status,
        nextMaintenance: new Date(nextMaintenance),
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
        lastMaintenance: lastMaintenance ? new Date(lastMaintenance) : null,
        cost,
        unitId: Number(unitId),
      })
      .returning();

    return res.status(201).json({ equipment: created });
  } catch (e) {
    console.error("ADD EQUIPMENT ERROR:", e);
    return res.status(500).json({ message: "Server error" });
  }
});


equipmentRouter.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const {
      name,
      category,
      manufacturer,
      model,
      serialNumber,
      location,
      status,
      nextMaintenance,
      purchaseDate,
      warrantyExpiry ,
      lastMaintenance,
      cost,
    } = req.body;

    const [updated] = await db
      .update(equipments)
      .set({
        name,
        category,
        manufacturer,
        model,
        serialNumber,
        location,
        status,
        nextMaintenance: new Date(nextMaintenance),
        cost,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
        lastMaintenance: lastMaintenance ? new Date(lastMaintenance) : null,
        updatedAt: new Date(),
      })
      .where(eq(equipments.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    return res.json({ equipment: updated });
  } catch (e) {
    console.error("UPDATE EQUIPMENT ERROR:", e);
    return res.status(500).json({ message: "Server error" });
  }
});


equipmentRouter.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    await db.delete(equipments).where(eq(equipments.id, id));

    return res.json({ success: true });
  } catch (e) {
    console.error("DELETE EQUIPMENT ERROR:", e);
    return res.status(500).json({ message: "Server error" });
  }
});





/* ============================
   EQUIPMENT STATS
============================ */
equipmentRouter.get("/stats", requireAuth, async (req, res) => {
  const unitId = Number(req.query.unitId);
  if (!unitId) {
    return res.status(400).json({ message: "unitId required" });
  }

  
  const result = await db.execute(sql`
  SELECT
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE status = 'Active')::int AS active,
    COUNT(*) FILTER (WHERE status = 'Maintenance')::int AS maintenance,
    COUNT(*) FILTER (WHERE status = 'Out of Order')::int AS out_of_order,
    COALESCE(SUM(cost),0)::int AS total_value
  FROM equipments
  WHERE unit_id = ${unitId}
`);

const stats = result.rows[0] as {
  total: number;
  active: number;
  maintenance: number;
  out_of_order: number;
  total_value: number;
};

  res.json({
    total: stats.total,
    active: stats.active,
    maintenance: stats.maintenance,
    outOfOrder: stats.out_of_order,
    totalValue: stats.total_value,
  });
});