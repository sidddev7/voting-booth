import Link from "next/link";

import { Container } from "@/components/container";

export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-auto border-t border-line/60 py-8">
      <Container className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-muted">
          Civic Vote · One citizen, one verified ballot.
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link
            href="/results"
            className="pressable text-ink-muted underline-offset-4 hover:text-ink hover:underline"
          >
            Public results
          </Link>
          <Link
            href="/login"
            className="pressable text-ink-muted underline-offset-4 hover:text-ink hover:underline"
          >
            Citizen sign-in
          </Link>
        </div>
      </Container>
    </footer>
  );
}
