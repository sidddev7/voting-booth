import { type Address, type Hex, encodeFunctionData } from "viem";
import { electionAddress } from "./config";
import { electionAbi } from "./electionAbi";

export type CastVoteCall = {
  to: Address;
  data: Hex;
};

/**
 * Builds the `{ to, data }` payload for Election.castVote.
 *
 * Does not sign or send — Phase 7 passes this into the citizen smart wallet
 * client as a sponsored UserOperation.
 */
export function encodeCastVoteCalldata(
  partyId: bigint,
  eligibilitySignature: `0x${string}`,
): CastVoteCall {
  if (!electionAddress) {
    throw new Error(
      "NEXT_PUBLIC_ELECTION_ADDRESS is not set. Deploy Election and configure the address.",
    );
  }

  return {
    to: electionAddress,
    data: encodeFunctionData({
      abi: electionAbi,
      functionName: "castVote",
      args: [partyId, eligibilitySignature],
    }),
  };
}
