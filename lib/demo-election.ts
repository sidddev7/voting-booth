import type { ElectionSnapshot } from "@/lib/election-types";

/**
 * Demo election data for UI development until /api/election-status
 * and on-chain reads are wired. Swap call sites to real fetches later.
 */
export const DEMO_ELECTION: ElectionSnapshot = {
  title: "Municipal Council Election 2026",
  state: "Active",
  closesAtLabel: "Closes Sunday · 8:00 PM",
  totalVotes: 1284,
  parties: [
    {
      id: 0,
      name: "Harbor Alliance",
      shortCode: "HA",
      description:
        "Waterfront renewal, transit expansion, and neighborhood stewardship.",
      voteCount: 412,
    },
    {
      id: 1,
      name: "Civic Forward",
      shortCode: "CF",
      description:
        "Transparent budgets, digital services, and small-business corridors.",
      voteCount: 389,
    },
    {
      id: 2,
      name: "Green Commons",
      shortCode: "GC",
      description:
        "Parks, clean air targets, and community energy cooperatives.",
      voteCount: 301,
    },
    {
      id: 3,
      name: "Unity Independent",
      shortCode: "UI",
      description:
        "Nonpartisan candidates focused on housing and school funding.",
      voteCount: 182,
    },
  ],
};

export function electionStateLabel(state: ElectionSnapshot["state"]): string {
  switch (state) {
    case "NotStarted":
      return "Not started";
    case "Registration":
      return "Registration open";
    case "Active":
      return "Voting open";
    case "Closed":
      return "Voting closed";
  }
}
