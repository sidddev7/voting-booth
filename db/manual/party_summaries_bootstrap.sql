-- Run in Supabase → SQL Editor if local `bun run db:migrate` / `db:seed` cannot connect.
-- Safe to re-run (IF NOT EXISTS / ON CONFLICT).

CREATE TABLE IF NOT EXISTS "eligible_citizens" (
  "id" text PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "eligible_citizens_email_uidx"
  ON "eligible_citizens" USING btree ("email");

CREATE TABLE IF NOT EXISTS "party_summaries" (
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

CREATE INDEX IF NOT EXISTS "party_summaries_expires_at_idx"
  ON "party_summaries" USING btree ("expires_at");

INSERT INTO "party_summaries" (
  "party_id",
  "party_name",
  "summary",
  "bullets",
  "sources",
  "exa_request_id",
  "model",
  "generated_at",
  "expires_at"
) VALUES
(
  0,
  'Harbor Alliance',
  'Harbor Alliance focuses on practical city services, waterfront resilience, and steady local growth. The party frames itself as pragmatic and neighborhood-first: keep ports and transit working, strengthen flood protection, and make permitting clearer for small businesses without abrupt policy swings.',
  '["Invest in ports, ferries, and coastal flood defenses","Simplify local permitting for small businesses and housing repairs","Maintain reliable trash, transit, and emergency services","Support workforce training tied to harbor and logistics jobs","Prefer incremental budgets over large experimental programs"]'::jsonb,
  '[]'::jsonb,
  NULL,
  'seed',
  now(),
  now() + interval '365 days'
),
(
  1,
  'Civic Forward',
  'Civic Forward emphasizes transparent government, digital public services, and faster delivery of everyday needs. It argues that open data, clearer procurement, and modernized city tools can cut wait times for licenses, benefits, and infrastructure repairs while keeping spending accountable.',
  '["Publish budgets and contracts in plain, searchable formats","Digitize licensing and benefits so residents wait less","Modernize procurement to reduce waste and delays","Expand civic tech apprenticeships and public-service careers","Measure departments on service outcomes citizens can verify"]'::jsonb,
  '[]'::jsonb,
  NULL,
  'seed',
  now(),
  now() + interval '365 days'
),
(
  2,
  'Green Commons',
  'Green Commons prioritizes climate resilience, clean air, and shared public spaces. The party pairs environmental goals with affordability: expand transit and bike access, plant and protect community green space, and phase in cleaner energy while cushioning costs for lower-income households.',
  '["Accelerate transit, walking, and bike infrastructure","Expand parks, tree canopy, and neighborhood commons","Cut pollution near schools and dense housing","Support clean-energy upgrades with low-income assistance","Require climate resilience checks in major city projects"]'::jsonb,
  '[]'::jsonb,
  NULL,
  'seed',
  now(),
  now() + interval '365 days'
),
(
  3,
  'Unity Independent',
  'Unity Independent presents itself as a cross-partisan option focused on fairness, anti-corruption, and consensus problem-solving. It stresses independent oversight, campaign-finance clarity, and policies that blend fiscal caution with targeted help for households under cost-of-living pressure.',
  '["Strengthen ethics rules and independent oversight","Increase transparency around campaign and lobby funding","Pursue cross-party deals on housing and transit bottlenecks","Target cost-of-living relief without open-ended spending","Keep ballot language and public notices easy to understand"]'::jsonb,
  '[]'::jsonb,
  NULL,
  'seed',
  now(),
  now() + interval '365 days'
)
ON CONFLICT ("party_id") DO UPDATE SET
  "party_name" = EXCLUDED."party_name",
  "summary" = EXCLUDED."summary",
  "bullets" = EXCLUDED."bullets",
  "sources" = EXCLUDED."sources",
  "exa_request_id" = NULL,
  "model" = 'seed',
  "generated_at" = EXCLUDED."generated_at",
  "expires_at" = EXCLUDED."expires_at",
  "updated_at" = now();
