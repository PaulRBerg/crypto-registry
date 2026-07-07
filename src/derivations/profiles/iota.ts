import { ed25519LedgerShape } from "../internal/shapes.js";
import type { Template } from "../path/template.js";
import { lit, vr } from "../path/template.js";
import { PURPOSES } from "../purposes.js";
import { COIN_TYPES } from "../slip44.js";
import type { DerivationProfile } from "./types.js";

const accountShape = (purpose: number): Template => [
  lit(purpose, true),
  lit(COIN_TYPES.IOTA, true),
  vr("account", true),
  lit(0),
  lit(0),
];

/**
 * IOTA (coin type 4218). The ed25519 and Stardust ed25519 profiles share an identical path shape and differ only by
 * address format, so a single path recognizes as both (see `recognizeAll`).
 */
export const IOTA_PROFILES: readonly DerivationProfile[] = [
  {
    addressKind: "iota-rebased",
    chain: "iota",
    coinType: COIN_TYPES.IOTA,
    ecosystems: ["iota"],
    id: "iota-ed25519-account",
    purpose: 44,
    scheme: "ed25519",
    standard: "iota-ed25519",
    standardName: "IOTA Ed25519",
    template: ed25519LedgerShape(COIN_TYPES.IOTA),
  },
  {
    addressKind: "iota-stardust",
    chain: "iota",
    coinType: COIN_TYPES.IOTA,
    ecosystems: ["iota"],
    id: "iota-stardust-ed25519-account",
    purpose: 44,
    scheme: "ed25519",
    standard: "iota-stardust-ed25519",
    standardName: "IOTA Stardust Ed25519",
    template: ed25519LedgerShape(COIN_TYPES.IOTA),
  },
  {
    addressKind: "iota-rebased",
    chain: "iota",
    coinType: COIN_TYPES.IOTA,
    ecosystems: ["iota"],
    id: "iota-secp256k1-account",
    purpose: PURPOSES.IOTA_SECP256K1,
    scheme: "secp256k1",
    standard: "iota-secp256k1",
    standardName: "IOTA Secp256k1",
    template: accountShape(PURPOSES.IOTA_SECP256K1),
  },
  {
    addressKind: "iota-rebased",
    chain: "iota",
    coinType: COIN_TYPES.IOTA,
    ecosystems: ["iota"],
    id: "iota-secp256r1-account",
    purpose: PURPOSES.IOTA_SECP256R1,
    scheme: "secp256r1",
    standard: "iota-secp256r1",
    standardName: "IOTA Secp256r1",
    template: accountShape(PURPOSES.IOTA_SECP256R1),
  },
];
