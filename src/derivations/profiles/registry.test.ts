import { describe, expect, it } from "vitest";
import { isKnownCoinType } from "../slip44.js";
import {
  accountPathRenderer,
  DERIVATION_PROFILES,
  indexPathRenderer,
  minValueForRole,
  profileById,
  profilesForChain,
  recognizeAll,
  recognizePath,
  renderProfilePath,
} from "./registry.js";
import { isUtxoChain, UTXO_CHAINS } from "./utxo.js";

describe("registry integrity", () => {
  it("has a unique id per profile", () => {
    const ids = DERIVATION_PROFILES.map((profile) => profile.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only references known SLIP-44 coin types", () => {
    for (const profile of DERIVATION_PROFILES) {
      expect(isKnownCoinType(profile.coinType)).toBe(true);
    }
  });

  it("always lists chain among its ecosystems", () => {
    for (const profile of DERIVATION_PROFILES) {
      expect(profile.ecosystems).toContain(profile.chain);
    }
  });

  it("precomputes example paths from the template", () => {
    expect(profileById("evm-bip44-address-index")?.examplePath).toBe("m/44'/60'/0'/0/0");
    expect(profileById("evm-ledger-live-account-index")?.examplePath).toBe("m/44'/60'/1'/0/0");
    expect(profileById("ripple-bip44-address-index")?.examplePath).toBe("m/44'/144'/0'/0/0");
    expect(profileById("ripple-bip44-account")?.examplePath).toBe("m/44'/144'/1'/0/0");
    expect(profileById("dash-bip44-legacy-account")?.examplePath).toBe("m/44'/5'/0'");
    expect(profileById("dash-bip44-legacy-account")?.template).toBe("m/44'/5'/{account}'");
    expect(profileById("bitcoin-bip84-native-segwit-account")?.template).toBe(
      "m/84'/0'/{account}'"
    );
    expect(profileById("vertcoin-ledger-bip49-nested-segwit-account")?.examplePath).toBe(
      "m/49'/128'/0'"
    );
    expect(profileById("zcash-zip32-account")?.examplePath).toBe("m/32'/133'/0'");
    expect(profileById("zcash-zip32-account")?.template).toBe("m/32'/133'/{account}'");
    expect(profileById("terra-classic-station-account")?.examplePath).toBe("m/44'/330'/0'/0/0");
    expect(profileById("terra-classic-station-legacy-account")?.examplePath).toBe(
      "m/44'/118'/0'/0/0"
    );
    expect(profileById("cosmos-ledger-account")?.examplePath).toBe("m/44'/118'/0'/0/0");
    expect(profileById("cosmos-keplr-account")?.template).toBe("m/44'/118'/0'/0/{index}");
    expect(profileById("multiversx-wallet-address-index")?.examplePath).toBe("m/44'/508'/0'/0'/0'");
    expect(profileById("multiversx-ledger-account")?.examplePath).toBe("m/44'/508'/1'/0'/0'");
    expect(profileById("tron-tronlink-account")?.examplePath).toBe("m/44'/195'/0'/0/0");
    expect(profileById("tron-ledger-account")?.examplePath).toBe("m/44'/195'/1'/0/0");
    expect(profileById("neo-legacy-bip44-account")?.examplePath).toBe("m/44'/888'/0'/0/0");
    expect(profileById("neo-legacy-safepal-account")?.examplePath).toBe("m/44'/888'/0'");
    expect(profileById("neo-legacy-atomic-wallet-account")?.examplePath).toBe("m/44'/888'/0'/0");
    expect(profileById("namada-transparent-secp256k1")?.examplePath).toBe("m/44'/60'/0'/0/0");
    expect(profileById("namada-shielded-modified-zip32")?.examplePath).toBe(
      "m/44'/877'/0'/0'/2147483647'"
    );
    expect(profileById("namada-transparent-ed25519")?.examplePath).toBe("m/44'/877'/0'/0'/0'");
    expect(profileById("namada-shielded-zip32-account")?.template).toBe("m/32'/877'/{account}'");
    expect(profileById("namada-shielded-zip32-address")?.template).toBe(
      "m/32'/877'/{account}'/{addressIndex}"
    );
    expect(profileById("cardano-byron-random-branch")?.template).toBe("m/{account}'");
    expect(profileById("cardano-byron-random-account")?.template).toBe("m/{account}'/0'");
    expect(profileById("cardano-byron-random-address")?.template).toBe(
      "m/{account}'/{addressIndex}"
    );
    expect(profileById("nano-legacy-seed-account")?.examplePath).toBe("index=0");
    expect(profileById("nano-legacy-seed-account")?.template).toBe("index={index}");
  });

  it("renders registered profile paths from authored segments", () => {
    expect(renderProfilePath("evm-bip44-address-index", { index: 3 })).toBe("m/44'/60'/0'/0/3");
    expect(renderProfilePath("cardano-shelley-base-account", { account: 2 })).toBe(
      "m/1852'/1815'/2'/0/0"
    );
    expect(() => renderProfilePath("missing-profile")).toThrow(
      "unknown derivation profile: missing-profile"
    );
  });
});

describe("recognizePath", () => {
  it("recognizes a UTXO path with a chain hint", () => {
    expect(recognizePath("m/84'/0'/0'", "bitcoin")).toMatchObject({
      chain: "bitcoin",
      profileId: "bitcoin-bip84-native-segwit-account",
      standard: "bip84-native-segwit",
      standardName: "BIP84 Native Segwit",
      values: { account: 0 },
    });
  });

  it("recognizes the Dash BIP44 legacy account path", () => {
    expect(recognizePath("m/44'/5'/0'", "dash")).toMatchObject({
      chain: "dash",
      coinType: 5,
      profileId: "dash-bip44-legacy-account",
      scheme: "secp256k1",
      standard: "bip44-legacy",
      standardName: "BIP44 Legacy",
      values: { account: 0 },
    });
  });

  it("extracts the EVM address index", () => {
    expect(recognizePath("m/44'/60'/0'/0/3")).toMatchObject({
      profileId: "evm-bip44-address-index",
      values: { index: 3 },
    });
  });

  it("disambiguates BIP44 from Ledger Live via minValue", () => {
    expect(recognizePath("m/44'/60'/0'/0/0")?.profileId).toBe("evm-bip44-address-index");
    expect(recognizePath("m/44'/60'/1'/0/0")).toMatchObject({
      profileId: "evm-ledger-live-account-index",
      values: { account: 1 },
    });
  });

  it("disambiguates Ripple BIP44 address index from the account-style profile via minValue", () => {
    expect(recognizePath("m/44'/144'/0'/0/0")?.profileId).toBe("ripple-bip44-address-index");
    expect(recognizePath("m/44'/144'/1'/0/0")).toMatchObject({
      profileId: "ripple-bip44-account",
      values: { account: 1 },
    });
    expect(profilesForChain("ripple").map((profile) => profile.id)).toEqual([
      "ripple-bip44-address-index",
      "ripple-bip44-account",
    ]);
  });

  it("disambiguates TronLink from Tron Ledger via minValue", () => {
    expect(recognizePath("m/44'/195'/0'/0/0", "tron")?.profileId).toBe("tron-tronlink-account");
    expect(recognizePath("m/44'/195'/1'/0/0", "tron")).toMatchObject({
      profileId: "tron-ledger-account",
      values: { account: 1 },
    });
    expect(profilesForChain("tron").map((profile) => profile.id)).toEqual([
      "tron-tronlink-account",
      "tron-ledger-account",
    ]);
  });

  it("recognizes Dymension as an EVM-shaped ecosystem", () => {
    expect(recognizePath("m/44'/60'/0'/0/1", "dymension")).toMatchObject({
      chain: "evm",
      coinType: 60,
      profileId: "evm-bip44-address-index",
      scheme: "secp256k1",
      standardName: "BIP44",
      values: { index: 1 },
    });
    expect(profilesForChain("dymension").map((profile) => profile.id)).toEqual([
      "evm-bip44-address-index",
      "evm-ledger-live-account-index",
      "evm-legacy-ledger-mew",
    ]);
  });

  it("honors a chain hint that excludes the only match", () => {
    expect(recognizePath("m/84'/0'/0'", "solana")).toBeUndefined();
    expect(recognizePath("m/0'/0'/0'/0/0", "bitcoin")).toBeUndefined();
  });

  it("rejects an out-of-range index (>= 2^31)", () => {
    expect(recognizePath(`m/44'/60'/0'/0/${2 ** 31}`)).toBeUndefined();
  });

  it("resolves a shared cosmos shape for any family member", () => {
    expect(recognizePath("m/44'/118'/0'/0/2", "osmosis")?.profileId).toBe("cosmos-keplr-account");
    expect(recognizePath("m/44'/118'/2'/0/0", "osmosis")?.profileId).toBe("cosmos-ledger-account");
    expect(recognizePath("m/44'/118'/2'/0/0", "celestia")?.standardName).toBe("Cosmos Ledger");
  });

  it("recognizes Terra Classic ledger and station profiles", () => {
    expect(recognizePath("m/44'/330'/0'/0/0", "terra-classic")).toMatchObject({
      chain: "terra",
      profileId: "terra-ledger-account",
      standardName: "Terra Ledger",
      values: { account: 0 },
    });
    expect(
      recognizeAll("m/44'/330'/0'/0/0", "terra-classic").map((entry) => entry.profileId)
    ).toEqual(["terra-ledger-account", "terra-classic-station-account"]);
    expect(recognizePath("m/44'/118'/0'/0/0", "terra-classic")).toMatchObject({
      chain: "terra-classic",
      profileId: "terra-classic-station-legacy-account",
      standardName: "Terra Station Legacy",
      values: { account: 0 },
    });
  });

  it("recognizes the Neo Legacy BIP44 P-256 path", () => {
    expect(recognizePath("m/44'/888'/0'/0/0", "neo-legacy")).toMatchObject({
      chain: "neo-legacy",
      coinType: 888,
      profileId: "neo-legacy-bip44-account",
      scheme: "secp256r1",
      standard: "neo-legacy-bip44",
      standardName: "Neo Legacy BIP44",
      values: { account: 0 },
    });
  });

  it("recognizes the Neo Legacy SafePal P-256 path", () => {
    expect(recognizePath("m/44'/888'/0'", "neo-legacy")).toMatchObject({
      chain: "neo-legacy",
      coinType: 888,
      profileId: "neo-legacy-safepal-account",
      scheme: "secp256r1",
      standard: "neo-legacy-safepal",
      standardName: "Neo Legacy SafePal",
      values: { account: 0 },
    });
  });

  it("recognizes the Neo Legacy Atomic Wallet P-256 path", () => {
    expect(recognizePath("m/44'/888'/0'/0", "neo-legacy")).toMatchObject({
      chain: "neo-legacy",
      coinType: 888,
      profileId: "neo-legacy-atomic-wallet-account",
      scheme: "secp256r1",
      standard: "neo-legacy-atomic-wallet",
      standardName: "Neo Legacy Atomic Wallet",
      values: { account: 0 },
    });
  });

  it("keeps the two Aptos path styles disjoint by curve", () => {
    expect(recognizePath("m/44'/637'/0'/0'/0'", "aptos")).toMatchObject({
      chain: "aptos",
      coinType: 637,
      profileId: "aptos-ledger-account",
      scheme: "ed25519",
      standard: "aptos-ledger",
      values: { account: 0 },
    });
    expect(recognizePath("m/44'/637'/1'/0/0", "aptos")).toMatchObject({
      chain: "aptos",
      coinType: 637,
      profileId: "aptos-bip44-account",
      scheme: "secp256k1",
      standard: "aptos-bip44",
      standardName: "Aptos BIP44",
      values: { account: 1 },
    });
  });

  it("disambiguates MultiversX Wallet from Ledger via minValue", () => {
    expect(recognizePath("m/44'/508'/0'/0'/0'", "multiversx")).toMatchObject({
      chain: "multiversx",
      coinType: 508,
      profileId: "multiversx-wallet-address-index",
      scheme: "ed25519",
      standard: "multiversx-wallet",
      standardName: "MultiversX Wallet",
      values: { index: 0 },
    });
    expect(recognizePath("m/44'/508'/1'/0'/0'", "multiversx")).toMatchObject({
      chain: "multiversx",
      coinType: 508,
      profileId: "multiversx-ledger-account",
      scheme: "ed25519",
      standard: "multiversx-ledger",
      standardName: "MultiversX Ledger",
      values: { account: 1 },
    });
  });

  it("keeps the two Algorand path styles disjoint by hardening", () => {
    expect(recognizePath("m/44'/283'/0'/0'/0'", "algorand")).toMatchObject({
      chain: "algorand",
      coinType: 283,
      profileId: "algorand-ledger-account",
      scheme: "ed25519",
      standard: "algorand-ledger",
      standardName: "Algorand Ledger",
      values: { account: 0 },
    });
    expect(recognizePath("m/44'/283'/0'/0/0", "algorand")).toMatchObject({
      chain: "algorand",
      coinType: 283,
      profileId: "algorand-arc52-account",
      scheme: "ed25519",
      standard: "algorand-arc52",
      standardName: "Algorand ARC-52",
      values: { account: 0, index: 0 },
    });
    expect(recognizePath("m/44'/283'/2'/0/1", "algorand")).toMatchObject({
      profileId: "algorand-arc52-account",
      values: { account: 2, index: 1 },
    });
  });

  it("recognizes the Zcash ZIP-32 shielded account", () => {
    expect(recognizePath("m/32'/133'/0'", "zcash")).toMatchObject({
      chain: "zcash",
      profileId: "zcash-zip32-account",
      scheme: "pallas",
      standard: "zip32-account",
      standardName: "ZIP32 Account",
      values: { account: 0 },
    });
  });

  it("keeps Zcash transparent (BIP44) and shielded (ZIP-32) disjoint", () => {
    expect(recognizePath("m/44'/133'/0'", "zcash")?.profileId).toBe(
      "zcash-bip44-transparent-account"
    );
    expect(recognizePath("m/32'/133'/0'", "zcash")?.profileId).toBe("zcash-zip32-account");
  });

  it("recognizes Namada transparent and shielded paths", () => {
    expect(recognizePath("m/44'/60'/0'/0/0", "namada")).toMatchObject({
      chain: "namada",
      coinType: 60,
      profileId: "namada-transparent-secp256k1",
      scheme: "secp256k1",
      standard: "namada-transparent-secp256k1",
      standardName: "Namada Transparent Secp256k1",
      values: { account: 0, addressIndex: 0, change: 0 },
    });
    expect(recognizePath("m/44'/877'/0'/0'/0'", "namada")).toMatchObject({
      coinType: 877,
      profileId: "namada-transparent-ed25519",
      scheme: "ed25519",
      standardName: "Namada Transparent Ed25519",
      values: { account: 0, addressIndex: 0, change: 0 },
    });
    expect(recognizePath("m/44'/877'/0'/0'/2147483647'", "namada")).toMatchObject({
      profileId: "namada-shielded-modified-zip32",
      scheme: "ed25519",
      standardName: "Namada Shielded Modified ZIP32",
      values: {},
    });
    expect(recognizePath("m/32'/877'/0'", "namada")).toMatchObject({
      profileId: "namada-shielded-zip32-account",
      scheme: "redjubjub",
      standardName: "Namada Shielded ZIP32 Account",
      values: { account: 0 },
    });
    expect(recognizePath("m/32'/877'/0'/7", "namada")).toMatchObject({
      profileId: "namada-shielded-zip32-address",
      values: { account: 0, addressIndex: 7 },
    });
  });

  it("recognizes the Solana BIP44 account and deprecated-legacy paths", () => {
    expect(recognizePath("m/44'/501'/0'", "solana")).toMatchObject({
      chain: "solana",
      coinType: 501,
      profileId: "solana-bip44-account",
      scheme: "ed25519",
      standard: "solana-bip44-account",
      standardName: "Solana BIP44 Account",
      values: { account: 0 },
    });
    expect(recognizePath("m/501'/3'/0/0", "solana")).toMatchObject({
      chain: "solana",
      coinType: 501,
      profileId: "solana-deprecated-legacy",
      scheme: "ed25519",
      standard: "solana-deprecated-legacy",
      standardName: "Solana Deprecated Legacy",
      values: { account: 3 },
    });
  });

  it("recognizes the native Nano legacy seed index", () => {
    expect(recognizePath("index=3", "nano")).toMatchObject({
      chain: "nano",
      coinType: 165,
      profileId: "nano-legacy-seed-account",
      scheme: "ed25519",
      standard: "nano-legacy-seed",
      standardName: "Nano Legacy Seed",
      values: { index: 3 },
    });
  });

  it("recognizes Cardano Byron Random branch and address paths", () => {
    expect(recognizePath("m/0'", "cardano")).toMatchObject({
      chain: "cardano",
      coinType: 1815,
      profileId: "cardano-byron-random-branch",
      scheme: "ed25519",
      standard: "cardano-byron-random",
      standardName: "Cardano Byron Random",
      values: { account: 0 },
    });
    expect(recognizePath("m/0'/0'", "cardano")?.profileId).toBe("cardano-byron-random-account");
    expect(recognizePath("m/0'/2089694086", "cardano")).toMatchObject({
      profileId: "cardano-byron-random-address",
      standardName: "Cardano Byron Random",
      values: { account: 0, addressIndex: 2_089_694_086 },
    });
  });

  it("keeps the four Solana shapes disjoint by depth and prefix", () => {
    expect(recognizePath("m/44'/501'/0'/0'", "solana")?.profileId).toBe(
      "solana-ledger-phantom-account"
    );
    expect(recognizePath("m/44'/501'", "solana")?.profileId).toBe("solana-legacy-ledger-root");
    expect(recognizePath("m/44'/501'/0'", "solana")?.profileId).toBe("solana-bip44-account");
    expect(recognizePath("m/501'/0'/0/0", "solana")?.profileId).toBe("solana-deprecated-legacy");
  });
});

describe("recognizeAll", () => {
  it("returns both IOTA ed25519 profiles for the shared shape", () => {
    const all = recognizeAll("m/44'/4218'/0'/0'/0'");
    expect(all.map((entry) => entry.profileId)).toEqual([
      "iota-ed25519-account",
      "iota-stardust-ed25519-account",
    ]);
  });

  it("constrains by chain hint", () => {
    expect(recognizeAll("m/44'/118'/0'/0/0", "terra")).toHaveLength(0);
    expect(recognizeAll("m/44'/118'/0'/0/0", "cosmos").map((entry) => entry.profileId)).toEqual([
      "cosmos-keplr-account",
      "cosmos-ledger-account",
    ]);
  });
});

describe("profilesForChain", () => {
  it("matches the primary chain and ecosystem members", () => {
    expect(profilesForChain("cosmos").map((profile) => profile.id)).toContain(
      "cosmos-keplr-account"
    );
    expect(profilesForChain("cosmos").map((profile) => profile.id)).toContain(
      "cosmos-ledger-account"
    );
    expect(profilesForChain("osmosis").map((profile) => profile.id)).toContain(
      "cosmos-keplr-account"
    );
    expect(profilesForChain("osmosis").map((profile) => profile.id)).toContain(
      "cosmos-ledger-account"
    );
    expect(profilesForChain("terra-classic").map((profile) => profile.id)).toEqual([
      "terra-ledger-account",
      "terra-classic-station-account",
      "terra-classic-station-legacy-account",
    ]);
    expect(profilesForChain("neo-legacy").map((profile) => profile.id)).toEqual([
      "neo-legacy-safepal-account",
      "neo-legacy-atomic-wallet-account",
      "neo-legacy-bip44-account",
    ]);
    expect(profilesForChain("nano").map((profile) => profile.id)).toEqual([
      "nano-ledger-account",
      "nano-legacy-seed-account",
    ]);
    expect(profilesForChain("avail").map((profile) => profile.id)).toContain(
      "polkadot-ledger-substrate-account"
    );
    expect(profilesForChain("namada").map((profile) => profile.id)).toEqual([
      "namada-transparent-secp256k1",
      "namada-shielded-modified-zip32",
      "namada-transparent-ed25519",
      "namada-shielded-zip32-account",
      "namada-shielded-zip32-address",
    ]);
  });
});

describe("legacy profiles", () => {
  it("precomputes example paths and templates", () => {
    expect(profileById("obyte-bip44-account")?.template).toBe("m/44'/0'/{account}'");
    expect(profileById("vertcoin-bip44-account")?.examplePath).toBe("m/44'/28'/0'");
    expect(profileById("vertcoin-electrum-legacy")?.examplePath).toBe("m/0/0");
    expect(profileById("hush-webwallet")?.template).toBe("m/{index}");
  });

  it("keeps Obyte disjoint from Bitcoin via the chain hint", () => {
    // Obyte reuses coin type 0, so the matcher is identical to Bitcoin's. UTXO profiles are ordered
    // first, so a hint-less path still resolves to Bitcoin — no regression.
    expect(recognizePath("m/44'/0'/0'")?.profileId).toBe("bitcoin-bip44-legacy-account");
    expect(recognizePath("m/44'/0'/0'", "obyte")).toMatchObject({
      chain: "obyte",
      coinType: 0,
      profileId: "obyte-bip44-account",
      scheme: "secp256k1",
      standard: "obyte-bip44",
      standardName: "Obyte BIP44",
      values: { account: 0 },
    });
    expect(recognizePath("m/44'/0'/0'", "byteball")?.profileId).toBe("obyte-bip44-account");
  });

  it("recognizes Vertcoin Ledger, BIP44 account, and Electrum legacy paths", () => {
    expect(recognizePath("m/49'/128'/0'", "vertcoin")).toMatchObject({
      chain: "vertcoin",
      coinType: 128,
      profileId: "vertcoin-ledger-bip49-nested-segwit-account",
      standard: "vertcoin-ledger-bip49",
      standardName: "Vertcoin Ledger BIP49",
      values: { account: 0 },
    });
    const ledgerFirstReceivePath = `${renderProfilePath(
      "vertcoin-ledger-bip49-nested-segwit-account",
      {
        account: 0,
      }
    )}/0/0`;
    expect(ledgerFirstReceivePath).toBe("m/49'/128'/0'/0/0");
    expect(recognizePath("m/44'/28'/0'", "vertcoin")).toMatchObject({
      chain: "vertcoin",
      coinType: 28,
      profileId: "vertcoin-bip44-account",
      standard: "vertcoin-bip44",
      values: { account: 0 },
    });
    expect(recognizePath("m/0/0", "vertcoin")).toMatchObject({
      profileId: "vertcoin-electrum-legacy",
      standardName: "Vertcoin Electrum Legacy",
      values: {},
    });
    expect(profilesForChain("vertcoin").map((profile) => profile.id)).toEqual([
      "vertcoin-ledger-bip49-nested-segwit-account",
      "vertcoin-bip44-account",
      "vertcoin-electrum-legacy",
    ]);
  });

  it("recognizes the Hush flat webwallet path via chain hint", () => {
    expect(recognizePath("m/0", "hush")).toMatchObject({
      chain: "hush",
      profileId: "hush-webwallet",
      standardName: "Hush Webwallet",
      values: { index: 0 },
    });
    expect(recognizePath("m/5", "hush")?.values).toEqual({ index: 5 });
  });
});

describe("accountPathRenderer / indexPathRenderer", () => {
  it("curries a profile id into an account-role path renderer", () => {
    expect(accountPathRenderer("evm-ledger-live-account-index")(1)).toBe("m/44'/60'/1'/0/0");
  });

  it("curries a profile id into an index-role path renderer", () => {
    expect(indexPathRenderer("evm-bip44-address-index")(3)).toBe("m/44'/60'/0'/0/3");
  });
});

describe("minValueForRole", () => {
  it("reads the minValue authored on a profile's role segment", () => {
    expect(minValueForRole("evm-ledger-live-account-index", "account")).toBe(1);
    expect(minValueForRole("ripple-bip44-account", "account")).toBe(1);
    expect(minValueForRole("multiversx-ledger-account", "account")).toBe(1);
    expect(minValueForRole("tron-ledger-account", "account")).toBe(1);
  });

  it("returns undefined when the role's segment carries no minValue", () => {
    expect(minValueForRole("evm-bip44-address-index", "index")).toBeUndefined();
  });

  it("returns undefined when the profile has no segment for the role", () => {
    expect(minValueForRole("evm-bip44-address-index", "account")).toBeUndefined();
  });

  it("throws for an unknown profile id", () => {
    expect(() => minValueForRole("missing-profile", "account")).toThrow(
      "unknown derivation profile: missing-profile"
    );
  });
});

describe("isUtxoChain", () => {
  it("recognizes every UTXO chain", () => {
    for (const chain of UTXO_CHAINS) {
      expect(isUtxoChain(chain)).toBe(true);
    }
  });

  it("rejects a non-UTXO chain", () => {
    expect(isUtxoChain("evm")).toBe(false);
  });
});
