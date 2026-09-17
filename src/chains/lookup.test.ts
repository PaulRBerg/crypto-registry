import { describe, expect, it } from "vitest";
import { CHAINS, VIEM_CHAINS_BY_SLUG } from "./chains.js";
import { allChains, getChain, getChainByName, getChainBySlug } from "./lookup.js";
import type { ChainCategory } from "./types.js";

const LOWERCASE_ADDRESS = /^0x[0-9a-f]{40}$/;
const CHAIN_CATEGORIES = new Set<ChainCategory>([
  "mainnet",
  "alt-l1",
  "op-stack",
  "nitro",
  "zk",
  "alt-l2",
]);
const viemChainsBySlug = VIEM_CHAINS_BY_SLUG as Record<
  string,
  (typeof VIEM_CHAINS_BY_SLUG)[keyof typeof VIEM_CHAINS_BY_SLUG]
>;
const NON_ETHEREUM_EOA_ACTIVITY_MODELS = {
  abstract: "native-account-abstraction",
  filecoin: "cross-vm",
  hyperevm: "cross-vm",
  sei: "cross-vm",
  sophon: "native-account-abstraction",
  zksync: "native-account-abstraction",
};

describe("chain registry", () => {
  it("exposes every chain", () => {
    expect(allChains()).toBe(CHAINS);
    expect(CHAINS.length).toBe(38);
  });

  it("has unique chain ids and slugs", () => {
    expect(new Set(CHAINS.map((c) => c.chainId)).size).toBe(CHAINS.length);
    expect(new Set(CHAINS.map((c) => c.slug)).size).toBe(CHAINS.length);
  });

  it("every native currency uses 18 decimals", () => {
    for (const chain of CHAINS) expect(chain.nativeCurrency.decimals).toBe(18);
  });

  it("classifies every chain's mnemonic-derived account activity model", () => {
    expect(
      Object.fromEntries(
        CHAINS.filter((chain) => chain.accountActivityModel !== "ethereum-eoa").map((chain) => [
          chain.slug,
          chain.accountActivityModel,
        ])
      )
    ).toEqual(NON_ETHEREUM_EOA_ACTIVITY_MODELS);
  });

  it("classifies every chain by its current architecture", () => {
    for (const chain of CHAINS) expect(CHAIN_CATEGORIES.has(chain.category)).toBe(true);

    expect(
      Object.fromEntries(
        [...CHAIN_CATEGORIES].map((category) => [
          category,
          CHAINS.filter((chain) => chain.category === category).length,
        ])
      )
    ).toEqual({
      mainnet: 1,
      "alt-l1": 15,
      "op-stack": 11,
      nitro: 3,
      zk: 7,
      "alt-l2": 1,
    });
  });

  it("reserves mainnet for Ethereum and covers key architecture assignments", () => {
    expect(
      CHAINS.filter((chain) => chain.category === "mainnet").map((chain) => chain.chainId)
    ).toEqual([1]);
    expect(getChainBySlug("polygon")?.category).toBe("alt-l1");
    expect(getChainBySlug("lightlink")?.category).toBe("alt-l2");
    expect(getChainBySlug("celo")?.category).toBe("op-stack");
    expect(getChainBySlug("ronin")?.category).toBe("op-stack");
    expect(getChainBySlug("robinhood")?.category).toBe("nitro");
    expect(getChainBySlug("morph")?.category).toBe("zk");
    expect(getChainBySlug("sophon")?.category).toBe("zk");
  });

  it("sources chain ids and native currencies from the supported viem mapping", () => {
    expect(Object.keys(VIEM_CHAINS_BY_SLUG).toSorted()).toEqual(
      CHAINS.map((chain) => chain.slug).toSorted()
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
    expect(getChainByName("fevm")?.slug).toBe("filecoin");
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
