import { CHAINS } from "./chains.js";
import type { Chain } from "./types.js";

const byId = new Map<number, Chain>(CHAINS.map((chain) => [chain.chainId, chain]));
const bySlug = new Map<string, Chain>(CHAINS.map((chain) => [chain.slug, chain]));

const normalizeName = (name: string): string => name.trim().toLowerCase();

const byName = new Map<string, Chain>();
for (const chain of CHAINS) {
  for (const name of [chain.name, chain.slug, ...chain.aliases]) {
    byName.set(normalizeName(name), chain);
  }
}

/** Every supported chain. */
export function allChains(): readonly Chain[] {
  return CHAINS;
}

/** Resolve a chain by its EIP-155 chain id. */
export function getChain(chainId: number): Chain | undefined {
  return byId.get(chainId);
}

/** Resolve a chain by its registry slug, e.g. `"arbitrum"`. */
export function getChainBySlug(slug: string): Chain | undefined {
  return bySlug.get(slug);
}

/**
 * Resolve a chain by name, slug, or alias (case-insensitive, trimmed).
 * E.g. `"Ethereum"`, `"eth"`, `"mainnet"` all resolve to Ethereum.
 */
export function getChainByName(name: string): Chain | undefined {
  return byName.get(normalizeName(name));
}
