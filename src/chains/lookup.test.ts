import { describe, expect, it } from "vitest";
import { CHAINS, VIEM_CHAINS_BY_SLUG } from "./chains.js";
import { allChains, getChain, getChainByName, getChainBySlug } from "./lookup.js";

const LOWERCASE_ADDRESS = /^0x[0-9a-f]{40}$/;
const viemChainsBySlug = VIEM_CHAINS_BY_SLUG as Record<
  string,
  (typeof VIEM_CHAINS_BY_SLUG)[keyof typeof VIEM_CHAINS_BY_SLUG]
>;

describe("chain registry", () => {
  it("exposes every chain", () => {
    expect(allChains()).toBe(CHAINS);
    expect(CHAINS.length).toBe(37);
  });

  it("has unique chain ids and slugs", () => {
    expect(new Set(CHAINS.map((c) => c.chainId)).size).toBe(CHAINS.length);
    expect(new Set(CHAINS.map((c) => c.slug)).size).toBe(CHAINS.length);
  });

  it("every native currency uses 18 decimals", () => {
    for (const chain of CHAINS) expect(chain.nativeCurrency.decimals).toBe(18);
  });

  it("sources chain ids and native currencies from the supported viem mapping", () => {
    expect(Object.keys(VIEM_CHAINS_BY_SLUG).sort()).toEqual(
      CHAINS.map((chain) => chain.slug).sort()
    );

    for (const chain of CHAINS) {
      const viemChain = viemChainsBySlug[chain.slug];
      expect(viemChain).toBeDefined();
      expect(chain.chainId).toBe(viemChain.id);
      expect(chain.nativeCurrency.decimals).toBe(viemChain.nativeCurrency.decimals);
      expect(chain.nativeCurrency.name).toBe(viemChain.nativeCurrency.name);
      expect(chain.nativeCurrency.symbol).toBe(
        chain.slug === "gnosis" ? "xDAI" : viemChain.nativeCurrency.symbol
      );
    }
  });

  it("wrapped/mirror addresses are lowercase 40-hex", () => {
    for (const chain of CHAINS) {
      if (chain.wrappedNativeAddress) expect(chain.wrappedNativeAddress).toMatch(LOWERCASE_ADDRESS);
      for (const mirror of chain.mirrorAddresses ?? []) expect(mirror).toMatch(LOWERCASE_ADDRESS);
    }
  });
});

describe("getChain / getChainBySlug", () => {
  it("resolves by id and slug", () => {
    expect(getChain(1)?.slug).toBe("mainnet");
    expect(getChainBySlug("mainnet")?.chainId).toBe(1);
    expect(getChainBySlug("arbitrum")?.chainId).toBe(42_161);
    expect(getChainBySlug("ethereum")).toBeUndefined();
    expect(getChain(999_999)).toBeUndefined();
  });
});

describe("getChainByName", () => {
  it("round-trips name, slug, and every alias (case-insensitively)", () => {
    for (const chain of CHAINS) {
      for (const lookup of [chain.name, chain.slug, ...chain.aliases]) {
        expect(getChainByName(lookup)?.chainId).toBe(chain.chainId);
        expect(getChainByName(lookup.toUpperCase())?.chainId).toBe(chain.chainId);
        expect(getChainByName(` ${lookup} `)?.chainId).toBe(chain.chainId);
      }
    }
  });

  it("resolves well-known aliases", () => {
    expect(getChainByName("eth")?.slug).toBe("mainnet");
    expect(getChainByName("ethereum")?.slug).toBe("mainnet");
    expect(getChainByName("matic")?.slug).toBe("polygon");
    expect(getChainByName("avax")?.slug).toBe("avalanche");
  });

  it("resolves differing viem display names as aliases", () => {
    for (const chain of CHAINS) {
      const viemName = viemChainsBySlug[chain.slug].name;
      if (viemName !== chain.name) expect(getChainByName(viemName)?.chainId).toBe(chain.chainId);
    }
  });

  it("returns undefined for unknown names", () => {
    expect(getChainByName("not-a-chain")).toBeUndefined();
  });
});
