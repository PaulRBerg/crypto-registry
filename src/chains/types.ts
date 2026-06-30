import type { Address } from "../address.js";

/** The native gas/balance asset of a {@link Chain}. */
export type NativeCurrency = {
  /** Ticker symbol, e.g. `"ETH"`, `"POL"`, `"BNB"`. */
  symbol: string;
  /** Human-readable name, e.g. `"Ether"`. */
  name: string;
  /** Number of decimals; `18` for every supported EVM chain. */
  decimals: number;
  /** CoinGecko coin id for pricing the native asset, e.g. `"ethereum"`. */
  coinGeckoId: string;
};

/** Explorer URL templates. `{address}` / `{tx_hash}` are substituted by callers. */
export type ChainExplorer = {
  /** Address page template containing the `{address}` placeholder. */
  addressUrl: string;
  /** Transaction page template containing the `{tx_hash}` placeholder. */
  txUrl: string;
};

/** A supported EVM chain and the metadata this registry needs to describe it. */
export type Chain = {
  /** EIP-155 chain id. */
  chainId: number;
  /** Stable identifier; matches the evm-atlas chain slug. */
  slug: string;
  /** Display name, e.g. `"Ethereum"`. */
  name: string;
  /** Extra lookup names (tickers, legacy names) resolved by `getChainByName`. */
  aliases: readonly string[];
  /** The chain's native gas asset. */
  nativeCurrency: NativeCurrency;
  /** Canonical wrapped-native token address (e.g. WETH), when one exists. */
  wrappedNativeAddress?: Address;
  /**
   * ERC-20-like addresses that mirror the native token (e.g. the POL precompile
   * at `0x…1010`), as opposed to deposit/withdraw wrappers.
   */
  mirrorAddresses?: readonly Address[];
  /** CoinGecko asset-platform id for token contract lookups. */
  coinGeckoPlatformId?: string;
  /** Explorer URL templates. */
  explorer: ChainExplorer;
};
