import type { Chain as ViemChain } from "viem/chains";
import {
  abstract,
  arbitrum,
  arbitrumNova,
  avalanche,
  base,
  berachain,
  blast,
  bsc,
  celo,
  chiliz,
  coreDao,
  fantom,
  filecoin,
  fraxtal,
  gnosis,
  hyperEvm,
  iotex,
  lightlinkPhoenix,
  linea,
  mainnet,
  mode,
  monad,
  morph,
  optimism,
  polygon,
  robinhood,
  ronin,
  scroll,
  sei,
  sonic,
  sophon,
  superseed,
  taiko,
  unichain,
  worldchain,
  xdc,
  zksync,
  zora,
} from "viem/chains";
import type { Address } from "../address.js";
import type {
  AccountActivityModel,
  Chain,
  ChainCategory,
  ChainExplorer,
  FormerNativeCurrency,
} from "./types.js";

const CHAIN_SLUGS = [
  "abstract",
  "arbitrum",
  "arbitrum-nova",
  "avalanche",
  "base",
  "berachain",
  "blast",
  "bsc",
  "celo",
  "chiliz",
  "core-dao",
  "mainnet",
  "fantom",
  "filecoin",
  "fraxtal",
  "gnosis",
  "hyperevm",
  "iotex",
  "lightlink",
  "linea",
  "mode",
  "monad",
  "morph",
  "optimism",
  "polygon",
  "robinhood",
  "ronin",
  "scroll",
  "sei",
  "sonic",
  "sophon",
  "superseed",
  "taiko",
  "unichain",
  "world-chain",
  "xdc",
  "zksync",
  "zora",
] as const;

type ChainSlug = (typeof CHAIN_SLUGS)[number];

const TRAILING_SLASHES = /\/+$/;

/** @internal viem chains for the evm-atlas target set only. */
export const VIEM_CHAINS_BY_SLUG = {
  abstract,
  arbitrum,
  "arbitrum-nova": arbitrumNova,
  avalanche,
  base,
  berachain,
  blast,
  bsc,
  celo,
  chiliz,
  "core-dao": coreDao,
  mainnet,
  fantom,
  filecoin,
  fraxtal,
  gnosis,
  hyperevm: hyperEvm,
  iotex,
  lightlink: lightlinkPhoenix,
  linea,
  mode,
  monad,
  morph,
  optimism,
  polygon,
  robinhood,
  ronin,
  scroll,
  sei,
  sonic,
  sophon,
  superseed,
  taiko,
  unichain,
  "world-chain": worldchain,
  xdc,
  zksync,
  zora,
} as const satisfies Record<ChainSlug, ViemChain>;

type LocalChainMetadata = {
  accountActivityModel: AccountActivityModel;
  aliases?: readonly string[];
  category: ChainCategory;
  coinGeckoPlatformId?: string;
  explorer?: ChainExplorer;
  formerNativeCurrencies?: readonly FormerNativeCurrency[];
  mirrorAddresses?: readonly Address[];
  name: string;
  nativeCoinGeckoId: string;
  nativeSymbol?: string;
  wrappedNativeAddress?: Address;
};

