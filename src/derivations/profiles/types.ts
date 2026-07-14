import type { DerivationPath, PathTemplate, RoleValues, Template } from "../path/index.js";
import type { Standard } from "../purposes.js";
import type { AddressKind, SignatureScheme } from "../schemes.js";
import type { XpubFamily } from "../slip132.js";

/**
 * Intrinsic metadata for one chain + standard. The `id` reuses the original profile slug; the `template` is the single
 * source of truth from which the path string and the recognizer are both derived.
 *
 * Explorer/RPC/wallet-UX glue (endpoints, ss58 prefixes, hrp, class hashes, ...) is deliberately excluded: if a field
 * changes when you swap explorer, RPC, or wallet, it does not belong here. Bitcoin output-descriptor kind/template
 * (see `../descriptors.js`) is the one exception: it is a pure function of `addressKind`, not a wallet or explorer
 * choice, so it is modeled separately rather than excluded.
 */
export type DerivationProfile = {
  /** Stable id, e.g. `bitcoin-bip84-native-segwit-account`. */
  readonly id: string;
  /** Primary ecosystem slug. */
  readonly chain: string;
  /** Every ecosystem that shares this exact shape (e.g. the Cosmos family). Always includes `chain`. */
  readonly ecosystems: readonly string[];
  /** Human label, e.g. `BIP84 Native Segwit`, `Ledger Live`. */
  readonly standardName: string;
  /** Machine slug for the standard. */
  readonly standard: Standard;
  /** SLIP-44 coin type. Always sourced from `COIN_TYPES`, never a magic number. */
  readonly coinType: number;
  /** Purpose (first level), or `null` when the path has no purpose level (Cardano Byron random). */
  readonly purpose: number | null;
  readonly scheme: SignatureScheme;
  readonly addressKind: AddressKind;
  /** The single source of truth: an ordered list of segments. */
  readonly template: Template;
  /** SLIP-132 xpub family (Bitcoin-family only). */
  readonly xpubFamily?: XpubFamily;
};

/** A {@link DerivationProfile} with its template pre-rendered, an example path, and a compiled matcher. */
export type ResolvedProfile = Omit<DerivationProfile, "template"> & {
  /** The raw segment list (the authored source of truth). */
  readonly segments: Template;
  /** The rendered placeholder string, e.g. `m/44'/0'/{account}'`. */
  readonly template: PathTemplate;
  /** A concrete example, with every variable bound to its minimum. */
  readonly examplePath: DerivationPath;
  /** The compiled recognizer regex. */
  readonly matcher: RegExp;
};

/** The result of recognizing a concrete path against the registry. */
export type Recognition = {
  readonly profileId: string;
  readonly standardName: string;
  readonly standard: Standard;
  readonly chain: string;
  readonly scheme: SignatureScheme;
  readonly coinType: number;
  /** The extracted variable values, e.g. `{ account: 0 }` or `{ index: 3 }`. */
  readonly values: RoleValues;
};
