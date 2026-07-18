import { describe, expect, it } from "vitest";

import { DEMO_PARTIES } from "@/lib/parties";

describe("DEMO_PARTIES", () => {
  it("has four ballot parties with contiguous ids", () => {
    expect(DEMO_PARTIES).toHaveLength(4);
    expect(DEMO_PARTIES.map((p) => p.id)).toEqual([0, 1, 2, 3]);
  });

  it("uses unique short codes", () => {
    const codes = DEMO_PARTIES.map((p) => p.shortCode);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("exposes the expected party names", () => {
    expect(DEMO_PARTIES.map((p) => p.name)).toEqual([
      "Harbor Alliance",
      "Civic Forward",
      "Green Commons",
      "Unity Independent",
    ]);
  });
});
