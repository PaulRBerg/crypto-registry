import { bip44AddressIndexShape, bip44Shape } from "../internal/shapes.js";
import { COIN_TYPES } from "../slip44.js";
import type { DerivationProfile } from "./types.js";

/**
 * Cosmos-family chains. Keplr extension mnemonic accounts and Ledger Cosmos accounts overlap at
 * `m/44'/118'/0'/0/0`, so `recognizeAll` is required when wallet provenance matters. Terra keeps its own coin type
 * (330).
 */
export const COSMOS_PROFILES: readonly DerivationProfile[] = [
  {
    addressKind: "cosmos",
    chain: "cosmos",
    coinType: COIN_TYPES.COSMOS,
    ecosystems: ["babylon", "celestia", "cosmos", "osmosis", "saga"],
    id: "cosmos-keplr-account",
    purpose: 44,
    scheme: "secp256k1",
    standard: "keplr-cosmos",
    standardName: "Keplr Cosmos",
    template: bip44AddressIndexShape(COIN_TYPES.COSMOS),
  },
  {
    addressKind: "cosmos",
    chain: "cosmos",
    coinType: COIN_TYPES.COSMOS,
    ecosystems: ["babylon", "celestia", "cosmos", "osmosis", "saga"],
    id: "cosmos-ledger-account",
    purpose: 44,
    scheme: "secp256k1",
    standard: "cosmos-ledger",
    standardName: "Cosmos Ledger",
    template: bip44Shape(COIN_TYPES.COSMOS),
  },
  {
    addressKind: "cosmos",
    chain: "terra",
    coinType: COIN_TYPES.TERRA,
    ecosystems: ["terra", "terra-classic"],
    id: "terra-ledger-account",
    purpose: 44,
    scheme: "secp256k1",
    standard: "terra-ledger",
    standardName: "Terra Ledger",
    template: bip44Shape(COIN_TYPES.TERRA),
  },
  {
    addressKind: "cosmos",
    chain: "terra-classic",
    coinType: COIN_TYPES.TERRA,
    ecosystems: ["terra-classic"],
    id: "terra-classic-station-account",
    purpose: 44,
    scheme: "secp256k1",
    standard: "terra-station",
    standardName: "Terra Station",
    template: bip44Shape(COIN_TYPES.TERRA),
  },
  {
    addressKind: "cosmos",
    chain: "terra-classic",
    coinType: COIN_TYPES.COSMOS,
    ecosystems: ["terra-classic"],
    id: "terra-classic-station-legacy-account",
    purpose: 44,
    scheme: "secp256k1",
    standard: "terra-station-legacy",
    standardName: "Terra Station Legacy",
    template: bip44Shape(COIN_TYPES.COSMOS),
  },
];
