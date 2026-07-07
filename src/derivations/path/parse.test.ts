import { describe, expect, it } from "vitest";
import { buildPath, formatPath, toBip32Indexes } from "./build.js";
import { DerivationPathError, parsePath, safeParsePath } from "./parse.js";
import { HARDENED_OFFSET, MAX_DERIVATION_INDEX } from "./segment.js";

describe("parsePath", () => {
  it("extracts positional BIP-44 fields", () => {
    const parsed = parsePath("m/44'/60'/0'/0/0");
    expect(parsed).toMatchObject({
      account: 0,
      addressIndex: 0,
      change: 0,
      coinType: 60,
      depth: 5,
      purpose: 44,
    });
  });

  it("omits absent positional fields", () => {
    const parsed = parsePath("m/44'/0'/3'");
    expect(parsed.purpose).toBe(44);
    expect(parsed.account).toBe(3);
    expect(parsed.change).toBeUndefined();
    expect(parsed.addressIndex).toBeUndefined();
  });

  it("accepts and normalizes h / H / ' hardened markers", () => {
    const parsed = parsePath("m/44h/60H/0'");
    expect(parsed.segments.every((segment) => segment.hardened)).toBe(true);
    expect(formatPath(parsed)).toBe("m/44'/60'/0'");
  });

  it("throws typed errors on malformed input", () => {
    expect(() => parsePath("")).toThrow(DerivationPathError);
    expect(() => parsePath("44'/0'")).toThrowError(
      expect.objectContaining({ code: "missing-master" })
    );
    expect(() => parsePath("m/xyz")).toThrowError(
      expect.objectContaining({ code: "invalid-segment" })
    );
    expect(() => parsePath("   ")).toThrowError(expect.objectContaining({ code: "empty" }));
  });

  it("rejects path levels at or above the hardened offset (2^31)", () => {
    expect(() => parsePath(`m/${2 ** 31}`)).toThrowError(
      expect.objectContaining({ code: "invalid-segment" })
    );
    expect(() => parsePath("m/44'/60'/0'/0/99999999999999999999")).toThrowError(
      expect.objectContaining({ code: "invalid-segment" })
    );
  });

  it("accepts the maximum soft index 2^31 - 1", () => {
    expect(parsePath(`m/${MAX_DERIVATION_INDEX}`).segments[0]?.index).toBe(MAX_DERIVATION_INDEX);
  });

  it("converts path levels to BIP-32 indexes", () => {
    expect(toBip32Indexes("m/44'/60'/0'/0/3")).toEqual([
      HARDENED_OFFSET + 44,
      HARDENED_OFFSET + 60,
      HARDENED_OFFSET,
      0,
      3,
    ]);
    expect(toBip32Indexes(parsePath("m/0'/1"))).toEqual([HARDENED_OFFSET, 1]);
  });

  it("preserves parse errors when converting string paths to BIP-32 indexes", () => {
    expect(() => toBip32Indexes("m/nope")).toThrowError(
      expect.objectContaining({ code: "invalid-segment" })
    );
  });

  it("safeParsePath does not throw", () => {
    expect(safeParsePath("m/44'/60'/0'/0/0").success).toBe(true);
    const bad = safeParsePath("nope");
    expect(bad.success).toBe(false);
    if (!bad.success) {
      expect(bad.error.code).toBe("missing-master");
    }
  });
});

describe("buildPath", () => {
  it("applies the standard BIP-44 hardening layout", () => {
    expect(buildPath({ account: 0, addressIndex: 3, change: 0, coinType: 60, purpose: 44 })).toBe(
      "m/44'/60'/0'/0/3"
    );
  });

  it("supports a contiguous prefix", () => {
    expect(buildPath({ account: 5, coinType: 0, purpose: 84 })).toBe("m/84'/0'/5'");
  });

  it("rejects non-contiguous components", () => {
    expect(() => buildPath({ addressIndex: 1, purpose: 44 })).toThrowError(
      expect.objectContaining({ code: "invalid-segment" })
    );
  });

  it("rejects components outside [0, 2^31)", () => {
    expect(() => buildPath({ purpose: 2 ** 31 })).toThrowError(
      expect.objectContaining({ code: "invalid-segment" })
    );
    expect(() => buildPath({ purpose: -1 })).toThrowError(
      expect.objectContaining({ code: "invalid-segment" })
    );
  });

  it("round-trips with parsePath for standard paths", () => {
    for (const path of ["m/44'/60'/0'/0/0", "m/44'/60'/0'/0/3", "m/84'/0'/5'"]) {
      const parsed = parsePath(path);
      expect(formatPath(parsed)).toBe(path);
      expect(
        buildPath({
          account: parsed.account,
          addressIndex: parsed.addressIndex,
          change: parsed.change,
          coinType: parsed.coinType,
          purpose: parsed.purpose,
        })
      ).toBe(path);
    }
  });
});
