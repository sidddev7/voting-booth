import { type Address, getAddress, isAddress } from "viem";
import { sepolia } from "viem/chains";

function parseElectionAddress(
  value: string | undefined,
): Address | undefined {
  if (!value || !isAddress(value)) {
    return undefined;
  }
  return getAddress(value);
}

/**
 * Deployed Election contract address on Sepolia.
 * `undefined` until NEXT_PUBLIC_ELECTION_ADDRESS is set to a valid address.
 */
export const electionAddress: Address | undefined = parseElectionAddress(
  process.env.NEXT_PUBLIC_ELECTION_ADDRESS,
);

/** Target chain for all Election reads and writes. */
export const targetChain = sepolia;
