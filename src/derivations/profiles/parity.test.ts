import { describe, expect, it } from "vitest";
import { render, toMatcher } from "../path/template.js";
import { profileById } from "./registry.js";

const segments = (id: string) => {
  const profile = profileById(id);
  if (profile === undefined) {
    throw new Error(`missing profile ${id}`);
  }
  return profile.segments;
};

/**
 * Exact path strings the original closures produce at account/index 0. `render` must reproduce them verbatim, proving
 * the shape builders match the originals they replace.
 */
const RENDER_FIXTURES: ReadonlyArray<
  readonly [id: string, values: Record<string, number>, expected: string]
> = [
  ["bitcoin-bip44-legacy-account", { account: 0 }, "m/44'/0'/0'"],
  ["dash-bip44-legacy-account", { account: 0 }, "m/44'/5'/0'"],
  ["bitcoin-bip84-native-segwit-account", { account: 0 }, "m/84'/0'/0'"],
  ["evm-bip44-address-index", { index: 0 }, "m/44'/60'/0'/0/0"],
  ["evm-ledger-live-account-index", { account: 1 }, "m/44'/60'/1'/0/0"],
  ["evm-legacy-ledger-mew", { index: 0 }, "m/44'/60'/0'/0"],
  ["iota-ed25519-account", { account: 0 }, "m/44'/4218'/0'/0'/0'"],
  ["iota-secp256k1-account", { account: 0 }, "m/54'/4218'/0'/0/0"],
  ["iota-secp256r1-account", { account: 0 }, "m/74'/4218'/0'/0/0"],
  ["cardano-shelley-base-account", { account: 0 }, "m/1852'/1815'/0'/0/0"],
  ["cardano-byron-icarus-account", { account: 0 }, "m/44'/1815'/0'/0/0"],
  ["cardano-byron-random-account", { account: 0 }, "m/0'/0'"],
  ["cosmos-keplr-account", { index: 0 }, "m/44'/118'/0'/0/0"],
  ["cosmos-ledger-account", { account: 0 }, "m/44'/118'/0'/0/0"],
  ["ripple-bip44-address-index", { index: 0 }, "m/44'/144'/0'/0/0"],
  ["ripple-bip44-account", { account: 1 }, "m/44'/144'/1'/0/0"],
  ["terra-ledger-account", { account: 0 }, "m/44'/330'/0'/0/0"],
  ["terra-classic-station-account", { account: 0 }, "m/44'/330'/0'/0/0"],
  ["terra-classic-station-legacy-account", { account: 0 }, "m/44'/118'/0'/0/0"],
  ["multiversx-wallet-address-index", { index: 0 }, "m/44'/508'/0'/0'/0'"],
  ["multiversx-ledger-account", { account: 1 }, "m/44'/508'/1'/0'/0'"],
  ["tron-tronlink-account", { index: 0 }, "m/44'/195'/0'/0/0"],
  ["tron-ledger-account", { account: 1 }, "m/44'/195'/1'/0/0"],
  ["aptos-bip44-account", { account: 0 }, "m/44'/637'/0'/0/0"],
  ["namada-transparent-secp256k1", { account: 0, addressIndex: 0, change: 0 }, "m/44'/60'/0'/0/0"],
  ["neo-legacy-safepal-account", { account: 0 }, "m/44'/888'/0'"],
  ["neo-legacy-atomic-wallet-account", { account: 0 }, "m/44'/888'/0'/0"],
  ["neo-legacy-bip44-account", { account: 0 }, "m/44'/888'/0'/0/0"],
  ["namada-shielded-modified-zip32", {}, "m/44'/877'/0'/0'/2147483647'"],
  ["namada-transparent-ed25519", { account: 0, addressIndex: 0, change: 0 }, "m/44'/877'/0'/0'/0'"],
  ["namada-shielded-zip32-account", { account: 0 }, "m/32'/877'/0'"],
  ["namada-shielded-zip32-address", { account: 0, addressIndex: 0 }, "m/32'/877'/0'/0"],
  ["polkadot-ledger-substrate-account", { account: 0 }, "m/44'/354'/0'/0'/0'"],
  ["solana-ledger-phantom-account", { account: 0 }, "m/44'/501'/0'/0'"],
  ["solana-legacy-ledger-root", {}, "m/44'/501'"],
  ["solana-bip44-account", { account: 0 }, "m/44'/501'/0'"],
  ["solana-deprecated-legacy", { account: 0 }, "m/501'/0'/0/0"],
  ["starknet-ready-argent-account", { index: 0 }, "m/44'/9004'/0'/0/0"],
  ["stellar-slip44-account", { account: 0 }, "m/44'/148'/0'"],
  ["nano-ledger-account", { account: 0 }, "m/44'/165'/0'"],
  ["nano-legacy-seed-account", { index: 0 }, "index=0"],
  ["obyte-bip44-account", { account: 0 }, "m/44'/0'/0'"],
  ["vertcoin-bip44-account", { account: 0 }, "m/44'/28'/0'"],
  ["vertcoin-ledger-bip49-nested-segwit-account", { account: 0 }, "m/49'/128'/0'"],
  ["vertcoin-electrum-legacy", {}, "m/0/0"],
  ["hush-webwallet", { index: 0 }, "m/0"],
];

