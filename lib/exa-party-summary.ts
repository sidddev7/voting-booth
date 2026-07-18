import { z } from "zod";

import type { PartySummarySource } from "@/db/schema";
import { getExa } from "@/lib/exa";
import {
  getPartySummaryTtlDays,
  upsertPartySummary,
  type PartySummaryDto,
  toPartySummaryDto,
} from "@/lib/party-summary";

const exaAnswerSchema = z.object({
  summary: z.string().min(1),
  bullets: z.array(z.string().min(1)).min(1).max(8),
});

const SYSTEM_PROMPT = `You are writing a neutral civic voter brief.
Use only publicly available information.
Do not tell the reader how to vote.
Do not invent policies. If information is thin, say so clearly.
Keep language plain and suitable for a ballot information panel.`;

export type GeneratedPartySummary = {
  summary: string;
  bullets: string[];
  sources: PartySummarySource[];
  exaRequestId?: string;
};

export async function generatePartySummaryWithExa(
  partyName: string,
): Promise<GeneratedPartySummary> {
  const exa = getExa();

  const result = await exa.answer(
    `For civic voters, summarize the political party or civic slate named "${partyName}".
Cover what they stand for, 3–5 key policy positions, and who they typically represent.
Stay neutral and factual.`,
    {
      model: "exa",
      systemPrompt: SYSTEM_PROMPT,
      outputSchema: {
        type: "object",
        required: ["summary", "bullets"],
        additionalProperties: false,
        properties: {
          summary: {
            type: "string",
            description:
              "2–4 short paragraphs of plain-English neutral overview",
          },
          bullets: {
            type: "array",
            minItems: 3,
            maxItems: 5,
            items: { type: "string" },
            description: "3–5 scannable key points",
          },
        },
      },
    },
  );

  const parsed = normalizeExaAnswer(result.answer, partyName);
  const sources = (result.citations ?? [])
    .filter((c) => typeof c.url === "string" && c.url.length > 0)
    .map((c) => ({
      title: (c.title && c.title.trim()) || c.url!,
      url: c.url!,
    }))
    .slice(0, 6);

  return {
    summary: parsed.summary,
    bullets: parsed.bullets,
    sources,
    exaRequestId: result.requestId,
  };
}

export function normalizeExaAnswer(
  answer: string | Record<string, unknown>,
  partyName: string,
): z.infer<typeof exaAnswerSchema> {
  if (typeof answer === "string") {
    const trimmed = answer.trim();
    return {
      summary: trimmed || `Limited public information was found for ${partyName}.`,
      bullets: [trimmed.slice(0, 240) || "See sources for available details."],
    };
  }

  const parsed = exaAnswerSchema.safeParse(answer);
  if (parsed.success) {
    return parsed.data;
  }

  const summary =
    typeof answer.summary === "string" && answer.summary.trim()
      ? answer.summary.trim()
      : `Limited public information was found for ${partyName}.`;

  const bullets = Array.isArray(answer.bullets)
    ? answer.bullets.filter(
        (b): b is string => typeof b === "string" && b.trim().length > 0,
      )
    : [];

  return {
    summary,
    bullets:
      bullets.length > 0
        ? bullets.slice(0, 5)
        : ["See sources below for available details."],
  };
}

export async function refreshAndCachePartySummary(
  partyId: number,
  partyName: string,
): Promise<PartySummaryDto> {
  const generated = await generatePartySummaryWithExa(partyName);
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + getPartySummaryTtlDays());

  const row = await upsertPartySummary({
    partyId,
    partyName,
    summary: generated.summary,
    bullets: generated.bullets,
    sources: generated.sources,
    exaRequestId: generated.exaRequestId ?? null,
    model: "exa",
    generatedAt: now,
    expiresAt,
  });

  return toPartySummaryDto(row, false);
}
