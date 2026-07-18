import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

/**
 * Read-only public client (Sepolia).
 *
 * Used everywhere we only need chain state — hasVoted lookups, election status,
 * admin results, the sync indexer — regardless of who signs transactions.
 * Safe for server-side use; not a wallet connector.
 */
export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL),
});
