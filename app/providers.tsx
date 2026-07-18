"use client";

import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { type State, WagmiProvider } from "wagmi";

import { getAdminWagmiConfig } from "@/lib/wagmi";

import "@rainbow-me/rainbowkit/styles.css";

type ProvidersProps = {
  children: ReactNode;
  initialState?: State;
};

/**
 * Wagmi + RainbowKit providers (Sepolia).
 *
 * Mount only from /app/admin — never from the root layout — so citizen pages
 * ship with zero wallet dependency in their bundle.
 */
export function Providers({ children, initialState }: ProvidersProps) {
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
