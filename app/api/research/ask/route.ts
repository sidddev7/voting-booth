import { partyAskSchema } from "@/lib/validation";
import {
  askPartyKnowledgeQuestion,
  streamPartyKnowledgeAnswer,
} from "@/lib/exa-party-ask";

/**
 * Real-time Q&A about a party, grounded in the curated knowledge base.
 * Streams plain-text answer chunks (Accept: text/plain) or returns JSON.
 */
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = partyAskSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { partyId, partyName, question } = parsed.data;
  const wantsStream =
    request.headers.get("accept")?.includes("text/plain") ||
    request.headers.get("accept")?.includes("text/event-stream");

  try {
    if (wantsStream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            for await (const chunk of streamPartyKnowledgeAnswer({
              partyId,
              partyName,
              question,
            })) {
              controller.enqueue(encoder.encode(chunk));
            }
            controller.close();
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Ask failed";
            controller.enqueue(encoder.encode(`\n\n[Error: ${message}]`));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    const answer = await askPartyKnowledgeQuestion({
      partyId,
      partyName,
      question,
    });
    return Response.json({ partyId, partyName, question, answer });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Party question failed";
    console.error("[api/research/ask]", message, error);

    if (message.includes("EXA_API_KEY")) {
      return Response.json({ error: message }, { status: 503 });
    }

    return Response.json({ error: message }, { status: 502 });
  }
}
