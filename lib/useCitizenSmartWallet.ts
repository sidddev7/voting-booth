"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";

/**
 * Citizen-facing wallet state for voting.
 *
 * Prefers the ERC-4337 smart account (gas-sponsored casts) when the Privy
 * smart-wallet client is ready. Otherwise uses the embedded EOA.
 *
 * Important: `useSendTransaction` can only sign with a Privy embedded wallet.
 * Never pass a smart-wallet address to `sendTransaction` — that throws
 * "Must have a Privy wallet before signing".
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

  const smartWalletClient = client ?? null;
  const canUseSmartWallet = Boolean(smartWalletClient && smartWalletAddress);

  /**
   * Address that will be `msg.sender` when casting.
   * Only use the smart account when its client is ready to submit UserOps.
   */
  const votingAddress = canUseSmartWallet
    ? smartWalletAddress
    : embeddedWalletAddress;

  return {
    ready,
    authenticated,
    smartWalletAddress,
    embeddedWalletAddress,
    votingAddress,
    hasSmartWallet: Boolean(smartWalletAddress),
    canUseSmartWallet,
    smartWalletClient,
  };
}
