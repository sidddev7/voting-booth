import { describe, expect, it } from "vitest";

import {
  eligibilityTicketSchema,
  ethAddressSchema,
  partyAskSchema,
  partyResearchSchema,
} from "@/lib/validation";

describe("ethAddressSchema", () => {
  it("accepts a valid checksummed address", () => {
    const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
    expect(ethAddressSchema.parse(address)).toBe(address);
  });

  it("accepts a lowercase address", () => {
    const address = "0x742d35cc6634c0532925a3b844bc9e7595f0beb0";
    expect(ethAddressSchema.parse(address)).toBe(address);
  });

  it("rejects a short address", () => {
    const result = ethAddressSchema.safeParse("0xabc");
    expect(result.success).toBe(false);
  });

  it("rejects a non-hex address", () => {
    const result = ethAddressSchema.safeParse(
      "0xGGGG35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    );
    expect(result.success).toBe(false);
  });

  it("rejects an address without 0x prefix", () => {
    const result = ethAddressSchema.safeParse(
      "742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    );
    expect(result.success).toBe(false);
  });
});

describe("partyResearchSchema", () => {
  it("parses a valid research request and defaults forceRefresh", () => {
    const parsed = partyResearchSchema.parse({
      partyId: "2",
      partyName: "  Green Commons  ",
    });

    expect(parsed).toEqual({
      partyId: 2,
      partyName: "Green Commons",
      forceRefresh: false,
    });
  });

  it("accepts forceRefresh true", () => {
    const parsed = partyResearchSchema.parse({
      partyId: 0,
      partyName: "Harbor Alliance",
      forceRefresh: true,
    });
    expect(parsed.forceRefresh).toBe(true);
  });

  it("rejects an empty party name", () => {
    const result = partyResearchSchema.safeParse({
      partyId: 1,
      partyName: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative party id", () => {
    const result = partyResearchSchema.safeParse({
      partyId: -1,
      partyName: "Civic Forward",
    });
    expect(result.success).toBe(false);
  });
});

describe("partyAskSchema", () => {
  it("parses a valid ask body", () => {
    const parsed = partyAskSchema.parse({
      partyId: 1,
      partyName: "Civic Forward",
      question: "What are their housing priorities?",
    });

    expect(parsed.partyId).toBe(1);
    expect(parsed.question).toContain("housing");
  });

  it("rejects a question that is too short", () => {
    const result = partyAskSchema.safeParse({
      partyId: 1,
      partyName: "Civic Forward",
      question: "hi",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a question that is too long", () => {
    const result = partyAskSchema.safeParse({
      partyId: 1,
      partyName: "Civic Forward",
      question: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("eligibilityTicketSchema", () => {
  it("parses a valid voter address body", () => {
    const voterAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
    expect(eligibilityTicketSchema.parse({ voterAddress })).toEqual({
      voterAddress,
    });
  });

  it("rejects a missing voter address", () => {
    const result = eligibilityTicketSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
