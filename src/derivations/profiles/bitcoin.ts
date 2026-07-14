import { bip44RootShape } from "../internal/shapes.js";
import type { Standard } from "../purposes.js";
import type { AddressKind } from "../schemes.js";
import { COIN_TYPES } from "../slip44.js";
import type { XpubFamily } from "../slip132.js";
import type { DerivationProfile } from "./types.js";

// Ledger's historical Vertcoin app uses coin type 128 in BIP49 paths, not Vertcoin's registered 28.
const LEDGER_VERTCOIN_COIN_TYPE = COIN_TYPES.MONERO;

const bitcoin = (
  id: string,
  chain: string,
  purpose: number,
  coinType: number,
  addressKind: AddressKind,
  xpubFamily: XpubFamily,
  standardName: string,
  standard: Standard
): DerivationProfile => ({
  addressKind,
  chain,
  coinType,
  ecosystems: [chain],
  id,
  purpose,
  scheme: "secp256k1",
  standard,
  standardName,
  template: bip44RootShape(purpose, coinType),
  xpubFamily,
});

/** Transparent Bitcoin-family chains: legacy (BIP44), nested segwit (BIP49), and native segwit (BIP84). */
export const BITCOIN_PROFILES: readonly DerivationProfile[] = [
  bitcoin(
    "bitcoin-bip44-legacy-account",
    "bitcoin",
    44,
    COIN_TYPES.BITCOIN,
    "p2pkh",
    "xpub",
    "BIP44 Legacy",
    "bip44-legacy"
  ),
  bitcoin(
    "bitcoin-bip49-nested-segwit-account",
    "bitcoin",
    49,
    COIN_TYPES.BITCOIN,
    "p2sh-p2wpkh",
    "ypub",
    "BIP49 Nested Segwit",
    "bip49-nested-segwit"
  ),
  bitcoin(
    "bitcoin-bip84-native-segwit-account",
    "bitcoin",
    84,
    COIN_TYPES.BITCOIN,
    "p2wpkh",
    "zpub",
    "BIP84 Native Segwit",
    "bip84-native-segwit"
  ),
  bitcoin(
    "bitcoin-cash-bip44-legacy-account",
    "bitcoin-cash",
    44,
    COIN_TYPES.BITCOIN_CASH,
    "p2pkh",
    "xpub",
    "BIP44 Legacy",
    "bip44-legacy"
  ),
  bitcoin(
    "bitcoin-gold-bip44-legacy-account",
    "bitcoin-gold",
    44,
    COIN_TYPES.BITCOIN_GOLD,
    "p2pkh",
    "xpub",
    "BIP44 Legacy",
    "bip44-legacy"
  ),
  bitcoin(
    "dash-bip44-legacy-account",
    "dash",
    44,
    COIN_TYPES.DASH,
    "p2pkh",
    "xpub",
    "BIP44 Legacy",
    "bip44-legacy"
  ),
  bitcoin(
    "litecoin-bip44-legacy-account",
    "litecoin",
    44,
    COIN_TYPES.LITECOIN,
    "p2pkh",
    "Ltub",
    "BIP44 Legacy",
    "bip44-legacy"
  ),
  bitcoin(
    "litecoin-bip49-nested-segwit-account",
    "litecoin",
    49,
    COIN_TYPES.LITECOIN,
    "p2sh-p2wpkh",
    "Mtub",
    "BIP49 Nested Segwit",
    "bip49-nested-segwit"
  ),
  bitcoin(
    "litecoin-bip84-native-segwit-account",
    "litecoin",
    84,
    COIN_TYPES.LITECOIN,
    "p2wpkh",
    "xpub",
    "BIP84 Native Segwit",
    "bip84-native-segwit"
  ),
  bitcoin(
    "vertcoin-ledger-bip49-nested-segwit-account",
    "vertcoin",
    49,
    LEDGER_VERTCOIN_COIN_TYPE,
    "p2sh-p2wpkh",
    "ypub",
    "Vertcoin Ledger BIP49",
    "vertcoin-ledger-bip49"
  ),
  bitcoin(
    "zcash-bip44-transparent-account",
    "zcash",
    44,
    COIN_TYPES.ZCASH,
    "p2pkh",
    "xpub",
    "BIP44 Transparent",
    "bip44-transparent"
  ),
];

/** Every Bitcoin-family chain modeled by {@link BITCOIN_PROFILES}. */
export const BITCOIN_CHAINS = [
  "bitcoin",
  "bitcoin-cash",
  "bitcoin-gold",
  "dash",
  "litecoin",
  "vertcoin",
  "zcash",
] as const;

export type BitcoinChain = (typeof BITCOIN_CHAINS)[number];

/** Narrow an arbitrary chain slug to a known {@link BitcoinChain}. */
export function isBitcoinChain(value: string): value is BitcoinChain {
  return (BITCOIN_CHAINS as readonly string[]).includes(value);
}
