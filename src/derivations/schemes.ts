/**
 * Signature schemes and on-chain address kinds used across the registry.
 */

/**
 * The elliptic-curve signature scheme a chain signs with.
 *
 * `stark` covers Starknet: the BIP-32 tree is traversed on secp256k1, but the resulting key is ground onto the STARK
 * curve, so the signature scheme is neither of the standard three.
 *
 * `pallas` covers Zcash Orchard: spend-authorization keys are RedPallas signatures over the Pallas curve, derived via
 * ZIP-32 (not BIP-32).
 *
 * `redjubjub` covers Sapling/MASP shielded spend-authorization keys, also derived via ZIP-32.
 */
export const SIGNATURE_SCHEMES = [
  "ed25519",
  "pallas",
  "redjubjub",
  "secp256k1",
  "secp256r1",
  "stark",
] as const;

export type SignatureScheme = (typeof SIGNATURE_SCHEMES)[number];

/**
 * The distinct on-chain address format a profile produces. UTXO script types (`p2pkh`, `p2sh-p2wpkh`, `p2wpkh`) map to
 * SLIP-132 xpub families; the rest are per-ecosystem account formats.
 */
export const ADDRESS_KINDS = [
  "algorand",
  "aptos",
  "cardano-byron",
  "cardano-shelley",
  "cosmos",
  "eos",
  "evm",
  "fuel",
  "handshake",
  "hedera-account",
  "iota-rebased",
  "iota-stardust",
  "multiversx",
  "namada-shielded",
  "namada-transparent",
  "nano",
  "navcoin",
  "neo-legacy",
  "obyte",
  "p2pkh",
  "p2sh-p2wpkh",
  "p2wpkh",
  "radix-babylon-account",
  "radix-babylon-identity",
  "radix-olympia",
  "ripple",
  "solana",
  "starknet",
  "stellar",
  "substrate",
  "tron",
  "verge",
  "waves",
  "zcash-unified",
] as const;

export type AddressKind = (typeof ADDRESS_KINDS)[number];
