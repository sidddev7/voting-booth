/**
 * Ballot parties used by setup-election and party-summary seed data.
 * Keep in sync with contracts/scripts/setup-election.ts PARTIES order
 * (array index == on-chain party id).
 */
export const DEMO_PARTIES = [
  {
    id: 0,
    name: "Harbor Alliance",
    shortCode: "HA",
  },
  {
    id: 1,
    name: "Civic Forward",
    shortCode: "CF",
  },
  {
    id: 2,
    name: "Green Commons",
    shortCode: "GC",
  },
  {
    id: 3,
    name: "Unity Independent",
    shortCode: "UI",
  },
] as const;

export type DemoParty = (typeof DEMO_PARTIES)[number];
