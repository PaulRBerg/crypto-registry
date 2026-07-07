import { describe, expect, it } from "vitest";
import { profileById, profilesForChain, recognizePath } from "./registry.js";

describe("Radix Babylon CAP-26 paths (mainnet)", () => {
  it("renders the account / transaction-signing baseline", () => {
    expect(profileById("radix-babylon-account")?.examplePath).toBe("m/44'/1022'/1'/525'/1460'/0'");
    expect(profileById("radix-babylon-account")?.template).toBe(
      "m/44'/1022'/1'/525'/1460'/{account}'"
    );
  });

  it("models the account/identity × transaction/ROLA matrix", () => {
    expect(profileById("radix-babylon-account-rola")?.examplePath).toBe(
      "m/44'/1022'/1'/525'/1678'/0'"
    );
    expect(profileById("radix-babylon-identity")?.examplePath).toBe("m/44'/1022'/1'/618'/1460'/0'");
    expect(profileById("radix-babylon-identity-rola")?.examplePath).toBe(
      "m/44'/1022'/1'/618'/1678'/0'"
    );
  });

  it("recognizes an account path (ed25519)", () => {
    expect(recognizePath("m/44'/1022'/1'/525'/1460'/3'", "radix")).toMatchObject({
      profileId: "radix-babylon-account",
      scheme: "ed25519",
      standardName: "Radix Babylon",
      values: { account: 3 },
    });
  });

  it("distinguishes identity (persona) and ROLA keys by their fixed levels", () => {
    expect(recognizePath("m/44'/1022'/1'/618'/1460'/0'", "radix")?.profileId).toBe(
      "radix-babylon-identity"
    );
    expect(recognizePath("m/44'/1022'/1'/525'/1678'/0'", "radix")?.profileId).toBe(
      "radix-babylon-account-rola"
    );
    expect(recognizePath("m/44'/1022'/1'/618'/1678'/0'", "radix")?.profileId).toBe(
      "radix-babylon-identity-rola"
    );
  });

  it("does not model testnet networks (stokenet, network 2)", () => {
    expect(recognizePath("m/44'/1022'/2'/525'/1460'/0'", "radix")).toBeUndefined();
  });
});

describe("Radix Olympia BIP44-like paths (secp256k1)", () => {
  it("renders both the hardened wallet form and the canonical form", () => {
    expect(profileById("radix-olympia-account")?.examplePath).toBe("m/44'/1022'/0'/0/0'");
    expect(profileById("radix-olympia-account")?.template).toBe("m/44'/1022'/0'/0/{addressIndex}'");
    expect(profileById("radix-olympia-canonical-account")?.examplePath).toBe("m/44'/1022'/0'/0/0");
    expect(profileById("radix-olympia-canonical-account")?.template).toBe(
      "m/44'/1022'/0'/0/{addressIndex}"
    );
  });

  it("recognizes the hardened wallet form (the real Olympia address derivation)", () => {
    expect(recognizePath("m/44'/1022'/0'/0/5'", "radix")).toMatchObject({
      profileId: "radix-olympia-account",
      scheme: "secp256k1",
      standardName: "Radix Olympia",
      values: { addressIndex: 5 },
    });
  });

  it("recognizes the canonical unhardened form", () => {
    expect(recognizePath("m/44'/1022'/0'/0/5", "radix")).toMatchObject({
      profileId: "radix-olympia-canonical-account",
      values: { addressIndex: 5 },
    });
  });
});

describe("Radix registry", () => {
  it("exposes both eras for the radix chain", () => {
    expect(profilesForChain("radix").map((profile) => profile.id)).toEqual([
      "radix-babylon-account",
      "radix-babylon-account-rola",
      "radix-babylon-identity",
      "radix-babylon-identity-rola",
      "radix-olympia-account",
      "radix-olympia-canonical-account",
    ]);
  });
});
