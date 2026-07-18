import { headers } from "next/headers";
import type { ReactNode } from "react";
import { cookieToInitialState } from "wagmi";

import { Providers } from "@/app/providers";
import { getAdminWagmiConfig } from "@/lib/wagmi";

/**
 * Admin-only layout. Wallet providers are mounted here — not in the root layout —
 * so citizen-facing routes never load wagmi / RainbowKit.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieHeader = (await headers()).get("cookie");
  const initialState = cookieToInitialState(getAdminWagmiConfig(), cookieHeader);

  return <Providers initialState={initialState}>{children}</Providers>;
}
