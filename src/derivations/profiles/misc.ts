import {
  bip44AccountOnlyShape,
  bip44AddressIndexShape,
  bip44ChangeOnlyShape,
  bip44Shape,
  ed25519LedgerShape,
  nativeIndexShape,
} from "../internal/shapes.js";
import type { Template } from "../path/template.js";
import { lit, vr } from "../path/template.js";
import type { Standard } from "../purposes.js";
import type { AddressKind, SignatureScheme } from "../schemes.js";
import { COIN_TYPES } from "../slip44.js";
import type { DerivationProfile } from "./types.js";

type Row = {
  readonly id: string;
  readonly chain: string;
  readonly ecosystems?: readonly string[];
  readonly coinType: number;
  readonly purpose?: number | null;
  readonly scheme: SignatureScheme;
  readonly addressKind: AddressKind;
  readonly standardName: string;
  readonly standard: Standard;
  readonly template: Template;
};

const ROWS: readonly Row[] = [
  {
    addressKind: "stellar",
    chain: "stellar",
    coinType: COIN_TYPES.STELLAR,
    id: "stellar-slip44-account",
    scheme: "ed25519",
    standard: "stellar-slip44",
    standardName: "Stellar SLIP44",
    template: bip44AccountOnlyShape(COIN_TYPES.STELLAR),
  },
  {
    addressKind: "nano",
    chain: "nano",
    coinType: COIN_TYPES.NANO,
    id: "nano-ledger-account",
    scheme: "ed25519",
    standard: "nano-ledger",
    standardName: "Nano Ledger",
    template: bip44AccountOnlyShape(COIN_TYPES.NANO),
  },
  {
    addressKind: "nano",
    chain: "nano",
    coinType: COIN_TYPES.NANO,
    id: "nano-legacy-seed-account",
    purpose: null,
    scheme: "ed25519",
    standard: "nano-legacy-seed",
    standardName: "Nano Legacy Seed",
    template: nativeIndexShape(),
  },
  {
    // mx-sdk-js-wallet (the official SDK behind the MultiversX Web Wallet and xPortal) fixes account/change at `0'`
    // and increments the hardened index instead.
    addressKind: "multiversx",
    chain: "multiversx",
    coinType: COIN_TYPES.MULTIVERSX,
    id: "multiversx-wallet-address-index",
    scheme: "ed25519",
    standard: "multiversx-wallet",
    standardName: "MultiversX Wallet",
    template: [
      lit(44, true),
      lit(COIN_TYPES.MULTIVERSX, true),
      lit(0, true),
      lit(0, true),
      vr("index", true),
    ],
  },
  {
    // Ledger's own account-increment convention. Overlaps multiversx-wallet-address-index at account/index = 0, so
    // this profile carries minValue: 1 to keep the two disjoint during recognition (same technique as the EVM/Ripple
    // pairs below).
    addressKind: "multiversx",
    chain: "multiversx",
    coinType: COIN_TYPES.MULTIVERSX,
    id: "multiversx-ledger-account",
    scheme: "ed25519",
    standard: "multiversx-ledger",
    standardName: "MultiversX Ledger",
    template: [
      lit(44, true),
      lit(COIN_TYPES.MULTIVERSX, true),
      vr("account", true, 1),
      lit(0, true),
      lit(0, true),
    ],
  },
  {
    addressKind: "waves",
    chain: "waves",
    coinType: COIN_TYPES.WAVES,
    id: "waves-ledger-account",
    scheme: "ed25519",
    standard: "waves-ledger",
    standardName: "Waves Ledger",
    template: ed25519LedgerShape(COIN_TYPES.WAVES),
  },
  {
    addressKind: "algorand",
    chain: "algorand",
    coinType: COIN_TYPES.ALGORAND,
    id: "algorand-ledger-account",
    scheme: "ed25519",
    standard: "algorand-ledger",
    standardName: "Algorand Ledger",
    template: ed25519LedgerShape(COIN_TYPES.ALGORAND),
  },
  {
    // ARC-52 (BIP32-Ed25519) HD accounts as used by Lute and the xHD-Wallet-API reference: account hardened, then a
    // hardcoded soft change `0` and a soft key index. The soft tail is what enables xpub child derivation, and the
    // missing ticks keep it disjoint from the fully-hardened Ledger shape above. (Kibisis is intentionally absent — it
    // uses Algorand's native 25-word mnemonic as a direct ed25519 seed, so it has no `m/...` path to model.)
    addressKind: "algorand",
    chain: "algorand",
    coinType: COIN_TYPES.ALGORAND,
    id: "algorand-arc52-account",
    scheme: "ed25519",
    standard: "algorand-arc52",
    standardName: "Algorand ARC-52",
    template: [
      lit(44, true),
      lit(COIN_TYPES.ALGORAND, true),
      vr("account", true),
      lit(0),
      vr("index"),
    ],
  },
  {
    addressKind: "aptos",
    chain: "aptos",
    coinType: COIN_TYPES.APTOS,
    id: "aptos-ledger-account",
    scheme: "ed25519",
    standard: "aptos-ledger",
    standardName: "Aptos Ledger",
    template: ed25519LedgerShape(COIN_TYPES.APTOS),
  },
  {
    addressKind: "aptos",
    chain: "aptos",
    coinType: COIN_TYPES.APTOS,
    id: "aptos-bip44-account",
    scheme: "secp256k1",
    standard: "aptos-bip44",
    standardName: "Aptos BIP44",
    template: bip44Shape(COIN_TYPES.APTOS),
  },
  {
    addressKind: "handshake",
    chain: "handshake",
    coinType: COIN_TYPES.HANDSHAKE,
    id: "handshake-ledger-account",
    scheme: "secp256k1",
    standard: "handshake-bip44",
    standardName: "Handshake BIP44",
    template: bip44Shape(COIN_TYPES.HANDSHAKE),
  },
  {
    addressKind: "hedera-account",
    chain: "hedera",
    coinType: COIN_TYPES.HEDERA,
    id: "hedera-ed25519-account",
    scheme: "ed25519",
    standard: "hedera-ed25519",
    standardName: "Hedera ED25519",
    template: [
      lit(44, true),
      lit(COIN_TYPES.HEDERA, true),
      lit(0, true),
      lit(0, true),
      vr("index", true),
    ],
  },
  {
    // Deprecated Hedera SDK default used before the indexed standard helper was introduced.
    addressKind: "hedera-account",
    chain: "hedera",
    coinType: COIN_TYPES.HEDERA,
    id: "hedera-ed25519-legacy",
    scheme: "ed25519",
    standard: "hedera-ed25519-legacy",
    standardName: "Hedera Legacy ED25519",
    template: [lit(44, true), lit(COIN_TYPES.HEDERA, true), lit(0, true), lit(0, true)],
  },
  {
    addressKind: "navcoin",
    chain: "navcoin",
    coinType: COIN_TYPES.NAVCOIN,
    id: "navcoin-bip44-account",
    scheme: "secp256k1",
    standard: "navcoin-bip44",
    standardName: "NavCoin BIP44",
    template: bip44Shape(COIN_TYPES.NAVCOIN),
  },
  {
    addressKind: "neo-legacy",
    chain: "neo-legacy",
    coinType: COIN_TYPES.NEO,
    id: "neo-legacy-safepal-account",
    scheme: "secp256r1",
    standard: "neo-legacy-safepal",
    standardName: "Neo Legacy SafePal",
    template: bip44AccountOnlyShape(COIN_TYPES.NEO),
  },
  {
    addressKind: "neo-legacy",
    chain: "neo-legacy",
    coinType: COIN_TYPES.NEO,
    id: "neo-legacy-atomic-wallet-account",
    scheme: "secp256r1",
    standard: "neo-legacy-atomic-wallet",
    standardName: "Neo Legacy Atomic Wallet",
    template: bip44ChangeOnlyShape(COIN_TYPES.NEO),
  },
  {
    addressKind: "neo-legacy",
    chain: "neo-legacy",
    coinType: COIN_TYPES.NEO,
    id: "neo-legacy-bip44-account",
    scheme: "secp256r1",
    standard: "neo-legacy-bip44",
    standardName: "Neo Legacy BIP44",
    template: bip44Shape(COIN_TYPES.NEO),
  },
  {
    addressKind: "ripple",
    chain: "ripple",
    coinType: COIN_TYPES.RIPPLE,
    id: "ripple-bip44-address-index",
    scheme: "secp256k1",
    standard: "bip44",
    standardName: "BIP44",
    template: bip44AddressIndexShape(COIN_TYPES.RIPPLE),
  },
  {
    // Ledger Live-style account increment. Overlaps ripple-bip44-address-index at account/index = 0, so this profile
    // carries minValue: 1 to keep the two disjoint during recognition (same technique as the EVM pair).
    addressKind: "ripple",
    chain: "ripple",
    coinType: COIN_TYPES.RIPPLE,
    id: "ripple-bip44-account",
    scheme: "secp256k1",
    standard: "ripple-bip44",
    standardName: "Ripple BIP44",
    template: [lit(44, true), lit(COIN_TYPES.RIPPLE, true), vr("account", true, 1), lit(0), lit(0)],
  },
  {
    addressKind: "verge",
    chain: "verge",
    coinType: COIN_TYPES.VERGE,
    id: "verge-bip44-account",
    scheme: "secp256k1",
    standard: "verge-bip44",
    standardName: "Verge BIP44",
    template: bip44Shape(COIN_TYPES.VERGE),
  },
  {
    addressKind: "eos",
    chain: "eos-vaulta",
    coinType: COIN_TYPES.EOS,
    ecosystems: ["eos-vaulta", "eos", "vaulta"],
    id: "eos-vaulta-ledger-account",
    scheme: "secp256k1",
    standard: "eos-bip44",
    standardName: "EOS BIP44",
    template: bip44Shape(COIN_TYPES.EOS),
  },
  {
    addressKind: "fuel",
    chain: "fuel",
    coinType: COIN_TYPES.FUEL,
    id: "fuel-bip44-account",
    scheme: "secp256k1",
    standard: "fuel-bip44",
    standardName: "Fuel BIP44",
    template: bip44Shape(COIN_TYPES.FUEL),
  },
  {
    addressKind: "tron",
    chain: "tron",
    coinType: COIN_TYPES.TRON,
    id: "tron-tronlink-account",
    scheme: "secp256k1",
    standard: "tron-tronlink",
    standardName: "TronLink",
    template: bip44AddressIndexShape(COIN_TYPES.TRON),
  },
  {
    // Overlaps tron-tronlink-account at account/index = 0, so this profile carries minValue: 1 to keep the two
    // disjoint during recognition (same technique as the EVM/Ripple pairs above).
    addressKind: "tron",
    chain: "tron",
    coinType: COIN_TYPES.TRON,
    id: "tron-ledger-account",
    scheme: "secp256k1",
    standard: "tron-ledger",
    standardName: "Tron Ledger",
    template: [lit(44, true), lit(COIN_TYPES.TRON, true), vr("account", true, 1), lit(0), lit(0)],
  },
];

