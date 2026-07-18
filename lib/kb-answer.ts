import { buildPartyKnowledgeText } from "@/db/seed/party-knowledge";

/**
 * Lightweight offline answer from the curated knowledge base when Exa is
 * unavailable. Prefers sentence overlap with the question terms.
 */
export function answerFromKnowledgeBase(
  partyId: number,
  partyName: string,
  question: string,
): string | null {
  const knowledge = buildPartyKnowledgeText(partyId);
  if (!knowledge) return null;

  const terms = tokenize(question).filter((t) => t.length > 2);
  const sentences = knowledge
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40);

  if (sentences.length === 0) {
    return knowledge.slice(0, 600);
  }

  const scored = sentences
    .map((sentence) => {
      const lower = sentence.toLowerCase();
      const score = terms.reduce(
        (sum, term) => (lower.includes(term) ? sum + 1 : sum),
        0,
      );
      return { sentence, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return (
      `Based on the ${partyName} election materials, here is the available overview:\n\n` +
      knowledge.split("\n\n").slice(0, 2).join("\n\n")
    );
  }

  const top = scored.slice(0, 4).map((s) => s.sentence);
  return top.join(" ");
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}
