import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/db/schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  pool?: Pool;
  db?: Db;
  databaseUrl?: string;
};

function getPool(): Pool {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Configure a Postgres database before using getDb().",
    );
  }

  // Recreate when DATABASE_URL changes (e.g. after .env reload without process restart).
  if (globalForDb.pool && globalForDb.databaseUrl === databaseUrl) {
    return globalForDb.pool;
  }

  if (globalForDb.pool) {
    void globalForDb.pool.end().catch(() => {});
    globalForDb.pool = undefined;
    globalForDb.db = undefined;
  }

  const isSupabase = databaseUrl.includes("supabase.co");

  const pool = new Pool({
    connectionString: databaseUrl,
    // Supabase requires TLS; local Postgres usually does not.
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
  });

  globalForDb.pool = pool;
  globalForDb.databaseUrl = databaseUrl;

  return pool;
}

/** Shared Drizzle client (Postgres via `pg`). */
export function getDb(): Db {
  const databaseUrl = process.env.DATABASE_URL;
  if (globalForDb.db && globalForDb.databaseUrl === databaseUrl) {
    return globalForDb.db;
  }

  const db = drizzle(getPool(), { schema });
  globalForDb.db = db;
  return db;
}

export type { Db };
