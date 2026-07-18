"use client";

import { useState, useTransition, type FormEvent } from "react";

import type { Party } from "@/lib/election-types";

type OverrideState = "idle" | "pending" | "blocked";

type AdminVoteOverrideProps = {
  parties: Pick<Party, "id" | "name" | "shortCode" | "voteCount">[];
};

export function AdminVoteOverride({ parties }: AdminVoteOverrideProps) {
  const [partyId, setPartyId] = useState(String(parties[0]?.id ?? ""));
  const [voteCount, setVoteCount] = useState(
    String(parties[0]?.voteCount ?? 0),
  );
  const [state, setState] = useState<OverrideState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selected = parties.find((party) => String(party.id) === partyId);

  function selectParty(nextPartyId: string) {
    setPartyId(nextPartyId);
    const party = parties.find((entry) => String(entry.id) === nextPartyId);
    if (party) {
      setVoteCount(String(party.voteCount));
    }
    setState("idle");
    setMessage(null);
  }

  function tryOverride(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;

    const nextCount = Number(voteCount);
    if (!Number.isFinite(nextCount) || nextCount < 0) {
      setMessage("Enter a valid non-negative vote count.");
      setState("blocked");
      return;
    }

    startTransition(async () => {
      setState("pending");
      setMessage(null);

      try {
        const res = await fetch("/api/tamper-votes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            partyId: selected.id,
            partyName: selected.name,
            voteCount: nextCount,
          }),
        });
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;

        const error =
          body?.error ??
          "Override blocked. Vote tallies are immutable on-chain.";

        setMessage(error);
        setState("blocked");
      } catch {
        setMessage(
          "Override blocked. Vote tallies are stored on-chain and cannot be modified by an admin.",
        );
        setState("blocked");
      }
    });
  }

  const busy = state === "pending" || isPending;
  const unchanged =
    selected != null && Number(voteCount) === selected.voteCount;

  if (parties.length === 0) {
    return null;
  }

  return (
    <div className="reveal reveal-delay-4 mt-8 rounded-2xl border border-line/70 bg-paper/80 p-5 sm:p-6">
      <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
        Admin simulation
      </p>
      <h2 className="mt-1 font-display text-lg font-medium text-ink">
        Change a party’s vote count
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        Try rewriting a tally as an operator would. The request is rejected —
        ballots cannot be altered after they are recorded.
      </p>

      <form onSubmit={tryOverride} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-ink">Party</span>
            <select
              value={partyId}
              onChange={(event) => selectParty(event.target.value)}
              disabled={busy}
              className="mt-1.5 w-full cursor-pointer rounded-xl border border-line/80 bg-white px-3 py-2.5 text-ink disabled:cursor-not-allowed disabled:opacity-70"
            >
              {parties.map((party) => (
                <option key={party.id} value={party.id}>
                  {party.name} ({party.shortCode})
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="font-medium text-ink">New vote count</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={voteCount}
              onChange={(event) => {
                setVoteCount(event.target.value);
                setState("idle");
                setMessage(null);
              }}
              disabled={busy}
              className="tabular mt-1.5 w-full rounded-xl border border-line/80 bg-white px-3 py-2.5 text-ink disabled:cursor-not-allowed disabled:opacity-70"
            />
          </label>
        </div>

        {selected ? (
          <p className="text-sm text-ink-muted">
            Current on-chain tally for {selected.name}:{" "}
            <span className="tabular font-medium text-ink">
              {selected.voteCount.toLocaleString()}
            </span>
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy || unchanged || !selected}
          className="pressable inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-warn/40 bg-white/80 px-5 text-sm font-semibold text-warn hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {busy ? "Applying override…" : "Apply admin override"}
        </button>
      </form>

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
