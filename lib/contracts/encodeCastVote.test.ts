import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { decodeFunctionData, getAddress } from "viem";

const ELECTION = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const SIGNATURE =
  "0x1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111";

describe("encodeCastVoteCalldata", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_ELECTION_ADDRESS;
  });

  it("throws when the election address is not configured", async () => {
    delete process.env.NEXT_PUBLIC_ELECTION_ADDRESS;
    const { encodeCastVoteCalldata } = await import(
      "@/lib/contracts/encodeCastVote"
    );

    expect(() => encodeCastVoteCalldata(1n, SIGNATURE)).toThrow(
      /NEXT_PUBLIC_ELECTION_ADDRESS/,
    );
  });

  it("encodes castVote calldata targeting the configured contract", async () => {
    process.env.NEXT_PUBLIC_ELECTION_ADDRESS = ELECTION;
    const { encodeCastVoteCalldata } = await import(
      "@/lib/contracts/encodeCastVote"
    );
    const { electionAbi } = await import("@/lib/contracts/electionAbi");

    const call = encodeCastVoteCalldata(2n, SIGNATURE);

    expect(call.to).toBe(getAddress(ELECTION));

    const decoded = decodeFunctionData({
      abi: electionAbi,
      data: call.data,
    });

    expect(decoded.functionName).toBe("castVote");
    expect(decoded.args).toEqual([2n, SIGNATURE]);
  });
});
