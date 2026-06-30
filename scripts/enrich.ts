// On-chain enrichment: reads decimals()/symbol()/name() for every candidate
// token across all supported chains and writes scripts/enriched.json — the
// committed, privacy-safe ground-truth cache (chain id + address + on-chain
// metadata only; no holdings provenance).
//
// Source token list = the prb-finance `included.tsv` ERC-20 rows (external,
// not committed) UNION the stablecoin/wrapped/mirror addresses this registry
// classifies. Run with: `just enrich` (bun scripts/enrich.ts).
//
// Usage:
//   bun scripts/enrich.ts            # fetch on-chain, write enriched.json, then codegen
//   bun scripts/enrich.ts --cached   # skip fetch, regenerate data files from cache
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { PublicClient, Chain as ViemChain } from "viem";
import { createPublicClient, fromHex, http } from "viem";
import * as viemChains from "viem/chains";
import { CHAINS } from "../src/chains/chains.js";
import { STABLECOIN_FAMILIES } from "./classification.js";
import { generate } from "./codegen.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const TOKEN_SOURCE_DIR =
  process.env.TOKEN_SOURCE_DIR ?? "/Users/prb/projects/prb-finance/onchain/evm/tokens";
const CACHE_PATH = join(HERE, "enriched.json");
const CHAIN_ID_BY_SLUG = new Map(CHAINS.map((chain) => [chain.slug, chain.chainId]));
const TOKEN_SOURCE_SLUG: Partial<Record<string, string>> = { mainnet: "ethereum" };

/** Map registry slug -> viem/chains export key (only where they differ). */
const VIEM_KEY: Partial<Record<string, keyof typeof viemChains>> = {
  "arbitrum-nova": "arbitrumNova",
  "core-dao": "coreDao",
  hyperevm: "hyperEvm",
  lightlink: "lightlinkPhoenix",
  mainnet: "mainnet",
  "world-chain": "worldchain",
};

/** Preferred RPC overrides (from cryptfolio RpcUrl), keyed by slug. */
const RPC_OVERRIDE: Partial<Record<string, string>> = {
  abstract: "https://api.mainnet.abs.xyz",
  arbitrum: "https://arbitrum-one.publicnode.com",
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
  base: "https://base.publicnode.com",
  berachain: "https://rpc.berachain-apis.com",
  blast: "https://rpc.blast.io",
  bsc: "https://bsc-dataseed1.binance.org",
  chiliz: "https://rpc.chiliz.com",
  gnosis: "https://rpc.gnosischain.com",
  hyperevm: "https://rpc.hyperliquid.xyz/evm",
  lightlink: "https://replicator.phoenix.lightlink.io/rpc/v1",
  linea: "https://linea-rpc.publicnode.com",
  mainnet: "https://ethereum.publicnode.com",
  mode: "https://1rpc.io/mode",
  monad: "https://rpc1.monad.xyz",
  morph: "https://rpc.morphl2.io",
  optimism: "https://optimism.publicnode.com",
  polygon: "https://polygon-bor.publicnode.com",
  scroll: "https://rpc.scroll.io",
  sonic: "https://rpc.soniclabs.com",
  sophon: "https://rpc.sophon.xyz",
  superseed: "https://superseed.drpc.org",
  unichain: "https://unichain-rpc.publicnode.com",
  xdc: "https://rpc.ankr.com/xdc",
  zksync: "https://mainnet.era.zksync.io",
};

