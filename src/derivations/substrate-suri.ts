/**
 * Substrate secret-URI (SURI) junction path recognizer — path-only, zero key derivation.
 *
 * Substrate (Polkadot, Avail, …) does not derive accounts with a BIP-32 `m/...` tree. Instead a seed is followed by a
 * chain of junctions appended to the secret URI: `//code` is a *hard* junction and `/code` is a *soft* junction. An
 * empty suffix is the seed's own account — the "Substrate Root". Because this is not a BIP-32 path it cannot be a
 * {@link DerivationProfile}; it lives here as a dedicated, self-contained module instead.
 *
 * This models the path grammar only: it parses, validates, and re-renders junction strings with the same
 * render/recognize round-trip the {@link Template} engine gives every BIP-32 standard. It does not derive keys.
 *
 * Note: Polkadot.js / SubWallet SURI accounts default to the sr25519 signature scheme; the scheme is a wallet concern
 * and is intentionally not modeled here.
 */

/** A single SURI junction: a hard (`//`) or soft (`/`) derivation step carrying a free-form code. */
export type SubstrateJunction = {
  /** `true` for a hard junction (`//code`), `false` for a soft junction (`/code`). */
  readonly hard: boolean;
  /** The junction code — any run of non-`/` characters, numeric (`"1"`) or string (`"polkadot"`). */
  readonly code: string;
};

/**
 * A recognized Substrate secret URI: either the bare seed account (`root`) or a non-empty chain of junctions (`suri`).
 */
export type SubstrateSuri =
  | { readonly kind: "root" }
  | { readonly kind: "suri"; readonly junctions: readonly SubstrateJunction[] };

/** The canonical human label for the empty-suffix seed account. */
export const SUBSTRATE_ROOT_LABEL = "Substrate Root";

/** A valid SURI suffix is one or more junctions, each a `/` (soft) or `//` (hard) followed by ≥1 non-`/` char. */
const SURI_PATTERN = /^(?:\/\/?[^/]+)+$/;

/** Tiles a validated suffix into its junctions: group 1 is the optional second slash (hard), group 2 is the code. */
const JUNCTION_PATTERN = /\/(\/?)([^/]+)/g;

/**
 * Parse a Substrate secret-URI suffix into its structured form, or `undefined` if it is not a valid SURI.
 *
 * `""` and {@link SUBSTRATE_ROOT_LABEL} both denote the seed's own account. Any other input must match
 * {@link SURI_PATTERN} — a chain of `//hard` / `/soft` junctions — otherwise it is rejected (e.g. a BIP-32 `m/...`
 * path, a trailing slash, an empty `///` junction, or a bare word).
 */
export function parseSubstrateSuri(input: string): SubstrateSuri | undefined {
  if (input === "" || input === SUBSTRATE_ROOT_LABEL) {
    return { kind: "root" };
  }
  if (!SURI_PATTERN.test(input)) {
    return undefined;
  }
  const junctions: SubstrateJunction[] = [];
  for (const [, slash, code] of input.matchAll(JUNCTION_PATTERN)) {
    junctions.push({ code, hard: slash === "/" });
  }
  return { junctions, kind: "suri" };
}

/**
 * Render a {@link SubstrateSuri} back to its canonical suffix string — the inverse of {@link parseSubstrateSuri}. The
 * root renders to `""` (its canonical form), each hard junction to `//code` and each soft junction to `/code`.
 */
export function formatSubstrateSuri(suri: SubstrateSuri): string {
  if (suri.kind === "root") {
    return "";
  }
  return suri.junctions.map((junction) => `${junction.hard ? "//" : "/"}${junction.code}`).join("");
}

/** Whether `input` is a recognizable Substrate secret URI (root or junction chain). */
export function isSubstrateSuri(input: string): boolean {
  return parseSubstrateSuri(input) !== undefined;
}
