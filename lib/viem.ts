import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

/**
 * Read-only public client (Sepolia). Safe for server-side use; this is not a
 * wallet connector and is separate from the admin RainbowKit stack.
 */
export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL),
});
