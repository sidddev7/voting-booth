import { describe, expect, it } from "vitest";

import { answerFromKnowledgeBase } from "@/lib/kb-answer";
import { DEMO_PARTIES } from "@/lib/parties";

describe("answerFromKnowledgeBase", () => {
  it("returns null for an unknown party id", () => {
    expect(
      answerFromKnowledgeBase(999, "Unknown", "What are their priorities?"),
    ).toBeNull();
  });

  it("returns overlapping sentences for a topical question", () => {
    const party = DEMO_PARTIES[0];
    const answer = answerFromKnowledgeBase(
      party.id,
      party.name,
      "What is their housing and permitting plan?",
    );

    expect(answer).toBeTruthy();
    expect(answer!.toLowerCase()).toMatch(/permit|housing|repair/);
  });

  it("falls back to an overview when no terms match", () => {
    const party = DEMO_PARTIES[1];
    const answer = answerFromKnowledgeBase(
      party.id,
      party.name,
      "zzzzzyyyxxx unrelated gibberish",
    );

    expect(answer).toContain(party.name);
    expect(answer).toMatch(/election materials|available overview/i);
  });

  it("answers climate-related questions for Green Commons", () => {
    const party = DEMO_PARTIES[2];
    const answer = answerFromKnowledgeBase(
      party.id,
      party.name,
      "How do they approach climate and clean air?",
    );

    expect(answer).toBeTruthy();
    expect(answer!.toLowerCase()).toMatch(/climate|air|transit|energy/);
  });
});
