CREATE TABLE "eligible_citizens" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "party_summaries" (
	"party_id" integer PRIMARY KEY NOT NULL,
	"party_name" text NOT NULL,
	"summary" text NOT NULL,
	"bullets" jsonb NOT NULL,
	"sources" jsonb NOT NULL,
	"exa_request_id" text,
	"model" text DEFAULT 'seed' NOT NULL,
	"generated_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "eligible_citizens_email_uidx" ON "eligible_citizens" USING btree ("email");--> statement-breakpoint
CREATE INDEX "party_summaries_expires_at_idx" ON "party_summaries" USING btree ("expires_at");