import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http, type Config } from "wagmi";
import { sepolia } from "wagmi/chains";

/**
 * Wagmi / RainbowKit config for the admin dashboard only (Sepolia).
 * Do not import this from citizen-facing routes — it pulls wallet code into
 * the client bundle.
 */
let adminConfig: Config | undefined;

export function getAdminWagmiConfig(): Config {
  if (adminConfig) {
    return adminConfig;
  }

  const projectId =
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ??
    // Placeholder so local builds work; set a real WalletConnect Cloud ID in .env.local.
    "00000000000000000000000000000000";

  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

  adminConfig = getDefaultConfig({
    appName: "civic-vote admin",
    projectId,
    chains: [sepolia],
    transports: {
      [sepolia.id]: http(rpcUrl),
    },
    ssr: true,
  });

  return adminConfig;
}
