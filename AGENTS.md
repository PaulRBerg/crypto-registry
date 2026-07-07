# AGENTS.md

Agent guidance for `@prb/token-registry`. Keep changes surgical and the package zero-dependency and isomorphic.

## Stack

- TypeScript, ESM-only (`"type": "module"`), built with `tsc` (no bundler).
- Package manager: **bun** (`bun@1.3.14`). Configs come from `@prb/devkit`.
- Recipes via **just**. Typecheck uses `tsgo` (`@typescript/native-preview`).

## Commands

- `just typecheck` — `tsgo` over `src/` and `scripts/`.
- `just lint` / `just format` — Biome (format also runs Prettier on Markdown).
- `just test` — Vitest (`src/**/*.test.ts`).
- `just build` — clean `dist/`, compile with `tsconfig.build.json`, `npm pack`.
- `just enrich` — regenerate token data (see below). Network + reads an external source dir; not part of the normal
  build.

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

- **Zero runtime dependencies.** Nothing in `src/` may import a third-party package or a `node:*` module — the package
  must run unchanged in the browser. `viem` is a dev-only dependency used solely by `scripts/`.
- ESM-only. Use explicit `.js` extensions on every relative import in `src/` (e.g.
  `import { Token } from "./types.js"`); `tsc` emits them verbatim.
- Addresses are stored lowercased; comparisons are case-insensitive and keccak-free. Do not add EIP-55 checksumming.

## Generated data — do not hand-edit

`src/tokens/data/{stablecoins,wrapped,mirrors,standard}.ts` and `scripts/enriched.json` are generated. Edit the inputs,
then run `just enrich`:

- `scripts/classification.ts` — hand-authored spec: stablecoin families (addresses + peg/backing/issuer) and the
  documented `DROPPED` list.
- `scripts/enrich.ts` — reads the token universe, fetches `decimals`/`symbol`/ `name` on-chain via viem Multicall3,
  writes `enriched.json`, then runs codegen. Re-run codegen only (no network) with `bun scripts/enrich.ts --cached`.
- `scripts/codegen.ts` — classifies (precedence: stablecoin > wrapped > mirror > standard) and emits the four data
  modules.
- `src/chains/chains.ts` is also generated (from the prb-finance chain registry); regenerate it from that source rather
  than editing entries by hand.

These generated files are excluded from Biome in `biome.jsonc` to stay compact (one row per line); they are still
typechecked.

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
  decorated `aUSDC`/`cDAI`/LP tokens are not); `bridged` is best-effort (symbol/name heuristic plus `FORCE_BRIDGED`).

## Conventions

- Token types are a discriminated union on `kind`; add new kinds via `src/tokens/types.ts` and a guard, then thread
  through codegen and lookups.
- Registry invariants (unique `(chainId,address)`, valid addresses, sane decimals, classification disjointness) are
  enforced in `src/tokens/registry.test.ts`; keep them green.
