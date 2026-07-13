// Hand-authored classification spec (privacy-safe: token addresses + metadata
// only — no holdings provenance). Consumed by both `enrich.ts` (to know which
// addresses to read on-chain) and `codegen.ts` (to classify + emit data files).
//
// Sources:
// - USDC/USDT allowlists: prb-finance src/policy/token-policy/{usdc,usdt}.ts
// - DAI/EURe addresses:   cryptfolio-scripts src/data.gs (Token map)
// - Other stablecoin families + remaps: on-chain investigation (see DROPPED).
//
// Native wrapped tokens and native mirrors are NOT listed here; they are
// derived from the chain registry (`wrappedNativeAddress` / `mirrorAddresses`).

/**
 * A stablecoin family. A token is classified into a family when its on-chain
 * symbol is one of `symbols` (exact, so decorated LP/receipt tokens such as
 * `aUSDC`/`cDAI`/`USDC/USDT sSLP` never match), or its address is in
 * `contracts`. `nativeSymbols` are the symbols of canonical (non-bridged)
 * issuer deployments; any other symbol — or a name signalling a bridge — is
 * flagged `bridged`.
 */
export type StablecoinFamily = {
  display: string;
  peg: "USD" | "EUR";
  backing: "fiat" | "crypto";
  issuer: string;
  /** Exact on-chain symbols that belong to this family. */
  symbols: readonly string[];
  /** Subset of `symbols` that denote canonical, non-bridged deployments. */
  nativeSymbols: readonly string[];
  /** Canonical per-chain addresses to guarantee in the registry/universe. */
  contracts?: Record<string, readonly string[]>;
};

