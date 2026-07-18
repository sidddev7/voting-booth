import { AdminConnectButton } from "@/components/admin/connect-button";
import { BoothShell } from "@/components/booth-shell";
import { Container } from "@/components/container";
import { ElectionStatusBadge } from "@/components/election-status-badge";
import { DEMO_ELECTION } from "@/lib/demo-election";

export default function AdminPage() {
  const election = DEMO_ELECTION;

  return (
    <BoothShell withFooter={false}>
      <Container className="py-10 sm:py-14">
        <div className="mx-auto max-w-2xl">
          <div className="reveal">
            <p className="text-sm font-semibold tracking-wide text-ink-muted uppercase">
              Operator console
            </p>
            <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
              Admin
            </h1>
            <p className="mt-2 max-w-xl text-ink-muted">
              Connect the trusted operator wallet to manage parties, eligibility,
              and election lifecycle. Citizens use the email sign-in flow
              instead.
            </p>
          </div>

          <div className="reveal reveal-delay-1 mt-8 glass-panel rounded-[1.75rem] border border-white/70 p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-ink-muted">Current election</p>
                <p className="mt-1 font-display text-xl font-medium text-ink">
                  {election.title}
                </p>
              </div>
              <ElectionStatusBadge state={election.state} />
            </div>

            <div className="mt-6 border-t border-line/70 pt-6">
              <p className="mb-3 text-sm font-medium text-ink">
                Operator wallet
              </p>
              <AdminConnectButton />
            </div>

            <ul className="mt-8 grid gap-3 text-sm text-ink-muted sm:grid-cols-2">
              <AdminHint title="Parties">
                Add parties before voting opens. Ballot choices lock once Active.
              </AdminHint>
              <AdminHint title="Eligibility">
                Upload citizen emails. Tickets are signed at vote time.
              </AdminHint>
              <AdminHint title="Lifecycle">
                Start and close the election from this console.
              </AdminHint>
              <AdminHint title="Results">
                Live tallies sync from on-chain VoteCast events.
              </AdminHint>
            </ul>
          </div>
        </div>
      </Container>
    </BoothShell>
  );
}

function AdminHint({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="rounded-xl border border-line/60 bg-white/50 px-4 py-3">
      <p className="font-semibold text-ink">{title}</p>
      <p className="mt-1 leading-relaxed">{children}</p>
    </li>
  );
}
