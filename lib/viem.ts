import { createPublicClient, http, type Chain } from "viem";
import { hardhat, sepolia } from "viem/chains";

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

function resolveChain(): Chain {
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? hardhat.id);

  if (chainId === sepolia.id) {
    return sepolia;
  }

  return hardhat;
}

export const publicClient = createPublicClient({
  chain: resolveChain(),
  transport: http(rpcUrl),
});
