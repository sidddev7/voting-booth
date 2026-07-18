import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "contracts/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "lib/**/*.{ts,tsx}",
        "db/seed/**/*.ts",
        "components/**/*.{ts,tsx}",
      ],
      exclude: [
        "lib/index.ts",
        "lib/wagmi.ts",
        "lib/useCitizenSmartWallet.ts",
        "lib/privy-server.ts",
        "lib/db.ts",
        "lib/exa.ts",
        "lib/viem.ts",
        "lib/viemClient.ts",
      ],
    },
  },
});
