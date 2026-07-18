import { describe, expect, it } from "vitest";
import { getChain } from "../chains/lookup.js";
import { TOKEN_ADDRESS_ALIASES } from "./aliases.js";
import {
  getMirrorTokens,
  getStablecoins,
  getStandardTokens,
  getToken,
  getTokensByChain,
  getTokensBySymbol,
  getWrappedTokens,
  resolveTokenAddress,
} from "./lookup.js";
import { TOKENS } from "./registry.js";
import { isMirror, isStablecoin, isStandard, isWrapped } from "./types.js";

const LOWERCASE_ADDRESS = /^0x[0-9a-f]{40}$/;
const BARE_TICKER_RE = /^[A-Za-z0-9][A-Za-z0-9_.-]*$/;

describe("registry integrity", () => {
  it("has unique (chainId, address) keys", () => {
    const seen = new Set<string>();
    for (const token of TOKENS) {
      const k = `${token.chainId}:${token.address}`;
      expect(seen.has(k), `duplicate key ${k}`).toBe(false);
      seen.add(k);
    }
  });

  it("every address is lowercase 40-hex", () => {
    for (const token of TOKENS) expect(token.address).toMatch(LOWERCASE_ADDRESS);
  });

  it("every symbol is non-empty", () => {
    for (const token of TOKENS) expect(token.symbol.length).toBeGreaterThan(0);
  });

  it("decimals are integers within 0..36", () => {
    for (const token of TOKENS) {
      expect(Number.isInteger(token.decimals), `${token.symbol} decimals`).toBe(true);
      expect(token.decimals).toBeGreaterThanOrEqual(0);
      expect(token.decimals).toBeLessThanOrEqual(36);
    }
  });

  it("every token belongs to a registered chain", () => {
    for (const token of TOKENS)
      expect(getChain(token.chainId), `chain ${token.chainId}`).toBeDefined();
  });

  it("kind partitions are exhaustive and disjoint", () => {
    const sum =
      getStablecoins().length +
      getWrappedTokens().length +
      getMirrorTokens().length +
      getStandardTokens().length;
    expect(sum).toBe(TOKENS.length);
  });
});

describe("token address aliases", () => {
  it("have unique lowercase keys on registered chains", () => {
    const seen = new Set<string>();
    for (const alias of TOKEN_ADDRESS_ALIASES) {
      expect(alias.historicalAddress).toMatch(LOWERCASE_ADDRESS);
      expect(alias.canonicalAddress).toMatch(LOWERCASE_ADDRESS);
      expect(getChain(alias.chainId), `chain ${alias.chainId}`).toBeDefined();
      const key = `${alias.chainId}:${alias.historicalAddress}`;
      expect(seen.has(key), `duplicate alias key ${key}`).toBe(false);
      seen.add(key);
    }
  });

  it("target same-chain canonical tokens without colliding with them", () => {
    for (const alias of TOKEN_ADDRESS_ALIASES) {
      expect(getToken(alias.chainId, alias.historicalAddress)).toBeUndefined();
      expect(
        getToken(alias.chainId, alias.canonicalAddress),
        `missing canonical target ${alias.chainId}:${alias.canonicalAddress}`
      ).toBeDefined();
    }
  });

  it("resolve to canonical tokens while preserving the relationship", () => {
    for (const alias of TOKEN_ADDRESS_ALIASES) {
      const mixedCaseAddress = `0x${alias.historicalAddress.slice(2).toUpperCase()}`;
      const resolved = resolveTokenAddress(alias.chainId, mixedCaseAddress);
      expect(resolved).toMatchObject({
        alias,
        relationship: "historical_event_emitter",
        token: { address: alias.canonicalAddress, chainId: alias.chainId },
      });
    }

    const canonical = getToken(1, "0x57ab1ec28d129707052df4df418d58a2d46d5f51");
    expect(resolveTokenAddress(1, "0x57Ab1ec28D129707052df4dF418D58a2D46d5f51")).toEqual({
      relationship: "canonical",
      token: canonical,
    });
    expect(resolveTokenAddress(1, "not-an-address")).toBeUndefined();
  });
});

describe("wrapped tokens", () => {
  it("only wrap the chain's native token", () => {
    for (const token of getWrappedTokens()) {
      expect(getChain(token.chainId)?.nativeCurrency.symbol).toBe(token.underlyingSymbol);
    }
  });
});

