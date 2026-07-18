import { NextResponse } from "next/server";

import { getElectionResults } from "@/lib/get-election-results";

/** Live election snapshot for the ballot UI. */
export async function GET() {
  const election = await getElectionResults();

  if (!election) {
    return NextResponse.json(
      {
        error:
          "Election is not available. Deploy the contract and register parties.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json(election, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
