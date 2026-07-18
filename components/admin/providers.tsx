"use client";

import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { type State, WagmiProvider } from "wagmi";

import { getAdminWagmiConfig } from "@/lib/wagmi";

import "@rainbow-me/rainbowkit/styles.css";

type AdminProvidersProps = {
  children: ReactNode;
  initialState?: State;
};

/**
 * Wallet providers for the admin dashboard only.
 * Do not mount this for citizen-facing routes.
 */
export function AdminProviders({ children, initialState }: AdminProvidersProps) {
  const [config] = useState(() => getAdminWagmiConfig());
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
