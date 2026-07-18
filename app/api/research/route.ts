import { NextResponse } from "next/server";

import { getPartySummaryForRequest } from "@/lib/get-party-summary";
import { getCachedPartySummary, toPartySummaryDto } from "@/lib/party-summary";
import { partyResearchSchema } from "@/lib/validation";

/**
 * Learn-about-party summaries: Supabase cache / seed first, Exa on refresh.
 */
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = partyResearchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { partyId, partyName, forceRefresh } = parsed.data;

  try {
    const dto = await getPartySummaryForRequest({
      partyId,
      partyName,
      forceRefresh,
    });
    return NextResponse.json(dto);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Party research failed";
    console.error("[api/research]", message, error);

    if (
      message.includes("EXA_API_KEY") ||
      message.includes("DATABASE_URL")
    ) {
      return NextResponse.json({ error: message }, { status: 503 });
    }

    try {
      const fallback = await getCachedPartySummary(partyId);
      if (fallback) {
        return NextResponse.json(toPartySummaryDto(fallback, true));
      }
    } catch {
      // ignore secondary failure
    }

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
