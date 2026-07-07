import { bip44AccountOnlyShape } from "../internal/shapes.js";
import { lit, vr } from "../path/template.js";
import { COIN_TYPES } from "../slip44.js";
import type { DerivationProfile } from "./types.js";

/**
 * Solana shapes: the default Ledger/Phantom account path, the legacy zero-variable root, the BIP-44 account-only path
 * (Solflare, Sollet, Ledger-via-Solflare), and the deprecated legacy path used by older Phantom and third-party wallets.
 */
export const SOLANA_PROFILES: readonly DerivationProfile[] = [
  {
    addressKind: "solana",
    chain: "solana",
    coinType: COIN_TYPES.SOLANA,
    ecosystems: ["solana"],
    id: "solana-ledger-phantom-account",
    purpose: 44,
    scheme: "ed25519",
    standard: "solana-default",
    standardName: "Solana Default",
    template: [lit(44, true), lit(COIN_TYPES.SOLANA, true), vr("account", true), lit(0, true)],
  },
  {
    addressKind: "solana",
    chain: "solana",
    coinType: COIN_TYPES.SOLANA,
    ecosystems: ["solana"],
    id: "solana-legacy-ledger-root",
    purpose: 44,
    scheme: "ed25519",
    standard: "solana-legacy-ledger",
    standardName: "Solana Legacy Ledger",
    template: [lit(44, true), lit(COIN_TYPES.SOLANA, true)],
  },
  {
    addressKind: "solana",
    chain: "solana",
    coinType: COIN_TYPES.SOLANA,
    ecosystems: ["solana"],
    id: "solana-bip44-account",
    purpose: 44,
    scheme: "ed25519",
    standard: "solana-bip44-account",
    standardName: "Solana BIP44 Account",
    template: bip44AccountOnlyShape(COIN_TYPES.SOLANA),
  },
  {
    addressKind: "solana",
    chain: "solana",
    coinType: COIN_TYPES.SOLANA,
    ecosystems: ["solana"],
    id: "solana-deprecated-legacy",
    purpose: null,
    scheme: "ed25519",
    standard: "solana-deprecated-legacy",
    standardName: "Solana Deprecated Legacy",
    template: [lit(COIN_TYPES.SOLANA, true), vr("account", true), lit(0), lit(0)],
  },
];
