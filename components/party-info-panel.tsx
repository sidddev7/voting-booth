"use client";

import { useEffect, useState } from "react";

type PartyInfoPanelProps = {
  partyId: number;
  partyName: string;
};

type ResearchState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "ready";
      points: string[];
      sources: { title: string; url: string }[];
    }
  | { status: "error"; message: string };

export function PartyInfoPanel({ partyId, partyName }: PartyInfoPanelProps) {
  const [open, setOpen] = useState(false);
  const [research, setResearch] = useState<ResearchState>({ status: "idle" });

  useEffect(() => {
    if (!open || research.status !== "idle") return;

    let cancelled = false;

    async function load() {
      setResearch({ status: "loading" });
      try {
        const res = await fetch("/api/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `${partyName} official platform policies manifesto`,
            numResults: 4,
          }),
        });

        if (!res.ok) {
          throw new Error("Unable to load party information right now.");
        }

        const data = (await res.json()) as {
          results?: {
            title?: string;
            url?: string;
            highlights?: string[];
          }[];
        };

        const results = data.results ?? [];
        const points = results
          .flatMap((r) => r.highlights ?? [])
          .map((h) => h.trim())
          .filter(Boolean)
          .slice(0, 5);

        const sources = results
          .filter((r) => r.title && r.url)
          .map((r) => ({ title: r.title!, url: r.url! }))
          .slice(0, 4);

        if (cancelled) return;

        setResearch({
          status: "ready",
          points:
            points.length > 0
              ? points
              : [
                  "No recent summarized highlights were returned. Check the sources below or official party materials.",
                ],
          sources,
        });
      } catch (error) {
        if (cancelled) return;
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
      cancelled = true;
    };
  }, [open, partyName, research.status]);

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
          className="mt-3 space-y-3 text-sm text-ink-muted"
        >
          {research.status === "loading" ? (
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
              <ul className="list-disc space-y-2 pl-5">
                {research.points.map((point) => (
                  <li key={point.slice(0, 48)}>{point}</li>
                ))}
              </ul>

              {research.sources.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink">
                    Sources
                  </p>
                  <ul className="space-y-1.5">
                    {research.sources.map((source) => (
                      <li key={source.url}>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pressable text-seal underline-offset-2 hover:underline"
                        >
                          {source.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <p className="text-xs leading-relaxed text-ink-muted/90">
                Information gathered from public web sources via Exa AI. Verify
                with official party materials before voting.
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
