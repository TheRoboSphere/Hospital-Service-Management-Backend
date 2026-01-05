ALTER TABLE "equipments" ALTER COLUMN "next_maintenance" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "equipments" ADD COLUMN "purchase_date" timestamp;--> statement-breakpoint
ALTER TABLE "equipments" ADD COLUMN "warranty_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "equipments" ADD COLUMN "last_maintenance" timestamp;