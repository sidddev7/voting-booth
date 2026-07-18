import type { Party } from "@/lib/election-types";

type ResultsBarsProps = {
  parties: Party[];
  totalVotes: number;
};

export function ResultsBars({ parties, totalVotes }: ResultsBarsProps) {
  const ranked = [...parties].sort((a, b) => b.voteCount - a.voteCount);
  const max = Math.max(...ranked.map((p) => p.voteCount), 1);

  return (
    <div className="space-y-5">
      {ranked.map((party, index) => {
        const pct =
          totalVotes > 0
            ? Math.round((party.voteCount / totalVotes) * 1000) / 10
            : 0;
        const width = `${Math.max((party.voteCount / max) * 100, 2)}%`;

        return (
          <div
            key={party.id}
            className={[
              "reveal",
              index === 0
                ? "reveal-delay-1"
                : index === 1
                  ? "reveal-delay-2"
                  : index === 2
                    ? "reveal-delay-3"
                    : "reveal-delay-4",
            ].join(" ")}
          >
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-medium text-ink">
                  {party.name}
                </p>
                <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  {party.shortCode}
                </p>
              </div>
              <div className="text-right">
                <p className="tabular text-lg font-semibold text-ink">
                  {party.voteCount.toLocaleString()}
                </p>
                <p className="tabular text-xs text-ink-muted">{pct}%</p>
              </div>
            </div>
            <div
              className="h-3 overflow-hidden rounded-full bg-ink/[0.06]"
              role="img"
              aria-label={`${party.name}: ${party.voteCount} votes, ${pct} percent`}
            >
              <div
                className="animate-bar h-full rounded-full bg-seal"
                style={{ width }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