export const STABLECOIN_FAMILIES: readonly StablecoinFamily[] = [
  {
    backing: "fiat",
    display: "USDC",
    issuer: "Circle",
    nativeSymbols: ["USDC"],
    peg: "USD",
    symbols: ["USDC", "USDC.e", "USDbC"],
    contracts: {
      "core-dao": ["0xa4151b2b3e269645181dccf2d426ce75fcbdeca9"],
      gnosis: ["0xddafbb505ad214d7b80b1f830fccc89b60fb7a83"],
      hyperevm: ["0xb88339cb7199b77e23db6e890353e22632ba630f"],
      lightlink: ["0x18fb38404dadee1727be4b805c5b242b5413fa40"],
      linea: ["0x176211869ca2b568f2a7d4ee941e073a821ee1ff"],
      mainnet: ["0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"],
      mode: ["0xd988097fb8612cc24eec14542bc03424c656005f"],
      monad: ["0x754704bc059f8c67012fed69bc8a327a5aafb603"],
      optimism: ["0x0b2c639c533813f4aa9d7837caf62653d097ff85"],
      ronin: ["0x0b7007c13325c48911f73a2dad5fa5dcbf808adc"],
      scroll: ["0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4"],
      sei: ["0xe15fc38f6d8c56af07bbcbe3baf5708a2bf42392"],
      sonic: ["0x29219dd400f2bf60e5a23d13be72b486d4038894"],
      sophon: ["0x9aa0f72392b5784ad86c6f3e899bcc053d00db4f"],
      superseed: ["0xc316c8252b5f2176d0135ebb0999e99296998f2e"],
      unichain: ["0x078d782b760474a361dda0af3839290b0ef57ad6"],
      "world-chain": ["0x79a02482a880bce3f13e09da970dc34db4cd24d1"],
      xdc: ["0xfa2958cb79b0491cc627c1557f441ef849ca8eb1"],
      arbitrum: [
        "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
        "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
      ],
      avalanche: [
        "0xb24ca28d4e2742907115fecda335b40dbda07a4c",
        "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
      ],
      base: [
        "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
        "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca",
      ],
      bsc: [
        "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
        "0xb04906e95ab5d797ada81508115611fee694c2b3",
      ],
      celo: [
        "0x37f750b7cc259a2f741af45294f6a16572cf5cad",
        "0xceba9300f2b948710d2653dd7b07f33a8b32118c",
      ],
      morph: [
        "0xcfb1186f4e93d60e60a8bdd997427d1f33bc372b",
        "0xe34c91815d7fc18a9e2148bcd4241d0a5848b693",
      ],
      polygon: [
        "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
        "0x4318cb63a2b8edf2de971e2f17f77097e499459d",
      ],
      zksync: [
        "0x1d17cbcf0d6d143135ae902365d2e5e2a16538d4",
        "0x3355df6d4c9c3035724fd0e3914de96a5a83aaf4",
      ],
    },
  },
  {
    backing: "fiat",
    display: "pUSD",
    issuer: "Polymarket",
    nativeSymbols: ["pUSD"],
    peg: "USD",
    symbols: ["pUSD"],
    contracts: {
      polygon: ["0xc011a7e12a19f7b1f670d46f03b03f3342e82dfb"],
    },
  },
  {
    backing: "fiat",
    display: "USDT",
    issuer: "Tether",
    nativeSymbols: ["USDT", "USDt", "USD₮"],
    peg: "USD",
    symbols: ["USDT", "USDt", "USD₮", "USD₮0", "USDT0", "USDT-matic"],
    contracts: {
      arbitrum: ["0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9"],
      avalanche: ["0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7"],
      base: ["0xfde4c96c8593536e31f229ea8f37b2ada2699bb2"],
      celo: ["0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e"],
      "core-dao": ["0x900101d06a7426441ae63e9ab3b9b0f63be145f1"],
      gnosis: ["0x4ecaba5870353805a9f068101a40e0f32ed605c6"],
      iotex: ["0x3cdb7c48e70b854ed2fa392e21687501d84b3afc"],
      linea: ["0xa219439258ca9da29e9cc4ce5596924745e12b93"],
      mainnet: ["0xdac17f958d2ee523a2206206994597c13d831ec7"],
      mode: ["0xf0f161fda2712db8b566946122a5af183995e2ed"],
      morph: ["0xc7d67a9cbb121b3b0b9c053dd9f469523243379a"],
      optimism: ["0x94b008aa00579c1307b0ef2c499ad98a8ce58e58"],
      scroll: ["0xf55bec9cafdbe8730f096aa55dad6d22d44099df"],
      sei: ["0xb75d0b03c06a926e488e2659df1a861f860bd3d1"],
      sonic: ["0x6047828dc181963ba44974801ff68e538da5eaf9"],
      sophon: ["0x6386da73545ae4e2b2e0393688fa8b65bb9a7169"],
      unichain: ["0x588ce4f028d8e7b53b687865d6a67b3a54c75518"],
      xdc: ["0xcda5b77e2e2268d9e09c874c1b9a4c3f07b37555"],
      zksync: ["0x493257fd37edb34451f62edf8d2a0c418852ba4c"],
      bsc: [
        "0x524bc91dc82d6b90ef29f76a3ecaabafffd490bc",
        "0x55d398326f99059ff775485246999027b3197955",
      ],
      polygon: [
        "0x3553f861dec0257bada9f8ed268bf0d74e45e89c",
        "0x9417669fbf23357d2774e9d421307bd5ea1006d2",
        "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
      ],
    },
  },
  {
    backing: "crypto",
    display: "DAI",
    issuer: "MakerDAO",
    nativeSymbols: ["DAI"],
    peg: "USD",
    symbols: ["DAI", "DAI.e"],
    contracts: {
      arbitrum: ["0xda10009cbd5d07dd0cecc66161fc93d7c9000da1"],
      avalanche: ["0xd586e7f844cea2f87f50152665bcbc2c279d8d70"],
      bsc: ["0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3"],
      mainnet: ["0x6b175474e89094c44da98b954eedeac495271d0f"],
      optimism: ["0xda10009cbd5d07dd0cecc66161fc93d7c9000da1"],
      polygon: ["0x8f3cf7ad23cd3cadbd9735aff958023239c6a063"],
    },
  },
  {
    backing: "fiat",
    display: "EURe",
    issuer: "Monerium",
    nativeSymbols: ["EURe"],
    peg: "EUR",
    symbols: ["EURe"],
    contracts: {
      gnosis: ["0x420ca0f9b9b604ce0fd9c18ef134c705e5fa3430"],
      mainnet: ["0x39b8b6385416f4ca36a20319f70d28621895279d"],
    },
  },
  // Additional fiat/crypto stablecoin families (matched by exact symbol).
  {
    backing: "fiat",
    display: "BUSD",
    issuer: "Paxos",
    nativeSymbols: ["BUSD"],
    peg: "USD",
    symbols: ["BUSD", "BUSD-bsc"],
  },
  {
    backing: "fiat",
    display: "TUSD",
    issuer: "TrueUSD",
    nativeSymbols: ["TUSD"],
    peg: "USD",
    symbols: ["TUSD"],
  },
  {
    backing: "fiat",
    display: "GUSD",
    issuer: "Gemini",
    nativeSymbols: ["GUSD"],
    peg: "USD",
    symbols: ["GUSD"],
  },
  {
    backing: "fiat",
    display: "EURT",
    issuer: "Tether",
    nativeSymbols: ["EURT"],
    peg: "EUR",
    symbols: ["EURT"],
  },
  {
    backing: "crypto",
    display: "USDB",
    issuer: "Blast",
    nativeSymbols: ["USDB"],
    peg: "USD",
    symbols: ["USDB"],
  },
  {
    backing: "crypto",
    contracts: { mainnet: ["0x57ab1ec28d129707052df4df418d58a2d46d5f51"] },
    display: "sUSD",
    issuer: "Synthetix",
    nativeSymbols: ["sUSD"],
    peg: "USD",
    symbols: ["sUSD"],
  },
  {
    backing: "fiat",
    contracts: { fraxtal: ["0xfc00000000000000000000000000000000000001"] },
    display: "frxUSD",
    issuer: "Frax Finance",
    nativeSymbols: ["frxUSD"],
    peg: "USD",
    symbols: ["frxUSD"],
  },
];

