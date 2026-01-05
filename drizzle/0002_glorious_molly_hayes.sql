-- ALTER TABLE "users" ADD COLUMN "phone_number" varchar(20);
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "phone_number" varchar(20);
