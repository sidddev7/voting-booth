"use client";

import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { BoothShell } from "@/components/booth-shell";
import { Container } from "@/components/container";

export default function LoginPage() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) {
      router.replace("/vote");
    }
  }, [ready, authenticated, router]);

  return (
    <BoothShell withFooter={false}>
      <Container className="flex flex-1 flex-col justify-center py-16 sm:py-20">
        <div className="mx-auto w-full max-w-md">
          <div className="reveal glass-panel rounded-[1.75rem] border border-white/70 p-7 sm:p-9">
            <p className="font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
              Civic Vote
            </p>
            <h1 className="mt-3 text-xl font-medium text-ink">
              Sign in to cast your ballot
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted sm:text-base">
              Use your email to continue. Your ballot stays private and can
              only be cast once.
            </p>

            <button
              type="button"
              disabled={!ready || authenticated}
              onClick={() => login()}
              className="pressable mt-8 inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-2xl bg-seal text-base font-semibold text-white hover:bg-seal-deep disabled:cursor-not-allowed disabled:opacity-60"
            >
              {!ready
                ? "Loading…"
                : authenticated
                  ? "Redirecting…"
                  : "Continue"}
            </button>

            <p className="mt-5 text-center text-sm text-ink-muted">
              Just browsing?{" "}
              <Link
                href="/results"
                className="pressable font-medium text-seal underline-offset-2 hover:underline"
              >
                View public results
              </Link>
            </p>
          </div>

          <p className="reveal reveal-delay-2 mt-6 text-center text-xs leading-relaxed text-ink-muted">
            By continuing you confirm you are an eligible voter for this
            election.
          </p>
        </div>
      </Container>
    </BoothShell>
  );
}
