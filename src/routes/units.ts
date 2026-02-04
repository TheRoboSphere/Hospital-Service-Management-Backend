
import { Router } from "express";
import { db } from "../db";
import { units } from "../db/schema";

export const unitRouter = Router();

// GET /api/units - Fetch all available units
unitRouter.get("/", async (req, res) => {
    try {
        const allUnits = await db.select().from(units);
        res.json(allUnits);
    } catch (error) {
        console.error("Error fetching units:", error);
        res.status(500).json({ error: "Failed to fetch units" });
    }
});
