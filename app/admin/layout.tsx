import { headers } from "next/headers";
import type { ReactNode } from "react";
import { cookieToInitialState } from "wagmi";

import { AdminProviders } from "@/app/admin/providers";
import { getAdminWagmiConfig } from "@/lib/wagmi";

/**
 * Admin-only layout. Wagmi / RainbowKit are mounted here — not in the root
 * layout — so citizen-facing routes never load those wallet libraries.
 * Root PrivyProvider (citizen auth) still wraps this layout from app/layout.tsx.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieHeader = (await headers()).get("cookie");
  const initialState = cookieToInitialState(getAdminWagmiConfig(), cookieHeader);

  return (
    <AdminProviders initialState={initialState}>{children}</AdminProviders>
  );
}
