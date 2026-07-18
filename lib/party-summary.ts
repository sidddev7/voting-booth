import { eq } from "drizzle-orm";

import {
  partySummaries,
  type NewPartySummary,
  type PartySummary,
  type PartySummarySource,
} from "@/db/schema";
import { getDb } from "@/lib/db";

export type PartySummaryDto = {
  partyId: number;
  partyName: string;
  summary: string;
  bullets: string[];
  sources: PartySummarySource[];
  cached: boolean;
  generatedAt: string;
  model: string;
};

export function getPartySummaryTtlDays(): number {
  const raw = process.env.PARTY_SUMMARY_TTL_DAYS;
  const parsed = raw ? Number(raw) : 7;
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 7;
  }
  return Math.floor(parsed);
}

export function isSummaryFresh(
  row: Pick<PartySummary, "expiresAt">,
  now = new Date(),
): boolean {
  return row.expiresAt.getTime() > now.getTime();
}

export function toPartySummaryDto(
  row: PartySummary,
  cached: boolean,
): PartySummaryDto {
  return {
    partyId: row.partyId,
    partyName: row.partyName,
    summary: row.summary,
    bullets: row.bullets,
    sources: row.sources,
    cached,
    generatedAt: row.generatedAt.toISOString(),
    model: row.model,
  };
}

export async function getCachedPartySummary(
  partyId: number,
): Promise<PartySummary | undefined> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(partySummaries)
    .where(eq(partySummaries.partyId, partyId))
    .limit(1);
  return row;
}

export async function upsertPartySummary(
  input: Omit<NewPartySummary, "createdAt" | "updatedAt"> & {
    createdAt?: Date;
    updatedAt?: Date;
  },
): Promise<PartySummary> {
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .insert(partySummaries)
    .values({
      ...input,
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    })
    .onConflictDoUpdate({
      target: partySummaries.partyId,
      set: {
        partyName: input.partyName,
        summary: input.summary,
        bullets: input.bullets,
        sources: input.sources,
        exaRequestId: input.exaRequestId ?? null,
        model: input.model,
        generatedAt: input.generatedAt,
        expiresAt: input.expiresAt,
        updatedAt: now,
      },
    })
    .returning();

  if (!row) {
    throw new Error("Failed to upsert party summary");
  }

  return row;
}

/** In-flight dedupe so concurrent Learn-about opens share one Exa call. */
const inflight = new Map<number, Promise<PartySummaryDto>>();

export function withPartySummaryInflight(
  partyId: number,
  factory: () => Promise<PartySummaryDto>,
): Promise<PartySummaryDto> {
  const existing = inflight.get(partyId);
  if (existing) {
    return existing;
  }

  const promise = factory().finally(() => {
    inflight.delete(partyId);
  });
  inflight.set(partyId, promise);
  return promise;
}
