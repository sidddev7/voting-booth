import {
  index,
  integer,
  jsonb,
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

/**
 * Citizens allowed to request an EIP-712 eligibility ticket.
 * Match on normalized email from the authenticated Privy user.
 */
export const eligibleCitizens = pgTable(
  "eligible_citizens",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("eligible_citizens_email_uidx").on(table.email)],
);

export type PartySummarySource = {
  title: string;
  url: string;
};

/**
 * Cached "Learn about party" summaries (Exa-generated or seeded).
 * Keyed by on-chain party id.
 */
export const partySummaries = pgTable(
  "party_summaries",
  {
    partyId: integer("party_id").primaryKey(),
    partyName: text("party_name").notNull(),
    summary: text("summary").notNull(),
    bullets: jsonb("bullets").$type<string[]>().notNull(),
    sources: jsonb("sources").$type<PartySummarySource[]>().notNull(),
    exaRequestId: text("exa_request_id"),
    model: text("model").notNull().default("seed"),
    generatedAt: timestamp("generated_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("party_summaries_expires_at_idx").on(table.expiresAt)],
);

export type Proposal = typeof proposals.$inferSelect;
export type NewProposal = typeof proposals.$inferInsert;
export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
export type EligibleCitizen = typeof eligibleCitizens.$inferSelect;
export type NewEligibleCitizen = typeof eligibleCitizens.$inferInsert;
export type PartySummary = typeof partySummaries.$inferSelect;
export type NewPartySummary = typeof partySummaries.$inferInsert;
