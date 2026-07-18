import { electionAddress } from "@/lib/contracts/config";
import { electionAbi } from "@/lib/contracts/electionAbi";
import type {
  ElectionSnapshot,
  ElectionState,
  Party,
} from "@/lib/election-types";
import { publicClient } from "@/lib/viem";

const STATE_BY_INDEX: ElectionState[] = [
  "NotStarted",
  "Registration",
  "Active",
  "Closed",
];

/**
 * Reads live tallies from Election.getResults().
 * Returns null when the contract is not configured, unreachable, or has no parties.
 */
export async function getElectionResults(): Promise<ElectionSnapshot | null> {
  if (!electionAddress) {
    return null;
  }

  try {
    const [results, stateIndex] = await Promise.all([
      publicClient.readContract({
        address: electionAddress,
        abi: electionAbi,
        functionName: "getResults",
      }),
      publicClient.readContract({
        address: electionAddress,
        abi: electionAbi,
        functionName: "state",
      }),
    ]);

    const [partyList, counts] = results;
    if (partyList.length === 0) {
      return null;
    }

    const parties: Party[] = partyList.map((party, index) => ({
      id: Number(party.id),
      name: party.name,
      shortCode: party.shortCode,
      voteCount: counts[index] === undefined ? 0 : Number(counts[index]),
    }));

    const totalVotes = parties.reduce((sum, party) => sum + party.voteCount, 0);
    const state = STATE_BY_INDEX[Number(stateIndex)] ?? "NotStarted";

    return {
      title: "On-chain election",
      state,
      parties,
      totalVotes,
    };
  } catch (error) {
    console.error("[getElectionResults] on-chain read failed:", error);
    return null;
  }
}
