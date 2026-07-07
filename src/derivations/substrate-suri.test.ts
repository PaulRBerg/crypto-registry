import { describe, expect, it } from "vitest";
import type { SubstrateSuri } from "./substrate-suri.js";
import {
  formatSubstrateSuri,
  isSubstrateSuri,
  parseSubstrateSuri,
  SUBSTRATE_ROOT_LABEL,
} from "./substrate-suri.js";

describe("parseSubstrateSuri", () => {
  it("treats the empty string and the root label as the seed account", () => {
    expect(parseSubstrateSuri("")).toEqual({ kind: "root" });
    expect(parseSubstrateSuri(SUBSTRATE_ROOT_LABEL)).toEqual({ kind: "root" });
  });

  it("parses a single hard junction", () => {
    expect(parseSubstrateSuri("//1")).toEqual({
      junctions: [{ code: "1", hard: true }],
      kind: "suri",
    });
  });

  it("parses a single soft junction", () => {
    expect(parseSubstrateSuri("/0")).toEqual({
      junctions: [{ code: "0", hard: false }],
      kind: "suri",
    });
  });

  it("parses a mixed chain of junctions", () => {
    expect(parseSubstrateSuri("//1//0")).toEqual({
      kind: "suri",
      junctions: [
        { code: "1", hard: true },
        { code: "0", hard: true },
      ],
    });
    expect(parseSubstrateSuri("//1/0")).toEqual({
      kind: "suri",
      junctions: [
        { code: "1", hard: true },
        { code: "0", hard: false },
      ],
    });
  });

  it("parses a string junction code", () => {
    expect(parseSubstrateSuri("//polkadot")).toEqual({
      junctions: [{ code: "polkadot", hard: true }],
      kind: "suri",
    });
  });

  it("rejects a BIP-32 path, malformed slashes, and bare words", () => {
    expect(parseSubstrateSuri("m/44'/354'/0'/0'/0'")).toBeUndefined();
    expect(parseSubstrateSuri("//1/")).toBeUndefined();
    expect(parseSubstrateSuri("///x")).toBeUndefined();
    expect(parseSubstrateSuri("foo")).toBeUndefined();
  });
});

describe("formatSubstrateSuri", () => {
  it("renders the root to the empty string", () => {
    expect(formatSubstrateSuri({ kind: "root" })).toBe("");
  });

  it("renders hard and soft junctions", () => {
    expect(
      formatSubstrateSuri({
        kind: "suri",
        junctions: [
          { code: "1", hard: true },
          { code: "0", hard: false },
        ],
      })
    ).toBe("//1/0");
  });
});

describe("isSubstrateSuri", () => {
  it("accepts roots and junction chains, rejects everything else", () => {
    expect(isSubstrateSuri("")).toBe(true);
    expect(isSubstrateSuri(SUBSTRATE_ROOT_LABEL)).toBe(true);
    expect(isSubstrateSuri("//1//0")).toBe(true);
    expect(isSubstrateSuri("m/44'/354'/0'/0'/0'")).toBe(false);
    expect(isSubstrateSuri("foo")).toBe(false);
  });
});

describe("round-trips", () => {
  const CANONICAL = ["", "//1", "/0", "//1//0", "//1/0", "//polkadot"];

  it("format ∘ parse is identity on canonical suffixes", () => {
    for (const suffix of CANONICAL) {
      expect(formatSubstrateSuri(parseSubstrateSuri(suffix) as SubstrateSuri)).toBe(suffix);
    }
  });

  it("parse ∘ format is identity on parsed values", () => {
    for (const suffix of CANONICAL) {
      const parsed = parseSubstrateSuri(suffix) as SubstrateSuri;
      expect(parseSubstrateSuri(formatSubstrateSuri(parsed))).toEqual(parsed);
    }
  });
});
