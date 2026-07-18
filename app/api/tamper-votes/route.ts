import { NextResponse } from "next/server";

/**
 * Demo endpoint that always rejects attempts to alter tallies.
 * Vote counts live on-chain; this API has no write path to them.
 */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "Tampering blocked. Vote tallies are stored on-chain and cannot be modified by this app or any client request.",
    },
    { status: 403 },
  );
}
