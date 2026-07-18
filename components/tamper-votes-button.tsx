"use client";

import { useState, useTransition } from "react";

type TamperState = "idle" | "pending" | "blocked";

export function TamperVotesButton() {
  const [state, setState] = useState<TamperState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function tryTamper() {
    startTransition(async () => {
      setState("pending");
      setMessage(null);

      try {
        const res = await fetch("/api/tamper-votes", { method: "POST" });
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;

        const error =
          body?.error ??
          "Tampering blocked. Vote tallies are immutable on-chain.";

        setMessage(error);
        setState("blocked");
      } catch {
        setMessage(
          "Tampering blocked. Vote tallies are stored on-chain and cannot be modified.",
        );
        setState("blocked");
      }
    });
  }

  const busy = state === "pending" || isPending;

  return (
    <div className="reveal reveal-delay-4 mt-8 rounded-2xl border border-line/70 bg-paper/80 p-5 sm:p-6">
      <h2 className="font-display text-lg font-medium text-ink">
        Integrity check
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        Attempt a fake tally rewrite. The request is rejected — ballots cannot
        be altered after they are recorded.
      </p>

      <button
        type="button"
        onClick={tryTamper}
        disabled={busy}
        className="pressable mt-4 inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-warn/40 bg-white/80 px-5 text-sm font-semibold text-warn hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {busy ? "Attempting…" : "Try to tamper votes"}
      </button>

      {message ? (
        <p
          role="alert"
          aria-live="assertive"
          className="mt-4 rounded-xl border border-warn/25 bg-warn/5 px-4 py-3 text-sm text-warn"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
