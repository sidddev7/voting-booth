import { Fraunces, Source_Sans_3 } from "next/font/google";
import type { Metadata } from "next";

import { Providers } from "@/app/providers";

import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Civic Vote",
    template: "%s · Civic Vote",
  },
  description:
    "Cast your ballot securely. One citizen, one vote — verified and countable.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${sourceSans.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