/**
 * Addresses of bridged deployments whose on-chain symbol/name give no bridge
 * signal (so the symbol/name heuristic alone would mislabel them as native).
 * Keyed `chainId:address`. Best-effort — `bridged` is informational.
 */
export const FORCE_BRIDGED: readonly string[] = [
  "10:0x7f5c764cbc14f9669b88837ca1490cca17c31607", // Optimism USDC.e (symbol "USDC")
  "100:0xddafbb505ad214d7b80b1f830fccc89b60fb7a83", // Gnosis bridged USDC (symbol "USDC")
  "42161:0xff970a61a04b1ca14834a43f5de4533ebddb5cc8", // Arbitrum bridged USDC (name "USD Coin (Arb1)")
];

/**
 * Current ecosystem tickers for contracts whose on-chain symbol is stale or
 * ambiguous. Keyed `chainId:address` with lowercase addresses.
 */
export const TICKER_OVERRIDES: Readonly<Record<string, string>> = {
  "10:0x7f5c764cbc14f9669b88837ca1490cca17c31607": "USDC.e", // Optimism bridged USDC; symbol reads "USDC"
  "100:0xddafbb505ad214d7b80b1f830fccc89b60fb7a83": "USDC.e", // Gnosis bridged USDC; symbol reads "USDC"
  "137:0x2791bca1f2de4661ed88a30c99a7a9449aa84174": "USDC.e", // Polygon PoS bridged USDC; symbol reads "USDC"
  "42161:0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9": "USDT0", // Arbitrum; on-chain symbol "USD₮0" needs ASCII normalization
  "42161:0xff970a61a04b1ca14834a43f5de4533ebddb5cc8": "USDC.e", // Arbitrum bridged USDC; name is "USD Coin (Arb1)"
  "42220:0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e": "USDT", // Celo; on-chain symbol "USD₮" needs ASCII normalization
};

/**
 * Addresses present in the source holdings that are intentionally excluded.
 * Documented here so every drop is explicit and reviewable, and so codegen can
 * fail loudly on any *undocumented* un-enrichable token.
 */
export type DroppedToken = {
  chain: string;
  address: string;
  reason: string;
  selfDestructed?: true;
};

export const DROPPED: readonly DroppedToken[] = [
  {
    address: "0x6ac07b7c4601b5ce11de8dfe6335b871c7c4dd4d",
    chain: "mainnet",
    reason: "Urbit Ecliptic (Azimuth Points, AZP) — ERC-721, self-destructed 2021",
    selfDestructed: true,
  },
  {
    address: "0x96ec286e98f72e73682266eb4f6f15229d02aa00",
    chain: "mainnet",
    reason: "dead ERC-20 — self-destructed 2020-04-06, no bytecode",
    selfDestructed: true,
  },
  {
    address: "0xf244176246168f24e3187f7288edbca29267739b",
    chain: "mainnet",
    reason: "original Havven (HAV) — self-destructed 2018; succeeded by canonical SNX proxy",
    selfDestructed: true,
  },
  {
    address: "0x6fe981dbd557f81ff66836af0932cba535cbc343",
    chain: "monad",
    reason: "no contract ever deployed at this address",
  },
  {
    address: "0xf5b0a3efb8e8e4c201e2a935f110eaaf3ffecb8d",
    chain: "mainnet",
    reason: "Axie AxieCore — ERC-721 NFT (no decimals), not an ERC-20",
  },
  {
    address: "0x57ab1e02fee23774580c119740129eac7081e9d3",
    chain: "mainnet",
    reason:
      "Synthetix sUSD legacy target (reverts 'Only the proxy can call'); canonical proxy 0x57ab1ec2… is registered from holdings",
  },
  {
    address: "0xc011a72400e58ecd99ee497cf89e3775d4bd732f",
    chain: "mainnet",
    reason:
      "Synthetix SNX deprecated target (reverts 'Only the proxy can call'); canonical proxy 0xc011a73e… is registered from holdings",
  },
];
