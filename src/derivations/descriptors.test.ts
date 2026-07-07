import { describe, expect, it } from "vitest";
import { descriptorKindForAddressKind, outputDescriptorTemplate } from "./descriptors.js";

describe("descriptorKindForAddressKind", () => {
  it("maps each UTXO script address kind to its descriptor kind", () => {
    expect(descriptorKindForAddressKind("p2pkh")).toBe("pkh");
    expect(descriptorKindForAddressKind("p2sh-p2wpkh")).toBe("sh-wpkh");
    expect(descriptorKindForAddressKind("p2wpkh")).toBe("wpkh");
  });

  it("returns undefined for a non-UTXO address kind", () => {
    expect(descriptorKindForAddressKind("evm")).toBeUndefined();
  });
});

describe("outputDescriptorTemplate", () => {
  it("renders the output descriptor template for each descriptor kind", () => {
    expect(outputDescriptorTemplate("pkh")).toBe("pkh({xpub}/0/*)");
    expect(outputDescriptorTemplate("sh-wpkh")).toBe("sh(wpkh({xpub}/0/*))");
    expect(outputDescriptorTemplate("wpkh")).toBe("wpkh({xpub}/0/*)");
  });
});
