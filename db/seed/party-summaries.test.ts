import { describe, expect, it } from "vitest";

import {
  buildSeedPartySummaryRows,
  PARTY_SUMMARY_SEEDS,
  SEED_SUMMARY_TTL_DAYS,
} from "@/db/seed/party-summaries";
import { DEMO_PARTIES } from "@/lib/parties";

describe("PARTY_SUMMARY_SEEDS", () => {
  it("aligns with DEMO_PARTIES ids and names", () => {
    expect(PARTY_SUMMARY_SEEDS).toHaveLength(DEMO_PARTIES.length);
    for (const party of DEMO_PARTIES) {
      const seed = PARTY_SUMMARY_SEEDS.find((s) => s.partyId === party.id);
      expect(seed?.partyName).toBe(party.name);
      expect(seed?.bullets.length).toBeGreaterThan(0);
    }
  });
});

describe("buildSeedPartySummaryRows", () => {
  it("builds rows with a long TTL and seed model", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const rows = buildSeedPartySummaryRows(now);

    expect(rows).toHaveLength(PARTY_SUMMARY_SEEDS.length);

    const expectedExpiry = new Date(now);
    expectedExpiry.setUTCDate(
      expectedExpiry.getUTCDate() + SEED_SUMMARY_TTL_DAYS,
    );

    for (const row of rows) {
      expect(row.model).toBe("seed");
      expect(row.generatedAt).toEqual(now);
      expect(row.expiresAt).toEqual(expectedExpiry);
      expect(row.exaRequestId).toBeNull();
    }
  });
});
