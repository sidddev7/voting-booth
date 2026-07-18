"use client";

import {
  useCreateWallet,
  usePrivy,
  useSendTransaction,
} from "@privy-io/react-auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import type { Hex } from "viem";

import { BoothShell } from "@/components/booth-shell";
import { CitizenAuthButton } from "@/components/citizen-auth-button";
import { Container } from "@/components/container";
import { ElectionStatusBadge } from "@/components/election-status-badge";
import { PartyVotingList } from "@/components/party-voting-list";
import { electionAddress } from "@/lib/contracts/config";
import { electionAbi } from "@/lib/contracts/electionAbi";
import { encodeCastVoteCalldata } from "@/lib/contracts/encodeCastVote";
import type { ElectionSnapshot } from "@/lib/election-types";
import { useCitizenSmartWallet } from "@/lib/useCitizenSmartWallet";
import { publicClient } from "@/lib/viem";

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
  const { sendTransaction } = useSendTransaction();
  const { createWallet } = useCreateWallet();
  const {
    ready: walletReady,
    votingAddress,
    hasSmartWallet,
    canUseSmartWallet,
    smartWalletClient,
    embeddedWalletAddress,
  } = useCitizenSmartWallet();

  const [election, setElection] = useState<ElectionSnapshot | null>(null);
  const [electionLoading, setElectionLoading] = useState(true);
  const [electionError, setElectionError] = useState<string | null>(null);
  const [flow, setFlow] = useState<FlowStep>("ballot");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const votedLocally = useHasVotedLocally(votingAddress);
  const [votedOnChain, setVotedOnChain] = useState(false);

  const voted = votedLocally || votedOnChain;
  const selectedParty = election?.parties.find((p) => p.id === selectedId);

  useEffect(() => {
    if (privyReady && !authenticated) {
      router.replace("/login");
    }
  }, [privyReady, authenticated, router]);

  useEffect(() => {
    let cancelled = false;

    async function loadElection() {
      setElectionLoading(true);
      setElectionError(null);
      try {
        const res = await fetch("/api/election");
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(body?.error ?? "Could not load election");
        }
        const data = (await res.json()) as ElectionSnapshot;
        if (!cancelled) setElection(data);
      } catch (error) {
        if (!cancelled) {
          setElection(null);
          setElectionError(
            error instanceof Error ? error.message : "Could not load election",
          );
        }
      } finally {
        if (!cancelled) setElectionLoading(false);
      }
    }

    void loadElection();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!votingAddress || !electionAddress) {
      setVotedOnChain(false);
      return;
    }

    const address = electionAddress;
    const voter = votingAddress as `0x${string}`;
    let cancelled = false;

    async function checkHasVoted() {
      try {
        const already = await publicClient.readContract({
          address,
          abi: electionAbi,
          functionName: "hasVoted",
          args: [voter],
        });
        if (!cancelled) setVotedOnChain(Boolean(already));
      } catch {
        if (!cancelled) setVotedOnChain(false);
      }
    }

    void checkHasVoted();
    return () => {
      cancelled = true;
    };
  }, [votingAddress]);

  const bootstrapping =
    !privyReady ||
    electionLoading ||
    (authenticated && !walletReady);

  const electionActive = election?.state === "Active";

  const showBallot =
    authenticated &&
    walletReady &&
    !electionLoading &&
    electionActive &&
    !voted &&
    (flow === "ballot" || flow === "confirm" || flow === "submitting");

  function beginConfirm(partyId: number) {
    setSelectedId(partyId);
    setFlow("confirm");
    setErrorMessage(null);
  }

  function castBallot() {
    if (selectedId === null) return;

    const partyId = selectedId;

    startTransition(async () => {
      setFlow("submitting");
      setErrorMessage(null);
      setTxHash(null);

      try {
        const accessToken = await getAccessToken();
        if (!accessToken) {
          throw new Error("Session expired. Please sign in again.");
        }

        // Smart-wallet client → UserOp from smart account.
        // Otherwise → embedded EOA via sendTransaction (create wallet if needed).
        let voter: string | null = null;

        if (canUseSmartWallet && smartWalletClient) {
          voter = votingAddress;
        } else {
          voter = embeddedWalletAddress;
          if (!voter) {
            const created = await createWallet();
            voter = created.address;
          }
        }

        if (!voter) {
          throw new Error(
            "Must have a Privy wallet before signing. Sign out and back in, or enable Embedded wallets in the Privy Dashboard.",
          );
        }

        const ticketRes = await fetch("/api/eligibility-ticket", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ voterAddress: voter }),
        });

        const ticketBody = (await ticketRes.json().catch(() => null)) as {
          signature?: Hex;
          error?: string;
        } | null;

        if (!ticketRes.ok || !ticketBody?.signature) {
          throw new Error(
            ticketBody?.error ?? "Could not issue an eligibility ticket.",
          );
        }

        const { to, data } = encodeCastVoteCalldata(
          BigInt(partyId),
          ticketBody.signature,
        );

        let hash: Hex;

        if (canUseSmartWallet && smartWalletClient) {
          hash = await smartWalletClient.sendTransaction({
            to,
            data,
            value: BigInt(0),
          });
        } else {
          const result = await sendTransaction(
            {
              to,
              data,
              value: BigInt(0),
              chainId: 11155111,
            },
            {
              address: voter,
              uiOptions: { showWalletUIs: true },
            },
          );
          hash = result.hash;
        }

        await publicClient.waitForTransactionReceipt({ hash });

        setTxHash(hash);
        markVotedLocally(voter, partyId);
        setVotedOnChain(true);
        setFlow("success");
      } catch (error) {
        console.error("[castBallot]", error);
        setErrorMessage(formatCastError(error));
        setFlow("error");
      }
    });
  }

  return (
    <BoothShell action={<CitizenAuthButton />}>
      <Container className="py-10 sm:py-14">
        <div className="mx-auto max-w-2xl">
          <div className="reveal mb-8">
            {election ? (
              <div className="flex flex-wrap items-center gap-3">
                <ElectionStatusBadge state={election.state} />
                {election.closesAtLabel ? (
                  <span className="text-sm text-ink-muted">
                    {election.closesAtLabel}
                  </span>
                ) : null}
              </div>
            ) : null}
            <h1 className="mt-4 font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
              {election?.title ?? "Ballot"}
            </h1>
            <p className="mt-2 text-ink-muted">
              Choose one party. You can review information before you submit —
              your choice cannot be changed after casting.
            </p>
          </div>

          {bootstrapping ? (
            <LoadingPanel message="Setting up your secure voting account…" />
          ) : null}

          {!bootstrapping && electionError ? (
            <StatusPanel
              title="Election unavailable"
              body={electionError}
              actionHref="/results"
              actionLabel="View results"
            />
          ) : null}

          {authenticated && election && election.state !== "Active" ? (
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

          {authenticated &&
          electionActive &&
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
              {txHash ? (
                <p className="mt-3 text-sm text-ink-muted">
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-seal underline-offset-2 hover:underline"
                  >
                    View transaction on Etherscan
                  </a>
                </p>
              ) : null}
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

          {showBallot && election ? (
            <div className="space-y-6">
              {!canUseSmartWallet ? (
                <p
                  role="status"
                  className="rounded-xl border border-line/70 bg-paper/80 px-4 py-3 text-sm text-ink-muted"
                >
                  {hasSmartWallet
                    ? "Your smart wallet isn’t ready to submit yet — casting with your embedded wallet. It needs a little Sepolia ETH for gas, or finish Smart Wallet / paymaster setup in Privy for sponsored votes."
                    : "Using your embedded wallet. It needs a little Sepolia ETH for gas, or enable Smart Wallets in the Privy Dashboard for sponsored votes."}
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
                        ? "Submitting on-chain…"
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

function formatCastError(error: unknown): string {
  const message =
    error instanceof Error ? error.message : "Could not record your ballot.";

  if (message.includes("PRIVY_APP_SECRET")) {
    return "Server is missing PRIVY_APP_SECRET. Add it from the Privy Dashboard.";
  }
  if (message.includes("Must have a Privy wallet before signing")) {
    return "Your Privy wallet isn’t ready yet. Tap Return to ballot, wait a moment, then try again — or sign out and back in so an embedded wallet can be created.";
  }
  if (message.includes("User rejected") || message.includes("rejected")) {
    return "Transaction was cancelled.";
  }
  if (message.includes("insufficient funds") || message.includes("gas")) {
    return "Not enough Sepolia ETH for gas. Fund your wallet or enable Smart Wallets with a paymaster.";
  }
  if (message.includes("AlreadyVoted") || message.includes("already voted")) {
    return "This wallet has already voted on-chain.";
  }
  if (message.includes("eligible voter")) {
    return message;
  }

  return message.length > 180
    ? "We couldn’t record your ballot. Please try again in a moment."
    : message;
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
