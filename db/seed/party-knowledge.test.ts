import { describe, expect, it } from "vitest";

import {
  buildPartyKnowledgeText,
  PARTY_KNOWLEDGE_SEEDS,
} from "@/db/seed/party-knowledge";
import { DEMO_PARTIES } from "@/lib/parties";

describe("PARTY_KNOWLEDGE_SEEDS", () => {
  it("covers every demo party", () => {
    expect(PARTY_KNOWLEDGE_SEEDS).toHaveLength(DEMO_PARTIES.length);
    for (const party of DEMO_PARTIES) {
      const seed = PARTY_KNOWLEDGE_SEEDS.find((k) => k.partyId === party.id);
      expect(seed?.partyName).toBe(party.name);
      expect(seed?.knowledge.length).toBeGreaterThan(100);
    }
  });
});

describe("buildPartyKnowledgeText", () => {
  it("returns null for an unknown party", () => {
    expect(buildPartyKnowledgeText(999)).toBeNull();
  });

  it("includes curated knowledge and the short voter brief", () => {
    const text = buildPartyKnowledgeText(0);
    expect(text).toBeTruthy();
    expect(text).toContain("Harbor Alliance");
    expect(text).toContain("Short voter brief:");
    expect(text).toContain("Key points:");
  });
});
