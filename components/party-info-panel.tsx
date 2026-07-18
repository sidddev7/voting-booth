"use client";

import { useEffect, useState, type FormEvent } from "react";

type PartyInfoPanelProps = {
  partyId: number;
  partyName: string;
};

type ResearchState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "ready";
      summary: string;
      bullets: string[];
      cached: boolean;
    }
  | { status: "error"; message: string };

type QaMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function PartyInfoPanel({ partyId, partyName }: PartyInfoPanelProps) {
  const [open, setOpen] = useState(false);
  const [research, setResearch] = useState<ResearchState>({ status: "idle" });
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<QaMessage[]>([]);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    setResearch({ status: "loading" });
    setMessages([]);
    setQuestion("");
    setAskError(null);

    async function load() {
      try {
        const res = await fetch("/api/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ partyId, partyName }),
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error("Unable to load party information right now.");
        }

        const data = (await res.json()) as {
          summary?: string;
          bullets?: string[];
          cached?: boolean;
        };

        const bullets = (data.bullets ?? [])
          .map((b) => b.trim())
          .filter(Boolean)
          .slice(0, 6);

        setResearch({
          status: "ready",
          summary:
            data.summary?.trim() ||
            "No summary is available for this party yet.",
          bullets,
          cached: Boolean(data.cached),
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        setResearch({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Unable to load party information.",
        });
      }
    }

    void load();

    return () => {
      controller.abort();
    };
  }, [open, partyId, partyName]);

  async function onAsk(event: FormEvent) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || asking) return;

    const userId = `u-${Date.now()}`;
    const assistantId = `a-${Date.now()}`;

    setAskError(null);
    setAsking(true);
    setQuestion("");
    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", content: trimmed },
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      const res = await fetch("/api/research/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/plain",
        },
        body: JSON.stringify({ partyId, partyName, question: trimmed }),
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(errBody?.error || "Unable to answer right now.");
      }

      if (!res.body) {
        throw new Error("No response stream from the assistant.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `${m.content}${chunk}` }
              : m,
          ),
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to answer right now.";
      setAskError(message);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId && !m.content
            ? { ...m, content: "Sorry — I could not answer that question." }
            : m,
        ),
      );
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="border-t border-line/70 pt-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`party-info-${partyId}`}
        onClick={() => setOpen((v) => !v)}
        className="pressable flex min-h-10 w-full cursor-pointer items-center justify-between gap-3 rounded-lg text-left text-sm font-medium text-seal-deep hover:text-seal"
      >
        <span>Learn about {partyName}</span>
        <Chevron open={open} />
      </button>

      {open ? (
        <div
          id={`party-info-${partyId}`}
          className="mt-3 space-y-4 text-sm text-ink-muted"
        >
          {research.status === "idle" || research.status === "loading" ? (
            <div className="space-y-2" aria-busy="true" aria-live="polite">
              <div className="h-3 w-11/12 animate-pulse rounded bg-line/50" />
              <div className="h-3 w-9/12 animate-pulse rounded bg-line/50" />
              <div className="h-3 w-10/12 animate-pulse rounded bg-line/50" />
            </div>
          ) : null}

          {research.status === "error" ? (
            <p role="alert" className="text-warn">
              {research.message}
            </p>
          ) : null}

          {research.status === "ready" ? (
            <>
              <p className="leading-relaxed text-ink">{research.summary}</p>

              {research.bullets.length > 0 ? (
                <ul className="list-disc space-y-2 pl-5">
                  {research.bullets.map((point) => (
                    <li key={point.slice(0, 48)}>{point}</li>
                  ))}
                </ul>
              ) : null}

              <div className="space-y-3 border-t border-line/60 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink">
                  Ask about {partyName}
                </p>

                {messages.length > 0 ? (
                  <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={
                          message.role === "user"
                            ? "rounded-lg bg-seal/10 px-3 py-2 text-ink"
                            : "rounded-lg bg-line/30 px-3 py-2 text-ink-muted whitespace-pre-wrap"
                        }
                      >
                        {message.content ||
                          (asking ? "Thinking…" : "")}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-ink-muted/90">
                    Examples: “What do they say about transit?” or “How do they
                    approach housing costs?”
                  </p>
                )}

                <form onSubmit={onAsk} className="flex gap-2">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder={`Ask a question about ${partyName}…`}
                    disabled={asking}
                    maxLength={500}
                    className="min-h-10 flex-1 rounded-lg border border-line bg-paper px-3 text-sm text-ink outline-none ring-seal/30 placeholder:text-ink-muted/70 focus:ring-2 disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={asking || question.trim().length < 3}
                    className="pressable min-h-10 shrink-0 rounded-lg bg-seal px-3 text-sm font-medium text-paper disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {asking ? "…" : "Ask"}
                  </button>
                </form>

                {askError ? (
                  <p role="alert" className="text-xs text-warn">
                    {askError}
                  </p>
                ) : null}
              </div>

              <p className="text-xs leading-relaxed text-ink-muted/90">
                Answers are grounded in this election’s party knowledge base
                (via Exa). Verify with official materials before voting.
              </p>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className={[
        "h-4 w-4 shrink-0 text-current transition-transform duration-200",
        open ? "rotate-180" : "",
      ].join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
