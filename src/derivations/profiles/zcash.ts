import { bip44RootShape } from "../internal/shapes.js";
import { COIN_TYPES } from "../slip44.js";
import type { DerivationProfile } from "./types.js";

/**
 * Zcash shielded — ZIP-32 account, `m/32'/133'/{account}'`. This is the account-level node of the ZIP-32 hierarchy
 * (purpose `32'`, not a BIP-44 purpose), from which the Sapling, Orchard, and transparent receivers of a unified
 * address are all derived.
 *
 * The wallet in scope is Zodl (ex-Zashi), which produces unified addresses with an Orchard pool. Orchard spend-auth
 * keys are RedPallas signatures over the Pallas curve, hence `scheme: "pallas"`. Disjoint from the transparent
 * `zcash-bip44-transparent-account` (`m/44'/133'/…`), so both coexist in the registry without collision.
 */
export const ZCASH_SHIELDED_PROFILES: readonly DerivationProfile[] = [
  {
    addressKind: "zcash-unified",
    chain: "zcash",
    coinType: COIN_TYPES.ZCASH,
    ecosystems: ["zcash"],
    id: "zcash-zip32-account",
    purpose: 32,
    scheme: "pallas",
    standard: "zip32-account",
    standardName: "ZIP32 Account",
    template: bip44RootShape(32, COIN_TYPES.ZCASH),
  },
];
