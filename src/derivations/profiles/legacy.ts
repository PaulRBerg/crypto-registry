import { bip44RootShape } from "../internal/shapes.js";
import { lit, vr } from "../path/template.js";
import { COIN_TYPES } from "../slip44.js";
import type { DerivationProfile } from "./types.js";

/**
 * Legacy and non-standard profiles for chains whose secrets predate BIP-compliant tooling.
 *
 * - Obyte/Byteball reuses Bitcoin's coin type (0) under BIP44; its `obyte` address kind (base32 chash160) is the only
 *   genuinely new format here.
 * - Vertcoin has a modern BIP44 account and the old Electrum `m/0/0` first-receive path. The Ledger BIP49 quirk
 *   lives in `BITCOIN_PROFILES`.
 * - Hush's MyHushWallet web-wallet derives flat `m/{index}` keys with no coin-type level, so its `coinType` is nominal
 *   SLIP-44 metadata (197) only.
 *
 * The soft templates (`m/0/0`, `m/{index}`) broaden registry-wide recognition, so these are appended last in
 * `DERIVATION_PROFILES` and should be recognized with a chain hint.
 */
export const LEGACY_PROFILES: readonly DerivationProfile[] = [
  {
    addressKind: "obyte",
    chain: "obyte",
    coinType: COIN_TYPES.BITCOIN,
    ecosystems: ["obyte", "byteball"],
    id: "obyte-bip44-account",
    purpose: 44,
    scheme: "secp256k1",
    standard: "obyte-bip44",
    standardName: "Obyte BIP44",
    template: bip44RootShape(44, COIN_TYPES.BITCOIN),
  },
  {
    addressKind: "p2pkh",
    chain: "vertcoin",
    coinType: COIN_TYPES.VERTCOIN,
    ecosystems: ["vertcoin"],
    id: "vertcoin-bip44-account",
    purpose: 44,
    scheme: "secp256k1",
    standard: "vertcoin-bip44",
    standardName: "Vertcoin BIP44",
    template: bip44RootShape(44, COIN_TYPES.VERTCOIN),
  },
  {
    addressKind: "p2pkh",
    chain: "vertcoin",
    coinType: COIN_TYPES.VERTCOIN,
    ecosystems: ["vertcoin"],
    id: "vertcoin-electrum-legacy",
    purpose: null,
    scheme: "secp256k1",
    standard: "vertcoin-electrum-legacy",
    standardName: "Vertcoin Electrum Legacy",
    template: [lit(0), lit(0)],
  },
  {
    addressKind: "p2pkh",
    chain: "hush",
    coinType: COIN_TYPES.HUSH,
    ecosystems: ["hush"],
    id: "hush-webwallet",
    purpose: null,
    scheme: "secp256k1",
    standard: "hush-webwallet",
    standardName: "Hush Webwallet",
    template: [vr("index")],
  },
];
