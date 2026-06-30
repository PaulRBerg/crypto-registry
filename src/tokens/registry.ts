import { MIRROR_TOKENS } from "./data/mirrors.js";
import { STABLECOINS } from "./data/stablecoins.js";
import { STANDARD_TOKENS } from "./data/standard.js";
import { WRAPPED_TOKENS } from "./data/wrapped.js";
import type { Token } from "./types.js";

/** Every token in the registry, across all kinds and chains. */
export const TOKENS: readonly Token[] = Object.freeze([
  ...STABLECOINS,
  ...WRAPPED_TOKENS,
  ...MIRROR_TOKENS,
  ...STANDARD_TOKENS,
]);

const tokenKey = (chainId: number, address: string): string =>
  `${chainId}:${address.toLowerCase()}`;

/** Group TOKENS by a derived key; each bucket is frozen so callers can't mutate the index. */
function groupTokens<K>(keyOf: (token: Token) => K): ReadonlyMap<K, readonly Token[]> {
  const map = new Map<K, Token[]>();
  for (const token of TOKENS) {
    const k = keyOf(token);
    const list = map.get(k);
    if (list) {
      list.push(token);
    } else {
      map.set(k, [token]);
    }
  }
  for (const list of map.values()) Object.freeze(list);
  return map;
}

/** Index by `${chainId}:${lowercaseAddress}` for O(1) exact lookup. */
export const TOKENS_BY_KEY: ReadonlyMap<string, Token> = new Map(
  TOKENS.map((token) => [tokenKey(token.chainId, token.address), token])
);

/** Index by chain id. */
export const TOKENS_BY_CHAIN: ReadonlyMap<number, readonly Token[]> = groupTokens(
  (token) => token.chainId
);

/** Index by uppercased symbol (case-insensitive); one symbol maps to many tokens. */
export const TOKENS_BY_SYMBOL: ReadonlyMap<string, readonly Token[]> = groupTokens((token) =>
  token.symbol.toUpperCase()
);

export { tokenKey };
