import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/db/schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  pool?: Pool;
  db?: Db;
};

function getPool(): Pool {
  if (globalForDb.pool) {
    return globalForDb.pool;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Configure a Postgres database before using getDb().",
    );
  }

  const pool = new Pool({ connectionString: databaseUrl });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.pool = pool;
  }

  return pool;
}

/** Shared Drizzle client (Postgres via `pg`). */
export function getDb(): Db {
  if (globalForDb.db) {
    return globalForDb.db;
  }

  const db = drizzle(getPool(), { schema });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.db = db;
  }

  return db;
}

export type { Db };
