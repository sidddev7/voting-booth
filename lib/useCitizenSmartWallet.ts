"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";

/**
 * Citizen-facing wallet state for voting.
 *
 * Prefers the ERC-4337 smart account (gas-sponsored casts). Falls back to the
 * Privy embedded EOA when Smart Wallets are not yet provisioned — common when
 * the Privy Dashboard has Smart Wallets disabled or misconfigured (Sepolia,
 * Kernel/ZeroDev, paymaster URL).
 */
export function useCitizenSmartWallet() {
  const { ready, authenticated, user } = usePrivy();
  const { client } = useSmartWallets();

  const linkedSmartWallet = user?.linkedAccounts.find(
    (account) => account.type === "smart_wallet",
  );

  const linkedEmbeddedWallet = user?.linkedAccounts.find(
    (account) =>
      account.type === "wallet" &&
      "walletClientType" in account &&
      account.walletClientType === "privy",
  );

  const smartWalletAddress =
    user?.smartWallet?.address ?? linkedSmartWallet?.address ?? null;

  const embeddedWalletAddress =
    (linkedEmbeddedWallet && "address" in linkedEmbeddedWallet
      ? linkedEmbeddedWallet.address
      : null) ??
    user?.wallet?.address ??
    null;

  /** Prefer smart account; fall back so the UI is not blocked on dashboard setup. */
  const votingAddress = smartWalletAddress ?? embeddedWalletAddress;

  return {
    ready,
    authenticated,
    smartWalletAddress,
    embeddedWalletAddress,
    votingAddress,
    hasSmartWallet: Boolean(smartWalletAddress),
    smartWalletClient: client ?? null,
  };
}