describe("mirror tokens", () => {
  it("resolve their mirror target", () => {
    for (const token of getMirrorTokens()) {
      if (token.mirrors === "native") {
        expect(getChain(token.chainId)).toBeDefined();
      } else {
        expect(token.mirrors.symbol.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("stablecoins", () => {
  it("classify canonical USDC/USDT/DAI/EURe as non-bridged stablecoins", () => {
    const canonical = [
      [1, "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "USDC"],
      [1, "0xdAC17F958D2ee523a2206206994597C13D831ec7", "USDT"],
      [1, "0x6B175474E89094C44Da98b954EedeAC495271d0F", "DAI"],
      [1, "0x39b8B6385416f4cA36a20319F70D28621895279D", "EURe"],
    ] as const;
    for (const [chainId, address, symbol] of canonical) {
      const token = getToken(chainId, address);
      expect(token, `${symbol} missing`).toBeDefined();
      if (token && isStablecoin(token)) {
        expect(token.bridged).toBe(false);
      } else {
        expect.fail(`${symbol} not a stablecoin`);
      }
    }
  });

  it("classify bridged variants as bridged stablecoins", () => {
    const bridged = [
      [137, "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"], // Polygon USDC.e
      [10, "0x7F5c764cBc14f9669B88837ca1490cCa17c31607"], // Optimism USDC.e
      [8453, "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA"], // Base USDbC
    ] as const;
    for (const [chainId, address] of bridged) {
      const token = getToken(chainId, address);
      if (token && isStablecoin(token)) {
        expect(token.bridged, `${chainId}:${address}`).toBe(true);
      } else {
        expect.fail(`${chainId}:${address} not a stablecoin`);
      }
    }
  });

  it("carries the current ecosystem ticker for each exact contract", () => {
    const expected = [
      [137, "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", "USDC.e"],
      [42_161, "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", "USDT0"],
      [42_220, "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e", "USDT"],
      [43_114, "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7", "USDt"],
      [8453, "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca", "USDbC"],
      [43_114, "0xd586e7f844cea2f87f50152665bcbc2c279d8d70", "DAI.e"],
      [137, "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", "DAI"],
    ] as const;
    for (const [chainId, address, ticker] of expected) {
      expect(getToken(chainId, address), `${chainId}:${address}`).toMatchObject({
        kind: "stablecoin",
        ticker,
      });
    }

    expect(getToken(42_161, "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8")).toMatchObject({
      bridged: true,
      kind: "stablecoin",
      ticker: "USDC.e",
    });
  });

  it("classify non-USDC/USDT/DAI/EURe stablecoin families", () => {
    const gusd = getToken(1, "0x056Fd409E1d7A124BD7017459DFEa2F387b6d5Cd"); // Gemini dollar
    expect(gusd && isStablecoin(gusd)).toBe(true);
  });

  it("classifies Polygon Polymarket USD by exact address and metadata", () => {
    const pusd = getToken(137, "0xC011a7E12a19f7B1f670d46F03B03f3342E82DFB");
    expect(pusd).toMatchObject({
      address: "0xc011a7e12a19f7b1f670d46f03b03f3342e82dfb",
      backing: "fiat",
      bridged: false,
      chainId: 137,
      decimals: 6,
      issuer: "Polymarket",
      kind: "stablecoin",
      peg: "USD",
      symbol: "pUSD",
    });
  });

  it("do NOT classify LP/receipt tokens that merely contain USD/DAI in the symbol", () => {
    const aUsdc = getToken(1, "0x9ba00d6856a4edf4665bca2c2309936572473b7e"); // Aave aUSDC
    expect(aUsdc, "aUSDC should be in the registry").toBeDefined();
    expect(aUsdc && isStablecoin(aUsdc)).toBe(false);
  });

  it("carry a peg and backing", () => {
    for (const token of getStablecoins()) {
      expect(["USD", "EUR"]).toContain(token.peg);
      expect(["fiat", "crypto"]).toContain(token.backing);
      expect(token.ticker).toMatch(BARE_TICKER_RE);
    }
  });
});

describe("remapped Synthetix proxies", () => {
  it("register the canonical sUSD/SNX proxies", () => {
    const susd = getToken(1, "0x57Ab1ec28D129707052df4dF418D58a2D46d5f51");
    expect(susd && isStandard(susd)).toBe(true);
    expect(getToken(1, "0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F")?.symbol).toBe("SNX");
  });

  it("exclude the non-canonical target addresses", () => {
    expect(getToken(1, "0x57ab1e02fee23774580c119740129eac7081e9d3")).toBeUndefined();
    expect(getToken(1, "0xc011a72400e58ecd99ee497cf89e3775d4bd732f")).toBeUndefined();
  });
});

describe("lookups", () => {
  it("getToken resolves a canonical token and ignores casing", () => {
    const usdc = getToken(1, "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
    expect(usdc?.symbol).toBe("USDC");
    expect(usdc && isStablecoin(usdc)).toBe(true);
  });

  it("getToken returns undefined for unknown or invalid input", () => {
    expect(getToken(1, "0x0000000000000000000000000000000000000000")).toBeUndefined();
    expect(getToken(1, "not-an-address")).toBeUndefined();
  });

  it("getTokensByChain returns only that chain's tokens", () => {
    const eth = getTokensByChain(1);
    expect(eth.length).toBeGreaterThan(0);
    expect(eth.every((t) => t.chainId === 1)).toBe(true);
  });

  it("getTokensBySymbol is case-insensitive and cross-chain", () => {
    const usdc = getTokensBySymbol("usdc");
    expect(usdc.length).toBeGreaterThan(1);
    expect(usdc.every((t) => t.symbol.toUpperCase() === "USDC")).toBe(true);
  });
});

describe("type guards", () => {
  it("narrow disjointly", () => {
    for (const token of TOKENS) {
      const matches = [isStandard, isStablecoin, isWrapped, isMirror].filter((guard) =>
        guard(token)
      );
      expect(matches.length, `${token.symbol} matched ${matches.length} guards`).toBe(1);
    }
  });
});
