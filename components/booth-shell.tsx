import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

type BoothShellProps = {
  children: ReactNode;
  action?: ReactNode;
  withFooter?: boolean;
};

export function BoothShell({
  children,
  action,
  withFooter = true,
}: BoothShellProps) {
  return (
    <div className="booth-atmosphere relative flex min-h-full flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="booth-grid pointer-events-none absolute inset-0"
      />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-paper focus:px-3 focus:py-2 focus:text-sm focus:shadow-md"
      >
        Skip to main content
      </a>
      <SiteHeader action={action} />
      <main id="main" className="relative z-10 flex flex-1 flex-col">
        {children}
      </main>
      {withFooter ? <SiteFooter /> : null}
    </div>
  );
}
