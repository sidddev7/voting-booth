import { describe, expect, it } from "vitest";

import { DEMO_ELECTION, electionStateLabel } from "@/lib/demo-election";
import type { ElectionState } from "@/lib/election-types";
import { DEMO_PARTIES } from "@/lib/parties";

describe("DEMO_ELECTION", () => {
  it("matches demo party ids and names", () => {
    expect(DEMO_ELECTION.parties).toHaveLength(DEMO_PARTIES.length);

    for (const party of DEMO_PARTIES) {
      const snapshot = DEMO_ELECTION.parties.find((p) => p.id === party.id);
      expect(snapshot?.name).toBe(party.name);
      expect(snapshot?.shortCode).toBe(party.shortCode);
    }
  });

  it("has vote totals that sum to totalVotes", () => {
    const sum = DEMO_ELECTION.parties.reduce(
      (acc, party) => acc + party.voteCount,
      0,
    );
    expect(sum).toBe(DEMO_ELECTION.totalVotes);
  });
});

describe("electionStateLabel", () => {
  const cases: [ElectionState, string][] = [
    ["NotStarted", "Not started"],
    ["Registration", "Registration open"],
    ["Active", "Voting open"],
    ["Closed", "Voting closed"],
  ];

  it.each(cases)("maps %s to %s", (state, label) => {
    expect(electionStateLabel(state)).toBe(label);
  });
});