const DECIMALS_ABI = [
  {
    inputs: [],
    name: "decimals",
    outputs: [{ type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
const SYMBOL_STRING_ABI = [
  {
    inputs: [],
    name: "symbol",
    outputs: [{ type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
const NAME_STRING_ABI = [
  {
    inputs: [],
    name: "name",
    outputs: [{ type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
const SYMBOL_BYTES32_ABI = [
  {
    inputs: [],
    name: "symbol",
    outputs: [{ type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
const NAME_BYTES32_ABI = [
  {
    inputs: [],
    name: "name",
    outputs: [{ type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export type EnrichedToken = {
  chainId: number;
  slug: string;
  address: `0x${string}`;
  symbol: string | null;
  name: string | null;
  decimals: number | null;
};

const lc = (a: string): `0x${string}` => a.toLowerCase() as `0x${string}`;
const ADDRESS_RE = /^0x[0-9a-f]{40}$/;
const ADDRESS_IN_URL = /0x[0-9a-fA-F]{40}/;
const VIEM_CHAINS = viemChains as Record<string, ViemChain>;

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isEnrichedToken(value: unknown): value is EnrichedToken {
  if (!value || typeof value !== "object") return false;
  const token = value as Record<string, unknown>;
  if (typeof token.slug !== "string") return false;

  const chainId = CHAIN_ID_BY_SLUG.get(token.slug);
  return (
    chainId !== undefined &&
    Number.isInteger(token.chainId) &&
    token.chainId === chainId &&
    typeof token.address === "string" &&
    ADDRESS_RE.test(token.address) &&
    (token.decimals === null || Number.isInteger(token.decimals)) &&
    isNullableString(token.name) &&
    isNullableString(token.symbol)
  );
}

function parseCachedTokens(raw: string): EnrichedToken[] {
  const value = JSON.parse(raw) as unknown;
  if (!Array.isArray(value)) throw new Error(`${CACHE_PATH} must contain an array`);

  const invalidIndex = value.findIndex((token) => !isEnrichedToken(token));
  if (invalidIndex !== -1) {
    throw new Error(`${CACHE_PATH} entry ${invalidIndex} is not a valid enriched token`);
  }
  return value;
}

/** Parse `included.tsv` ERC-20 rows for a chain; returns lowercased addresses. */
function readIncludedAddresses(slug: string): `0x${string}`[] {
  const path = join(TOKEN_SOURCE_DIR, TOKEN_SOURCE_SLUG[slug] ?? slug, "included.tsv");
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return [];
  }
  const out: `0x${string}`[] = [];
  const rows = raw.split("\n").slice(1); // drop header
  for (const row of rows) {
    const cols = row.split("\t");
    if (cols[1] !== "erc20") continue;
    const match = cols.at(-1)?.match(ADDRESS_IN_URL);
    if (match) out.push(lc(match[0]));
  }
  return out;
}

/** Build the full set of (slug -> addresses) to enrich. */
function buildUniverse(): Map<string, Set<`0x${string}`>> {
  const universe = new Map<string, Set<`0x${string}`>>();
  const add = (slug: string, address: string) => {
    const set = universe.get(slug);
    if (!set) throw new Error(`unknown chain slug in token universe: ${slug}`);

    const lower = lc(address);
    if (!ADDRESS_RE.test(lower)) throw new Error(`invalid token address for ${slug}: ${address}`);
    set.add(lower);
  };

  for (const chain of CHAINS) {
    universe.set(chain.slug, new Set());
    for (const address of readIncludedAddresses(chain.slug)) add(chain.slug, address);
    if (chain.wrappedNativeAddress) add(chain.slug, chain.wrappedNativeAddress);
    for (const mirror of chain.mirrorAddresses ?? []) add(chain.slug, mirror);
  }
  for (const family of STABLECOIN_FAMILIES) {
    for (const [slug, addresses] of Object.entries(family.contracts ?? {})) {
      for (const address of addresses) add(slug, address);
    }
  }
  return universe;
}

function clientFor(slug: string, useDefault = false): PublicClient {
  const viemKey = VIEM_KEY[slug] ?? slug;
  const chain = VIEM_CHAINS[viemKey];
  if (!chain) throw new Error(`no viem chain mapping for ${slug} (tried ${viemKey})`);

  const override = RPC_OVERRIDE[slug];
  const transport = !useDefault && override ? http(override) : http();
  return createPublicClient({ chain, transport, batch: { multicall: true } }) as PublicClient;
}

const NUL = String.fromCharCode(0);

const bytes32ToString = (hex: `0x${string}`): string => {
  try {
    // bytes32 strings are right-padded with NUL; terminate at the first one.
    const decoded = fromHex(hex, "string");
    const end = decoded.indexOf(NUL);
    return (end === -1 ? decoded : decoded.slice(0, end)).trim();
  } catch {
    return "";
  }
};

async function readField(
  client: PublicClient,
  addresses: `0x${string}`[],
  field: "symbol" | "name"
): Promise<Map<`0x${string}`, string | null>> {
  const stringAbi = field === "symbol" ? SYMBOL_STRING_ABI : NAME_STRING_ABI;
  const bytesAbi = field === "symbol" ? SYMBOL_BYTES32_ABI : NAME_BYTES32_ABI;
  const result = new Map<`0x${string}`, string | null>();
  const stringResults = await client.multicall({
    allowFailure: true,
    contracts: addresses.map((address) => ({ abi: stringAbi, address, functionName: field })),
  });
  const bytesRetry: `0x${string}`[] = [];
  addresses.forEach((address, i) => {
    const r = stringResults[i];
    if (r?.status === "success" && typeof r.result === "string") {
      result.set(address, (r.result as string).trim() || null);
    } else {
      bytesRetry.push(address);
    }
  });
  if (bytesRetry.length > 0) {
    const bytesResults = await client.multicall({
      allowFailure: true,
      contracts: bytesRetry.map((address) => ({ abi: bytesAbi, address, functionName: field })),
    });
    bytesRetry.forEach((address, i) => {
      const r = bytesResults[i];
      result.set(
        address,
        r?.status === "success" ? bytes32ToString(r.result as `0x${string}`) || null : null
      );
    });
  }
  return result;
}

async function enrichChain(
  slug: string,
  chainId: number,
  addresses: `0x${string}`[]
): Promise<EnrichedToken[]> {
  const attempt = async (useDefault: boolean) => {
    const client = clientFor(slug, useDefault);
    const decimalsResults = await client.multicall({
      allowFailure: true,
      contracts: addresses.map((address) => ({
        abi: DECIMALS_ABI,
        address,
        functionName: "decimals",
      })),
    });
    const symbols = await readField(client, addresses, "symbol");
    const names = await readField(client, addresses, "name");
    return addresses.map((address, i): EnrichedToken => {
      const d = decimalsResults[i];
      return {
        chainId,
        slug,
        address,
        decimals: d?.status === "success" ? Number(d.result) : null,
        name: names.get(address) ?? null,
        symbol: symbols.get(address) ?? null,
      };
    });
  };

  try {
    const first = await attempt(false);
    // Backfill ANY tokens the override RPC left unresolved from viem's default
    // RPC (a partial failure must not silently drop tokens).
    const hasMissingMetadata = first.some(
      (t) => t.decimals === null || t.name === null || t.symbol === null
    );
    if (hasMissingMetadata && RPC_OVERRIDE[slug]) {
      const second = await attempt(true);
      return first.map((t, i) => ({
        ...t,
        decimals: t.decimals ?? second[i]?.decimals ?? null,
        name: t.name ?? second[i]?.name ?? null,
        symbol: t.symbol ?? second[i]?.symbol ?? null,
      }));
    }
    return first;
  } catch (error) {
    console.error(
      `  [${slug}] override RPC failed (${(error as Error).message}); retrying default`
    );
    try {
      return await attempt(true);
    } catch (error2) {
      console.error(`  [${slug}] default RPC failed too (${(error2 as Error).message})`);
      return addresses.map((address) => ({
        chainId,
        slug,
        address,
        decimals: null,
        name: null,
        symbol: null,
      }));
    }
  }
}

async function fetchAll(): Promise<EnrichedToken[]> {
  if (!existsSync(TOKEN_SOURCE_DIR)) {
    throw new Error(
      `TOKEN_SOURCE_DIR not found: ${TOKEN_SOURCE_DIR}\nSet TOKEN_SOURCE_DIR to the prb-finance evm tokens dir, or run \`just enrich --cached\` to regenerate from scripts/enriched.json.`
    );
  }
  const universe = buildUniverse();
  const all: EnrichedToken[] = [];
  for (const [slug, set] of universe) {
    const addresses = [...set];
    if (addresses.length === 0) continue;
    const chainId = CHAIN_ID_BY_SLUG.get(slug);
    if (chainId === undefined) throw new Error(`unknown chain slug in token universe: ${slug}`);

    process.stdout.write(`[${slug}] ${addresses.length} tokens... `);
    const enriched = await enrichChain(slug, chainId, addresses);
    const ok = enriched.filter((t) => t.decimals !== null).length;
    console.log(`${ok}/${addresses.length} resolved`);
    all.push(...enriched);
  }
  return all;
}

async function main() {
  const cached = process.argv.includes("--cached");
  let tokens: EnrichedToken[];
  if (cached) {
    tokens = parseCachedTokens(readFileSync(CACHE_PATH, "utf8"));
    console.log(`Loaded ${tokens.length} tokens from cache.`);
  } else {
    tokens = await fetchAll();
    tokens.sort((a, b) => a.chainId - b.chainId || a.address.localeCompare(b.address));
    writeFileSync(CACHE_PATH, `${JSON.stringify(tokens, null, 2)}\n`);
    const failed = tokens.filter((t) => t.decimals === null);
    console.log(`\nWrote ${tokens.length} tokens to enriched.json (${failed.length} unresolved).`);
    if (failed.length > 0) {
      console.log("Unresolved (no decimals):");
      for (const t of failed) console.log(`  ${t.slug}\t${t.address}`);
    }
  }
  generate(tokens);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
