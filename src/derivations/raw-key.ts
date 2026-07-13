/**
 * Raw-key address descriptors: the declarative model for re-encoding a single pathless keypair across every ecosystem
 * that shares its curve.
 *
 * A raw private key (SLIP-44 has no bearing — there is no derivation path) can be re-encoded as an address on any chain
 * whose secret→pubkey rule matches. Reading the secret is the only thing that buys addresses you cannot get from a known
 * address: the same secp256k1 secret as a Bitcoin / Tron / Ripple / EOS address, or the same ed25519 seed on another
 * RFC-8032 chain.
 *
 * Each descriptor binds BOTH halves that must agree for two chains to share a keypair: the `scheme` (the secret→pubkey
 * rule) and the `encoding` + `params` (the pubkey→address rule). Same curve is necessary but not sufficient — Nano
 * (Blake2b key expansion), Cardano, and Substrate all sign on ed25519 yet expand a raw secret into a *different* public
 * key than Solana/Stellar/Algorand/MultiversX/Waves, so they are deliberately excluded from the raw-ed25519 family.
 *
 * `params` is pure data (version bytes / bech32 hrp); the byte math lives in the address interpreter, since this package
 * has no crypto-library dependency. `scheme` and `coinType` are always sourced from {@link SIGNATURE_SCHEMES} and
 * {@link COIN_TYPES}, never invented here.
 */

import type { SignatureScheme } from "./schemes.js";
import { COIN_TYPES } from "./slip44.js";

/**
 * The pubkey→address encoding a raw-key descriptor applies. UTXO chains fan out to every realistic historical script
 * type because a raw key has no xpub to disambiguate which one was funded: uncompressed and compressed P2PKH always,
 * plus nested and native segwit where the chain supports them.
 */
export type RawKeyEncoding =
  | "evm"
  | "utxo-p2pkh-uncompressed"
  | "utxo-p2pkh-compressed"
  | "utxo-p2sh-p2wpkh"
  | "utxo-p2wpkh"
  | "tron"
  | "ripple"
  | "eos-k1"
  | "solana"
  | "stellar"
  | "algorand"
  | "multiversx"
  | "waves"
  | "neo-legacy";

/** Declarative encoding parameters. Only the fields an `encoding` needs are present. */
export type RawKeyEncodingParams = {
  /** base58check version byte(s) for a P2PKH-style address. Zcash's transparent prefix is two bytes. */
  readonly p2pkhVersion?: number | readonly number[];
  /** base58check version byte for a P2SH-wrapped (nested segwit) address. */
  readonly p2shVersion?: number;
  /** bech32 human-readable part for a native-segwit (P2WPKH) address. */
  readonly bech32Hrp?: string;
};

/** One raw-key address form: a curve, a coin type, and the encoding that turns the secret's public key into an address. */
export type RawKeyDescriptor = {
  readonly ecosystem: string;
  readonly scheme: SignatureScheme;
  readonly coinType: number;
  readonly encoding: RawKeyEncoding;
  readonly params?: RawKeyEncodingParams;
};

type UtxoChainSpec = {
  readonly ecosystem: string;
  readonly coinType: number;
  /** base58check P2PKH version byte(s). */
  readonly p2pkhVersion: number | readonly number[];
  /** base58check P2SH version byte; present iff the chain supports nested segwit. */
  readonly p2shVersion?: number;
  /** bech32 hrp; present iff the chain supports native segwit. */
  readonly bech32Hrp?: string;
};

// secp256k1 transparent UTXO chains. Segwit fields are present only where the chain actually deployed segwit: Bitcoin
// Cash, Dash, and transparent Zcash never did, so they enumerate P2PKH forms only.
const UTXO_CHAIN_SPECS: readonly UtxoChainSpec[] = [
  {
    bech32Hrp: "bc",
    coinType: COIN_TYPES.BITCOIN,
    ecosystem: "bitcoin",
    p2pkhVersion: 0x00,
    p2shVersion: 0x05,
  },
  { coinType: COIN_TYPES.BITCOIN_CASH, ecosystem: "bitcoin-cash", p2pkhVersion: 0x00 },
  {
    bech32Hrp: "btg",
    coinType: COIN_TYPES.BITCOIN_GOLD,
    ecosystem: "bitcoin-gold",
    p2pkhVersion: 0x26,
    p2shVersion: 0x17,
  },
  {
    bech32Hrp: "ltc",
    coinType: COIN_TYPES.LITECOIN,
    ecosystem: "litecoin",
    p2pkhVersion: 0x30,
    p2shVersion: 0x32,
  },
  { coinType: COIN_TYPES.DASH, ecosystem: "dash", p2pkhVersion: 0x4c },
  { coinType: COIN_TYPES.ZCASH, ecosystem: "zcash", p2pkhVersion: [0x1c, 0xb8] },
  { coinType: COIN_TYPES.VERGE, ecosystem: "verge", p2pkhVersion: 0x1e },
];

