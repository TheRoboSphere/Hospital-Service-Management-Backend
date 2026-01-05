CREATE TABLE IF NOT EXISTS "equipments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"manufacturer" text NOT NULL,
	"model" text NOT NULL,
	"serial_number" text NOT NULL,
	"location" text NOT NULL,
	"status" text DEFAULT 'Active' NOT NULL,
	"next_maintenance" timestamp NOT NULL,
	"cost" numeric(12, 0) NOT NULL,
	"unit_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "equipments" ADD CONSTRAINT "equipments_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;