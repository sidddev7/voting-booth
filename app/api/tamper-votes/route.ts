import { NextResponse } from "next/server";

type TamperBody = {
  partyId?: number;
  partyName?: string;
  voteCount?: number;
};

/**
 * Demo endpoint that always rejects attempts to alter tallies.
 * Vote counts live on-chain; this API has no write path to them.
 */
export async function POST(request: Request) {
  let body: TamperBody = {};

  try {
    body = (await request.json()) as TamperBody;
  } catch {
    body = {};
  }

  const partyLabel =
    typeof body.partyName === "string" && body.partyName.trim()
      ? body.partyName.trim()
      : typeof body.partyId === "number"
        ? `party #${body.partyId}`
        : "that party";

  const countLabel =
    typeof body.voteCount === "number" && Number.isFinite(body.voteCount)
      ? ` to ${body.voteCount}`
      : "";

  return NextResponse.json(
    {
      ok: false,
      error: `Admin override blocked for ${partyLabel}${countLabel}. Vote tallies are stored on-chain and cannot be modified by this app or any client request.`,
    },
    { status: 403 },
  );
}
