

// src/db/schema.ts
import { boolean } from "drizzle-orm/pg-core";
import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

// Role enum
export const roleEnum = pgEnum("role_enum", ["admin", "employee", "manager"]);


export const ticketStatusEnum = pgEnum("ticket_status_enum", [
  "Verified",  // <-- ADDED THIS
  "In Progress",
  "Pending",   // <-- ADD THIS
  "Resolved",
  "Closed"
]);


// src/db/schema/equipments.ts
import {  numeric } from "drizzle-orm/pg-core";
//import { units } from "./units";


export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 120 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("employee"),
  phoneNumber: varchar("phone_number", { length: 20 }),
  // For employees, which unit they belong to
  unitId: integer("unit_id").references(() => units.id),
  department: varchar("department", { length: 100 }).notNull().default("General"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
});

export const equipments = pgTable("equipments", {
  id: serial("id").primaryKey(),

  name: text("name").notNull(),
  category: text("category").notNull(),

  manufacturer: text("manufacturer").notNull(),
  model: text("model").notNull(),

  serialNumber: text("serial_number").notNull(),

  // department / location shown in UI
  location: text("location").notNull(),

  status: text("status")
    .$type<"Active" | "Maintenance" | "Retired" | "Out of Order">()
    .notNull()
    .default("Active"),

  nextMaintenance: timestamp("next_maintenance"),
  purchaseDate: timestamp("purchase_date"),
  warrantyExpiry: timestamp("warranty_expiry"),
  lastMaintenance: timestamp("last_maintenance"),

  cost: numeric("cost", { precision: 12, scale: 0 }).notNull(),

  // for unit-based filtering (important)
  unitId: integer("unit_id")
    .references(() => units.id)
    .notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});



export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),

  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),

  category: varchar("category", { length: 100 }).notNull(),
  priority: varchar("priority", { length: 20 }).notNull(),

  department: varchar("department", { length: 255 }).notNull(),

  floor: varchar("floor", { length: 10 }),
  room: varchar("room", { length: 20 }),
  bed: varchar("bed", { length: 20 }),
  comment: varchar("comment", { length: 500 }),
  status: ticketStatusEnum("status")
    .notNull()
    .default("Pending"),

  unitId: integer("unit_id").references(() => units.id).notNull(),

  equipmentId: integer("equipment_id"),

  assignedToName: varchar("assigned_to_name", { length: 255 }),

  createdById: integer("created_by_id")
    .notNull()
    .references(() => users.id),

  assignedToId: integer("assigned_to_id").references(() => users.id),

  /* ===========================
     NEW FIELDS (WORKFLOW)
  ============================ */

  // manager assigned by admin
  assignedManagerId: integer("assigned_manager_id")
    .references(() => users.id),

  // employee assigned by manager
  assignedEmployeeId: integer("assigned_employee_id")
    .references(() => users.id),

  // employee work update
  workNote: text("work_note"),

  // equipment used during work
  equipmentsUsed: integer("equipments_used").array(),

  // manager verification
  managerReviewNote: text("manager_review_note"),

  // department verification
  departmentReviewNote: text("department_review_note"),

  // timestamps for tracking
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  closedAt: timestamp("closed_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ticketLogs = pgTable("ticket_logs", {
  id: serial("id").primaryKey(),

  ticketId: integer("ticket_id")
    .references(() => tickets.id)
    .notNull(),

  action: text("action").notNull(), // assigned, accepted, completed etc

  message: text("message"),

  doneById: integer("done_by_id")
    .references(() => users.id)
    .notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});

export const ticketAssignments = pgTable("ticket_assignments", {
  id: serial("id").primaryKey(),

  ticketId: integer("ticket_id")
    .notNull()
    .references(() => tickets.id),

  assignedToId: integer("assigned_to_id")
    .notNull()
    .references(() => users.id),

  assignedById: integer("assigned_by_id")
    .notNull()
    .references(() => users.id),

  equipmentIds: integer("equipment_ids").array(),

  note: text("note"),

  /* NEW */
  role: text("role"), // admin → manager → employee

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});




export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  hospitalName: text("hospital_name").notNull(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  currency: text("currency").default("INR"),
  dateFormat: text("date_format").default("DD/MM/YYYY"),
  maintenanceAlertDays: integer("maintenance_alert_days").default(30),
});
export const notificationSettings = pgTable("notification_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),

  assignmentEmail: boolean("assignment_email").default(true),
  assignmentSMS: boolean("assignment_sms").default(false),
  deadlineReminder: boolean("deadline_reminder").default(true),
});