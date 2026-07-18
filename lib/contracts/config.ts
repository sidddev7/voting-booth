import type { Address } from "viem";
import { sepolia } from "viem/chains";

/**
 * Deployed Election contract address on Sepolia.
 * Set via NEXT_PUBLIC_ELECTION_ADDRESS after Ignition deploy.
 */
export const electionAddress = process.env
  .NEXT_PUBLIC_ELECTION_ADDRESS as Address;

/** Target chain for all Election reads and writes. */
export const targetChain = sepolia;
