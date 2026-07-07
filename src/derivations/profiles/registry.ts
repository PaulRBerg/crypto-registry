import type { DerivationPath, Role, RoleValues, Template } from "../path/index.js";
import { match, render, renderTemplate, toMatcher } from "../path/index.js";
import { CARDANO_PROFILES } from "./cardano.js";
import { COSMOS_PROFILES } from "./cosmos.js";
import { EVM_PROFILES } from "./evm.js";
import { IOTA_PROFILES } from "./iota.js";
import { LEGACY_PROFILES } from "./legacy.js";
import { MISC_PROFILES } from "./misc.js";
import { NAMADA_PROFILES } from "./namada.js";
import { RADIX_PROFILES } from "./radix.js";
import { SOLANA_PROFILES } from "./solana.js";
import { STARKNET_PROFILES } from "./starknet.js";
import { SUBSTRATE_PROFILES } from "./substrate.js";
import type { DerivationProfile, Recognition, ResolvedProfile } from "./types.js";
import { UTXO_PROFILES } from "./utxo.js";
import { ZCASH_SHIELDED_PROFILES } from "./zcash.js";

/** Every derivation profile, one row per chain + standard. */
export const DERIVATION_PROFILES: readonly DerivationProfile[] = [
  ...UTXO_PROFILES,
  ...EVM_PROFILES,
  ...IOTA_PROFILES,
  ...CARDANO_PROFILES,
  ...COSMOS_PROFILES,
  ...NAMADA_PROFILES,
  ...RADIX_PROFILES,
  ...SUBSTRATE_PROFILES,
  ...SOLANA_PROFILES,
  ...STARKNET_PROFILES,
  ...ZCASH_SHIELDED_PROFILES,
  ...MISC_PROFILES,
  ...LEGACY_PROFILES,
];

/** Bind each param to its minimum (its `minValue`, else `0`) for a representative example path. */
const exampleValues = (template: Template): RoleValues => {
  const values: RoleValues = {};
  for (const segment of template) {
    if (segment.kind === "param" || segment.kind === "native-param") {
      values[segment.role] = segment.minValue ?? 0;
    }
  }
  return values;
};

const resolve = (profile: DerivationProfile): ResolvedProfile => {
  const { template, ...rest } = profile;
  return {
    ...rest,
    examplePath: render(template, exampleValues(template)),
    matcher: toMatcher(template).regex,
    segments: template,
    template: renderTemplate(template),
  };
};

/** Every profile with its template pre-rendered, example bound, and matcher compiled. */
export const RESOLVED_PROFILES: readonly ResolvedProfile[] = DERIVATION_PROFILES.map(resolve);

const PROFILES_BY_ID: ReadonlyMap<string, ResolvedProfile> = new Map(
  RESOLVED_PROFILES.map((profile) => [profile.id, profile])
);

/** Look up a resolved profile by its stable id. */
export function profileById(id: string): ResolvedProfile | undefined {
  return PROFILES_BY_ID.get(id);
}

/** Render a registered profile's authored template with the supplied role values. */
export function renderProfilePath(profileId: string, values: RoleValues = {}): DerivationPath {
  const profile = profileById(profileId);
  if (profile === undefined) {
    throw new Error(`unknown derivation profile: ${profileId}`);
  }
  return render(profile.segments, values);
}

/** Every resolved profile whose `chain` or `ecosystems` includes `chain`. */
export function profilesForChain(chain: string): readonly ResolvedProfile[] {
  return RESOLVED_PROFILES.filter(
    (profile) => profile.chain === chain || profile.ecosystems.includes(chain)
  );
}

const chainMatches = (profile: ResolvedProfile, chainHint?: string): boolean =>
  chainHint === undefined || profile.chain === chainHint || profile.ecosystems.includes(chainHint);

const toRecognition = (profile: ResolvedProfile, values: RoleValues): Recognition => ({
  chain: profile.chain,
  coinType: profile.coinType,
  profileId: profile.id,
  scheme: profile.scheme,
  standard: profile.standard,
  standardName: profile.standardName,
  values,
});

/**
 * Recognize a concrete path against the registry, returning the first matching profile (optionally constrained to a
 * `chainHint`). Honors per-param `minValue`, so e.g. EVM BIP44 and Ledger Live stay disjoint.
 */
export function recognizePath(path: string, chainHint?: string): Recognition | undefined {
  for (const profile of RESOLVED_PROFILES) {
    if (!chainMatches(profile, chainHint)) {
      continue;
    }
    const values = match(profile.segments, path);
    if (values !== undefined) {
      return toRecognition(profile, values);
    }
  }
  return undefined;
}

/** Every profile that recognizes `path` — useful for shapes shared across chains (e.g. the IOTA ed25519 pair). */
export function recognizeAll(path: string, chainHint?: string): readonly Recognition[] {
  const matches: Recognition[] = [];
  for (const profile of RESOLVED_PROFILES) {
    if (!chainMatches(profile, chainHint)) {
      continue;
    }
    const values = match(profile.segments, path);
    if (values !== undefined) {
      matches.push(toRecognition(profile, values));
    }
  }
  return matches;
}

/** A single-argument path renderer curried from a registered profile id (see {@link accountPathRenderer}, {@link indexPathRenderer}). */
export type PathRenderer = (value: number) => DerivationPath;

/** Curry a registered profile's `account` role into a single-argument path renderer. */
export function accountPathRenderer(profileId: string): PathRenderer {
  return (account) => renderProfilePath(profileId, { account });
}

/** Curry a registered profile's `index` role into a single-argument path renderer. */
export function indexPathRenderer(profileId: string): PathRenderer {
  return (index) => renderProfilePath(profileId, { index });
}

/** The `minValue` authored on a registered profile's `role` segment, or `undefined` if the role has none. */
export function minValueForRole(profileId: string, role: Role): number | undefined {
  const profile = profileById(profileId);
  if (profile === undefined) {
    throw new Error(`unknown derivation profile: ${profileId}`);
  }
  const segment = profile.segments.find((s) => s.kind !== "fixed" && s.role === role);
  return segment !== undefined && segment.kind !== "fixed" ? segment.minValue : undefined;
}
