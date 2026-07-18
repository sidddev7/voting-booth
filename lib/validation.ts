import { z } from "zod";

/** Shared Zod schemas for API route input validation. */
export const ethAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address");

export const partyResearchSchema = z.object({
  query: z.string().trim().min(1, "Query is required").max(500),
  numResults: z.coerce.number().int().min(1).max(20).default(5),
});

export type PartyResearchInput = z.infer<typeof partyResearchSchema>;

export { z };
