export { counterAbi } from "./abi";
export { getDb } from "./db";
export { getExa } from "./exa";
export { partyResearchSchema, ethAddressSchema, z } from "./validation";
export { publicClient } from "./viem";

// Intentionally do not re-export wagmi/RainbowKit or Privy client hooks from
// this barrel. Import `@/lib/wagmi` only from /admin, and
// `@/lib/useCitizenSmartWallet` from client components that need citizen auth.
//
// Also do not re-export `@/lib/eligibility` here — it uses ADMIN_SIGNER_PRIVATE_KEY
// and must only be imported from server-side API routes.
