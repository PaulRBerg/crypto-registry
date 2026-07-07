import { bip44Shape } from "../internal/shapes.js";
import { lit, vr } from "../path/template.js";
import { PURPOSES } from "../purposes.js";
import { COIN_TYPES } from "../slip44.js";
import type { DerivationProfile } from "./types.js";

/** Cardano: Shelley (CIP-1852), Byron Icarus (BIP44), and Byron random (no purpose level). */
export const CARDANO_PROFILES: readonly DerivationProfile[] = [
  {
    addressKind: "cardano-shelley",
    chain: "cardano",
    coinType: COIN_TYPES.CARDANO,
    ecosystems: ["cardano"],
    id: "cardano-shelley-base-account",
    purpose: PURPOSES.CIP1852,
    scheme: "ed25519",
    standard: "cardano-shelley",
    standardName: "Cardano Shelley",
    template: [
      lit(PURPOSES.CIP1852, true),
      lit(COIN_TYPES.CARDANO, true),
      vr("account", true),
      lit(0),
      lit(0),
    ],
  },
  {
    addressKind: "cardano-byron",
    chain: "cardano",
    coinType: COIN_TYPES.CARDANO,
    ecosystems: ["cardano"],
    id: "cardano-byron-icarus-account",
    purpose: 44,
    scheme: "ed25519",
    standard: "cardano-byron-icarus",
    standardName: "Cardano Byron Icarus",
    template: bip44Shape(COIN_TYPES.CARDANO),
  },
  {
    addressKind: "cardano-byron",
    chain: "cardano",
    coinType: COIN_TYPES.CARDANO,
    ecosystems: ["cardano"],
    id: "cardano-byron-random-branch",
    purpose: null,
    scheme: "ed25519",
    standard: "cardano-byron-random",
    standardName: "Cardano Byron Random",
    template: [vr("account", true)],
  },
  {
    addressKind: "cardano-byron",
    chain: "cardano",
    coinType: COIN_TYPES.CARDANO,
    ecosystems: ["cardano"],
    id: "cardano-byron-random-account",
    purpose: null,
    scheme: "ed25519",
    standard: "cardano-byron-random",
    standardName: "Cardano Byron Random",
    template: [vr("account", true), lit(0, true)],
  },
  {
    addressKind: "cardano-byron",
    chain: "cardano",
    coinType: COIN_TYPES.CARDANO,
    ecosystems: ["cardano"],
    id: "cardano-byron-random-address",
    purpose: null,
    scheme: "ed25519",
    standard: "cardano-byron-random",
    standardName: "Cardano Byron Random",
    template: [vr("account", true), vr("addressIndex")],
  },
];
