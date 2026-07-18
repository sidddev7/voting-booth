"use client";

import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";

import { BoothShell } from "@/components/booth-shell";
import { CitizenAuthButton } from "@/components/citizen-auth-button";
import { Container } from "@/components/container";
import { ElectionStatusBadge } from "@/components/election-status-badge";
import { PartyVotingList } from "@/components/party-voting-list";
import { DEMO_ELECTION } from "@/lib/demo-election";
import { useCitizenSmartWallet } from "@/lib/useCitizenSmartWallet";

type FlowStep = "ballot" | "confirm" | "submitting" | "success" | "error";

const VOTED_EVENT = "civic-vote:voted-changed";

function votedStorageKey(address: string) {
  return `civic-vote:voted:${address}`;
}

function subscribeVoted(onStoreChange: () => void) {
  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener(VOTED_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(VOTED_EVENT, handler);
  };
}

function useHasVotedLocally(address: string | null): boolean {
  return useSyncExternalStore(
    subscribeVoted,
    () =>
      Boolean(
        address &&
          window.localStorage.getItem(votedStorageKey(address)) === "1",
      ),
    () => false,
  );
}

function markVotedLocally(address: string, partyId: number) {
  window.localStorage.setItem(votedStorageKey(address), "1");
  window.localStorage.setItem(
    `civic-vote:choice:${address}`,
    String(partyId),
  );
  window.dispatchEvent(new Event(VOTED_EVENT));
}

