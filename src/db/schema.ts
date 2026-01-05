

// src/db/schema.ts
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
export const roleEnum = pgEnum("role_enum", ["admin", "employee"]);


export const ticketStatusEnum = pgEnum("ticket_status_enum", [
  "Open",
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

  // NEW FIELDS FROM FRONTEND
  department: varchar("department", { length: 255 }).notNull(),
     // name from frontend

  floor: varchar("floor", { length: 10 }),
  room: varchar("room", { length: 20 }),
  bed: varchar("bed", { length: 20 }),
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

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
    .references(() => users.id), // admin

  // optional equipment list (array of equipment ids)
  equipmentIds: integer("equipment_ids").array(),

  note: text("note"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});