import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { users } from "../db/schema";
import { notificationSettings } from "../db/schema";
import { systemSettings } from "../db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const settingsRouter = Router();

/*
====================================
GET ALL SETTINGS
====================================
*/
settingsRouter.get("/", requireAuth, async (req, res) => {
  const userId = req.user!.id;

  const [profile] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phoneNumber,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId));

  const [notifications] = await db
    .select()
    .from(notificationSettings)
    .where(eq(notificationSettings.userId, userId));

  const system =
    req.user!.role === "admin"
      ? (await db.select().from(systemSettings))[0]
      : null;

  res.json({
    profile,
    notifications: notifications ?? {
      assignmentEmail: true,
      assignmentSMS: false,
      deadlineReminder: true,
    },
    system,
  });
});

/*
====================================
UPDATE PROFILE
====================================
*/
// settingsRouter.put("/profile", requireAuth, async (req, res) => {
//   const { name, phone } = req.body;

//   await db
//     .update(users)
//     .set({ name, phoneNumber: phone })
//     .where(eq(users.id, req.user!.id));

//   res.json({ success: true });
// });

/*
====================================
UPDATE NOTIFICATIONS
====================================
*/
settingsRouter.put("/notifications", requireAuth, async (req, res) => {
  const { assignmentEmail, assignmentSMS, deadlineReminder } = req.body;

  await db
    .insert(notificationSettings)
    .values({
      userId: req.user!.id,
      assignmentEmail,
      assignmentSMS,
      deadlineReminder,
    })
    .onConflictDoUpdate({
      target: notificationSettings.userId,
      set: { assignmentEmail, assignmentSMS, deadlineReminder },
    });

  res.json({ success: true });
});

/*
====================================
UPDATE SYSTEM (ADMIN)
====================================
// */
// settingsRouter.put("/system", requireAuth, async (req, res) => {
//   if (req.user!.role !== "admin") {
//     return res.status(403).json({ message: "Forbidden" });
//   }

//   const { hospitalName, contactEmail, contactPhone, currency, reminderHours } =
//     req.body;

//   await db
//     .update(systemSettings)
//     .set({
//       hospitalName,
//       contactEmail,
//       contactPhone,
//       currency,
//       reminderHours,
//     })
//     .where(eq(systemSettings.id, 1));

//   res.json({ success: true });
// });

/*
====================================
CHANGE PASSWORD
====================================
*/
settingsRouter.put("/password", requireAuth, async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: "Password too short" });
  }

  const hash = await bcrypt.hash(newPassword, 10);

  await db
    .update(users)
    .set({ passwordHash: hash })
    .where(eq(users.id, req.user!.id));

  res.json({ success: true });
});

export default settingsRouter;
