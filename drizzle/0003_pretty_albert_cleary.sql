-- ALTER TABLE "tickets" ADD COLUMN "floor" varchar(10);--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "room" varchar(20);--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "bed" varchar(20);
ALTER TABLE "tickets"
ADD COLUMN IF NOT EXISTS "floor" varchar(10);
