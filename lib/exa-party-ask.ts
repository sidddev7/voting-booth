import { buildPartyKnowledgeText } from "@/db/seed/party-knowledge";
import { getExa } from "@/lib/exa";
import { answerFromKnowledgeBase } from "@/lib/kb-answer";
import { getCachedPartySummary } from "@/lib/party-summary";

function buildSystemPrompt(partyName: string, knowledge: string): string {
  return `You are a neutral civic election assistant for voters.
Answer ONLY about the party named "${partyName}".
Use ONLY the knowledge base below. Do not invent policies or facts.
If the knowledge base does not contain enough information, say clearly that the election materials do not cover that topic.
Do not tell the voter how to vote.
Keep answers concise (2–5 short paragraphs or short bullets).

KNOWLEDGE BASE:
${knowledge}`;
}

async function resolveKnowledge(
  partyId: number,
  partyName: string,
): Promise<string> {
  const seeded = buildPartyKnowledgeText(partyId);
  if (seeded) {
    return seeded;
  }

  try {
    const cached = await getCachedPartySummary(partyId);
    if (cached) {
      const bullets = cached.bullets.map((b) => `- ${b}`).join("\n");
      return `Party: ${cached.partyName}\n\n${cached.summary}\n\nKey points:\n${bullets}`;
    }
  } catch {
    // fall through
  }

  return `Party: ${partyName}\nNo curated knowledge base entry is available yet.`;
}

function hasExaKey(): boolean {
  const key = process.env.EXA_API_KEY;
  return Boolean(key && !key.includes("YOUR_"));
}

/**
 * Stream a knowledge-grounded answer for a voter question about one party.
 * Yields plain text chunks for real-time UI updates.
 * Falls back to local KB matching when Exa is unavailable.
 */
export async function* streamPartyKnowledgeAnswer(input: {
  partyId: number;
  partyName: string;
  question: string;
}): AsyncGenerator<string> {
  if (!hasExaKey()) {
    const local = answerFromKnowledgeBase(
      input.partyId,
      input.partyName,
      input.question,
    );
    yield local ??
      `I do not have enough materials on ${input.partyName} to answer that yet.`;
    return;
  }

  try {
    const knowledge = await resolveKnowledge(input.partyId, input.partyName);
    const exa = getExa();
    const query = `Voter question about "${input.partyName}": ${input.question}`;

    let yielded = false;
    for await (const chunk of exa.streamAnswer(query, {
      model: "exa",
      systemPrompt: buildSystemPrompt(input.partyName, knowledge),
    })) {
      if (chunk.content) {
        yielded = true;
        yield chunk.content;
      }
    }

    if (!yielded) {
      const local = answerFromKnowledgeBase(
        input.partyId,
        input.partyName,
        input.question,
      );
      if (local) yield local;
    }
  } catch {
    const local = answerFromKnowledgeBase(
      input.partyId,
      input.partyName,
      input.question,
    );
    yield local ??
      `I could not reach the research service. Based on available materials for ${input.partyName}, please try a more specific question about their stated priorities.`;
  }
}

/** Non-streaming fallback. */
export async function askPartyKnowledgeQuestion(input: {
  partyId: number;
  partyName: string;
  question: string;
}): Promise<string> {
  let answer = "";
  for await (const chunk of streamPartyKnowledgeAnswer(input)) {
    answer += chunk;
  }
  return answer.trim();
}
