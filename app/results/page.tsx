import Link from "next/link";
import type { Metadata } from "next";

import { BoothShell } from "@/components/booth-shell";
import { CitizenAuthLink } from "@/components/citizen-auth-button";
import { Container } from "@/components/container";
import { ElectionStatusBadge } from "@/components/election-status-badge";
import { ResultsBars } from "@/components/results-bars";
import { electionAddress } from "@/lib/contracts/config";
import { DEMO_ELECTION } from "@/lib/demo-election";
import { getElectionResults } from "@/lib/get-election-results";

export const metadata: Metadata = {
  title: "Results",
  description: "Live public tallies for the Civic Vote election.",
};

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const onChain = await getElectionResults();
  // Demo only when no contract address is configured. If the address is set
  // but parties aren't registered yet, show an on-chain setup empty state.
  const usingDemo = !electionAddress && !onChain;
  const election = onChain ?? (usingDemo ? DEMO_ELECTION : null);
  const hasResults = Boolean(election && election.parties.length > 0);
  const awaitingSetup = Boolean(electionAddress && !onChain);

  return (
    <BoothShell action={<CitizenAuthLink />}>
      <Container className="py-10 sm:py-14">
        <div className="mx-auto max-w-2xl">
          <div className="reveal mb-8">
            {hasResults && election ? (
              <div className="flex flex-wrap items-center gap-3">
                <ElectionStatusBadge state={election.state} />
                {election.state === "Active" ? (
                  <span className="text-sm text-ink-muted">
                    {usingDemo
                      ? "Demo tallies — configure the election contract for live on-chain results."
                      : "Results update as ballots are cast."}
                  </span>
                ) : null}
              </div>
            ) : null}
            <h1
              className={[
                "font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl",
                hasResults ? "mt-4" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              Public results
            </h1>
            {hasResults && election ? (
              <p className="mt-2 text-ink-muted">{election.title}</p>
            ) : null}
          </div>

          {hasResults && election ? (
            <>
              <div className="reveal reveal-delay-1 mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Stat
                  label="Total ballots"
                  value={election.totalVotes.toLocaleString()}
                />
                <Stat label="Parties" value={String(election.parties.length)} />
                <Stat
                  label="Leading"
                  value={
                    [...election.parties].sort(
                      (a, b) => b.voteCount - a.voteCount,
                    )[0]?.shortCode ?? "—"
                  }
                  className="col-span-2 sm:col-span-1"
                />
              </div>

              <div className="reveal reveal-delay-2 glass-panel rounded-[1.75rem] border border-white/70 p-6 sm:p-8">
                <ResultsBars
                  parties={election.parties}
                  totalVotes={election.totalVotes}
                />
              </div>

              <div className="reveal reveal-delay-3 mt-6 overflow-hidden rounded-2xl border border-line/70 bg-paper/80">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">
                    Vote totals by party with percentages
                  </caption>
                  <thead className="border-b border-line/70 bg-ink/[0.03] text-xs tracking-wide text-ink-muted uppercase">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Party
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Votes
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Share
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...election.parties]
                      .sort((a, b) => b.voteCount - a.voteCount)
                      .map((party) => {
                        const pct =
                          election.totalVotes > 0
                            ? Math.round(
                                (party.voteCount / election.totalVotes) * 1000,
                              ) / 10
                            : 0;
                        return (
                          <tr
                            key={party.id}
                            className="border-b border-line/50 last:border-0"
                          >
                            <th
                              scope="row"
                              className="px-4 py-3 font-medium text-ink"
                            >
                              {party.name}{" "}
                              <span className="text-ink-muted">
                                ({party.shortCode})
                              </span>
                            </th>
                            <td className="tabular px-4 py-3 text-ink">
                              {party.voteCount.toLocaleString()}
                            </td>
                            <td className="tabular px-4 py-3 text-ink-muted">
                              {pct}%
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="reveal reveal-delay-1 glass-panel rounded-[1.75rem] border border-white/70 px-6 py-12 text-center sm:px-8">
              <p className="font-display text-xl font-medium text-ink">
                {awaitingSetup ? "Election not opened yet" : "No poll results"}
              </p>
              <p className="mt-2 text-sm text-ink-muted">
                {awaitingSetup
                  ? "The contract is deployed, but parties aren’t registered and voting hasn’t started. Run the admin setup (setAdminSigner → addParty → startElection)."
                  : "Results will appear here once the election contract is configured and parties are registered on-chain."}
              </p>
            </div>
          )}

          <div className="reveal reveal-delay-4 mt-8 flex flex-wrap items-center gap-4 text-sm">
            {electionAddress ? (
              <a
                href={`https://sepolia.etherscan.io/address/${electionAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="pressable font-medium text-seal underline-offset-2 hover:underline"
              >
                Verify results on-chain
              </a>
            ) : (
              <p className="text-ink-muted">
                On-chain verification link appears once the election contract is
                configured.
              </p>
            )}
            <Link
              href="/vote"
              className="pressable font-medium text-ink underline-offset-2 hover:underline"
            >
              Go to ballot
            </Link>
          </div>
        </div>
      </Container>
    </BoothShell>
  );
}

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-2xl border border-white/70 bg-paper/80 px-4 py-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
        {label}
      </p>
      <p className="tabular mt-1 font-display text-2xl font-medium text-ink">
        {value}
      </p>
    </div>
  );
}
