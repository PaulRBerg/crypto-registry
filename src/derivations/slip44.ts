/**
 * SLIP-44 registered coin types and their display metadata.
 *
 * `COIN_TYPES` is the canonical, never-a-magic-number source for the `coinType` field of every derivation profile.
 *
 * @see https://github.com/satoshilabs/slips/blob/master/slip-0044.md
 */
export const COIN_TYPES = {
  ALGORAND: 283,
  APTOS: 637,
  BITCOIN: 0,
  BITCOIN_CASH: 145,
  BITCOIN_GOLD: 156,
  CARDANO: 1815,
  COSMOS: 118,
  DASH: 5,
  EOS: 194,
  ETHEREUM: 60,
  FUEL: 1_179_993_420,
  HANDSHAKE: 5353,
  HEDERA: 3030,
  HUSH: 197,
  IOTA: 4218,
  LITECOIN: 2,
  MONERO: 128,
  MULTIVERSX: 508,
  NAMADA: 877,
  NANO: 165,
  NAVCOIN: 130,
  NEO: 888,
  RADIX: 1022,
  RIPPLE: 144,
  SOLANA: 501,
  STARKNET: 9004,
  STELLAR: 148,
  SUBSTRATE: 354,
  TERRA: 330,
  TRON: 195,
  VERGE: 77,
  VERTCOIN: 28,
  WAVES: 5_741_564,
  ZCASH: 133,
} as const;

/** The screaming-snake keys of {@link COIN_TYPES}. */
export type CoinTypeKey = keyof typeof COIN_TYPES;

/** The numeric union of registered SLIP-44 coin types. */
export type CoinType = (typeof COIN_TYPES)[CoinTypeKey];

export type CoinTypeInfo = {
  readonly coinType: CoinType;
  readonly key: CoinTypeKey;
  readonly name: string;
  readonly symbol: string;
};

