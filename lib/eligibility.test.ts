import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAddress, verifyTypedData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const HARDHAT_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const CONTRACT = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const VOTER = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

describe("eligibility ticket helpers", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.ADMIN_SIGNER_PRIVATE_KEY = HARDHAT_KEY;
    delete process.env.NEXT_PUBLIC_CHAIN_ID;
  });

  afterEach(() => {
    delete process.env.ADMIN_SIGNER_PRIVATE_KEY;
    delete process.env.NEXT_PUBLIC_CHAIN_ID;
  });

  it("builds the CivicVote EIP-712 domain for Sepolia by default", async () => {
    const { getEligibilityTicketDomain } = await import("@/lib/eligibility");
    const domain = getEligibilityTicketDomain(getAddress(CONTRACT));

    expect(domain).toEqual({
      name: "CivicVote",
      version: "1",
      chainId: sepolia.id,
      verifyingContract: getAddress(CONTRACT),
    });
  });

  it("honors NEXT_PUBLIC_CHAIN_ID when set", async () => {
    process.env.NEXT_PUBLIC_CHAIN_ID = "1";
    const { getEligibilityTicketDomain } = await import("@/lib/eligibility");
    const domain = getEligibilityTicketDomain(getAddress(CONTRACT));
    expect(domain.chainId).toBe(1);
  });

  it("returns the admin signer address derived from the private key", async () => {
    const { getAdminSignerAddress } = await import("@/lib/eligibility");
    const expected = privateKeyToAccount(HARDHAT_KEY).address;
    expect(getAdminSignerAddress()).toBe(expected);
  });

  it("signs a verifiable eligibility ticket", async () => {
    const {
      ELIGIBILITY_TICKET_PRIMARY_TYPE,
      ELIGIBILITY_TICKET_TYPES,
      getEligibilityTicketDomain,
      signEligibilityTicket,
    } = await import("@/lib/eligibility");

    const signature = await signEligibilityTicket(VOTER, CONTRACT);
    expect(signature).toMatch(/^0x[0-9a-fA-F]+$/);

    const valid = await verifyTypedData({
      address: privateKeyToAccount(HARDHAT_KEY).address,
      domain: getEligibilityTicketDomain(getAddress(CONTRACT)),
      types: ELIGIBILITY_TICKET_TYPES,
      primaryType: ELIGIBILITY_TICKET_PRIMARY_TYPE,
      message: {
        voter: getAddress(VOTER),
        votingContract: getAddress(CONTRACT),
      },
      signature,
    });

    expect(valid).toBe(true);
  });

  it("throws when ADMIN_SIGNER_PRIVATE_KEY is missing", async () => {
    delete process.env.ADMIN_SIGNER_PRIVATE_KEY;
    const { getAdminSignerAddress } = await import("@/lib/eligibility");
    expect(() => getAdminSignerAddress()).toThrow(/ADMIN_SIGNER_PRIVATE_KEY/);
  });

  it("throws when ADMIN_SIGNER_PRIVATE_KEY is not 32 bytes", async () => {
    process.env.ADMIN_SIGNER_PRIVATE_KEY = "0x1234";
    const { getAdminSignerAddress } = await import("@/lib/eligibility");
    expect(() => getAdminSignerAddress()).toThrow(/32-byte hex/);
  });

  it("accepts a private key without the 0x prefix", async () => {
    process.env.ADMIN_SIGNER_PRIVATE_KEY = HARDHAT_KEY.slice(2);
    const { getAdminSignerAddress } = await import("@/lib/eligibility");
    expect(getAdminSignerAddress()).toBe(
      privateKeyToAccount(HARDHAT_KEY).address,
    );
  });
});
