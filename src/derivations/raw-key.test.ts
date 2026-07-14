import { describe, expect, it } from "vitest";
import { RAW_KEY_DESCRIPTORS, rawKeyDescriptorsForScheme, schemeForEcosystem } from "./raw-key.js";
import { isKnownCoinType } from "./slip44.js";

describe("rawKeyDescriptorsForScheme", () => {
  it("enumerates the secp256k1 account and Bitcoin family", () => {
    const encodingsByEcosystem = new Map<string, string[]>();
    for (const descriptor of rawKeyDescriptorsForScheme("secp256k1")) {
      const encodings = encodingsByEcosystem.get(descriptor.ecosystem) ?? [];
      encodings.push(descriptor.encoding);
      encodingsByEcosystem.set(descriptor.ecosystem, encodings);
    }

    expect(encodingsByEcosystem.get("evm")).toEqual(["evm"]);
    expect(encodingsByEcosystem.get("tron")).toEqual(["tron"]);
    expect(encodingsByEcosystem.get("ripple")).toEqual(["ripple"]);
    expect(encodingsByEcosystem.get("eos-vaulta")).toEqual(["eos-k1"]);
    // Bitcoin fans out to all four script types; Bitcoin Cash (no segwit) to two.
    expect(encodingsByEcosystem.get("bitcoin")).toEqual([
      "utxo-p2pkh-uncompressed",
      "utxo-p2pkh-compressed",
      "utxo-p2sh-p2wpkh",
      "utxo-p2wpkh",
    ]);
    expect(encodingsByEcosystem.get("bitcoin-cash")).toEqual([
      "utxo-p2pkh-uncompressed",
      "utxo-p2pkh-compressed",
    ]);
    expect(encodingsByEcosystem.get("zcash")).toEqual([
      "utxo-p2pkh-uncompressed",
      "utxo-p2pkh-compressed",
    ]);
  });

  it("enumerates only the RFC-8032 ed25519 chains that share one public key", () => {
    const ecosystems = new Set(rawKeyDescriptorsForScheme("ed25519").map((d) => d.ecosystem));
    expect(ecosystems).toEqual(new Set(["solana", "stellar", "algorand", "multiversx", "waves"]));
    // Nano/Cardano/Substrate expand a raw ed25519 secret differently and must not appear.
    expect(ecosystems.has("nano")).toBe(false);
    expect(ecosystems.has("cardano")).toBe(false);
  });

  it("covers Neo Legacy for secp256r1", () => {
    expect(rawKeyDescriptorsForScheme("secp256r1")).toEqual([
      { coinType: 888, ecosystem: "neo-legacy", encoding: "neo-legacy", scheme: "secp256r1" },
    ]);
  });
});

describe("RAW_KEY_DESCRIPTORS", () => {
  it("only references SLIP-44 registered coin types", () => {
    for (const descriptor of RAW_KEY_DESCRIPTORS) {
      expect(isKnownCoinType(descriptor.coinType)).toBe(true);
    }
  });
});

describe("schemeForEcosystem", () => {
  it("resolves the curve of each recorded raw-key ecosystem", () => {
    expect(schemeForEcosystem("evm")).toBe("secp256k1");
    expect(schemeForEcosystem("verge")).toBe("secp256k1");
    expect(schemeForEcosystem("stellar")).toBe("ed25519");
    expect(schemeForEcosystem("multiversx")).toBe("ed25519");
    expect(schemeForEcosystem("neo-legacy")).toBe("secp256r1");
  });

  it("returns undefined for an ecosystem outside any raw-key family", () => {
    expect(schemeForEcosystem("cosmos")).toBeUndefined();
  });
});
