import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Lightweight DB client placeholder.
 * Wire this up to your preferred driver (e.g. postgres.js, better-sqlite3)
 * using DATABASE_URL once a database is provisioned.
 */
export type DbClient = {
  query: <T = unknown>(sql: string, params?: unknown[]) => Promise<T[]>;
};

let client: DbClient | null = null;

export function getDb(): DbClient {
  if (client) {
    return client;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Configure a database before using getDb().",
    );
  }

  client = {
    async query() {
      throw new Error(
        "DB driver not configured yet. Connect a SQL client in lib/db.ts.",
      );
    },
  };

  return client;
}

/** Helper for reading migration SQL from /db/migrations during tooling. */
export function readMigration(filename: string): string {
  return readFileSync(join(process.cwd(), "db", "migrations", filename), "utf8");
}