const LOCAL_CHAIN_METADATA = {
  abstract: {
    accountActivityModel: "native-account-abstraction",
    category: "zk",
    coinGeckoPlatformId: "abstract",
    name: "Abstract",
    nativeCoinGeckoId: "ethereum",
  },
  arbitrum: {
    accountActivityModel: "ethereum-eoa",
    category: "nitro",
    aliases: ["Arbitrum One"],
    coinGeckoPlatformId: "arbitrum-one",
    name: "Arbitrum",
    nativeCoinGeckoId: "ethereum",
    wrappedNativeAddress: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
  },
  "arbitrum-nova": {
    accountActivityModel: "ethereum-eoa",
    category: "nitro",
    coinGeckoPlatformId: "arbitrum-nova",
    name: "Arbitrum Nova",
    nativeCoinGeckoId: "ethereum",
    explorer: {
      addressUrl: "https://arbitrum-nova.blockscout.com/address/{address}",
      txUrl: "https://arbitrum-nova.blockscout.com/tx/{tx_hash}",
    },
  },
  avalanche: {
    accountActivityModel: "ethereum-eoa",
    category: "alt-l1",
    aliases: ["avalanche c-chain", "avax"],
    coinGeckoPlatformId: "avalanche",
    name: "Avalanche",
    nativeCoinGeckoId: "avalanche-2",
    wrappedNativeAddress: "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7",
    explorer: {
      addressUrl: "https://snowscan.xyz/address/{address}",
      txUrl: "https://snowscan.xyz/tx/{tx_hash}",
    },
  },
  base: {
    accountActivityModel: "ethereum-eoa",
    category: "op-stack",
    coinGeckoPlatformId: "base",
    mirrorAddresses: ["0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000"],
    name: "Base",
    nativeCoinGeckoId: "ethereum",
    wrappedNativeAddress: "0x4200000000000000000000000000000000000006",
  },
  berachain: {
    accountActivityModel: "ethereum-eoa",
    category: "alt-l1",
    coinGeckoPlatformId: "berachain",
    name: "Berachain",
    nativeCoinGeckoId: "berachain-bera",
    wrappedNativeAddress: "0x6969696969696969696969696969696969696969",
  },
  blast: {
    accountActivityModel: "ethereum-eoa",
    category: "op-stack",
    coinGeckoPlatformId: "blast",
    name: "Blast",
    nativeCoinGeckoId: "ethereum",
    wrappedNativeAddress: "0x4300000000000000000000000000000000000004",
  },
  bsc: {
    accountActivityModel: "ethereum-eoa",
    category: "alt-l1",
    aliases: ["binance smart chain", "bnb", "BNB Smart Chain"],
    coinGeckoPlatformId: "binance-smart-chain",
    name: "BNB Chain",
    nativeCoinGeckoId: "binancecoin",
    wrappedNativeAddress: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
  },
  celo: {
    accountActivityModel: "ethereum-eoa",
    category: "op-stack",
    coinGeckoPlatformId: "celo",
    mirrorAddresses: ["0x471ece3750da237f93b8e339c536989b8978a438"],
    name: "Celo",
    nativeCoinGeckoId: "celo",
  },
  chiliz: {
    accountActivityModel: "ethereum-eoa",
    category: "alt-l1",
    aliases: ["Chiliz Chain"],
    coinGeckoPlatformId: "chiliz",
    name: "Chiliz",
    nativeCoinGeckoId: "chiliz",
    explorer: {
      addressUrl: "https://chiliscan.com/address/{address}",
      txUrl: "https://chiliscan.com/tx/{tx_hash}",
    },
  },
  "core-dao": {
    accountActivityModel: "ethereum-eoa",
    category: "alt-l1",
    aliases: ["coreDao"],
    coinGeckoPlatformId: "core",
    name: "Core Dao",
    nativeCoinGeckoId: "coredaoorg",
  },
  fantom: {
    accountActivityModel: "ethereum-eoa",
    category: "alt-l1",
    aliases: ["fantom opera", "ftm"],
    coinGeckoPlatformId: "fantom",
    name: "Fantom",
    nativeCoinGeckoId: "fantom",
    wrappedNativeAddress: "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83",
    explorer: {
      addressUrl: "https://explorer.fantom.network/address/{address}",
      txUrl: "https://explorer.fantom.network/tx/{tx_hash}",
    },
  },
  filecoin: {
    accountActivityModel: "cross-vm",
    category: "alt-l1",
    aliases: ["fevm", "filecoin evm", "fvm"],
    coinGeckoPlatformId: "filecoin",
    name: "Filecoin",
    nativeCoinGeckoId: "filecoin",
    explorer: {
      addressUrl: "https://filecoin.blockscout.com/address/{address}",
      txUrl: "https://filecoin.blockscout.com/tx/{tx_hash}",
    },
  },
  fraxtal: {
    accountActivityModel: "ethereum-eoa",
    category: "op-stack",
    aliases: ["frax"],
    coinGeckoPlatformId: "fraxtal",
    name: "Fraxtal",
    nativeCoinGeckoId: "frax-share",
    wrappedNativeAddress: "0xfc00000000000000000000000000000000000002",
    // frxETH was the native gas asset until the Northstar hardfork replaced it with FRAX (ex-FXS).
    // Activation: Fraxtal block 19571383, tx 0x30ecd5d4d33e823badbdef1eb2e2c040b1bb9c5cff7c76c1b7fb1dae6c2dad93
    // upgraded both predeploys (0x…0002 FXS → wFRAX, 0x…0006 wfrxETH → frxETH).
    formerNativeCurrencies: [
      {
        coinGeckoId: "frax-ether",
        symbol: "frxETH",
        untilUtc: "2025-04-29T19:04:37Z",
        wrappedNativeAddress: "0xfc00000000000000000000000000000000000006",
      },
    ],
  },
  gnosis: {
    accountActivityModel: "ethereum-eoa",
    category: "alt-l1",
    aliases: ["gnosis chain"],
    coinGeckoPlatformId: "xdai",
    name: "Gnosis",
    nativeCoinGeckoId: "dai",
    nativeSymbol: "xDAI",
    wrappedNativeAddress: "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d",
  },
  hyperevm: {
    accountActivityModel: "cross-vm",
    category: "alt-l1",
    aliases: ["hyper evm", "hyperliquid"],
    coinGeckoPlatformId: "hyperevm",
    name: "HyperEVM",
    nativeCoinGeckoId: "hyperliquid",
    wrappedNativeAddress: "0x5555555555555555555555555555555555555555",
  },
  iotex: {
    accountActivityModel: "ethereum-eoa",
    category: "alt-l1",
    coinGeckoPlatformId: "iotex",
    name: "IoTeX",
    nativeCoinGeckoId: "iotex",
    wrappedNativeAddress: "0xa00744882684c3e4747faefd68d283ea44099d03",
  },
  lightlink: {
    accountActivityModel: "ethereum-eoa",
    category: "alt-l2",
    aliases: ["lightlink phoenix", "LightLink Phoenix Mainnet"],
    coinGeckoPlatformId: "lightlink",
    name: "Lightlink",
    nativeCoinGeckoId: "ethereum",
  },
  linea: {
    accountActivityModel: "ethereum-eoa",
    category: "zk",
    aliases: ["Linea Mainnet"],
    coinGeckoPlatformId: "linea",
    name: "Linea",
    nativeCoinGeckoId: "ethereum",
    wrappedNativeAddress: "0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f",
  },
  mainnet: {
    accountActivityModel: "ethereum-eoa",
    category: "mainnet",
    aliases: ["eth", "ethereum", "ethereum mainnet"],
    coinGeckoPlatformId: "ethereum",
    name: "Ethereum",
    nativeCoinGeckoId: "ethereum",
    wrappedNativeAddress: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  },
  mode: {
    accountActivityModel: "ethereum-eoa",
    category: "op-stack",
    aliases: ["Mode Mainnet"],
    coinGeckoPlatformId: "mode",
    name: "Mode",
    nativeCoinGeckoId: "ethereum",
    wrappedNativeAddress: "0x4200000000000000000000000000000000000006",
    explorer: {
      addressUrl: "https://explorer.mode.network/address/{address}",
      txUrl: "https://explorer.mode.network/tx/{tx_hash}",
    },
  },
  monad: {
    accountActivityModel: "ethereum-eoa",
    category: "alt-l1",
    coinGeckoPlatformId: "monad",
    name: "Monad",
    nativeCoinGeckoId: "monad",
    wrappedNativeAddress: "0x3bd359c1119da7da1d913d1c4d2b7c461115433a",
  },
  morph: {
    accountActivityModel: "ethereum-eoa",
    category: "zk",
    coinGeckoPlatformId: "morph-l2",
    name: "Morph",
    nativeCoinGeckoId: "ethereum",
    wrappedNativeAddress: "0x5300000000000000000000000000000000000011",
    explorer: {
      addressUrl: "https://explorer.morph.network/address/{address}",
      apiUrl: "https://explorer-api.morph.network/api",
      txUrl: "https://explorer.morph.network/tx/{tx_hash}",
    },
  },
  optimism: {
    accountActivityModel: "ethereum-eoa",
    category: "op-stack",
    aliases: ["op", "OP Mainnet"],
    coinGeckoPlatformId: "optimistic-ethereum",
    mirrorAddresses: ["0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000"],
    name: "Optimism",
    nativeCoinGeckoId: "ethereum",
    wrappedNativeAddress: "0x4200000000000000000000000000000000000006",
  },
  polygon: {
    accountActivityModel: "ethereum-eoa",
    category: "alt-l1",
    aliases: ["matic", "pol"],
    coinGeckoPlatformId: "polygon-pos",
    mirrorAddresses: ["0x0000000000000000000000000000000000001010"],
    name: "Polygon",
    nativeCoinGeckoId: "polygon-ecosystem-token",
    wrappedNativeAddress: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
  },
  robinhood: {
    accountActivityModel: "ethereum-eoa",
    category: "nitro",
    coinGeckoPlatformId: "robinhood",
    name: "Robinhood Chain",
    nativeCoinGeckoId: "ethereum",
    wrappedNativeAddress: "0x0bd7d308f8e1639fab988df18a8011f41eacad73",
  },
  ronin: {
    accountActivityModel: "ethereum-eoa",
    category: "op-stack",
    coinGeckoPlatformId: "ronin",
    name: "Ronin",
    nativeCoinGeckoId: "ronin",
  },
  scroll: {
    accountActivityModel: "ethereum-eoa",
    category: "zk",
    coinGeckoPlatformId: "scroll",
    name: "Scroll",
    nativeCoinGeckoId: "ethereum",
    wrappedNativeAddress: "0x5300000000000000000000000000000000000004",
  },
  sei: {
    accountActivityModel: "cross-vm",
    category: "alt-l1",
    aliases: ["Sei Network"],
    coinGeckoPlatformId: "sei-v2",
    name: "Sei",
    nativeCoinGeckoId: "sei-network",
    wrappedNativeAddress: "0xe30fedd158a2e3b13e9badaeabafc5516e95e8c7",
    explorer: {
      addressUrl: "https://seiscan.io/address/{address}",
      txUrl: "https://seiscan.io/tx/{tx_hash}",
    },
  },
  sonic: {
    accountActivityModel: "ethereum-eoa",
    category: "alt-l1",
    coinGeckoPlatformId: "sonic",
    name: "Sonic",
    nativeCoinGeckoId: "sonic-3",
    wrappedNativeAddress: "0x039e2fb66102314ce7b64ce5ce3e5183bc94ad38",
  },
  sophon: {
    accountActivityModel: "native-account-abstraction",
    category: "zk",
    coinGeckoPlatformId: "sophon",
    name: "Sophon",
    nativeCoinGeckoId: "sophon",
  },
  superseed: {
    accountActivityModel: "ethereum-eoa",
    category: "op-stack",
    coinGeckoPlatformId: "superseed",
    name: "Superseed",
    nativeCoinGeckoId: "ethereum",
    wrappedNativeAddress: "0x4200000000000000000000000000000000000006",
  },
  taiko: {
    accountActivityModel: "ethereum-eoa",
    category: "zk",
    aliases: ["Taiko Alethia"],
    coinGeckoPlatformId: "taiko",
    name: "Taiko",
    nativeCoinGeckoId: "ethereum",
    wrappedNativeAddress: "0xa51894664a773981c6c112c43ce576f315d5b1b6",
  },
  unichain: {
    accountActivityModel: "ethereum-eoa",
    category: "op-stack",
    coinGeckoPlatformId: "unichain",
    name: "Unichain",
    nativeCoinGeckoId: "ethereum",
    wrappedNativeAddress: "0x4200000000000000000000000000000000000006",
  },
  "world-chain": {
    accountActivityModel: "ethereum-eoa",
    category: "op-stack",
    aliases: ["worldchain"],
    coinGeckoPlatformId: "world-chain",
    name: "World Chain",
    nativeCoinGeckoId: "ethereum",
    wrappedNativeAddress: "0x4200000000000000000000000000000000000006",
  },
  xdc: {
    accountActivityModel: "ethereum-eoa",
    category: "alt-l1",
    aliases: ["XDC Network"],
    coinGeckoPlatformId: "xdc-network",
    name: "XDC",
    nativeCoinGeckoId: "xdce-crowd-sale",
    wrappedNativeAddress: "0x951857744785e80e2de051c32ee7b25f9c458c42",
  },
  zksync: {
    accountActivityModel: "native-account-abstraction",
    category: "zk",
    coinGeckoPlatformId: "zksync",
    mirrorAddresses: ["0x000000000000000000000000000000000000800a"],
    name: "ZKsync Era",
    nativeCoinGeckoId: "ethereum",
    wrappedNativeAddress: "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91",
    explorer: {
      addressUrl: "https://explorer.zksync.io/address/{address}",
      txUrl: "https://explorer.zksync.io/tx/{tx_hash}",
    },
  },
  zora: {
    accountActivityModel: "ethereum-eoa",
    category: "op-stack",
    aliases: ["zora network"],
    coinGeckoPlatformId: "zora-network",
    explorer: {
      addressUrl: "https://app.zerion.io/{address}/history?chain=zora",
      txUrl: "https://explorer.zora.energy/tx/{tx_hash}",
    },
    name: "Zora",
    nativeCoinGeckoId: "ethereum",
    wrappedNativeAddress: "0x4200000000000000000000000000000000000006",
  },
} as const satisfies Record<ChainSlug, LocalChainMetadata>;

