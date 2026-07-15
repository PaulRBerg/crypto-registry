import { describe, expect, it, vi } from "vitest";
import type { EnrichedToken } from "./enrich.js";
import { requireRouteMeshApiKey, runChainEnrichment, summarizeRpcError } from "./enrich.js";

const CHAIN_ID = 1;
const SLUG = "mainnet";
const API_KEY = "route-mesh-secret";
const ADDRESS_A = "0x1111111111111111111111111111111111111111";
const ADDRESS_B = "0x2222222222222222222222222222222222222222";

function token(
  address: `0x${string}`,
  metadata: Pick<EnrichedToken, "decimals" | "name" | "symbol">
): EnrichedToken {
  return { address, chainId: CHAIN_ID, slug: SLUG, ...metadata };
}

describe("RouteMesh enrichment", () => {
  it("keeps successful RouteMesh results with per-contract misses", async () => {
    const routeMeshTokens = [
      token(ADDRESS_A, { decimals: 18, name: "Token A", symbol: "A" }),
      token(ADDRESS_B, { decimals: null, name: null, symbol: null }),
    ];
    const routeMeshAttempt = vi.fn(async () => routeMeshTokens);
    const publicAttempt = vi.fn(async () => []);

    const result = await runChainEnrichment({
      addresses: [ADDRESS_A, ADDRESS_B],
      cachedTokens: new Map(),
      chainId: CHAIN_ID,
      publicAttempt,
      routeMeshApiKey: API_KEY,
      routeMeshAttempt,
      slug: SLUG,
    });

    expect(result).toEqual(routeMeshTokens);
    expect(routeMeshAttempt).toHaveBeenCalledOnce();
    expect(publicAttempt).not.toHaveBeenCalled();
  });

  it("uses the public RPC only after a RouteMesh transport failure", async () => {
    const publicTokens = [token(ADDRESS_A, { decimals: 6, name: "USD Coin", symbol: "USDC" })];
    const publicAttempt = vi.fn(async () => publicTokens);
    const warn = vi.fn();

    const result = await runChainEnrichment({
      addresses: [ADDRESS_A],
      cachedTokens: new Map(),
      chainId: CHAIN_ID,
      publicAttempt,
      routeMeshApiKey: API_KEY,
      routeMeshAttempt: vi.fn(() => Promise.reject(new Error("RouteMesh unavailable"))),
      slug: SLUG,
      warn,
    });

    expect(result).toEqual(publicTokens);
    expect(publicAttempt).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("retrying public RPC"));
  });

  it("recovers existing addresses from cache without masking new addresses", async () => {
    const cached = token(ADDRESS_A, { decimals: 18, name: "Cached Token", symbol: "CACHE" });
    const cachedTokens = new Map([[`${CHAIN_ID}:${ADDRESS_A}`, cached]]);
    const warnings: string[] = [];

    const result = await runChainEnrichment({
      addresses: [ADDRESS_A, ADDRESS_B],
      cachedTokens,
      chainId: CHAIN_ID,
      publicAttempt: vi.fn(() => Promise.reject(new Error("public RPC unavailable"))),
      routeMeshApiKey: API_KEY,
      routeMeshAttempt: vi.fn(() =>
        Promise.reject(new Error(`request https://lb.routeme.sh/rpc/${CHAIN_ID}/${API_KEY} failed`))
      ),
      slug: SLUG,
      warn: (message) => warnings.push(message),
    });

    expect(result).toEqual([
      cached,
      token(ADDRESS_B, { decimals: null, name: null, symbol: null }),
    ]);
    expect(warnings.join("\n")).toContain("recovered 1/2 tokens from cache");
    expect(warnings.join("\n")).not.toContain(API_KEY);
  });
});

describe("RouteMesh configuration", () => {
  it("requires a decrypted API key for live enrichment", () => {
    expect(() => requireRouteMeshApiKey(" ")).toThrow("ROUTEMESH_API_KEY is required");
    expect(() => requireRouteMeshApiKey("encrypted:ciphertext")).toThrow(
      "ROUTEMESH_API_KEY is required"
    );
    expect(requireRouteMeshApiKey(`  ${API_KEY}  `)).toBe(API_KEY);
  });

  it("redacts RouteMesh credentials and URLs from errors", () => {
    const summary = summarizeRpcError(
      new Error(`request https://lb.routeme.sh/rpc/${CHAIN_ID}/${API_KEY} failed`),
      API_KEY
    );

    expect(summary).toBe("request RouteMesh RPC failed");
    expect(summary).not.toContain(API_KEY);
  });
});
