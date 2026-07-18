"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { SmartWalletsProvider } from "@privy-io/react-auth/smart-wallets";
import { type ReactNode } from "react";
import { sepolia } from "viem/chains";

type ProvidersProps = {
  children: ReactNode;
};

/**
 * Root Privy provider for citizen auth (email / passkey / Google) with
 * automatic embedded wallet creation on first login (Sepolia).
 *
 * `SmartWalletsProvider` is nested so citizen pages can use
 * `useCitizenSmartWallet` / `useSmartWallets` for sponsored txs.
 *
 * Mounted from the root layout so all citizen-facing pages can use Privy.
 * Admin still mounts its own wagmi / RainbowKit providers under /admin.
 */
export function Providers({ children }: ProvidersProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    throw new Error(
      "Missing NEXT_PUBLIC_PRIVY_APP_ID. Set it in .env.local from the Privy dashboard.",
    );
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email", "passkey", "google"],
        // ethereum.createOnLogin is the current SDK shape for auto-wallet creation
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        defaultChain: sepolia,
        supportedChains: [sepolia],
      }}
    >
      <SmartWalletsProvider>{children}</SmartWalletsProvider>
    </PrivyProvider>
  );
}
