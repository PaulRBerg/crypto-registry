import type { Template } from "../path/template.js";
import { lit, vr } from "../path/template.js";
import { COIN_TYPES } from "../slip44.js";
import type { DerivationProfile } from "./types.js";

const NAMADA_ECOSYSTEMS = ["namada"] as const;
const MODIFIED_ZIP32_ADDRESS_INDEX = 0x7f_ff_ff_ff;

const transparentSecp256k1Shape: Template = [
  lit(44, true),
  lit(COIN_TYPES.ETHEREUM, true),
  vr("account", true),
  vr("change"),
  vr("addressIndex"),
];

const transparentEd25519Shape: Template = [
  lit(44, true),
  lit(COIN_TYPES.NAMADA, true),
  vr("account", true),
  vr("change", true),
  vr("addressIndex", true),
];

const shieldedModifiedZip32Shape: Template = [
  lit(44, true),
  lit(COIN_TYPES.NAMADA, true),
  lit(0, true),
  lit(0, true),
  lit(MODIFIED_ZIP32_ADDRESS_INDEX, true),
];

const shieldedZip32AccountShape: Template = [
  lit(32, true),
  lit(COIN_TYPES.NAMADA, true),
  vr("account", true),
];

const shieldedZip32AddressShape: Template = [
  lit(32, true),
  lit(COIN_TYPES.NAMADA, true),
  vr("account", true),
  vr("addressIndex"),
];

/**
 * Namada official HD paths:
 * - transparent secp256k1: `m/44'/60'/account'/change/address_index`
 * - transparent ed25519: `m/44'/877'/account'/change'/address_index'`
 * - shielded MASP ZIP-32: `m/32'/877'/account'[/address_index]`
 * - shielded Ledger-compatible modified ZIP-32: `m/44'/877'/0'/0'/2147483647'`
 */
export const NAMADA_PROFILES: readonly DerivationProfile[] = [
  {
    addressKind: "namada-transparent",
    chain: "namada",
    coinType: COIN_TYPES.ETHEREUM,
    ecosystems: NAMADA_ECOSYSTEMS,
    id: "namada-transparent-secp256k1",
    purpose: 44,
    scheme: "secp256k1",
    standard: "namada-transparent-secp256k1",
    standardName: "Namada Transparent Secp256k1",
    template: transparentSecp256k1Shape,
  },
  {
    addressKind: "namada-shielded",
    chain: "namada",
    coinType: COIN_TYPES.NAMADA,
    ecosystems: NAMADA_ECOSYSTEMS,
    id: "namada-shielded-modified-zip32",
    purpose: 44,
    scheme: "ed25519",
    standard: "namada-shielded-modified-zip32",
    standardName: "Namada Shielded Modified ZIP32",
    template: shieldedModifiedZip32Shape,
  },
  {
    addressKind: "namada-transparent",
    chain: "namada",
    coinType: COIN_TYPES.NAMADA,
    ecosystems: NAMADA_ECOSYSTEMS,
    id: "namada-transparent-ed25519",
    purpose: 44,
    scheme: "ed25519",
    standard: "namada-transparent-ed25519",
    standardName: "Namada Transparent Ed25519",
    template: transparentEd25519Shape,
  },
  {
    addressKind: "namada-shielded",
    chain: "namada",
    coinType: COIN_TYPES.NAMADA,
    ecosystems: NAMADA_ECOSYSTEMS,
    id: "namada-shielded-zip32-account",
    purpose: 32,
    scheme: "redjubjub",
    standard: "namada-shielded-zip32-account",
    standardName: "Namada Shielded ZIP32 Account",
    template: shieldedZip32AccountShape,
  },
  {
    addressKind: "namada-shielded",
    chain: "namada",
    coinType: COIN_TYPES.NAMADA,
    ecosystems: NAMADA_ECOSYSTEMS,
    id: "namada-shielded-zip32-address",
    purpose: 32,
    scheme: "redjubjub",
    standard: "namada-shielded-zip32-address",
    standardName: "Namada Shielded ZIP32 Address",
    template: shieldedZip32AddressShape,
  },
];
