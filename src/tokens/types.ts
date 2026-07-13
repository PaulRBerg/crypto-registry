import type { Address } from "../address.js";

/** Discriminant for the {@link Token} union. */
export type TokenKind = "standard" | "stablecoin" | "wrapped" | "mirror";

/** Fields shared by every token, regardless of {@link TokenKind}. */
type TokenBase = {
  /** EIP-155 chain id the token is deployed on. */
  chainId: number;
  /** Lowercased contract address. */
  address: Address;
  /** Ticker symbol as reported on-chain, e.g. `"USDC"`. */
  symbol: string;
  /** Human-readable name, when known. */
  name?: string;
  /** ERC-20 `decimals()`. */
  decimals: number;
  /** CoinGecko coin id for pricing, when known. */
  coinGeckoId?: string;
  /** Discriminant. */
  kind: TokenKind;
};

/** A plain ERC-20 with no special semantics. */
export type StandardToken = TokenBase & {
  kind: "standard";
};

/** What a {@link Stablecoin} is pegged to. */
export type StablecoinPeg = "USD" | "EUR";

/** How a {@link Stablecoin} maintains its peg. */
export type StablecoinBacking = "fiat" | "crypto";

/** A token that targets a fixed value in a reference currency. */
export type Stablecoin = TokenBase & {
  kind: "stablecoin";
  /** Canonical accounting quote ticker for this stablecoin family. */
  family: string;
  /** The currency the token tracks. */
  peg: StablecoinPeg;
  /** Collateral type backing the peg. */
  backing: StablecoinBacking;
  /** `true` for canonically-bridged variants (e.g. `USDC.e`). */
  bridged: boolean;
  /** Issuing entity, e.g. `"Circle"`, when known. */
  issuer?: string;
};

/**
 * A canonical wrapper for a chain's native gas token (e.g. WETH wraps ETH,
 * WAVAX wraps AVAX). Only native wraps are classified as `wrapped`; bridged
 * assets and staking derivatives (WBTC, stETH, …) are {@link StandardToken}s.
 */
export type WrappedToken = TokenBase & {
  kind: "wrapped";
  /** Symbol of the wrapped native asset, e.g. `"ETH"` for WETH. */
  underlyingSymbol: string;
};

/**
 * What a {@link MirrorToken} mirrors: either the chain's native token, or
 * another asset identified by symbol (and optionally address).
 */
export type MirrorTarget = "native" | { symbol: string; address?: Address };

/**
 * An ERC-20-like contract that mirrors the native token (e.g. the POL
 * precompile at `0x…1010`), rather than wrapping it via deposit/withdraw.
 */
export type MirrorToken = TokenBase & {
  kind: "mirror";
  mirrors: MirrorTarget;
};

/** Any token in the registry. Discriminated by {@link TokenKind | kind}. */
export type Token = StandardToken | Stablecoin | WrappedToken | MirrorToken;

/** Narrow a {@link Token} to a {@link StandardToken}. */
export const isStandard = (token: Token): token is StandardToken => token.kind === "standard";

/** Narrow a {@link Token} to a {@link Stablecoin}. */
export const isStablecoin = (token: Token): token is Stablecoin => token.kind === "stablecoin";

/** Narrow a {@link Token} to a {@link WrappedToken}. */
export const isWrapped = (token: Token): token is WrappedToken => token.kind === "wrapped";

/** Narrow a {@link Token} to a {@link MirrorToken}. */
export const isMirror = (token: Token): token is MirrorToken => token.kind === "mirror";
