import type { DerivationPath, ParsedPath, PathSegment } from "./segment.js";
import { HARDENED_OFFSET } from "./segment.js";

export type DerivationPathErrorCode = "empty" | "missing-master" | "invalid-segment";

/** A typed parse failure carrying a machine-readable {@link DerivationPathErrorCode}. */
export class DerivationPathError extends Error {
  readonly code: DerivationPathErrorCode;

  constructor(code: DerivationPathErrorCode, message: string) {
    super(message);
    this.name = "DerivationPathError";
    this.code = code;
  }
}

export type SafeParseResult =
  | { readonly success: true; readonly data: ParsedPath }
  | { readonly success: false; readonly error: DerivationPathError };

const SEGMENT_PATTERN = /^(\d+)(['hH])?$/u;

/** The positional BIP-44 field for each of the first five levels. */
const POSITIONAL_FIELDS = ["purpose", "coinType", "account", "change", "addressIndex"] as const;

const parseSegment = (token: string): PathSegment => {
  const groups = SEGMENT_PATTERN.exec(token);
  if (groups === null) {
    throw new DerivationPathError("invalid-segment", `invalid path level "${token}"`);
  }
  const index = Number.parseInt(groups[1], 10);
  if (index >= HARDENED_OFFSET) {
    throw new DerivationPathError(
      "invalid-segment",
      `path level out of range: "${token}" (must be below 2^31)`
    );
  }
  return { hardened: groups[2] !== undefined, index };
};

/**
 * Parse a derivation path into a structured, positional view. Hardened markers `'`, `h`, and `H` are all accepted and
 * normalized to a boolean flag. Throws {@link DerivationPathError} on malformed input, including any level at or above
 * the hardened offset (`2^31`).
 *
 * @example parsePath("m/44'/60'/0'/0/0") // { purpose: 44, coinType: 60, account: 0, change: 0, addressIndex: 0, ... }
 */
export function parsePath(path: string): ParsedPath {
  const trimmed = path.trim();
  if (trimmed.length === 0) {
    throw new DerivationPathError("empty", "empty derivation path");
  }
  const [master, ...tokens] = trimmed.split("/");
  if (master !== "m" && master !== "M") {
    throw new DerivationPathError("missing-master", `path must start with "m", got "${master}"`);
  }
  const segments = tokens.map(parseSegment);
  const named: Record<string, number> = {};
  for (const [position, field] of POSITIONAL_FIELDS.entries()) {
    const segment = segments[position];
    if (segment !== undefined) {
      named[field] = segment.index;
    }
  }
  return {
    depth: segments.length,
    path: trimmed as DerivationPath,
    segments,
    ...named,
  };
}

/** Non-throwing variant of {@link parsePath}. */
export function safeParsePath(path: string): SafeParseResult {
  try {
    return { data: parsePath(path), success: true };
  } catch (error) {
    if (error instanceof DerivationPathError) {
      return { error, success: false };
    }
    throw error;
  }
}
