import { PrivyClient } from "@privy-io/node";
import { getAddress, isAddress } from "viem";

import type { User } from "@privy-io/node";

let client: PrivyClient | null = null;

/** Shared Privy server client. Requires PRIVY_APP_SECRET. */
export function getPrivyServerClient(): PrivyClient {
  if (client) return client;

  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;

  if (!appId || !appSecret || appSecret.includes("YOUR_")) {
    throw new Error(
      "PRIVY_APP_SECRET is not set. Copy the App Secret from the Privy Dashboard into .env.",
    );
  }

  client = new PrivyClient({
    appId,
    appSecret,
    jwtVerificationKey: process.env.PRIVY_VERIFICATION_KEY || undefined,
  });

  return client;
}

export type AuthenticatedCitizen = {
  userId: string;
  email: string | null;
  walletAddresses: string[];
};

/**
 * Verify a Privy access token, load the user, and collect wallet + email.
 */
export async function authenticateCitizen(
  accessToken: string,
): Promise<AuthenticatedCitizen> {
  const privy = getPrivyServerClient();
  const claims = await privy.utils().auth().verifyAccessToken(accessToken);
  const user = await privy.users()._get(claims.user_id);

  return {
    userId: claims.user_id,
    email: extractEmail(user),
    walletAddresses: extractWalletAddresses(user),
  };
}

function extractEmail(user: User): string | null {
  for (const account of user.linked_accounts ?? []) {
    if (account.type === "email" && "address" in account && account.address) {
      return account.address.toLowerCase();
    }
  }
  return null;
}

function extractWalletAddresses(user: User): string[] {
  const addresses: string[] = [];

  for (const account of user.linked_accounts ?? []) {
    if (
      (account.type === "wallet" || account.type === "smart_wallet") &&
      "address" in account &&
      typeof account.address === "string" &&
      isAddress(account.address)
    ) {
      addresses.push(getAddress(account.address));
    }
  }

  return [...new Set(addresses)];
}

export function citizenOwnsWallet(
  citizen: AuthenticatedCitizen,
  voterAddress: string,
): boolean {
  const normalized = getAddress(voterAddress);
  return citizen.walletAddresses.some((address) => address === normalized);
}
