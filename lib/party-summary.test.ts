import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getPartySummaryTtlDays,
  isSummaryFresh,
  toPartySummaryDto,
  withPartySummaryInflight,
  type PartySummaryDto,
} from "@/lib/party-summary";
import type { PartySummary } from "@/db/schema";

function makeRow(
  overrides: Partial<PartySummary> = {},
): PartySummary {
  const now = new Date("2026-07-01T12:00:00.000Z");
  return {
    partyId: 0,
    partyName: "Harbor Alliance",
    summary: "A summary",
    bullets: ["One", "Two"],
    sources: [{ title: "Source", url: "https://example.com" }],
    exaRequestId: null,
    model: "seed",
    generatedAt: now,
    expiresAt: new Date("2026-07-08T12:00:00.000Z"),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("getPartySummaryTtlDays", () => {
  afterEach(() => {
    delete process.env.PARTY_SUMMARY_TTL_DAYS;
  });

  it("defaults to 7 days when unset", () => {
    delete process.env.PARTY_SUMMARY_TTL_DAYS;
    expect(getPartySummaryTtlDays()).toBe(7);
  });

  it("parses a valid positive integer", () => {
    process.env.PARTY_SUMMARY_TTL_DAYS = "14";
    expect(getPartySummaryTtlDays()).toBe(14);
  });

  it("floors fractional values", () => {
    process.env.PARTY_SUMMARY_TTL_DAYS = "3.9";
    expect(getPartySummaryTtlDays()).toBe(3);
  });

  it("falls back to 7 for non-positive or non-numeric values", () => {
    process.env.PARTY_SUMMARY_TTL_DAYS = "0";
    expect(getPartySummaryTtlDays()).toBe(7);

    process.env.PARTY_SUMMARY_TTL_DAYS = "-2";
    expect(getPartySummaryTtlDays()).toBe(7);

    process.env.PARTY_SUMMARY_TTL_DAYS = "abc";
    expect(getPartySummaryTtlDays()).toBe(7);
  });
});

describe("isSummaryFresh", () => {
  it("returns true when expiresAt is in the future", () => {
    const now = new Date("2026-07-01T12:00:00.000Z");
    expect(
      isSummaryFresh(
        { expiresAt: new Date("2026-07-02T12:00:00.000Z") },
        now,
      ),
    ).toBe(true);
  });

  it("returns false when expiresAt is in the past", () => {
    const now = new Date("2026-07-10T12:00:00.000Z");
    expect(
      isSummaryFresh(
        { expiresAt: new Date("2026-07-08T12:00:00.000Z") },
        now,
      ),
    ).toBe(false);
  });
});

describe("toPartySummaryDto", () => {
  it("maps a row into the public DTO shape", () => {
    const row = makeRow();
    const dto = toPartySummaryDto(row, true);

    expect(dto).toEqual<PartySummaryDto>({
      partyId: 0,
      partyName: "Harbor Alliance",
      summary: "A summary",
      bullets: ["One", "Two"],
      sources: [{ title: "Source", url: "https://example.com" }],
      cached: true,
      generatedAt: "2026-07-01T12:00:00.000Z",
      model: "seed",
    });
  });
});

describe("withPartySummaryInflight", () => {
  it("dedupes concurrent calls for the same party id", async () => {
    let calls = 0;
    const factory = vi.fn(async () => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return toPartySummaryDto(makeRow(), false);
    });

    const [a, b] = await Promise.all([
      withPartySummaryInflight(99, factory),
      withPartySummaryInflight(99, factory),
    ]);

    expect(factory).toHaveBeenCalledTimes(1);
    expect(calls).toBe(1);
    expect(a).toEqual(b);
  });

  it("allows a new call after the previous promise settles", async () => {
    const factory = vi.fn(async () => toPartySummaryDto(makeRow(), false));

    await withPartySummaryInflight(100, factory);
    await withPartySummaryInflight(100, factory);

    expect(factory).toHaveBeenCalledTimes(2);
  });
});
