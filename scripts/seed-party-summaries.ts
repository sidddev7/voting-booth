/**
 * Upsert curated "Learn about party" starter summaries into Supabase.
 *
 *   bun run db:seed
 *
 * Bun loads `.env` automatically.
 */
import { partySummaries } from "../db/schema";
import { buildSeedPartySummaryRows } from "../db/seed/party-summaries";
import { getDb } from "../lib/db";

async function main() {
  const db = getDb();
  const rows = buildSeedPartySummaryRows();

  for (const row of rows) {
    await db
      .insert(partySummaries)
      .values(row)
      .onConflictDoUpdate({
        target: partySummaries.partyId,
        set: {
          partyName: row.partyName,
          summary: row.summary,
          bullets: row.bullets,
          sources: row.sources,
          exaRequestId: null,
          model: "seed",
          generatedAt: row.generatedAt,
          expiresAt: row.expiresAt,
          updatedAt: new Date(),
        },
      });

    console.log(`Seeded party_summaries party_id=${row.partyId} (${row.partyName})`);
  }

  console.log(`Done. Upserted ${rows.length} party summaries.`);
}

main().catch((error) => {
  const cause =
    error && typeof error === "object" && "cause" in error
      ? (error as { cause?: unknown }).cause
      : undefined;
  const code =
    cause && typeof cause === "object" && cause && "code" in cause
      ? String((cause as { code?: string }).code)
      : undefined;

  console.error(error);

  if (code === "ECONNREFUSED") {
    console.error(`
Database connection refused.

Your Supabase direct host (db.*.supabase.co:5432) is IPv6-only and often
fails from local networks. In Supabase → Project Settings → Database, copy the
Transaction pooler URI (port 6543) into DATABASE_URL, e.g.:

  postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres

URL-encode special characters in the password (@ → %40).
Then re-run:

  bun run db:migrate
  bun run db:seed
`);
  }

  process.exit(1);
});
