import { describe, expect, it } from "vitest";
import type { CoinTypeKey } from "./slip44.js";
import {
  COIN_TYPE_INFO,
  COIN_TYPES,
  coinTypeInfo,
  coinTypeName,
  isKnownCoinType,
  keyByCoinType,
} from "./slip44.js";

const KEYS = Object.keys(COIN_TYPES) as CoinTypeKey[];

describe("slip44 lookups", () => {
  it("resolves forward by key", () => {
    expect(COIN_TYPES.ETHEREUM).toBe(60);
    expect(COIN_TYPES.BITCOIN).toBe(0);
    expect(COIN_TYPES.MONERO).toBe(128);
    expect(COIN_TYPES.FUEL).toBe(1_179_993_420);
  });

  it("resolves reverse by number", () => {
    expect(keyByCoinType.get(60)).toBe("ETHEREUM");
    expect(coinTypeInfo(60)?.name).toBe("Ethereum");
    expect(coinTypeName(60)).toBe("Ethereum");
    expect(coinTypeName(0)).toBe("Bitcoin");
    expect(coinTypeName(128)).toBe("Monero");
  });

  it("reports membership", () => {
    expect(isKnownCoinType(60)).toBe(true);
    expect(isKnownCoinType(0)).toBe(true);
    expect(isKnownCoinType(999_999)).toBe(false);
    expect(coinTypeInfo(999_999)).toBeUndefined();
    expect(coinTypeName(999_999)).toBeUndefined();
  });

  it("has no colliding coin-type numbers", () => {
    const values = KEYS.map((key) => COIN_TYPES[key]);
    expect(new Set(values).size).toBe(values.length);
    expect(keyByCoinType.size).toBe(KEYS.length);
  });

  it("has display metadata for every coin type", () => {
    for (const key of KEYS) {
      const info = COIN_TYPE_INFO[key];
      expect(info.coinType).toBe(COIN_TYPES[key]);
      expect(info.key).toBe(key);
      expect(info.name.length).toBeGreaterThan(0);
      expect(info.symbol.length).toBeGreaterThan(0);
    }
  });
});
