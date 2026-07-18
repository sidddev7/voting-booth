# civic-vote

Civic voting app with on-chain contracts (Hardhat) and a Next.js frontend/API.

## Folder structure

```text
/contracts     Hardhat 3 project (Solidity, tests, Ignition)
/app           Next.js App Router pages
/app/admin     Admin dashboard (wallet auth via RainbowKit / wagmi)
/app/api       Next.js Route Handlers
/components    Shared React components
/lib           Shared utilities (ABI, viem, wagmi, db, exa, validation)
/db            Drizzle schema and migrations
```

## Stack notes

- **Citizen auth:** Privy (`@privy-io/react-auth`) lives in `app/providers.tsx` and is mounted from the root layout (email login + embedded wallet on Sepolia; enable Google/passkey in the Privy Dashboard before adding them to `loginMethods`).
- **Admin only:** `wagmi` (v2) + RainbowKit live in `app/admin/providers.tsx` and are mounted from `app/admin/layout.tsx` only (Sepolia).
- **Eligibility:** Backend EIP-712 tickets via `ADMIN_SIGNER_PRIVATE_KEY` (`lib/eligibility.ts`) after Postgres allowlist checks — not a precomputed Merkle tree. Election.sol will verify with `adminSigner` + ECDSA.recover.
- **Database:** `drizzle-orm` + `drizzle-kit` with the `pg` driver.
- **API validation:** `zod` (see `lib/validation.ts`).
- **Party research:** `exa-js` (see `lib/exa.ts` and `POST /api/research`).

## Getting started

### App

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

- Health: `/api/health`
- Admin (wallet): `/admin`

### Unit tests

Vitest covers shared lib helpers, seed builders, API health, and key UI components:

```bash
bun run test        # single run (Vitest)
bun run test:watch  # watch mode
```

PRs targeting `main` run the same suite via GitHub Actions (`.github/workflows/unit-tests.yml`).

### Database

```bash
bun run db:generate
bun run db:migrate
# or, for local prototyping:
bun run db:push
```

### Contracts

```bash
cd contracts
npm install
npm run compile
npm test
```

From the repo root:

```bash
bun run contracts:compile
bun run contracts:test
```

## Environment

Copy `.env.example` and fill in values:

```bash
cp .env.example .env.local
```

Admin wallet (Sepolia): `NEXT_PUBLIC_RPC_URL`, `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` (from [WalletConnect Cloud](https://cloud.walletconnect.com/)).

Party research (Exa + cached summaries): `EXA_API_KEY`, `DATABASE_URL`.

```bash
bun run db:migrate
bun run db:seed   # initial Learn-about summaries for all demo parties
```

Database: `DATABASE_URL` (Supabase Postgres).