/**
 * Single-chain account profiles: Stellar/Waves/Algorand/Aptos/Nano (ed25519), Neo Legacy (secp256r1), and the
 * Hedera ED25519 accounts, and secp256k1 BIP44 chains (Aptos, Handshake, NavCoin, Ripple, Verge, EOS-Vaulta, Fuel).
 * Aptos carries both an ed25519
 * fully-hardened Ledger path and a secp256k1 BIP44 path (last two levels unhardened), matching the Aptos SDK.
 * Algorand likewise carries two ed25519 shapes: the fully-hardened Ledger path and the ARC-52 BIP32-Ed25519 path whose
 * last two levels are soft. Ripple and Tron each carry two secp256k1 shapes, mirroring the EVM pair: a generic/wallet
 * address-index path (fixed account, varying index — TronLink for Tron) and a Ledger Live-style account-index path
 * (`minValue: 1`). MultiversX carries the same pair on ed25519, fully hardened throughout: the official SDK/Web
 * Wallet/xPortal address-index path and Ledger's own account-index path (`minValue: 1`).
 * Neo Legacy carries three secp256r1 shapes because NEO never had an official HD standard (NEP-6/WIF is address-only,
 * not BIP32): SafePal's account-only path, Atomic Wallet's account+change path, and the full account/change/index
 * BIP44 path other wallets use.
 */
export const MISC_PROFILES: readonly DerivationProfile[] = ROWS.map((row) => ({
  addressKind: row.addressKind,
  chain: row.chain,
  coinType: row.coinType,
  ecosystems: row.ecosystems ?? [row.chain],
  id: row.id,
  purpose: row.purpose ?? 44,
  scheme: row.scheme,
  standard: row.standard,
  standardName: row.standardName,
  template: row.template,
}));
