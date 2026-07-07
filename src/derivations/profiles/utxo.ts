import { bip44RootShape } from "../internal/shapes.js";
import type { Standard } from "../purposes.js";
import type { AddressKind } from "../schemes.js";
import { COIN_TYPES } from "../slip44.js";
import type { XpubFamily } from "../slip132.js";
import type { DerivationProfile } from "./types.js";

// Ledger's historical Vertcoin app uses coin type 128 in BIP49 paths, not Vertcoin's registered 28.
const LEDGER_VERTCOIN_COIN_TYPE = COIN_TYPES.MONERO;

const utxo = (
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

/** Transparent UTXO chains: legacy (BIP44), nested segwit (BIP49), and native segwit (BIP84). */
export const UTXO_PROFILES: readonly DerivationProfile[] = [
  utxo(
    "bitcoin-bip44-legacy-account",
    "bitcoin",
    44,
    COIN_TYPES.BITCOIN,
    "p2pkh",
    "xpub",
    "BIP44 Legacy",
    "bip44-legacy"
  ),
  utxo(
    "bitcoin-bip49-nested-segwit-account",
    "bitcoin",
    49,
    COIN_TYPES.BITCOIN,
    "p2sh-p2wpkh",
    "ypub",
    "BIP49 Nested Segwit",
    "bip49-nested-segwit"
  ),
  utxo(
    "bitcoin-bip84-native-segwit-account",
    "bitcoin",
    84,
    COIN_TYPES.BITCOIN,
    "p2wpkh",
    "zpub",
    "BIP84 Native Segwit",
    "bip84-native-segwit"
  ),
  utxo(
    "bitcoin-cash-bip44-legacy-account",
    "bitcoin-cash",
    44,
    COIN_TYPES.BITCOIN_CASH,
    "p2pkh",
    "xpub",
    "BIP44 Legacy",
    "bip44-legacy"
  ),
  utxo(
    "bitcoin-gold-bip44-legacy-account",
    "bitcoin-gold",
    44,
    COIN_TYPES.BITCOIN_GOLD,
    "p2pkh",
    "xpub",
    "BIP44 Legacy",
    "bip44-legacy"
  ),
  utxo(
    "dash-bip44-legacy-account",
    "dash",
    44,
    COIN_TYPES.DASH,
    "p2pkh",
    "xpub",
    "BIP44 Legacy",
    "bip44-legacy"
  ),
  utxo(
    "litecoin-bip44-legacy-account",
    "litecoin",
    44,
    COIN_TYPES.LITECOIN,
    "p2pkh",
    "Ltub",
    "BIP44 Legacy",
    "bip44-legacy"
  ),
  utxo(
    "litecoin-bip49-nested-segwit-account",
    "litecoin",
    49,
    COIN_TYPES.LITECOIN,
    "p2sh-p2wpkh",
    "Mtub",
    "BIP49 Nested Segwit",
    "bip49-nested-segwit"
  ),
  utxo(
    "litecoin-bip84-native-segwit-account",
    "litecoin",
    84,
    COIN_TYPES.LITECOIN,
    "p2wpkh",
    "xpub",
    "BIP84 Native Segwit",
    "bip84-native-segwit"
  ),
  utxo(
    "vertcoin-ledger-bip49-nested-segwit-account",
    "vertcoin",
    49,
    LEDGER_VERTCOIN_COIN_TYPE,
    "p2sh-p2wpkh",
    "ypub",
    "Vertcoin Ledger BIP49",
    "vertcoin-ledger-bip49"
  ),
  utxo(
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

/** Every UTXO chain modeled by {@link UTXO_PROFILES}. */
export const UTXO_CHAINS = [
  "bitcoin",
  "bitcoin-cash",
  "bitcoin-gold",
  "dash",
  "litecoin",
  "vertcoin",
  "zcash",
] as const;

export type UtxoChain = (typeof UTXO_CHAINS)[number];

/** Narrow an arbitrary chain slug to a known {@link UtxoChain}. */
export function isUtxoChain(value: string): value is UtxoChain {
  return (UTXO_CHAINS as readonly string[]).includes(value);
}
