// On-chain enrichment: reads decimals()/symbol()/name() for every candidate
// token across all supported chains and writes scripts/enriched.json — the
// committed, privacy-safe ground-truth cache (chain id + address + on-chain
// metadata only; no holdings provenance).
//
// Source token list = the prb-finance `included.tsv` ERC-20 rows (external,
// not committed) UNION the stablecoin/wrapped/mirror addresses this registry
// classifies. Run with: `just enrich`.
//
// Usage:
//   just enrich            # fetch through RouteMesh, write enriched.json, then codegen
//   just enrich --cached   # skip fetch, regenerate data files from cache
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { PublicClient } from "viem";
import { createPublicClient, fromHex, http } from "viem";
import { CHAINS, VIEM_CHAINS_BY_SLUG } from "../src/chains/chains.js";
import { STABLECOIN_FAMILIES } from "./classification.js";
import { generate } from "./codegen.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const TOKEN_SOURCE_DIR =
  process.env.TOKEN_SOURCE_DIR ?? "/Users/prb/projects/prb-finance/onchain/evm/tokens";
const CACHE_PATH = join(HERE, "enriched.json");
const ROUTEMESH_BASE_URL = "https://lb.routeme.sh/rpc";
const CHAIN_ID_BY_SLUG = new Map(CHAINS.map((chain) => [chain.slug, chain.chainId]));
const TOKEN_SOURCE_SLUG: Partial<Record<string, string>> = { mainnet: "ethereum" };
const TOKEN_METADATA_OVERRIDES = new Map<string, Partial<Pick<EnrichedToken, "name" | "symbol">>>([
  [
    "100:0xd4e420bbf00b0f409188b338c5d87df761d6c894",
    { name: "Agave interest bearing WxDAI", symbol: "agWxDAI" },
  ],
  ["100:0xe91d153e0b41518a2ce8dd3d7944fa863463a97d", { name: "Wrapped xDAI", symbol: "WxDAI" }],
]);

/** Public RPC fallbacks (from cryptfolio RpcUrl), keyed by slug. */
const PUBLIC_RPC_BY_SLUG: Partial<Record<string, string>> = {
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

// Independent wall-clock ceiling per RPC attempt. viem's own transport timeout
// (10s, AbortController-based) doesn't reliably tear down a request stuck in
// DNS/connect under Bun, and enrichChain runs up to 5 sequential multicalls
// per attempt — so one stuck call can otherwise block the run indefinitely.
const CHAIN_TIMEOUT_MS = 45_000;

function withHardTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

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

type ChainAttempt = () => Promise<EnrichedToken[]>;
type ChainEnrichmentOptions = {
  addresses: `0x${string}`[];
  cachedTokens: ReadonlyMap<string, EnrichedToken>;
  chainId: number;
  publicAttempt: ChainAttempt;
  routeMeshAttempt: ChainAttempt;
  routeMeshApiKey: string;
  slug: string;
  timeoutMs?: number;
  warn?: (message: string) => void;
};

const lc = (a: string): `0x${string}` => a.toLowerCase() as `0x${string}`;
const ADDRESS_RE = /^0x[0-9a-f]{40}$/;
const ADDRESS_IN_URL = /0x[0-9a-fA-F]{40}/;
const tokenKey = (chainId: number, address: string) => `${chainId}:${address.toLowerCase()}`;

function viemChainForSlug(slug: string) {
  if (Object.hasOwn(VIEM_CHAINS_BY_SLUG, slug)) {
    return VIEM_CHAINS_BY_SLUG[slug as keyof typeof VIEM_CHAINS_BY_SLUG];
  }
  return undefined;
}

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

function applyMetadataOverrides(token: EnrichedToken): EnrichedToken {
  const override = TOKEN_METADATA_OVERRIDES.get(tokenKey(token.chainId, token.address));
  return override ? { ...token, ...override } : token;
}

function canonicalizeTokens(tokens: EnrichedToken[]): EnrichedToken[] {
  return tokens.map((token) => {
    const canonical = applyMetadataOverrides(token);
    // biome-ignore assist/source/useSortedKeys: Preserve the committed cache's field order.
    return {
      chainId: canonical.chainId,
      slug: canonical.slug,
      address: canonical.address,
      symbol: canonical.symbol,
      name: canonical.name,
      decimals: canonical.decimals,
    };
  });
}

export function requireRouteMeshApiKey(value = process.env.ROUTEMESH_API_KEY): string {
  const apiKey = value?.trim();
  if (!apiKey || apiKey.startsWith("encrypted:")) {
    throw new Error(
      "ROUTEMESH_API_KEY is required for live enrichment; configure dotenvx or run `just enrich --cached`"
    );
  }
  return apiKey;
}

export function summarizeRpcError(error: unknown, routeMeshApiKey: string): string {
  const message = error instanceof Error ? error.message : String(error);
  const firstLine = message.split("\n", 1)[0] || "unknown error";
  return firstLine
    .replaceAll(routeMeshApiKey, "[redacted]")
    .replace(/https:\/\/lb\.routeme\.sh\/rpc\/\d+\/[^\s)]+/g, "RouteMesh RPC");
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

function clientFor(slug: string, rpcUrl?: string): PublicClient {
  const chain = viemChainForSlug(slug);
  if (!chain) throw new Error(`no viem chain mapping for ${slug}`);

  const transport = http(rpcUrl);
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

async function attemptChain(
  client: PublicClient,
  slug: string,
  chainId: number,
  addresses: `0x${string}`[]
): Promise<EnrichedToken[]> {
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
      address,
      chainId,
      decimals: d?.status === "success" ? Number(d.result) : null,
      name: names.get(address) ?? null,
      slug,
      symbol: symbols.get(address) ?? null,
    };
  });
}

