/**
 * Application database schema.
 * Mirror structural changes in SQL migrations under db/migrations.
 */

export type Proposal = {
  id: string;
  title: string;
  description: string;
  status: "draft" | "active" | "closed";
  createdAt: Date;
  updatedAt: Date;
};

export type Vote = {
  id: string;
  proposalId: string;
  voterAddress: string;
  choice: "yes" | "no" | "abstain";
  txHash: string | null;
  createdAt: Date;
};

export const tables = {
  proposals: "proposals",
  votes: "votes",
} as const;
