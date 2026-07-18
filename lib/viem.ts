import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

/**
 * Read-only public client (Sepolia). Safe for server-side use; this is not a
 * wallet connector and is separate from the admin RainbowKit stack.
 *
 * Prefer a reliable provider URL in NEXT_PUBLIC_RPC_URL — public free RPCs
 * (e.g. publicnode) often time out and make /results look "not opened".
 */
export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL, {
    timeout: 20_000,
    retryCount: 2,
  }),
});
