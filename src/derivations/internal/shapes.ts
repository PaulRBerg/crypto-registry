import type { Template } from "../path/template.js";
import { lit, nvr, vr } from "../path/template.js";

/**
 * Shape builders that replace the four original path-builder closures. Each returns a {@link Template} — the single
 * structure that drives both rendering and recognition. The varying level carries a role; fixed levels are literals.
 */

/** `m/44'/{coin}'/{account}'/0/0` — standard BIP-44 account (replaces `bip44Account`). */
export const bip44Shape = (coinType: number): Template => [
  lit(44, true),
  lit(coinType, true),
  vr("account", true),
  lit(0),
  lit(0),
];

/** `m/44'/{coin}'/0'/0/{index}` — fixed-account BIP-44 address index. */
export const bip44AddressIndexShape = (coinType: number): Template => [
  lit(44, true),
  lit(coinType, true),
  lit(0, true),
  lit(0),
  vr("index"),
];

/** `m/44'/{coin}'/{account}'` — account-only (replaces `bip44AccountOnly`). */
export const bip44AccountOnlyShape = (coinType: number): Template => [
  lit(44, true),
  lit(coinType, true),
  vr("account", true),
];

/** `m/44'/{coin}'/{account}'/0` — hardened account, fixed non-hardened change (Atomic Wallet's NEO path). */
export const bip44ChangeOnlyShape = (coinType: number): Template => [
  lit(44, true),
  lit(coinType, true),
  vr("account", true),
  lit(0),
];

/** `m/44'/{coin}'/{account}'/0'/0'` — fully-hardened ed25519 Ledger (replaces `bip44Ed25519Ledger`). */
export const ed25519LedgerShape = (coinType: number): Template => [
  lit(44, true),
  lit(coinType, true),
  vr("account", true),
  lit(0, true),
  lit(0, true),
];

/** `m/{purpose}'/{coin}'/{account}'` — purpose-rooted account (replaces `bip44RootAccount`). */
export const bip44RootShape = (purpose: number, coinType: number): Template => [
  lit(purpose, true),
  lit(coinType, true),
  vr("account", true),
];

/** `m/44'/{coin}'/0'/0/{index}` — fixed account, varying address index (EVM, Starknet). */
export const evmAddressIndexShape = (coinType: number): Template => [
  lit(44, true),
  lit(coinType, true),
  lit(0, true),
  lit(0),
  vr("index"),
];

/** `index={index}` — native Nano/RaiBlocks seed account index evidence. */
export const nativeIndexShape = (): Template => [nvr("index", "index=")];
