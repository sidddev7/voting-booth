import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http, type Config } from "wagmi";
import { hardhat, sepolia } from "wagmi/chains";

/**
 * Wagmi / RainbowKit config for the admin dashboard only.
 * Citizens use the email-based, walletless flow (Phase 0.5) and must not
 * import this module.
 */
let adminConfig: Config | undefined;

export function getAdminWagmiConfig(): Config {
  if (adminConfig) {
    return adminConfig;
  }

  const projectId =
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ??
    // Placeholder so local builds work; set a real WalletConnect Cloud ID for admin auth.
    "00000000000000000000000000000000";

  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

  adminConfig = getDefaultConfig({
    appName: "civic-vote admin",
    projectId,
    chains: [hardhat, sepolia],
    transports: {
      [hardhat.id]: http(rpcUrl),
      [sepolia.id]: http(rpcUrl),
    },
    ssr: true,
  });

  return adminConfig;
}