const explorerFromViem = (chain: ViemChain): ChainExplorer => {
  const url = chain.blockExplorers?.default.url?.replace(TRAILING_SLASHES, "");
  if (!url) throw new Error(`missing viem default explorer for ${chain.name}`);

  return {
    addressUrl: `${url}/address/{address}`,
    txUrl: `${url}/tx/{tx_hash}`,
  };
};

const aliasesWithViemName = (
  name: string,
  aliases: readonly string[],
  viemName: string
): readonly string[] => {
  if (name === viemName || aliases.includes(viemName)) return aliases;
  return [...aliases, viemName];
};

const buildChain = (slug: ChainSlug): Chain => {
  const viemChain = VIEM_CHAINS_BY_SLUG[slug];
  const metadata: LocalChainMetadata = LOCAL_CHAIN_METADATA[slug];

  return {
    accountActivityModel: metadata.accountActivityModel,
    aliases: aliasesWithViemName(metadata.name, metadata.aliases ?? [], viemChain.name),
    category: metadata.category,
    chainId: viemChain.id,
    ...(metadata.coinGeckoPlatformId ? { coinGeckoPlatformId: metadata.coinGeckoPlatformId } : {}),
    explorer: metadata.explorer ?? explorerFromViem(viemChain),
    ...(metadata.formerNativeCurrencies
      ? { formerNativeCurrencies: metadata.formerNativeCurrencies }
      : {}),
    ...(metadata.mirrorAddresses ? { mirrorAddresses: metadata.mirrorAddresses } : {}),
    name: metadata.name,
    nativeCurrency: {
      coinGeckoId: metadata.nativeCoinGeckoId,
      decimals: viemChain.nativeCurrency.decimals,
      name: viemChain.nativeCurrency.name,
      symbol: metadata.nativeSymbol ?? viemChain.nativeCurrency.symbol,
    },
    slug,
    ...(metadata.wrappedNativeAddress
      ? { wrappedNativeAddress: metadata.wrappedNativeAddress }
      : {}),
  };
};

/**
 * Every EVM chain supported by the registry.
 *
 * The supported set and Atlas-facing metadata stay local; chain ids and native
 * currency fields are sourced from viem/chains.
 */
export const CHAINS: readonly Chain[] = CHAIN_SLUGS.map(buildChain);
