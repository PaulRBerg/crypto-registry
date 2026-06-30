# @prb/token-registry

> Typed, isomorphic registry of EVM chains and ERC-20 tokens with **zero runtime dependencies**.

A single source of truth for EVM chain metadata and curated ERC-20 token data — addresses, symbols, decimals, and
CoinGecko ids — with a discriminated-union type model that distinguishes plain tokens from **stablecoins**, **wrapped
natives**, and **native mirrors**. The package is pure data plus lookup helpers: no network access, no `node:*` imports,
so it runs unchanged in Node and the browser.

- **34** EVM chains
- **615** ERC-20 tokens across four kinds
- ESM-only, ships `.d.ts`, tree-shakeable (`sideEffects: false`)

## Install

```sh
bun add @prb/token-registry   # or: npm i / pnpm add / yarn add
```

Requires an ESM environment (Node ≥ 20, or any modern bundler/browser).

## Token kinds

Every token carries a `kind` discriminant. Narrow with the exported guards (`isStandard`, `isStablecoin`, `isWrapped`,
`isMirror`).

| Kind         | Meaning                                                                                       | Extra fields                          |
| ------------ | --------------------------------------------------------------------------------------------- | ------------------------------------- |
| `standard`   | A plain ERC-20.                                                                               | —                                     |
| `stablecoin` | USDC / USDT / DAI / EURe and their bridged variants.                                          | `peg`, `backing`, `bridged`, `issuer` |
| `wrapped`    | The canonical wrapper of a chain's **native** gas token (e.g. WETH).                          | `underlyingSymbol`                    |
| `mirror`     | An ERC-20-like contract that mirrors the native token (e.g. the POL precompile at `0x…1010`). | `mirrors`                             |

## Usage

```ts
import {
  getChain,
  getChainByName,
  getToken,
  getTokensBySymbol,
  getStablecoins,
  isStablecoin,
} from "@prb/token-registry";

getChain(1)?.slug; // "mainnet"
getChainByName("matic")?.chainId; // 137 (resolves names, slugs, and aliases)

const usdc = getToken(1, "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
// { kind: "stablecoin", symbol: "USDC", decimals: 6, peg: "USD", bridged: false, ... }

if (usdc && isStablecoin(usdc)) {
  usdc.peg; // "USD"  — narrowed to Stablecoin
}

getTokensBySymbol("USDC").length; // every USDC across all chains
getStablecoins().length; // 96
```

## API

**Chains** — `CHAINS`, `allChains()`, `getChain(chainId)`, `getChainBySlug(slug)`, `getChainByName(name)`
(case-insensitive over name, slug, and aliases).

**Tokens** — `TOKENS`, `getToken(chainId, address)`, `getTokensByChain(chainId)`, `getTokensBySymbol(symbol)`,
`getStablecoins()`, `getWrappedTokens()`, `getMirrorTokens()`, `getStandardTokens()`.

**Addresses** — `isAddress(value)`, `normalizeAddress(value)` (validates and lowercases), `isAddressEqual(a, b)`.

**Types & guards** — `Chain`, `NativeCurrency`, `Token`, `Stablecoin`, `WrappedToken`, `MirrorToken`, `StandardToken`,
`Address`, and the guards `isStandard` / `isStablecoin` / `isWrapped` / `isMirror`.

Addresses are stored lowercased; lookups are case-insensitive. No keccak/EIP-55 checksumming is performed, which keeps
the package dependency-free.

## Contributing

See [`AGENTS.md`](./AGENTS.md) for the development workflow and the generated-data ownership rules.

## License

MIT © [Paul Razvan Berg](https://github.com/PaulRBerg)
