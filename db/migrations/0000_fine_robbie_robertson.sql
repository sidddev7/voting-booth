CREATE TYPE "public"."proposal_status" AS ENUM('draft', 'active', 'closed');--> statement-breakpoint
CREATE TYPE "public"."vote_choice" AS ENUM('yes', 'no', 'abstain');--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "proposal_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" text PRIMARY KEY NOT NULL,
	"proposal_id" text NOT NULL,
	"voter_address" text NOT NULL,
	"choice" "vote_choice" NOT NULL,
	"tx_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "votes_proposal_id_voter_address_uidx" ON "votes" USING btree ("proposal_id","voter_address");--> statement-breakpoint
CREATE INDEX "votes_proposal_id_idx" ON "votes" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX "votes_voter_address_idx" ON "votes" USING btree ("voter_address");