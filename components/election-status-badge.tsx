import type { ElectionState } from "@/lib/election-types";
import { electionStateLabel } from "@/lib/demo-election";

const styles: Record<ElectionState, string> = {
  NotStarted: "bg-white/70 text-ink-muted border-line",
  Registration: "bg-seal-soft text-seal-deep border-seal/20",
  Active: "bg-seal-soft text-seal-deep border-seal/25",
  Closed: "bg-ink/5 text-ink-muted border-line",
};

type ElectionStatusBadgeProps = {
  state: ElectionState;
  className?: string;
};

export function ElectionStatusBadge({
  state,
  className,
}: ElectionStatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase",
        styles[state],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {state === "Active" ? (
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full bg-seal animate-pulse-ring"
        />
      ) : null}
      {electionStateLabel(state)}
    </span>
  );
}