function utxoDescriptors(spec: UtxoChainSpec): RawKeyDescriptor[] {
  const base = { coinType: spec.coinType, ecosystem: spec.ecosystem, scheme: "secp256k1" } as const;
  const descriptors: RawKeyDescriptor[] = [
    { ...base, encoding: "utxo-p2pkh-uncompressed", params: { p2pkhVersion: spec.p2pkhVersion } },
    { ...base, encoding: "utxo-p2pkh-compressed", params: { p2pkhVersion: spec.p2pkhVersion } },
  ];
  if (spec.p2shVersion !== undefined) {
    descriptors.push({
      ...base,
      encoding: "utxo-p2sh-p2wpkh",
      params: { p2shVersion: spec.p2shVersion },
    });
  }
  if (spec.bech32Hrp !== undefined) {
    descriptors.push({ ...base, encoding: "utxo-p2wpkh", params: { bech32Hrp: spec.bech32Hrp } });
  }
  return descriptors;
}

const SECP256K1_ACCOUNT_DESCRIPTORS: readonly RawKeyDescriptor[] = [
  { coinType: COIN_TYPES.ETHEREUM, ecosystem: "evm", encoding: "evm", scheme: "secp256k1" },
  { coinType: COIN_TYPES.TRON, ecosystem: "tron", encoding: "tron", scheme: "secp256k1" },
  { coinType: COIN_TYPES.RIPPLE, ecosystem: "ripple", encoding: "ripple", scheme: "secp256k1" },
  { coinType: COIN_TYPES.EOS, ecosystem: "eos-vaulta", encoding: "eos-k1", scheme: "secp256k1" },
];

const ED25519_DESCRIPTORS: readonly RawKeyDescriptor[] = [
  { coinType: COIN_TYPES.SOLANA, ecosystem: "solana", encoding: "solana", scheme: "ed25519" },
  { coinType: COIN_TYPES.STELLAR, ecosystem: "stellar", encoding: "stellar", scheme: "ed25519" },
  { coinType: COIN_TYPES.ALGORAND, ecosystem: "algorand", encoding: "algorand", scheme: "ed25519" },
  {
    coinType: COIN_TYPES.MULTIVERSX,
    ecosystem: "multiversx",
    encoding: "multiversx",
    scheme: "ed25519",
  },
  { coinType: COIN_TYPES.WAVES, ecosystem: "waves", encoding: "waves", scheme: "ed25519" },
];

const SECP256R1_DESCRIPTORS: readonly RawKeyDescriptor[] = [
  {
    coinType: COIN_TYPES.NEO,
    ecosystem: "neo-legacy",
    encoding: "neo-legacy",
    scheme: "secp256r1",
  },
];

/**
 * Every raw-key address form, grouped by curve family. secp256k1 fans out to EVM, the transparent UTXO chains (each with
 * its script-type variants), Tron, Ripple, and EOS; ed25519 covers the RFC-8032 chains that share one public key; and
 * secp256r1 covers Neo Legacy.
 */
export const RAW_KEY_DESCRIPTORS: readonly RawKeyDescriptor[] = [
  ...SECP256K1_ACCOUNT_DESCRIPTORS,
  ...UTXO_CHAIN_SPECS.flatMap(utxoDescriptors),
  ...ED25519_DESCRIPTORS,
  ...SECP256R1_DESCRIPTORS,
];

const SCHEME_BY_ECOSYSTEM: ReadonlyMap<string, SignatureScheme> = new Map(
  RAW_KEY_DESCRIPTORS.map((descriptor) => [descriptor.ecosystem, descriptor.scheme])
);

/** Every raw-key descriptor whose curve is `scheme`. */
export function rawKeyDescriptorsForScheme(scheme: SignatureScheme): readonly RawKeyDescriptor[] {
  return RAW_KEY_DESCRIPTORS.filter((descriptor) => descriptor.scheme === scheme);
}

/** The curve a recorded raw-key ecosystem is enumerated under, or `undefined` when the ecosystem has no raw-key family. */
export function schemeForEcosystem(ecosystem: string): SignatureScheme | undefined {
  return SCHEME_BY_ECOSYSTEM.get(ecosystem);
}
