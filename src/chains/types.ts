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

/**
 * An earlier native gas asset of a {@link Chain}. The era ends (exclusive) at
 * `untilUtc`, the activation instant of the hardfork that replaced the asset.
 */
export type FormerNativeCurrency = {
  /** Ticker symbol, e.g. `"frxETH"`. */
  symbol: string;
  /** CoinGecko coin id for pricing the former native asset. */
  coinGeckoId: string;
  /** Era end (exclusive), ISO 8601 UTC. */
  untilUtc: string;
  /** Wrapped-native token address during this era, when one existed. */
  wrappedNativeAddress?: Address;
};

/** Explorer URL templates. `{address}` / `{tx_hash}` are substituted by callers. */
export type ChainExplorer = {
  /** Address page template containing the `{address}` placeholder. */
  addressUrl: string;
  /** Transaction page template containing the `{tx_hash}` placeholder. */
  txUrl: string;
};

/**
 * Account semantics relevant to activity discovery for a mnemonic-derived EVM
 * address.
 *
 * `ethereum-eoa` means that the derived address is an Ethereum-style EOA for
 * this purpose. It does not mean the chain lacks smart-contract accounts,
 * ERC-4337, or EIP-7702. The other values identify protocol-native account
 * abstraction, activity shared with another execution environment, or a model
 * that has not been verified.
 *
 * Consumers may enable EOA-specific activity shortcuts only for the exact
 * `ethereum-eoa` value. Treat every other (and any future) value as unsafe by
 * default.
 */
export type AccountActivityModel =
  | "ethereum-eoa"
  | "native-account-abstraction"
  | "cross-vm"
  | "unknown";

/** A supported EVM chain and the metadata this registry needs to describe it. */
export type Chain = {
  /** EIP-155 chain id. */
  chainId: number;
  /** Stable identifier; matches the evm-atlas chain slug. */
  slug: string;
  /** Display name, e.g. `"Ethereum"`. */
  name: string;
  /** Account semantics governing safe activity-discovery shortcuts. */
  accountActivityModel: AccountActivityModel;
  /** Extra lookup names (tickers, legacy names) resolved by `getChainByName`. */
  aliases: readonly string[];
  /** The chain's native gas asset. */
  nativeCurrency: NativeCurrency;
  /** Earlier native gas assets, oldest first (e.g. Fraxtal's frxETH era). */
  formerNativeCurrencies?: readonly FormerNativeCurrency[];
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
