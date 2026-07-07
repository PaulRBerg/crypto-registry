import { ed25519LedgerShape } from "../internal/shapes.js";
import { COIN_TYPES } from "../slip44.js";
import type { DerivationProfile } from "./types.js";

/**
 * Substrate chains (Polkadot, Avail) share the fully-hardened ed25519 Ledger shape on coin type 354. They differed in
 * only by ss58 prefix and explorer slug — both app glue — so they collapse to one intrinsic profile.
 */
export const SUBSTRATE_PROFILES: readonly DerivationProfile[] = [
  {
    addressKind: "substrate",
    chain: "polkadot",
    coinType: COIN_TYPES.SUBSTRATE,
    ecosystems: ["polkadot", "avail"],
    id: "polkadot-ledger-substrate-account",
    purpose: 44,
    scheme: "ed25519",
    standard: "substrate-ledger",
    standardName: "Substrate Ledger",
    template: ed25519LedgerShape(COIN_TYPES.SUBSTRATE),
  },
];