export default function VotePage() {
  const router = useRouter();
  const { ready: privyReady, authenticated, getAccessToken } = usePrivy();
  const {
    ready: walletReady,
    votingAddress,
    hasSmartWallet,
  } = useCitizenSmartWallet();

  const [flow, setFlow] = useState<FlowStep>("ballot");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const voted = useHasVotedLocally(votingAddress);

  const election = DEMO_ELECTION;
  const selectedParty = election.parties.find((p) => p.id === selectedId);

  useEffect(() => {
    if (privyReady && !authenticated) {
      router.replace("/login");
    }
  }, [privyReady, authenticated, router]);

  const bootstrapping = !privyReady || (authenticated && !walletReady);

  const showBallot =
    authenticated &&
    walletReady &&
    election.state === "Active" &&
    Boolean(votingAddress) &&
    !voted &&
    (flow === "ballot" || flow === "confirm" || flow === "submitting");

  const missingWallet =
    authenticated &&
    walletReady &&
    election.state === "Active" &&
    !votingAddress &&
    !voted &&
    flow !== "success";

  function beginConfirm(partyId: number) {
    setSelectedId(partyId);
    setFlow("confirm");
    setErrorMessage(null);
  }

  function castBallot() {
    if (selectedId === null || !votingAddress) return;

    startTransition(async () => {
      setFlow("submitting");
      setErrorMessage(null);

      try {
        // Placeholder for Phase 7 wiring:
        // 1) getAccessToken → POST /api/eligibility-ticket
        // 2) encodeCastVoteCalldata → smartWalletClient.sendTransaction
        await getAccessToken();
        await new Promise((resolve) => setTimeout(resolve, 1400));

        markVotedLocally(votingAddress, selectedId);
        setFlow("success");
      } catch {
        setErrorMessage(
          "We couldn’t record your ballot. Please try again in a moment.",
        );
        setFlow("error");
      }
    });
  }

  return (
    <BoothShell action={<CitizenAuthButton />}>
      <Container className="py-10 sm:py-14">
        <div className="mx-auto max-w-2xl">
          <div className="reveal mb-8">
            <div className="flex flex-wrap items-center gap-3">
              <ElectionStatusBadge state={election.state} />
              {election.closesAtLabel ? (
                <span className="text-sm text-ink-muted">
                  {election.closesAtLabel}
                </span>
              ) : null}
            </div>
            <h1 className="mt-4 font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
              {election.title}
            </h1>
            <p className="mt-2 text-ink-muted">
              Choose one party. You can review information before you submit —
              your choice cannot be changed after casting.
            </p>
          </div>

          {bootstrapping ? (
            <LoadingPanel message="Setting up your secure voting account…" />
          ) : null}

          {authenticated && election.state !== "Active" ? (
            <StatusPanel
              title={
                election.state === "Closed"
                  ? "Voting is closed"
                  : "Voting isn’t open yet"
              }
              body="You can still view the public tally while the election is prepared or after it ends."
              actionHref="/results"
              actionLabel="View results"
            />
          ) : null}

          {missingWallet ? (
            <div className="reveal glass-panel rounded-[1.75rem] border border-warn/25 p-7 sm:p-9">
              <h2 className="font-display text-2xl font-medium text-ink">
                Voting account unavailable
              </h2>
              <p className="mt-2 text-ink-muted">
                You’re signed in, but Privy didn’t create a wallet for this
                session. In the Privy Dashboard, confirm{" "}
                <strong className="font-semibold text-ink">
                  Embedded wallets
                </strong>{" "}
                are on, and for gas-sponsored votes also enable{" "}
                <strong className="font-semibold text-ink">Smart Wallets</strong>{" "}
                (Sepolia, Kernel/ZeroDev, paymaster URL).
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="pressable mt-6 inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-ink px-5 text-sm font-semibold text-paper hover:bg-ink/90"
              >
                Try again
              </button>
            </div>
          ) : null}

          {authenticated &&
          election.state === "Active" &&
          voted &&
          flow !== "success" ? (
            <StatusPanel
              title="You’ve already voted"
              body="Your ballot was recorded for this election. Thank you for participating."
              actionHref="/results"
              actionLabel="See live results"
            />
          ) : null}

          {flow === "success" ? (
            <div className="reveal glass-panel rounded-[1.75rem] border border-seal/20 p-7 sm:p-9">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-seal text-white">
                <CheckIcon />
              </div>
              <h2 className="mt-5 font-display text-2xl font-medium text-ink">
                Your vote has been recorded
              </h2>
              <p className="mt-2 text-ink-muted">
                {selectedParty
                  ? `Ballot cast for ${selectedParty.name} (${selectedParty.shortCode}).`
                  : "Your ballot was accepted."}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/results"
                  className="pressable inline-flex min-h-11 items-center rounded-xl bg-seal px-5 text-sm font-semibold text-white hover:bg-seal-deep"
                >
                  View results
                </Link>
                <Link
                  href="/"
                  className="pressable inline-flex min-h-11 items-center rounded-xl border border-line bg-white/80 px-5 text-sm font-semibold text-ink hover:bg-white"
                >
                  Back home
                </Link>
              </div>
            </div>
          ) : null}

          {flow === "error" ? (
            <div className="reveal glass-panel rounded-[1.75rem] border border-warn/20 p-7">
              <h2 className="font-display text-2xl font-medium text-ink">
                Something went wrong
              </h2>
              <p role="alert" className="mt-2 text-warn">
                {errorMessage}
              </p>
              <button
                type="button"
                onClick={() => setFlow("ballot")}
                className="pressable mt-6 inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-ink px-5 text-sm font-semibold text-paper hover:bg-ink/90"
              >
                Return to ballot
              </button>
            </div>
          ) : null}

          {showBallot ? (
            <div className="space-y-6">
              {!hasSmartWallet ? (
                <p
                  role="status"
                  className="rounded-xl border border-line/70 bg-paper/80 px-4 py-3 text-sm text-ink-muted"
                >
                  Demo mode: using your embedded wallet. For sponsored on-chain
                  votes, enable Smart Wallets in the Privy Dashboard (Sepolia +
                  paymaster).
                </p>
              ) : null}

              <PartyVotingList
                parties={election.parties}
                selectedId={selectedId}
                onSelect={beginConfirm}
                disabled={flow === "submitting" || isPending}
              />

              {flow === "confirm" || flow === "submitting" ? (
                <div
                  className="reveal glass-panel sticky bottom-4 rounded-2xl border border-white/70 p-4 shadow-[var(--shadow-lg)] sm:p-5"
                  role="region"
                  aria-label="Confirm ballot"
                >
                  <p className="text-sm text-ink-muted">
                    You are about to cast your ballot for
                  </p>
                  <p className="mt-1 font-display text-xl font-medium text-ink">
                    {selectedParty?.name}{" "}
                    <span className="text-base text-ink-muted">
                      ({selectedParty?.shortCode})
                    </span>
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={flow === "submitting" || isPending}
                      onClick={castBallot}
                      className="pressable inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-xl bg-seal px-5 text-sm font-semibold text-white hover:bg-seal-deep disabled:cursor-not-allowed disabled:opacity-70 sm:flex-none"
                    >
                      {flow === "submitting"
                        ? "Recording your vote securely…"
                        : "Confirm and cast ballot"}
                    </button>
                    <button
                      type="button"
                      disabled={flow === "submitting" || isPending}
                      onClick={() => {
                        setFlow("ballot");
                        setSelectedId(null);
                      }}
                      className="pressable inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-line bg-white/80 px-5 text-sm font-semibold text-ink hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Change choice
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </Container>
    </BoothShell>
  );
}

function LoadingPanel({ message }: { message: string }) {
  return (
    <div
      className="glass-panel rounded-[1.75rem] border border-white/70 p-8"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-seal/30 border-t-seal" />
        <p className="text-ink-muted">{message}</p>
      </div>
      <div className="mt-6 space-y-3">
        <div className="h-20 animate-pulse rounded-2xl bg-line/40" />
        <div className="h-20 animate-pulse rounded-2xl bg-line/40" />
        <div className="h-20 animate-pulse rounded-2xl bg-line/40" />
      </div>
    </div>
  );
}

function StatusPanel({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string;
  body: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="reveal glass-panel rounded-[1.75rem] border border-white/70 p-7 sm:p-9">
      <h2 className="font-display text-2xl font-medium text-ink">{title}</h2>
      <p className="mt-2 text-ink-muted">{body}</p>
      <Link
        href={actionHref}
        className="pressable mt-6 inline-flex min-h-11 items-center rounded-xl bg-ink px-5 text-sm font-semibold text-paper hover:bg-ink/90"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
      <path
        d="M5 12.5 9.5 17 19 7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
