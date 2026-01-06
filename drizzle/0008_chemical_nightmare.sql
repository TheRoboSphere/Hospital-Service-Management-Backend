CREATE TABLE "system_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"hospital_name" text NOT NULL,
	"contact_email" text,
	"contact_phone" text,
	"currency" text DEFAULT 'INR',
	"date_format" text DEFAULT 'DD/MM/YYYY',
	"maintenance_alert_days" integer DEFAULT 30
);