function unresolvedToken(slug: string, chainId: number, address: `0x${string}`): EnrichedToken {
  return { address, chainId, decimals: null, name: null, slug, symbol: null };
}

export async function runChainEnrichment({
  addresses,
  cachedTokens,
  chainId,
  publicAttempt,
  routeMeshApiKey,
  routeMeshAttempt,
  slug,
  timeoutMs = CHAIN_TIMEOUT_MS,
  warn = console.error,
}: ChainEnrichmentOptions): Promise<EnrichedToken[]> {
  try {
    return await withHardTimeout(routeMeshAttempt(), timeoutMs, `[${slug}] RouteMesh`);
  } catch (error) {
    warn(
      `  [${slug}] RouteMesh failed (${summarizeRpcError(error, routeMeshApiKey)}); retrying public RPC`
    );
  }

  try {
    return await withHardTimeout(publicAttempt(), timeoutMs, `[${slug}] public RPC`);
  } catch (error) {
    const tokens = addresses.map(
      (address) =>
        cachedTokens.get(tokenKey(chainId, address)) ?? unresolvedToken(slug, chainId, address)
    );
    const recovered = tokens.filter((token) =>
      cachedTokens.has(tokenKey(chainId, token.address))
    ).length;
    warn(
      `  [${slug}] public RPC failed too (${summarizeRpcError(error, routeMeshApiKey)}); recovered ${recovered}/${addresses.length} tokens from cache`
    );
    return tokens;
  }
}

function enrichChain(
  slug: string,
  chainId: number,
  addresses: `0x${string}`[],
  cachedTokens: ReadonlyMap<string, EnrichedToken>,
  routeMeshApiKey: string
): Promise<EnrichedToken[]> {
  const routeMeshClient = clientFor(slug, `${ROUTEMESH_BASE_URL}/${chainId}/${routeMeshApiKey}`);
  const publicClient = clientFor(slug, PUBLIC_RPC_BY_SLUG[slug]);
  return runChainEnrichment({
    addresses,
    cachedTokens,
    chainId,
    publicAttempt: () => attemptChain(publicClient, slug, chainId, addresses),
    routeMeshApiKey,
    routeMeshAttempt: () => attemptChain(routeMeshClient, slug, chainId, addresses),
    slug,
  });
}

async function fetchAll(
  cachedTokens: readonly EnrichedToken[],
  routeMeshApiKey: string
): Promise<EnrichedToken[]> {
  if (!existsSync(TOKEN_SOURCE_DIR)) {
    throw new Error(
      `TOKEN_SOURCE_DIR not found: ${TOKEN_SOURCE_DIR}\nSet TOKEN_SOURCE_DIR to the prb-finance evm tokens dir, or run \`just enrich --cached\` to regenerate from scripts/enriched.json.`
    );
  }
  const universe = buildUniverse();
  const cachedByKey = new Map(
    cachedTokens.map((token) => [tokenKey(token.chainId, token.address), token] as const)
  );
  const all: EnrichedToken[] = [];
  for (const [slug, set] of universe) {
    const addresses = [...set];
    if (addresses.length === 0) continue;
    const chainId = CHAIN_ID_BY_SLUG.get(slug);
    if (chainId === undefined) throw new Error(`unknown chain slug in token universe: ${slug}`);

    process.stdout.write(`[${slug}] ${addresses.length} tokens... `);
    const enriched = await enrichChain(slug, chainId, addresses, cachedByKey, routeMeshApiKey);
    const resolvedCount = enriched.filter((token) => token.decimals !== null).length;
    console.log(`${resolvedCount}/${addresses.length} resolved`);
    all.push(...enriched);
  }
  return all;
}

async function main() {
  const useCachedTokens = process.argv.includes("--cached");
  const cachedRaw = readFileSync(CACHE_PATH, "utf8");
  const cachedTokens = parseCachedTokens(cachedRaw);
  let tokens: EnrichedToken[];
  if (useCachedTokens) {
    tokens = canonicalizeTokens(cachedTokens);
    console.log(`Loaded ${tokens.length} tokens from cache.`);
  } else {
    const routeMeshApiKey = requireRouteMeshApiKey();
    tokens = canonicalizeTokens(await fetchAll(cachedTokens, routeMeshApiKey));
    tokens.sort((a, b) => a.chainId - b.chainId || a.address.localeCompare(b.address));
    const unresolved = tokens.filter((token) => token.decimals === null);
    console.log(`\nFetched ${tokens.length} tokens (${unresolved.length} unresolved).`);
    if (unresolved.length > 0) {
      console.log("Unresolved (no decimals):");
      for (const token of unresolved) console.log(`  ${token.slug}\t${token.address}`);
    }
  }

  const serializedTokens = `${JSON.stringify(tokens, null, 2)}\n`;
  generate(tokens);
  if (serializedTokens !== cachedRaw) writeFileSync(CACHE_PATH, serializedTokens);
  const { emitJson } = await import("./emit-json.js");
  emitJson();
  console.log(`Wrote ${tokens.length} tokens to enriched.json.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(
    () => {
      // A watchdog-abandoned fetch (see withHardTimeout) can leave a dangling
      // handle that keeps the event loop alive; force termination once done.
      process.exit(0);
    },
    (error: unknown) => {
      console.error(error);
      process.exit(1);
    }
  );
}
