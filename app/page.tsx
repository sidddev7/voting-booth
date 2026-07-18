import Link from "next/link";

import { BoothShell } from "@/components/booth-shell";
import { CitizenAuthLink } from "@/components/citizen-auth-button";
import { Container } from "@/components/container";
import { ElectionStatusBadge } from "@/components/election-status-badge";
import { DEMO_ELECTION } from "@/lib/demo-election";

export default function HomePage() {
  return (
    <BoothShell action={<CitizenAuthLink />}>
      <section className="relative flex flex-1 flex-col justify-center py-16 sm:py-20 lg:py-24">
        <Container className="relative">
          <div className="max-w-2xl">
            <p className="reveal font-display text-5xl leading-[1.05] font-medium tracking-tight text-ink sm:text-6xl lg:text-7xl">
              Civic Vote
            </p>

            <h1 className="reveal reveal-delay-1 mt-6 max-w-xl text-2xl font-medium tracking-tight text-ink sm:text-3xl">
              Cast your ballot. Counted once. Verifiable always.
            </h1>

            <p className="reveal reveal-delay-2 mt-4 max-w-md text-base leading-relaxed text-ink-muted sm:text-lg">
              Sign in with email, review the parties, and submit a
              single private ballot — no wallet app required.
            </p>

            <div className="reveal reveal-delay-3 mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="pressable inline-flex min-h-12 cursor-pointer items-center rounded-2xl bg-seal px-6 text-base font-semibold text-white shadow-[var(--shadow-md)] hover:bg-seal-deep"
              >
                Enter voting booth
              </Link>
              <Link
                href="/results"
                className="pressable inline-flex min-h-12 cursor-pointer items-center rounded-2xl border border-line bg-white/70 px-6 text-base font-semibold text-ink hover:bg-white"
              >
                View results
              </Link>
            </div>

            <div className="reveal reveal-delay-4 mt-10 flex flex-wrap items-center gap-3">
              <ElectionStatusBadge state={DEMO_ELECTION.state} />
              <span className="text-sm text-ink-muted">
                {DEMO_ELECTION.title}
                {DEMO_ELECTION.closesAtLabel
                  ? ` · ${DEMO_ELECTION.closesAtLabel}`
                  : null}
              </span>
            </div>
          </div>
        </Container>
      </section>
    </BoothShell>
  );
}
