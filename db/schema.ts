import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const proposalStatusEnum = pgEnum("proposal_status", [
  "draft",
  "active",
  "closed",
]);

export const voteChoiceEnum = pgEnum("vote_choice", ["yes", "no", "abstain"]);

export const proposals = pgTable("proposals", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  status: proposalStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const votes = pgTable(
  "votes",
  {
    id: text("id").primaryKey(),
    proposalId: text("proposal_id")
      .notNull()
      .references(() => proposals.id, { onDelete: "cascade" }),
    voterAddress: text("voter_address").notNull(),
    choice: voteChoiceEnum("choice").notNull(),
    txHash: text("tx_hash"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("votes_proposal_id_voter_address_uidx").on(
      table.proposalId,
      table.voterAddress,
    ),
    index("votes_proposal_id_idx").on(table.proposalId),
    index("votes_voter_address_idx").on(table.voterAddress),
  ],
);

export type Proposal = typeof proposals.$inferSelect;
export type NewProposal = typeof proposals.$inferInsert;
export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
