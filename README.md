# @prb/crypto-registry

> Typed, isomorphic registry of EVM chains, ERC-20 tokens, and HD derivation metadata with **viem as its only runtime
> dependency**.

A single source of truth for EVM chain metadata and curated ERC-20 token data — addresses, symbols, decimals, and
CoinGecko ids — with a discriminated-union type model that distinguishes plain tokens from **stablecoins**, **wrapped
natives**, and **native mirrors**. The package is data plus lookup helpers: no network access, no `node:*` imports, and
only `viem` at runtime, so it runs unchanged in Node and the browser. The `derivations` subpath adds HD derivation path
types, SLIP-44 data, and registered path profiles.

- **34** EVM chains
- **615** ERC-20 tokens across four kinds
- HD derivation path profiles and SLIP registries under `@prb/crypto-registry/derivations`
- ESM-only, ships `.d.ts`, tree-shakeable (`sideEffects: false`)

## Install

```sh
bun add @prb/crypto-registry   # or: npm i / pnpm add / yarn add
```

Requires an ESM environment (Node ≥ 20, or any modern bundler/browser).

## Token kinds

Every token carries a `kind` discriminant. Narrow with the exported guards (`isStandard`, `isStablecoin`, `isWrapped`,
`isMirror`).

| Kind         | Meaning                                                                                       | Extra fields                                    |
| ------------ | --------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `standard`   | A plain ERC-20.                                                                               | —                                               |
| `stablecoin` | USDC / USDT / DAI / EURe and their bridged variants.                                          | `family`, `peg`, `backing`, `bridged`, `issuer` |
| `wrapped`    | The canonical wrapper of a chain's **native** gas token (e.g. WETH).                          | `underlyingSymbol`                              |
| `mirror`     | An ERC-20-like contract that mirrors the native token (e.g. the POL precompile at `0x…1010`). | `mirrors`                                       |

## Usage

```ts
import {
  getChain,
  getChainByName,
  getToken,
  getTokensBySymbol,
  getStablecoins,
  isStablecoin,
  resolveTokenAddress,
} from "@prb/crypto-registry";

getChain(1)?.slug; // "mainnet"
getChainByName("matic")?.chainId; // 137 (resolves names, slugs, and aliases)

const usdc = getToken(1, "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
// { kind: "stablecoin", symbol: "USDC", decimals: 6, peg: "USD", bridged: false, ... }

if (usdc && isStablecoin(usdc)) {
  usdc.peg; // "USD"  — narrowed to Stablecoin
}

getTokensBySymbol("USDC").length; // every USDC across all chains
getStablecoins().length; // 96

const historical = resolveTokenAddress(1, "0x57ab1e02fee23774580c119740129eac7081e9d3");
// { relationship: "historical_event_emitter", token: <canonical sUSD>, alias: ... }
getToken(1, "0x57ab1e02fee23774580c119740129eac7081e9d3"); // undefined (exact-only)
```

```ts
import { COIN_TYPES, recognizePath, renderProfilePath } from "@prb/crypto-registry/derivations";

COIN_TYPES.ETHEREUM; // 60
renderProfilePath("evm-bip44-address-index", { index: 3 }); // "m/44'/60'/0'/0/3"
recognizePath("m/84'/0'/0'", "bitcoin")?.standard; // "bip84-native-segwit"
```

## API

**Chains** — `CHAINS`, `allChains()`, `getChain(chainId)`, `getChainBySlug(slug)`, `getChainByName(name)`
(case-insensitive over name, slug, and aliases). Every chain has an `accountActivityModel`; consumers may use
Ethereum-EOA activity shortcuts only for the exact `"ethereum-eoa"` value and must default-deny every other value.

**Tokens** — `TOKENS`, `getToken(chainId, address)`, `getTokensByChain(chainId)`, `getTokensBySymbol(symbol)`,
`getStablecoins()`, `getWrappedTokens()`, `getMirrorTokens()`, `getStandardTokens()`.

**Token address aliases** — `TOKEN_ADDRESS_ALIASES` contains verified non-callable historical event emitters as
`{ chainId, historicalAddress, canonicalAddress, relationship: "historical_event_emitter" }`.
`resolveTokenAddress(chainId, address)` returns either `{ relationship: "canonical", token }` or
`{ relationship: "historical_event_emitter", alias, token }`, where `token` is always canonical. `getToken()` remains
exact-only.

**Tickers** — `STABLECOIN_TICKERS_BY_PEG` (fiat-equivalent quote tickers grouped by `USD` / `EUR` peg),
`PRICE_ASSET_ALIASES` (wrapped/decorated ticker → the underlying asset whose price values it), and `NATIVE_ASSET_CHAINS`
(native gas ticker → canonical source-ref chain). Chain-agnostic curated vocabularies for accounting/pricing;
case-sensitive.

**Addresses** — `isAddress(value)`, `normalizeAddress(value)` (validates and lowercases), `isAddressEqual(a, b)`.

**Types & guards** — `AccountActivityModel`, `Chain`, `NativeCurrency`, `Token`, `Stablecoin`, `WrappedToken`,
`MirrorToken`, `StandardToken`, `TokenAddressAlias`, `TokenAddressResolution`, `Address`, and the guards `isStandard` /
`isStablecoin` / `isWrapped` / `isMirror`.

**Derivations** — `@prb/crypto-registry/derivations` exposes path parsing/building, profile recognition/rendering,
SLIP-44 coin types, purposes, schemes, SLIP-132 version bytes, Bitcoin descriptor helpers, and Substrate SURI utilities.

Addresses are stored lowercased; lookups are case-insensitive. No keccak/EIP-55 checksumming is performed.

## JSON artifacts

Non-TypeScript consumers (Go, jq, Python) can use the `@prb/crypto-registry/tokens.json` and
`@prb/crypto-registry/chains.json` subpaths. Node ESM imports require `with { type: "json" }`; TypeScript consumers
should keep using the typed `@prb/crypto-registry` entry. Run `just json-gen` after hand edits to `chains.ts` or the
stablecoin classification.

`tokens.json` schema version 2 has the shape
`{ "aliases": TokenAddressAlias[], "schemaVersion": 2, "tokens": Token[] }`. `chains.json` schema version 2 has the
shape `{ "chains": Chain[], "schemaVersion": 2 }`; every chain row includes the required `accountActivityModel` field.

## Contributing

See [`AGENTS.md`](./AGENTS.md) for the development workflow and the generated-data ownership rules.

## License

MIT © [Paul Razvan Berg](https://github.com/PaulRBerg)
