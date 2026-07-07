import { evmAddressIndexShape } from "../internal/shapes.js";
import { COIN_TYPES } from "../slip44.js";
import type { DerivationProfile } from "./types.js";

/**
 * Starknet — path only. The BIP-32 tree is traversed on secp256k1 and the key is ground onto the STARK curve (hence
 * `scheme: "stark"`). Class hash and constructor calldata are wallet glue and are intentionally not modeled here.
 */
export const STARKNET_PROFILES: readonly DerivationProfile[] = [
  {
    addressKind: "starknet",
    chain: "starknet",
    coinType: COIN_TYPES.STARKNET,
    ecosystems: ["starknet"],
    id: "starknet-ready-argent-account",
    purpose: 44,
    scheme: "stark",
    standard: "ready-argent",
    standardName: "Ready X",
    template: evmAddressIndexShape(COIN_TYPES.STARKNET),
  },
];
