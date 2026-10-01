import { describe, expect, it } from "vitest";
import { PRIVATE_KEY_FORMATS, privateKeyFormatForAddressKind } from "./private-key-formats.js";
import { ADDRESS_KINDS, type AddressKind } from "./schemes.js";

const EXPECTED_KINDS: readonly AddressKind[] = [
  "aptos",
  "cosmos",
  "eos",
  "evm",
  "fuel",
  "multiversx",
  "nano",
  "neo-legacy",
  "ripple",
  "solana",
  "starknet",
];

describe("PRIVATE_KEY_FORMATS", () => {
  it("declares a format for exactly the supported kinds", () => {
    expect(Object.keys(PRIVATE_KEY_FORMATS).toSorted()).toEqual([...EXPECTED_KINDS].toSorted());
  });

  it("uses only valid address kinds", () => {
    for (const kind of Object.keys(PRIVATE_KEY_FORMATS)) {
      expect(ADDRESS_KINDS).toContain(kind);
    }
  });

  it("leaves Bitcoin-family kinds to chain-level WIF versions", () => {
    for (const kind of ["p2pkh", "p2sh-p2wpkh", "p2wpkh"] as const) {
      expect(privateKeyFormatForAddressKind(kind)).toBeUndefined();
    }
  });

  it("encodes the documented formats", () => {
    expect(privateKeyFormatForAddressKind("evm")).toEqual({
      case: "lower",
      encoding: "hex",
      prefix: "0x",
    });
    expect(privateKeyFormatForAddressKind("nano")).toEqual({
      case: "upper",
      encoding: "hex",
      prefix: "",
    });
    expect(privateKeyFormatForAddressKind("eos")).toEqual({
      compressed: false,
      encoding: "wif",
      version: 0x80,
    });
    expect(privateKeyFormatForAddressKind("neo-legacy")).toEqual({
      compressed: true,
      encoding: "wif",
      version: 0x80,
    });
    expect(privateKeyFormatForAddressKind("solana")).toEqual({ encoding: "solana-keypair-base58" });
    expect(privateKeyFormatForAddressKind("aptos")).toEqual({
      encoding: "aip80",
      scheme: "ed25519",
    });
  });
});
