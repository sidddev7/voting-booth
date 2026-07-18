import { NextResponse } from "next/server";

import { isEmailAllowlisted } from "@/lib/allowlist";
import { electionAddress } from "@/lib/contracts/config";
import { signEligibilityTicket } from "@/lib/eligibility";
import {
  authenticateCitizen,
  citizenOwnsWallet,
} from "@/lib/privy-server";
import { eligibilityTicketSchema } from "@/lib/validation";

/**
 * Issues an EIP-712 eligibility ticket for the caller's voting wallet.
 *
 * Auth: Bearer Privy access token
 * Body: { voterAddress }
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const accessToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Missing Authorization Bearer token" },
      { status: 401 },
    );
  }

  if (!electionAddress) {
    return NextResponse.json(
      {
        error:
          "NEXT_PUBLIC_ELECTION_ADDRESS is not set. Deploy Election before requesting tickets.",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = eligibilityTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { voterAddress } = parsed.data;

  try {
    const citizen = await authenticateCitizen(accessToken);

    if (!citizenOwnsWallet(citizen, voterAddress)) {
      return NextResponse.json(
        {
          error:
            "voterAddress is not linked to the authenticated Privy user.",
        },
        { status: 403 },
      );
    }

    const allowed = await isEmailAllowlisted(citizen.email);
    if (!allowed) {
      return NextResponse.json(
        {
          error:
            "You are not on the eligible voter list for this election.",
        },
        { status: 403 },
      );
    }

    const signature = await signEligibilityTicket(
      voterAddress,
      electionAddress,
    );

    return NextResponse.json({
      signature,
      voterAddress,
      votingContract: electionAddress,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to issue eligibility ticket";

    if (message.includes("PRIVY_APP_SECRET") || message.includes("ADMIN_SIGNER")) {
      return NextResponse.json({ error: message }, { status: 503 });
    }

    if (
      message.toLowerCase().includes("token") ||
      message.toLowerCase().includes("unauthorized") ||
      message.toLowerCase().includes("jwt")
    ) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    console.error("[eligibility-ticket]", error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