/** Display metadata (human name + ticker) for each registered coin type. */
export const COIN_TYPE_INFO = {
  ALGORAND: { coinType: COIN_TYPES.ALGORAND, key: "ALGORAND", name: "Algorand", symbol: "ALGO" },
  APTOS: { coinType: COIN_TYPES.APTOS, key: "APTOS", name: "Aptos", symbol: "APT" },
  BITCOIN: { coinType: COIN_TYPES.BITCOIN, key: "BITCOIN", name: "Bitcoin", symbol: "BTC" },
  CARDANO: { coinType: COIN_TYPES.CARDANO, key: "CARDANO", name: "Cardano", symbol: "ADA" },
  COSMOS: { coinType: COIN_TYPES.COSMOS, key: "COSMOS", name: "Cosmos", symbol: "ATOM" },
  DASH: { coinType: COIN_TYPES.DASH, key: "DASH", name: "Dash", symbol: "DASH" },
  EOS: { coinType: COIN_TYPES.EOS, key: "EOS", name: "EOS", symbol: "EOS" },
  ETHEREUM: { coinType: COIN_TYPES.ETHEREUM, key: "ETHEREUM", name: "Ethereum", symbol: "ETH" },
  FUEL: { coinType: COIN_TYPES.FUEL, key: "FUEL", name: "Fuel", symbol: "FUEL" },
  HANDSHAKE: { coinType: COIN_TYPES.HANDSHAKE, key: "HANDSHAKE", name: "Handshake", symbol: "HNS" },
  HEDERA: { coinType: COIN_TYPES.HEDERA, key: "HEDERA", name: "Hedera", symbol: "HBAR" },
  HUSH: { coinType: COIN_TYPES.HUSH, key: "HUSH", name: "Hush", symbol: "HUSH" },
  IOTA: { coinType: COIN_TYPES.IOTA, key: "IOTA", name: "IOTA", symbol: "IOTA" },
  LITECOIN: { coinType: COIN_TYPES.LITECOIN, key: "LITECOIN", name: "Litecoin", symbol: "LTC" },
  MONERO: { coinType: COIN_TYPES.MONERO, key: "MONERO", name: "Monero", symbol: "XMR" },
  NAMADA: { coinType: COIN_TYPES.NAMADA, key: "NAMADA", name: "Namada", symbol: "NAM" },
  NANO: { coinType: COIN_TYPES.NANO, key: "NANO", name: "Nano", symbol: "XNO" },
  NAVCOIN: { coinType: COIN_TYPES.NAVCOIN, key: "NAVCOIN", name: "NavCoin", symbol: "NAV" },
  NEO: { coinType: COIN_TYPES.NEO, key: "NEO", name: "Neo Legacy", symbol: "NEO" },
  RADIX: { coinType: COIN_TYPES.RADIX, key: "RADIX", name: "Radix", symbol: "XRD" },
  RIPPLE: { coinType: COIN_TYPES.RIPPLE, key: "RIPPLE", name: "XRP", symbol: "XRP" },
  SOLANA: { coinType: COIN_TYPES.SOLANA, key: "SOLANA", name: "Solana", symbol: "SOL" },
  STARKNET: { coinType: COIN_TYPES.STARKNET, key: "STARKNET", name: "Starknet", symbol: "STRK" },
  STELLAR: { coinType: COIN_TYPES.STELLAR, key: "STELLAR", name: "Stellar", symbol: "XLM" },
  SUBSTRATE: { coinType: COIN_TYPES.SUBSTRATE, key: "SUBSTRATE", name: "Polkadot", symbol: "DOT" },
  TERRA: { coinType: COIN_TYPES.TERRA, key: "TERRA", name: "Terra", symbol: "LUNA" },
  TRON: { coinType: COIN_TYPES.TRON, key: "TRON", name: "Tron", symbol: "TRX" },
  VERGE: { coinType: COIN_TYPES.VERGE, key: "VERGE", name: "Verge", symbol: "XVG" },
  VERTCOIN: { coinType: COIN_TYPES.VERTCOIN, key: "VERTCOIN", name: "Vertcoin", symbol: "VTC" },
  WAVES: { coinType: COIN_TYPES.WAVES, key: "WAVES", name: "Waves", symbol: "WAVES" },
  ZCASH: { coinType: COIN_TYPES.ZCASH, key: "ZCASH", name: "Zcash", symbol: "ZEC" },
  BITCOIN_CASH: {
    coinType: COIN_TYPES.BITCOIN_CASH,
    key: "BITCOIN_CASH",
    name: "Bitcoin Cash",
    symbol: "BCH",
  },
  BITCOIN_GOLD: {
    coinType: COIN_TYPES.BITCOIN_GOLD,
    key: "BITCOIN_GOLD",
    name: "Bitcoin Gold",
    symbol: "BTG",
  },
  MULTIVERSX: {
    coinType: COIN_TYPES.MULTIVERSX,
    key: "MULTIVERSX",
    name: "MultiversX",
    symbol: "EGLD",
  },
} as const satisfies Record<CoinTypeKey, CoinTypeInfo>;

/** Reverse lookup: coin type number -> its canonical {@link COIN_TYPES} key. */
export const keyByCoinType: ReadonlyMap<number, CoinTypeKey> = new Map(
  (Object.keys(COIN_TYPES) as CoinTypeKey[]).map((key) => [COIN_TYPES[key], key])
);

/** Whether `value` is a registered SLIP-44 coin type. */
export function isKnownCoinType(value: number): value is CoinType {
  return keyByCoinType.has(value);
}

/** Display metadata for a coin type, or `undefined` if unregistered. */
export function coinTypeInfo(coinType: number): CoinTypeInfo | undefined {
  const key = keyByCoinType.get(coinType);
  return key === undefined ? undefined : COIN_TYPE_INFO[key];
}

/** Human name for a coin type, or `undefined` if unregistered. */
export function coinTypeName(coinType: number): string | undefined {
  return coinTypeInfo(coinType)?.name;
}
