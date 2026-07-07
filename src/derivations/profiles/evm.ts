import { evmAddressIndexShape } from "../internal/shapes.js";
import { lit, vr } from "../path/template.js";
import { COIN_TYPES } from "../slip44.js";
import type { DerivationProfile } from "./types.js";

const ECOSYSTEMS = ["dymension", "evm", "zksync-lite"] as const;

const base = {
  addressKind: "evm",
  chain: "evm",
  coinType: COIN_TYPES.ETHEREUM,
  ecosystems: ECOSYSTEMS,
  purpose: 44,
  scheme: "secp256k1",
} as const satisfies Partial<DerivationProfile>;

/**
 * EVM address layouts. `m/44'/60'/0'/0/{index}` (BIP44) and `m/44'/60'/{account}'/0/0` (Ledger Live) overlap at
 * `index/account = 0`, so Ledger Live carries `minValue: 1` to keep the two disjoint during recognition.
 */
export const EVM_PROFILES: readonly DerivationProfile[] = [
  {
    ...base,
    id: "evm-bip44-address-index",
    standard: "bip44",
    standardName: "BIP44",
    template: evmAddressIndexShape(COIN_TYPES.ETHEREUM),
  },
  {
    ...base,
    id: "evm-ledger-live-account-index",
    standard: "ledger-live",
    standardName: "Ledger Live",
    template: [
      lit(44, true),
      lit(COIN_TYPES.ETHEREUM, true),
      vr("account", true, 1),
      lit(0),
      lit(0),
    ],
  },
  {
    ...base,
    id: "evm-legacy-ledger-mew",
    standard: "legacy-ledger",
    standardName: "Legacy Ledger",
    template: [lit(44, true), lit(COIN_TYPES.ETHEREUM, true), lit(0, true), vr("index")],
  },
];
