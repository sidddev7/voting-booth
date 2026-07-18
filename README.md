# civic-vote

Civic voting app with on-chain contracts (Hardhat) and a Next.js frontend/API.

## Folder structure

```text
/contracts     Hardhat 3 project (Solidity, tests, Ignition)
/app           Next.js App Router pages
/app/api       Next.js Route Handlers
/components    Shared React components
/lib           Shared utilities (ABI, viem client, db client)
/db            Database schema and SQL migrations
```

## Getting started

### App

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

Health check: [http://localhost:3000/api/health](http://localhost:3000/api/health).

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

Copy and adjust as needed:

```bash
# App / chain
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_CHAIN_ID=31337

# Database
DATABASE_URL=postgres://user:password@localhost:5432/civic_vote
```
