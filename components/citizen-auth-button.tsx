"use client";

import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";

type CitizenAuthButtonProps = {
  compact?: boolean;
};

export function CitizenAuthButton({ compact }: CitizenAuthButtonProps) {
  const { ready, authenticated, login, logout, user } = usePrivy();

  if (!ready) {
    return (
      <span
        className="inline-flex h-10 min-w-24 animate-pulse rounded-xl bg-white/50"
        aria-hidden
      />
    );
  }

  if (authenticated) {
    const label =
      user?.email?.address?.split("@")[0] ??
      user?.google?.email?.split("@")[0] ??
      "Signed in";

    return (
      <div className="flex items-center gap-2">
        {!compact ? (
          <span className="hidden max-w-36 truncate text-sm text-ink-muted md:inline">
            {label}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => logout()}
          className="pressable inline-flex min-h-10 cursor-pointer items-center rounded-xl border border-line bg-white/70 px-3 text-sm font-medium text-ink hover:bg-white"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => login()}
      className="pressable inline-flex min-h-10 cursor-pointer items-center rounded-xl bg-ink px-4 text-sm font-semibold text-paper hover:bg-ink/90"
    >
      Sign in
    </button>
  );
}

export function CitizenAuthLink() {
  const { ready, authenticated } = usePrivy();

  if (!ready) return null;

  if (authenticated) {
    return (
      <Link
        href="/vote"
        className="pressable inline-flex min-h-10 items-center rounded-xl bg-seal px-4 text-sm font-semibold text-white hover:bg-seal-deep"
      >
        Open ballot
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="pressable inline-flex min-h-10 items-center rounded-xl bg-ink px-4 text-sm font-semibold text-paper hover:bg-ink/90"
    >
      Sign in
    </Link>
  );
}
