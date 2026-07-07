/**
 * Core path vocabulary: branded path strings, BIP-44 segment roles, and the structured view of a parsed path.
 */

/** A concrete, fully-bound derivation path, e.g. `m/44'/60'/0'/0/0`. */
export type DerivationPath = string & { readonly __brand: "DerivationPath" };

/** A path with `{role}` placeholders for its variable levels, e.g. `m/44'/60'/0'/0/{index}`. */
export type PathTemplate = string & { readonly __brand: "PathTemplate" };

/**
 * The hardened-index offset (`0x80000000`, i.e. `2^31`). Every path level's numeric component must be strictly below
 * it: a value at or above this offset would collide with the hardened bit, so it is rejected when parsing, building, or
 * recognizing a path.
 */
export const HARDENED_OFFSET = 2 ** 31;

/** The largest valid derivation path index before the hardened bit is set. */
export const MAX_DERIVATION_INDEX = HARDENED_OFFSET - 1;

/**
 * The positional roles of a BIP-44 style path (`m / purpose' / coinType' / account' / change / addressIndex`),
 * plus the generic `index` leaf used by chains that vary the final level (EVM, Starknet).
 */
export const SEGMENT_ROLES = [
  "purpose",
  "coinType",
  "account",
  "change",
  "addressIndex",
  "index",
] as const;

export type Role = (typeof SEGMENT_ROLES)[number];

/** A single level of a parsed path: its numeric index and whether it is hardened. */
export type PathSegment = {
  readonly index: number;
  readonly hardened: boolean;
};

/** The structured, positional view returned by {@link parsePath}. */
export type ParsedPath = {
  readonly path: DerivationPath;
  readonly depth: number;
  readonly segments: readonly PathSegment[];
  readonly purpose?: number;
  readonly coinType?: number;
  readonly account?: number;
  readonly change?: number;
  readonly addressIndex?: number;
};
