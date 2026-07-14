import { isAddress } from "../address.js";
import { TOKEN_ADDRESS_ALIASES } from "./aliases.js";
import { TOKENS, TOKENS_BY_CHAIN, TOKENS_BY_KEY, TOKENS_BY_SYMBOL, tokenKey } from "./registry.js";
import type {
  MirrorToken,
  Stablecoin,
  StandardToken,
  Token,
  TokenAddressAlias,
  TokenAddressResolution,
  WrappedToken,
} from "./types.js";
import { isMirror, isStablecoin, isStandard, isWrapped } from "./types.js";

const EMPTY: readonly Token[] = [];

/** Resolve a token by chain id and address (case-insensitive). */
export function getToken(chainId: number, address: string): Token | undefined {
  if (!isAddress(address)) return undefined;
  return TOKENS_BY_KEY.get(tokenKey(chainId, address));
}

const TOKEN_ADDRESS_ALIASES_BY_KEY: ReadonlyMap<string, TokenAddressAlias> = new Map(
  TOKEN_ADDRESS_ALIASES.map((alias) => [tokenKey(alias.chainId, alias.historicalAddress), alias])
);

/**
 * Resolve an exact canonical token or a verified historical event emitter.
 * The returned token is canonical in both cases; {@link getToken} remains
 * exact-only and never resolves aliases.
 */
export function resolveTokenAddress(
  chainId: number,
  address: string
): TokenAddressResolution | undefined {
  if (!isAddress(address)) return undefined;
  const key = tokenKey(chainId, address);
  const token = TOKENS_BY_KEY.get(key);
  if (token) return { relationship: "canonical", token };

  const alias = TOKEN_ADDRESS_ALIASES_BY_KEY.get(key);
  if (!alias) return undefined;
  const canonicalToken = TOKENS_BY_KEY.get(tokenKey(alias.chainId, alias.canonicalAddress));
  return canonicalToken
    ? { alias, relationship: alias.relationship, token: canonicalToken }
    : undefined;
}

/** All tokens on a given chain. */
export function getTokensByChain(chainId: number): readonly Token[] {
  return TOKENS_BY_CHAIN.get(chainId) ?? EMPTY;
}

/** All tokens sharing a symbol (case-insensitive), across every chain. */
export function getTokensBySymbol(symbol: string): readonly Token[] {
  return TOKENS_BY_SYMBOL.get(symbol.toUpperCase()) ?? EMPTY;
}

// Partition once at module load; freeze so callers can't mutate the shared arrays.
const STABLECOINS: Stablecoin[] = [];
const WRAPPED: WrappedToken[] = [];
const MIRRORS: MirrorToken[] = [];
const STANDARD: StandardToken[] = [];
for (const token of TOKENS) {
  if (isStablecoin(token)) STABLECOINS.push(token);
  else if (isWrapped(token)) WRAPPED.push(token);
  else if (isMirror(token)) MIRRORS.push(token);
  else if (isStandard(token)) STANDARD.push(token);
}
for (const list of [STABLECOINS, WRAPPED, MIRRORS, STANDARD]) Object.freeze(list);

/** Every stablecoin in the registry. */
export const getStablecoins = (): readonly Stablecoin[] => STABLECOINS;

/** Every wrapped-native token in the registry. */
export const getWrappedTokens = (): readonly WrappedToken[] => WRAPPED;

/** Every native-mirror token in the registry. */
export const getMirrorTokens = (): readonly MirrorToken[] => MIRRORS;

/** Every plain ERC-20 in the registry. */
export const getStandardTokens = (): readonly StandardToken[] => STANDARD;
