# AGENTS.md

Agent guidance for `@prb/crypto-registry`. Keep changes surgical and the package viem-only at runtime and isomorphic.

## Stack

- TypeScript, ESM-only (`"type": "module"`), built with `tsc` (no bundler).
- Package manager: **bun** (`bun@1.3.14`). Configs come from `@prb/devkit`.
- Recipes via **just**. Typecheck uses `tsgo` (`@typescript/native-preview`).
- Runtime dependency: **viem** only.

## Commands

- `just typecheck` — `tsgo` over `src/` and `scripts/`.
- `just lint` / `just format` — Biome (format also runs Prettier on Markdown).
- `just test` — Vitest (`src/**/*.test.ts`, `scripts/**/*.test.ts`).
- `just build` — clean `dist/`, compile with `tsconfig.build.json`, `npm pack`.
- `just enrich` — regenerate token data through RouteMesh (see below). Requires `ROUTEMESH_API_KEY`, uses the network,
  and reads an external source dir; not part of the normal build.
- `just json-gen` — regenerate committed JSON artifacts for non-TypeScript consumers after hand edits to
  `src/chains/chains.ts` or `scripts/classification.ts`.

## Lint Rules

After generating or editing code, run these checks **in order**. The `just` recipes wrap Biome, Prettier, and `tsgo`
with the repo's config.

**File argument rules:**

- Changed fewer than 10 files? → pass specific paths or globs
- Changed 10+ files? → omit file arguments to process everything

**Command sequence:**

1. **Identify which file types changed.**
2. **`just biome-check <files>`** — format + lint JS/TS/JSON (skip if none changed). The generated data modules
   (`src/tokens/data/`, `scripts/enriched.json`) are excluded in `biome.jsonc`, so Biome ignores them even if passed.
   Auto-fix with `just format`.
3. **`just prettier-check <globs>`** — check Markdown/YAML formatting (skip if no `.md`/`.mdx`/`.yaml` changed).
   Auto-fix with `just format`.
4. **`just typecheck`** — `tsgo` over `src/` + `scripts/` (always run on the entire project).

**Examples:**

```bash
# Fewer than 10 files: specific paths and/or globs
just biome-check src/tokens/registry.ts scripts/codegen.ts
just prettier-check AGENTS.md

# 10+ files: omit arguments to process everything
just biome-check
just prettier-check

# Type check always runs on the whole project
just typecheck
```

If any command fails, fix only the errors in files you changed.

## Hard constraints

- **Runtime dependencies.** `viem` is the only third-party package allowed in `src/`. Nothing in `src/` may import a
  `node:*` module; the package must run unchanged in the browser.
- ESM-only. Use explicit `.js` extensions on every relative import in `src/` (e.g.
  `import { Token } from "./types.js"`); `tsc` emits them verbatim.
- Addresses are stored lowercased; comparisons are case-insensitive and keccak-free. Do not add EIP-55 checksumming.

## Generated data — do not hand-edit

`src/tokens/data/{stablecoins,wrapped,mirrors,standard}.ts` and `scripts/enriched.json` are generated. Edit the inputs,
then run `just enrich`:

- `scripts/classification.ts` — hand-authored spec: stablecoin families (addresses + peg/backing/issuer), exact-contract
  `TICKER_OVERRIDES`, and the documented `DROPPED` list.
- `src/tokens/aliases.ts` — verified non-callable historical event emitters; codegen treats their historical addresses
  as documented exclusions and resolves them to same-chain canonical tokens at runtime.
- `scripts/enrich.ts` — reads the token universe, fetches `decimals`/`symbol`/ `name` on-chain via viem Multicall3,
  writes `enriched.json`, then runs codegen. Re-run codegen only (no network) with `just enrich --cached`.
