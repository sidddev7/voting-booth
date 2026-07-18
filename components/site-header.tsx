import Link from "next/link";
import type { ReactNode } from "react";

import { Container } from "@/components/container";

type SiteHeaderProps = {
  action?: ReactNode;
};

export function SiteHeader({ action }: SiteHeaderProps) {
  return (
    <header className="relative z-20 pt-5 sm:pt-6">
      <Container>
        <div className="glass-panel flex items-center justify-between gap-4 rounded-2xl border border-white/70 px-4 py-3 sm:px-5">
          <Link
            href="/"
            className="group flex min-h-10 items-center gap-3 rounded-lg pressable"
          >
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-[0.7rem] font-semibold tracking-[0.14em] text-paper"
            >
              CV
            </span>
            <span className="font-display text-lg font-medium tracking-tight text-ink sm:text-xl">
              Civic Vote
            </span>
          </Link>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 sm:flex"
          >
            <NavLink href="/vote">Ballot</NavLink>
            <NavLink href="/results">Results</NavLink>
          </nav>

          <div className="flex items-center gap-2">{action}</div>
        </div>
      </Container>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="pressable inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium text-ink-muted hover:bg-white/60 hover:text-ink"
    >
      {children}
    </Link>
  );
}
