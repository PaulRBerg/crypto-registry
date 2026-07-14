import type { TokenAddressAlias } from "./types.js";

/**
 * Verified historical contracts that emitted events for canonical tokens but
 * are not themselves callable token addresses.
 */
export const TOKEN_ADDRESS_ALIASES: readonly TokenAddressAlias[] = Object.freeze([
  {
    canonicalAddress: "0x57ab1ec28d129707052df4df418d58a2d46d5f51",
    chainId: 1,
    historicalAddress: "0x57ab1e02fee23774580c119740129eac7081e9d3",
    relationship: "historical_event_emitter",
  },
  {
    canonicalAddress: "0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f",
    chainId: 1,
    historicalAddress: "0xc011a72400e58ecd99ee497cf89e3775d4bd732f",
    relationship: "historical_event_emitter",
  },
]);