- `scripts/codegen.ts` — classifies (precedence: stablecoin > wrapped > mirror > standard) and emits the four data
  modules. A stablecoin's `ticker` defaults to its enriched on-chain symbol, then applies an exact-contract override;
  codegen rejects tickers outside the ASCII bare-ticker shape (`^[A-Za-z0-9][A-Za-z0-9_.-]*$`).
- `src/chains/chains.ts` keeps the supported evm-atlas chain set local, maps those slugs to `viem/chains`, and layers
  local Atlas/accounting metadata on top. Do not widen support to every viem chain.

These generated files are excluded from Biome in `biome.jsonc` to stay compact (one row per line); they are still
typechecked.

`data/tokens.json` and `data/chains.json` are canonical JSON artifacts for non-TypeScript consumers (Go, jq, Python).
TypeScript consumers should use the typed `@prb/crypto-registry` entry; Node ESM JSON imports need
`with { type: "json" }`. Regenerate them with `just json-gen` after hand edits to `chains.ts`, the stablecoin
classification, or ticker overrides.

## Enrichment credentials (dotenvx)

- `.env` contains the encrypted `ROUTEMESH_API_KEY` plus its public key and is safe to commit.
- `.env.keys` contains `DOTENV_PRIVATE_KEY`, is gitignored, and must never be committed or printed.
- Set or rotate the key with `env -u ROUTEMESH_API_KEY na dotenvx set ROUTEMESH_API_KEY <value>`; never write a
  plaintext value to `.env`.
- `just enrich` decrypts `.env` through `dotenvx run`. An existing shell or CI variable takes precedence.
- `just enrich --cached` does not require a decrypted RouteMesh key.

## Hand-authored ticker vocabulary

`src/tokens/tickers.ts` is **hand-authored** (not generated). It holds the chain-agnostic accounting ticker vocabulary:
`STABLECOIN_TICKERS_BY_PEG` (fiat-equivalent quote tickers grouped by peg), `PRICE_ASSET_ALIASES` (wrapped/decorated
ticker → underlying price asset), and `NATIVE_ASSET_CHAINS` (native gas ticker → canonical source-ref chain). These are
deliberate curated supersets of the on-chain token data: they add fiat-only and exchange-specific tickers (`USD`,
`BSC-USD`, `LinkUSD`, `mUSD`, `xDAI`) and non-native wrappers (`WBTC`, `WMATIC`, `clBTC`, `wNXM`) that don't exist as
canonical on-chain symbols. Downstream consumers (e.g. the prb-finance Go tax CLI codegen) treat this as the source of
truth, so edit the literals here and keep `src/tokens/tickers.test.ts` green.

## Data provenance & privacy

- The standard-token set is enriched from `included.tsv` files in a sibling repo (`TOKEN_SOURCE_DIR`, default
  `~/projects/prb-finance/onchain/evm/tokens`). Those TSVs contain personal holdings provenance and are **not**
  committed here; only public on-chain fields (chain id, address, symbol, name, decimals) are baked into the data
  modules and `enriched.json`.
- Wrapped natives and native mirrors are derived from the chain registry. Stablecoins are classified by exact on-chain
  symbol against the families in `classification.ts` (so bridged/legacy variants like `USDC.e`/`USDbC` are caught while
  decorated `aUSDC`/`cDAI`/LP tokens are not). Each contract's `ticker` is its current ecosystem ticker, defaulting to
  the enriched symbol and corrected through `TICKER_OVERRIDES` when that symbol is stale or ambiguous; consumers apply
  the newest ticker retroactively rather than preserving historical names. Tickers must satisfy the ASCII bare-ticker
  invariant. `bridged` remains best-effort (symbol/name heuristic plus `FORCE_BRIDGED`).

## Conventions

- Token types are a discriminated union on `kind`; add new kinds via `src/tokens/types.ts` and a guard, then thread
  through codegen and lookups.
- Registry invariants (unique `(chainId,address)`, valid addresses, sane decimals, classification disjointness) are
  enforced in `src/tokens/registry.test.ts`; keep them green.
