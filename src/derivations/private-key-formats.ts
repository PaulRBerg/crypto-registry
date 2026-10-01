/**
 * Canonical single-account private-key export formats: the string a wallet imports for one derived account.
 *
 * Pure data; the byte math (hex, base58check, base58) lives in consumers, since this package has no crypto-library
 * dependency. Each entry describes how to render the raw leaf secret, not how to derive it.
 *
 * Bitcoin-family kinds (`p2pkh`, `p2sh-p2wpkh`, `p2wpkh`) are deliberately absent: their WIF version byte depends on
 * the chain, not the address kind. Use {@link wifVersionForEcosystem} (compressed WIF) for those.
 */

import type { AddressKind } from "./schemes.js";

export type PrivateKeyFormat =
  /** The raw secret as hex. `prefix` is `"0x"` or empty. */
  | { readonly encoding: "hex"; readonly prefix: "0x" | ""; readonly case: "lower" | "upper" }
  /** base58check of `version || secret [|| 0x01 when compressed]`. */
  | { readonly encoding: "wif"; readonly version: number; readonly compressed: boolean }
  /** base58 of 64 bytes: 32-byte ed25519 seed followed by the 32-byte public key. */
  | { readonly encoding: "solana-keypair-base58" }
  /** AIP-80 string `<scheme>-priv-0x<64 lowercase hex>`. */
  | { readonly encoding: "aip80"; readonly scheme: "ed25519" };

export const PRIVATE_KEY_FORMATS: Partial<Record<AddressKind, PrivateKeyFormat>> = {
  // Phantom / Solana CLI keypair export.
  solana: { encoding: "solana-keypair-base58" },
  // AIP-80 (Petra, Aptos CLI).
  aptos: { encoding: "aip80", scheme: "ed25519" },
  // Keplr / Leap: bare 32-byte hex.
  cosmos: { encoding: "hex", prefix: "", case: "lower" },
  // EOS legacy WIF (uncompressed), as imported by Anchor / cleos.
  eos: { encoding: "wif", version: 0x80, compressed: false },
  // MetaMask and other EVM wallets: 0x-prefixed hex.
  evm: { encoding: "hex", prefix: "0x", case: "lower" },
  // Fuel Wallet: 0x-prefixed hex.
  fuel: { encoding: "hex", prefix: "0x", case: "lower" },
  // MultiversX: 32-byte secret, bare hex.
  multiversx: { encoding: "hex", prefix: "", case: "lower" },
  // Nano: 32-byte private key, bare uppercase hex.
  nano: { encoding: "hex", prefix: "", case: "upper" },
  // Neo Legacy WIF (secp256r1, compressed), as imported by NeoLine / neon-wallet.
  "neo-legacy": { encoding: "wif", version: 0x80, compressed: true },
  // Bare 32-byte secret hex. XRPL family seeds (sEd.../s...) are not derivable from a BIP-32 key, so this is the raw key.
  ripple: { encoding: "hex", prefix: "", case: "lower" },
  // Argent / Braavos: 0x-prefixed ground Stark key.
  starknet: { encoding: "hex", prefix: "0x", case: "lower" },
};

/** The private-key export format for an address kind, or `undefined` when none is declared. */
export function privateKeyFormatForAddressKind(kind: AddressKind): PrivateKeyFormat | undefined {
  return PRIVATE_KEY_FORMATS[kind];
}
