// import { Router } from "express";
// import bcrypt from "bcryptjs";
// import { db } from "../db";
// import { users } from "../db/schema";
// import { notificationSettings } from "../db/schema";
// import { systemSettings } from "../db/schema";
// import { eq } from "drizzle-orm";
// import { requireAuth } from "../middleware/auth";

// const settingsRouter = Router();

// /*
// ====================================
// GET ALL SETTINGS
// ====================================
// */
// settingsRouter.get("/", requireAuth, async (req, res) => {
//   const userId = req.user!.id;

//   const [profile] = await db
//     .select({
//       id: users.id,
//       name: users.name,
//       email: users.email,
//       phone: users.phoneNumber,
//       role: users.role,
//     })
//     .from(users)
//     .where(eq(users.id, userId));

//   const [notifications] = await db
//     .select()
//     .from(notificationSettings)
//     .where(eq(notificationSettings.userId, userId));

//   const system =
//     req.user!.role === "admin"
//       ? (await db.select().from(systemSettings))[0]
//       : null;

//   res.json({
//     profile,
//     notifications: notifications ?? {
//       assignmentEmail: true,
//       assignmentSMS: false,
//       deadlineReminder: true,
//     },
//     system,
//   });
// });

// /*
// ====================================
// UPDATE PROFILE
// ====================================
// */
// // settingsRouter.put("/profile", requireAuth, async (req, res) => {
// //   const { name, phone } = req.body;

// //   await db
// //     .update(users)
// //     .set({ name, phoneNumber: phone })
// //     .where(eq(users.id, req.user!.id));

// //   res.json({ success: true });
// // });

// /*
// ====================================
// UPDATE NOTIFICATIONS
// ====================================
// */
// settingsRouter.put("/notifications", requireAuth, async (req, res) => {
//   const { assignmentEmail, assignmentSMS, deadlineReminder } = req.body;

//   await db
//     .insert(notificationSettings)
//     .values({
//       userId: req.user!.id,
//       assignmentEmail,
//       assignmentSMS,
//       deadlineReminder,
//     })
//     .onConflictDoUpdate({
//       target: notificationSettings.userId,
//       set: { assignmentEmail, assignmentSMS, deadlineReminder },
//     });

//   res.json({ success: true });
// });

// /*
// ====================================
// UPDATE SYSTEM (ADMIN)
// ====================================
// // */
// // settingsRouter.put("/system", requireAuth, async (req, res) => {
// //   if (req.user!.role !== "admin") {
// //     return res.status(403).json({ message: "Forbidden" });
// //   }

// //   const { hospitalName, contactEmail, contactPhone, currency, reminderHours } =
// //     req.body;

// //   await db
// //     .update(systemSettings)
// //     .set({
// //       hospitalName,
// //       contactEmail,
// //       contactPhone,
// //       currency,
// //       reminderHours,
// //     })
// //     .where(eq(systemSettings.id, 1));

// //   res.json({ success: true });
// // });

// /*
// ====================================
// CHANGE PASSWORD
// ====================================
// */
// settingsRouter.put("/password", requireAuth, async (req, res) => {
//   const { newPassword } = req.body;

//   if (!newPassword || newPassword.length < 6) {
//     return res.status(400).json({ message: "Password too short" });
//   }

//   const hash = await bcrypt.hash(newPassword, 10);

//   await db
//     .update(users)
//     .set({ passwordHash: hash })
//     .where(eq(users.id, req.user!.id));

//   res.json({ success: true });
// });

// export default settingsRouter;
// // import { Router } from "express";
// // import { requireAuth } from "../middleware/auth";
// // import { db } from "../db";
// // import { users, notificationSettings, systemSettings } from "../db/schema";
// // import { eq } from "drizzle-orm";

// // const router = Router();

// // /* ================= PROFILE ================= */
// // router.get("/profile", requireAuth, async (req, res) => {
// //   const user = await db
// //     .select({
// //       name: users.name,
// //       email: users.email,
// //       phoneNumber: users.phoneNumber,
// //       role: users.role,
// //     })
// //     .from(users)
// //     .where(eq(users.id, req.user!.id));

// //   res.json(user[0]);
// // });

// // /* ================= NOTIFICATIONS ================= */
// // router.get("/notifications", requireAuth, async (req, res) => {
// //   const settings = await db
// //     .select()
// //     .from(notificationSettings)
// //     .where(eq(notificationSettings.userId, req.user!.id));

// //   res.json(settings[0]);
// // });

// /* ================= SYSTEM ================= */
// router.get("/system", requireAuth, async (_req, res) => {
//   const system = await db.select().from(systemSettings);
//   res.json(system[0]);
// });

// export default router;
import { Router } from "express";
import { db } from "../db";
import { users, notificationSettings, systemSettings } from "../db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import bcrypt from "bcryptjs";

const settingsRouter = Router();

/* =====================
   PROFILE
===================== */

// router.get("/profile", requireAuth, async (req, res) => {
//   const user = req.user!;
//   res.json({
//     profile: {
//       name: user.name,
//       email: user.email,
//       phoneNumber: user.phoneNumber,
//       role: user.role,
//     },
//   });
// });

settingsRouter.put("/profile", requireAuth, async (req, res) => {
  const { name, phoneNumber } = req.body;

  await db
    .update(users)
    .set({ name, phoneNumber })
    .where(eq(users.id, req.user!.id));

  res.json({ message: "Profile updated" });
});

/* =====================
   NOTIFICATIONS
===================== */

settingsRouter.get("/notifications", requireAuth, async (req, res) => {
  const result = await db
    .select()
    .from(notificationSettings)
    .where(eq(notificationSettings.userId, req.user!.id));

  if (!result[0]) {
    // create default if missing
    const [created] = await db
      .insert(notificationSettings)
      .values({ userId: req.user!.id })
      .returning();

    return res.json({ settings: created });
  }

  res.json({ settings: result[0] });
});

settingsRouter.put("/notifications", requireAuth, async (req, res) => {
  await db
    .update(notificationSettings)
    .set(req.body)
    .where(eq(notificationSettings.userId, req.user!.id));

  res.json({ message: "Notifications updated" });
});

/* =====================
   PASSWORD
===================== */

settingsRouter.put("/password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, req.user!.id));

  const valid = await bcrypt.compare(
    currentPassword,
    user.passwordHash
  );

  if (!valid) {
    return res.status(400).json({ message: "Wrong password" });
  }

  const hash = await bcrypt.hash(newPassword, 10);

  await db
    .update(users)
    .set({ passwordHash: hash })
    .where(eq(users.id, req.user!.id));

  res.json({ message: "Password updated" });
});

/* =====================
   SYSTEM (ADMIN)
===================== */

settingsRouter.get("/system", requireAuth, async (_req, res) => {
  const result = await db.select().from(systemSettings);
  res.json({ settings: result[0] ?? null });
});

settingsRouter.put("/system", requireAuth, async (req, res) => {
  const existing = await db.select().from(systemSettings);

  if (!existing[0]) {
    await db.insert(systemSettings).values(req.body);
  } else {
    await db.update(systemSettings).set(req.body);
  }

  res.json({ message: "System settings updated" });
});

export default settingsRouter;
