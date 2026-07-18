import { NextResponse } from "next/server";

import { getExa } from "@/lib/exa";
import { partyResearchSchema } from "@/lib/validation";

/**
 * Party research via Exa. Validates input with Zod before calling the SDK.
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

  try {
    const exa = getExa();
    const result = await exa.search(parsed.data.query, {
      numResults: parsed.data.numResults,
      type: "auto",
      contents: {
        highlights: true,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Party research failed";

    if (message.includes("EXA_API_KEY")) {
      return NextResponse.json({ error: message }, { status: 503 });
    }

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
