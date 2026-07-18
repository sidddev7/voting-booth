import { headers } from "next/headers";
import type { ReactNode } from "react";
import { cookieToInitialState } from "wagmi";

import { AdminProviders } from "@/components/admin/providers";
import { getAdminWagmiConfig } from "@/lib/wagmi";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieHeader = (await headers()).get("cookie");
  const initialState = cookieToInitialState(getAdminWagmiConfig(), cookieHeader);

  return <AdminProviders initialState={initialState}>{children}</AdminProviders>;
}
