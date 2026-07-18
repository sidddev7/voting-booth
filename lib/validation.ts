import { z } from "zod";

/** Shared Zod schemas for API route input validation. */
export const ethAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address");

export const partyResearchSchema = z.object({
  partyId: z.coerce.number().int().nonnegative(),
  partyName: z.string().trim().min(1, "Party name is required").max(120),
  /** Dev/admin only — bypasses cache and calls Exa again. */
  forceRefresh: z.boolean().optional().default(false),
});

export type PartyResearchInput = z.infer<typeof partyResearchSchema>;

/** Body for POST /api/research/ask — real-time Q&A from party knowledge base */
export const partyAskSchema = z.object({
  partyId: z.coerce.number().int().nonnegative(),
  partyName: z.string().trim().min(1, "Party name is required").max(120),
  question: z
    .string()
    .trim()
    .min(3, "Question is too short")
    .max(500, "Question is too long"),
});

export type PartyAskInput = z.infer<typeof partyAskSchema>;

/** Body for POST /api/eligibility-ticket */
export const eligibilityTicketSchema = z.object({
  voterAddress: ethAddressSchema,
});

export type EligibilityTicketInput = z.infer<typeof eligibilityTicketSchema>;

export { z };
