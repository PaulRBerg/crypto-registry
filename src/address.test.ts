import { describe, expect, it } from "vitest";
import { isAddress, isAddressEqual, normalizeAddress } from "./address.js";

const CHECKSUMMED = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const LOWER = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const INVALID_ADDRESS_ERROR = /invalid evm address/i;

describe("isAddress", () => {
  it("accepts valid 0x 40-hex strings", () => {
    expect(isAddress(CHECKSUMMED)).toBe(true);
    expect(isAddress(LOWER)).toBe(true);
  });

  it("rejects malformed input", () => {
    expect(isAddress("0x123")).toBe(false);
    expect(isAddress("c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2")).toBe(false);
    expect(isAddress(`${LOWER}00`)).toBe(false);
    expect(isAddress("0xZZ2aaa39b223fe8d0a0e5c4f27ead9083c756cc2")).toBe(false);
  });
});

describe("normalizeAddress", () => {
  it("lowercases valid addresses", () => {
    expect(normalizeAddress(CHECKSUMMED)).toBe(LOWER);
  });

  it("throws on invalid addresses", () => {
    expect(() => normalizeAddress("0x123")).toThrow(INVALID_ADDRESS_ERROR);
  });
});

describe("isAddressEqual", () => {
  it("compares case-insensitively", () => {
    expect(isAddressEqual(CHECKSUMMED, LOWER)).toBe(true);
    expect(isAddressEqual(LOWER, LOWER)).toBe(true);
  });

  it("returns false for different addresses", () => {
    expect(isAddressEqual(LOWER, `0x${"0".repeat(40)}`)).toBe(false);
  });

  it("throws when an argument is invalid", () => {
    expect(() => isAddressEqual(LOWER, "nope")).toThrow();
  });
});
