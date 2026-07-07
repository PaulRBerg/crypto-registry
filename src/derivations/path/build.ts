import { DerivationPathError, parsePath } from "./parse.js";
import type { DerivationPath, ParsedPath } from "./segment.js";
import { HARDENED_OFFSET } from "./segment.js";

/** The BIP-44 positional components, supplied as a contiguous prefix (`purpose` down to `addressIndex`). */
export type PathComponents = {
  readonly purpose?: number;
  readonly coinType?: number;
  readonly account?: number;
  readonly change?: number;
  readonly addressIndex?: number;
};

/** Which positional levels are hardened. Defaults to the standard BIP-44 layout. */
export type HardeningLayout = Record<keyof PathComponents, boolean>;

const ORDER = ["purpose", "coinType", "account", "change", "addressIndex"] as const;

/** Standard BIP-44 hardening: `purpose'`, `coinType'`, `account'`, then soft `change` and `addressIndex`. */
export const DEFAULT_HARDENING: HardeningLayout = {
  account: true,
  addressIndex: false,
  change: false,
  coinType: true,
  purpose: true,
};

/**
 * Build a path from BIP-44 components. The components must form a contiguous prefix; a gap (e.g. `coinType` without
 * `purpose`) throws {@link DerivationPathError}, as does any component outside `[0, 2^31)`.
 *
 * @example buildPath({ purpose: 44, coinType: 60, account: 0, change: 0, addressIndex: 3 }) // "m/44'/60'/0'/0/3"
 */
export function buildPath(
  components: PathComponents,
  hardeningLayout: HardeningLayout = DEFAULT_HARDENING
): DerivationPath {
  const parts: string[] = [];
  let ended = false;
  for (const field of ORDER) {
    const value = components[field];
    if (value === undefined) {
      ended = true;
      continue;
    }
    if (ended) {
      throw new DerivationPathError(
        "invalid-segment",
        `non-contiguous components: "${field}" follows a gap`
      );
    }
    if (!Number.isInteger(value) || value < 0 || value >= HARDENED_OFFSET) {
      throw new DerivationPathError(
        "invalid-segment",
        `component "${field}" out of range: ${value} (must be an integer in [0, 2^31))`
      );
    }
    parts.push(`${value}${hardeningLayout[field] ? "'" : ""}`);
  }
  return `m${parts.length > 0 ? `/${parts.join("/")}` : ""}` as DerivationPath;
}

/** Render a {@link ParsedPath} back to its canonical string, preserving each level's hardened flag. */
export function formatPath(parsed: ParsedPath): DerivationPath {
  const parts = parsed.segments.map((segment) => `${segment.index}${segment.hardened ? "'" : ""}`);
  return `m${parts.length > 0 ? `/${parts.join("/")}` : ""}` as DerivationPath;
}

/** Convert a parsed or string path into BIP-32 child indexes, with hardened levels carrying the hardened bit. */
export function toBip32Indexes(input: string | ParsedPath): readonly number[] {
  const parsed = typeof input === "string" ? parsePath(input) : input;
  return parsed.segments.map((segment) =>
    segment.hardened ? segment.index + HARDENED_OFFSET : segment.index
  );
}
