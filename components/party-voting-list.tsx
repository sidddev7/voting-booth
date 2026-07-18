"use client";

import { PartyInfoPanel } from "@/components/party-info-panel";
import type { Party } from "@/lib/election-types";

type PartyVotingListProps = {
  parties: Party[];
  selectedId: number | null;
  onSelect: (partyId: number) => void;
  disabled?: boolean;
};

export function PartyVotingList({
  parties,
  selectedId,
  onSelect,
  disabled,
}: PartyVotingListProps) {
  return (
    <ul className="flex flex-col gap-3" role="listbox" aria-label="Parties">
      {parties.map((party, index) => {
        const selected = selectedId === party.id;

        return (
          <li
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
            <div
              role="option"
              aria-selected={selected}
              tabIndex={disabled ? -1 : 0}
              onClick={() => {
                if (!disabled) onSelect(party.id);
              }}
              onKeyDown={(event) => {
                if (disabled) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(party.id);
                }
              }}
              className={[
                "pressable cursor-pointer rounded-2xl border bg-paper/90 p-4 shadow-[var(--shadow-sm)] outline-none transition-[border-color,box-shadow,background-color] duration-200 sm:p-5",
                selected
                  ? "border-seal bg-seal-soft/40 shadow-[var(--shadow-md)] ring-2 ring-seal/30"
                  : "border-line/80 hover:border-line-strong hover:bg-white",
                disabled ? "cursor-not-allowed opacity-60" : "",
              ].join(" ")}
            >
              <div className="flex items-start gap-4">
                <span
                  aria-hidden
                  className={[
                    "mt-0.5 grid h-12 w-12 shrink-0 place-items-center rounded-xl text-sm font-bold tracking-wide",
                    selected
                      ? "bg-seal text-white"
                      : "bg-ink/[0.06] text-ink",
                  ].join(" ")}
                >
                  {party.shortCode}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h3 className="font-display text-xl font-medium tracking-tight text-ink">
                      {party.name}
                    </h3>
                    {selected ? (
                      <span className="rounded-full bg-seal px-2.5 py-0.5 text-[0.65rem] font-semibold tracking-wide text-white uppercase">
                        Selected
                      </span>
                    ) : null}
                  </div>
                  {party.description ? (
                    <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                      {party.description}
                    </p>
                  ) : null}

                  <div
                    className="mt-3"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <PartyInfoPanel
                      partyId={party.id}
                      partyName={party.name}
                    />
                  </div>
                </div>

                <span
                  aria-hidden
                  className={[
                    "mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors duration-200",
                    selected
                      ? "border-seal bg-seal text-white"
                      : "border-line-strong bg-transparent",
                  ].join(" ")}
                >
                  {selected ? (
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
                      <path
                        d="M3.5 8.2 6.4 11l6.1-6.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
