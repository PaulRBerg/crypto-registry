import type { Template } from "../path/template.js";
import { lit, vr } from "../path/template.js";
import { COIN_TYPES } from "../slip44.js";
import type { DerivationProfile } from "./types.js";

const RADIX_ECOSYSTEMS = ["radix"] as const;

/** CAP-26 network id (1 = mainnet, 2 = stokenet, ...). Mainnet only — testnets are out of scope. */
const NETWORK_MAINNET = 1;
/** CAP-26 entity kinds: 525 = account (`account_rdx1...`), 618 = identity/persona (`identity_rdx1...`). */
const ENTITY_KIND_ACCOUNT = 525;
const ENTITY_KIND_IDENTITY = 618;
/** CAP-26 key kinds: 1460 = transaction signing, 1678 = ROLA authentication signing. */
const KEY_KIND_TRANSACTION_SIGNING = 1460;
const KEY_KIND_AUTHENTICATION_SIGNING = 1678;

/**
 * Radix Babylon CAP-26 shape: `m/44'/1022'/1'/<entity_kind>'/<key_kind>'/<entity_index>'`, every level hardened
 * (SLIP-10 over Curve25519/ed25519), pinned to mainnet (network 1). `entity_kind` selects accounts (525) or
 * identities/personas (618); `key_kind` selects the transaction-signing key (1460) or the separate ROLA
 * authentication-signing key (1678). The varying leaf is the 0-based entity index.
 *
 * @see https://github.com/radixdlt/wallet-compatible-derivation
 */
const babylonShape = (entityKind: number, keyKind: number): Template => [
  lit(44, true),
  lit(COIN_TYPES.RADIX, true),
  lit(NETWORK_MAINNET, true),
  lit(entityKind, true),
  lit(keyKind, true),
  vr("account", true),
];

/**
 * Radix Olympia "BIP44-like" account path: `m/44'/1022'/0'/0/<address_index>`, secp256k1, producing Bech32 `rdx1...`
 * addresses (0x04-prefixed compressed secp256k1 public key). Canonical BIP-44 with the account level fixed at 0' and
 * change at 0; accounts are enumerated by the address index. The original Olympia implementation accidentally hardened
 * that final index, so both the hardened wallet form and the canonical unhardened form are valid — sargon models the
 * pair as `BIP44LikePath`.
 *
 * @see https://github.com/radixdlt/sargon/blob/main/crates/crypto/hd/src/bip44/bip44_like_path.rs
 */
const olympiaShape = (hardenedIndex: boolean): Template => [
  lit(44, true),
  lit(COIN_TYPES.RADIX, true),
  lit(0, true),
  lit(0),
  vr("addressIndex", hardenedIndex),
];

/**
 * Radix derivation profiles for both eras. Babylon (CAP-26, ed25519): the mainnet account/identity × transaction/ROLA
 * matrix. Olympia (BIP44-like, secp256k1): the hardened wallet form plus the canonical unhardened form. All shapes are
 * mutually disjoint by depth and fixed levels, so first-match order among them is immaterial.
 */
export const RADIX_PROFILES: readonly DerivationProfile[] = [
  {
    addressKind: "radix-babylon-account",
    chain: "radix",
    coinType: COIN_TYPES.RADIX,
    ecosystems: RADIX_ECOSYSTEMS,
    id: "radix-babylon-account",
    purpose: 44,
    scheme: "ed25519",
    standard: "radix-babylon",
    standardName: "Radix Babylon",
    template: babylonShape(ENTITY_KIND_ACCOUNT, KEY_KIND_TRANSACTION_SIGNING),
  },
  {
    addressKind: "radix-babylon-account",
    chain: "radix",
    coinType: COIN_TYPES.RADIX,
    ecosystems: RADIX_ECOSYSTEMS,
    id: "radix-babylon-account-rola",
    purpose: 44,
    scheme: "ed25519",
    standard: "radix-babylon",
    standardName: "Radix Babylon",
    template: babylonShape(ENTITY_KIND_ACCOUNT, KEY_KIND_AUTHENTICATION_SIGNING),
  },
  {
    addressKind: "radix-babylon-identity",
    chain: "radix",
    coinType: COIN_TYPES.RADIX,
    ecosystems: RADIX_ECOSYSTEMS,
    id: "radix-babylon-identity",
    purpose: 44,
    scheme: "ed25519",
    standard: "radix-babylon",
    standardName: "Radix Babylon",
    template: babylonShape(ENTITY_KIND_IDENTITY, KEY_KIND_TRANSACTION_SIGNING),
  },
  {
    addressKind: "radix-babylon-identity",
    chain: "radix",
    coinType: COIN_TYPES.RADIX,
    ecosystems: RADIX_ECOSYSTEMS,
    id: "radix-babylon-identity-rola",
    purpose: 44,
    scheme: "ed25519",
    standard: "radix-babylon",
    standardName: "Radix Babylon",
    template: babylonShape(ENTITY_KIND_IDENTITY, KEY_KIND_AUTHENTICATION_SIGNING),
  },
  {
    addressKind: "radix-olympia",
    chain: "radix",
    coinType: COIN_TYPES.RADIX,
    ecosystems: RADIX_ECOSYSTEMS,
    id: "radix-olympia-account",
    purpose: 44,
    scheme: "secp256k1",
    standard: "radix-olympia",
    standardName: "Radix Olympia",
    template: olympiaShape(true),
  },
  {
    addressKind: "radix-olympia",
    chain: "radix",
    coinType: COIN_TYPES.RADIX,
    ecosystems: RADIX_ECOSYSTEMS,
    id: "radix-olympia-canonical-account",
    purpose: 44,
    scheme: "secp256k1",
    standard: "radix-olympia",
    standardName: "Radix Olympia",
    template: olympiaShape(false),
  },
];
