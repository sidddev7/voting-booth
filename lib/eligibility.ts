import {
  type Address,
  type Hex,
  getAddress,
  isHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

/**
 * EIP-712 typed-data for eligibility tickets.
 *
 * Election.sol (next phase) must use the same domain + typehash and verify with
 * ECDSA.recover against `adminSigner` — not a Merkle proof. Tickets are signed
 * only after the backend confirms the citizen is on the Postgres allowlist, for
 * their post-login smart wallet address.
 *
 * Server-side only: never import this module from client components.
 */

export const ELIGIBILITY_TICKET_PRIMARY_TYPE = "EligibilityTicket" as const;

export const ELIGIBILITY_TICKET_TYPES = {
  EligibilityTicket: [
    { name: "voter", type: "address" },
    { name: "contract", type: "address" },
  ],
} as const;

export function getEligibilityTicketDomain(contractAddress: Address) {
  const chainId = Number(
    process.env.NEXT_PUBLIC_CHAIN_ID ?? sepolia.id,
  );

  return {
    name: "CivicVote",
    version: "1",
    chainId,
    verifyingContract: contractAddress,
  } as const;
}

function getAdminSignerPrivateKey(): Hex {
  const key = process.env.ADMIN_SIGNER_PRIVATE_KEY;

  if (!key) {
    throw new Error(
      "ADMIN_SIGNER_PRIVATE_KEY is not set. Configure a Sepolia keypair used only for signing eligibility tickets.",
    );
  }

  const normalized = key.startsWith("0x") ? key : `0x${key}`;

  if (!isHex(normalized) || normalized.length !== 66) {
    throw new Error(
      "ADMIN_SIGNER_PRIVATE_KEY must be a 32-byte hex private key (with or without 0x).",
    );
  }

  return normalized;
}

function getAdminSignerAccount() {
  return privateKeyToAccount(getAdminSignerPrivateKey());
}

/** Public address of the backend eligibility signer (store as Election.adminSigner). */
export function getAdminSignerAddress(): Address {
  return getAdminSignerAccount().address;
}

/**
 * Sign an EIP-712 eligibility ticket for a voter's smart wallet address.
 *
 * Call only after verifying the citizen is on the approved Postgres list.
 */
export async function signEligibilityTicket(
  voterAddress: string,
  contractAddress: string,
): Promise<Hex> {
  const voter = getAddress(voterAddress);
  const contract = getAddress(contractAddress);
  const account = getAdminSignerAccount();

  return account.signTypedData({
    domain: getEligibilityTicketDomain(contract),
    types: ELIGIBILITY_TICKET_TYPES,
    primaryType: ELIGIBILITY_TICKET_PRIMARY_TYPE,
    message: {
      voter,
      contract,
    },
  });
}
