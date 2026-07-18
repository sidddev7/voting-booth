import { eq } from "drizzle-orm";

import { eligibleCitizens } from "@/db/schema";
import { getDb } from "@/lib/db";

/**
 * Returns true when the citizen email is on the allowlist.
 *
 * Set ELIGIBILITY_SKIP_ALLOWLIST=true to skip the Postgres check while
 * developing (still requires Privy auth + wallet ownership).
 */
export async function isEmailAllowlisted(email: string | null): Promise<boolean> {
  if (process.env.ELIGIBILITY_SKIP_ALLOWLIST === "true") {
    return true;
  }

  if (!email) {
    return false;
  }

  const normalized = email.trim().toLowerCase();
  const db = getDb();
  const rows = await db
    .select({ id: eligibleCitizens.id })
    .from(eligibleCitizens)
    .where(eq(eligibleCitizens.email, normalized))
    .limit(1);

  return rows.length > 0;
}