/**
 * Matcher sources that must equal the hand-written `ACCOUNT_DERIVATION_NAME_RULES` patterns in the
 * wallets-sync-model verbatim (the account-style rules that capture with `(\d+)`).
 */
const MATCHER_FIXTURES: ReadonlyArray<readonly [id: string, source: string]> = [
  ["evm-bip44-address-index", "^m\\/44'\\/60'\\/0'\\/0\\/(\\d+)$"],
  ["evm-ledger-live-account-index", "^m\\/44'\\/60'\\/(\\d+)'\\/0\\/0$"],
  ["evm-legacy-ledger-mew", "^m\\/44'\\/60'\\/0'\\/(\\d+)$"],
  ["cosmos-keplr-account", "^m\\/44'\\/118'\\/0'\\/0\\/(\\d+)$"],
  ["cosmos-ledger-account", "^m\\/44'\\/118'\\/(\\d+)'\\/0\\/0$"],
  ["terra-ledger-account", "^m\\/44'\\/330'\\/(\\d+)'\\/0\\/0$"],
  ["terra-classic-station-account", "^m\\/44'\\/330'\\/(\\d+)'\\/0\\/0$"],
  ["terra-classic-station-legacy-account", "^m\\/44'\\/118'\\/(\\d+)'\\/0\\/0$"],
  ["multiversx-wallet-address-index", "^m\\/44'\\/508'\\/0'\\/0'\\/(\\d+)'$"],
  ["multiversx-ledger-account", "^m\\/44'\\/508'\\/(\\d+)'\\/0'\\/0'$"],
  ["tron-tronlink-account", "^m\\/44'\\/195'\\/0'\\/0\\/(\\d+)$"],
  ["tron-ledger-account", "^m\\/44'\\/195'\\/(\\d+)'\\/0\\/0$"],
  ["aptos-bip44-account", "^m\\/44'\\/637'\\/(\\d+)'\\/0\\/0$"],
  ["neo-legacy-safepal-account", "^m\\/44'\\/888'\\/(\\d+)'$"],
  ["neo-legacy-atomic-wallet-account", "^m\\/44'\\/888'\\/(\\d+)'\\/0$"],
  ["neo-legacy-bip44-account", "^m\\/44'\\/888'\\/(\\d+)'\\/0\\/0$"],
  ["polkadot-ledger-substrate-account", "^m\\/44'\\/354'\\/(\\d+)'\\/0'\\/0'$"],
  ["solana-ledger-phantom-account", "^m\\/44'\\/501'\\/(\\d+)'\\/0'$"],
  ["solana-legacy-ledger-root", "^m\\/44'\\/501'$"],
  ["solana-bip44-account", "^m\\/44'\\/501'\\/(\\d+)'$"],
  ["solana-deprecated-legacy", "^m\\/501'\\/(\\d+)'\\/0\\/0$"],
  ["ripple-bip44-address-index", "^m\\/44'\\/144'\\/0'\\/0\\/(\\d+)$"],
  ["ripple-bip44-account", "^m\\/44'\\/144'\\/(\\d+)'\\/0\\/0$"],
  ["stellar-slip44-account", "^m\\/44'\\/148'\\/(\\d+)'$"],
  ["nano-ledger-account", "^m\\/44'\\/165'\\/(\\d+)'$"],
  ["nano-legacy-seed-account", "^index=(\\d+)$"],
  ["starknet-ready-argent-account", "^m\\/44'\\/9004'\\/0'\\/0\\/(\\d+)$"],
];

/**
 * UTXO `*_DERIVATION_NAME_RULES` patterns recognize without capturing (`\d+'`). Dropping our capture parens must yield
 * the exact hand-written source, tying the engine to those rules too.
 */
const UTXO_MATCHER_FIXTURES: ReadonlyArray<readonly [id: string, source: string]> = [
  ["bitcoin-bip44-legacy-account", "^m\\/44'\\/0'\\/\\d+'$"],
  ["dash-bip44-legacy-account", "^m\\/44'\\/5'\\/\\d+'$"],
  ["bitcoin-bip84-native-segwit-account", "^m\\/84'\\/0'\\/\\d+'$"],
  ["litecoin-bip49-nested-segwit-account", "^m\\/49'\\/2'\\/\\d+'$"],
  ["vertcoin-ledger-bip49-nested-segwit-account", "^m\\/49'\\/128'\\/\\d+'$"],
  ["zcash-bip44-transparent-account", "^m\\/44'\\/133'\\/\\d+'$"],
  ["cardano-byron-random-account", "^m\\/\\d+'\\/0'$"],
  ["obyte-bip44-account", "^m\\/44'\\/0'\\/\\d+'$"],
  ["vertcoin-bip44-account", "^m\\/44'\\/28'\\/\\d+'$"],
];

describe("parity with original closures", () => {
  it.each(RENDER_FIXTURES)("render %s -> %o = %s", (id, values, expected) => {
    expect(render(segments(id), values)).toBe(expected);
  });
});

describe("parity with original regex rules", () => {
  it.each(MATCHER_FIXTURES)("matcher source %s", (id, source) => {
    expect(toMatcher(segments(id)).regex.source).toBe(source);
  });

  it.each(UTXO_MATCHER_FIXTURES)("utxo matcher source (capture-stripped) %s", (id, source) => {
    expect(toMatcher(segments(id)).regex.source.replaceAll("(\\d+)", "\\d+")).toBe(source);
  });
});
