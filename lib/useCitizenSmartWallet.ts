"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";

/**
 * Citizen-facing smart wallet state for voting.
 *
 * Combines Privy auth readiness with the ERC-4337 smart account client so
 * pages can read the on-chain address and send sponsored UserOperations.
 *
 * Requires `SmartWalletsProvider` nested inside `PrivyProvider` (see
 * `app/providers.tsx`). If the client stays undefined after login, double-check
 * Privy Dashboard: Smart Wallets enabled, Sepolia, Kernel/ZeroDev, paymaster URL.
 */
export function useCitizenSmartWallet() {
  const { ready, authenticated, user } = usePrivy();
  const { client } = useSmartWallets();

  const linkedSmartWallet = user?.linkedAccounts.find(
    (account) => account.type === "smart_wallet",
  );

  const smartWalletAddress =
    user?.smartWallet?.address ?? linkedSmartWallet?.address ?? null;

  return {
    ready,
    authenticated,
    smartWalletAddress,
    smartWalletClient: client ?? null,
  };
}
