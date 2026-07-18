import {
  buildSeedPartySummaryRows,
  PARTY_SUMMARY_SEEDS,
} from "@/db/seed/party-summaries";
import { refreshAndCachePartySummary } from "@/lib/exa-party-summary";
import {
  getCachedPartySummary,
  isSummaryFresh,
  toPartySummaryDto,
  upsertPartySummary,
  withPartySummaryInflight,
  type PartySummaryDto,
} from "@/lib/party-summary";

/**
 * Resolve a Learn-about summary: fresh cache → bootstrap seed → Exa refresh.
 * Falls back to in-memory seed if Postgres is unreachable.
 */
export async function getPartySummaryForRequest(input: {
  partyId: number;
  partyName: string;
  forceRefresh?: boolean;
}): Promise<PartySummaryDto> {
  const { partyId, partyName, forceRefresh = false } = input;

  return withPartySummaryInflight(partyId, async () => {
    try {
      if (!forceRefresh) {
        const cached = await getCachedPartySummary(partyId);
        if (cached && isSummaryFresh(cached)) {
          return toPartySummaryDto(cached, true);
        }

        if (!cached) {
          const seeded = await bootstrapSeedIfAvailable(partyId);
          if (seeded) {
            return seeded;
          }
        } else {
          try {
            return await refreshAndCachePartySummary(partyId, partyName);
          } catch {
            return toPartySummaryDto(cached, true);
          }
        }
      }

      return await refreshAndCachePartySummary(partyId, partyName);
    } catch (error) {
      const memory = memorySeedDto(partyId);
      if (memory) {
        return memory;
      }
      throw error;
    }
  });
}

async function bootstrapSeedIfAvailable(
  partyId: number,
): Promise<PartySummaryDto | null> {
  const row = buildSeedPartySummaryRows().find((r) => r.partyId === partyId);
  if (!row) {
    return null;
  }

  const saved = await upsertPartySummary(row);
  return toPartySummaryDto(saved, true);
}

function memorySeedDto(partyId: number): PartySummaryDto | null {
  const seed = PARTY_SUMMARY_SEEDS.find((s) => s.partyId === partyId);
  if (!seed) {
    return null;
  }

  return {
    partyId: seed.partyId,
    partyName: seed.partyName,
    summary: seed.summary,
    bullets: seed.bullets,
    sources: seed.sources,
    cached: true,
    generatedAt: new Date().toISOString(),
    model: "seed-memory",
  };
}
