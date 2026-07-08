---
argument-hint: <chain-name-or-id>
disable-model-invocation: false
name: add-evm-chain
user-invocable: true
description:
  Use when adding a new EVM chain to @prb/crypto-registry and propagating it to the evm-atlas skill in
  ~/projects/agent-skills, including Chainlist/Chrome DevTools research, wrapped-native enrichment, verification,
  commits, and just sync.
---

# Add EVM Chain

Add one EVM chain to `@prb/crypto-registry`, then propagate the chain metadata into the local `evm-atlas` skill.

## Arguments

- `<chain-name-or-id>`: chain name, slug, or numeric chain ID to add.

## Workflow

1. Preflight both repositories.
   - In `crypto-registry`, run `git status --short --branch`.
   - In `~/projects/agent-skills`, run `git status --short --branch`; use this path even if the prompt says
     `agents-kills`.
   - Treat unrelated dirty files as other agents' work. Completion: both repos' starting state is known.

2. Research chain metadata.
   - Open `https://chainlist.org/chain/<chainId>` first.
   - Prefer Chrome DevTools MCP page/network inspection for Chainlist-rendered data when available.
   - Verify every candidate public RPC with `eth_chainId`.
   - Cross-check explorer URLs and IDs with Etherscan V2, Chainscout, RouteMesh, CoinGecko, and direct on-chain reads.
   - Capture: chain ID, slug, name, native currency, RPC URL, explorer URL, explorer family/API URL, wrapped native
     token address, SLIP-44/coin type if available, RouteMesh bridge IDs, Chainscout slug, and CoinGecko platform/native
     IDs. Completion: every value used in code has at least one source and RPC verification for chain identity.

3. Check `viem/chains` support.
   - Confirm the target chain is exported by `viem/chains`.
   - If missing, stop and ask whether to bump `viem` or add a local viem-compatible chain object. Completion: the
     implementation path uses an available viem chain definition or has explicit user direction.

4. Update `crypto-registry`.
   - Update `src/chains/chains.ts` for the supported evm-atlas chain set and local Atlas/accounting metadata.
   - Update `src/chains/lookup.test.ts` for lookup expectations.
   - Add wrapped-native metadata and generated token data through the existing enrichment flow.
   - Prefer `just enrich`. If it stalls or fails on unrelated chains, run
     `node scripts/read-erc20-metadata.mjs --rpc <url> --chain-id <id> --slug <slug> --address <wrapped-native>` from
     this skill to get the missing row, merge it into `scripts/enriched.json`, then run
     `bun scripts/enrich.ts --cached`.
   - Do not widen support to every viem chain; add only the requested chain. Completion: generated data reflects the new
     chain without hand-editing generated modules beyond the codegen output.

5. Verify `crypto-registry`.
   - For fewer than 10 changed JS/TS/JSON files, run `just biome-check <changed files>`; otherwise run
     `just biome-check`.
   - Run `just typecheck`.
   - Run `just test src/chains/lookup.test.ts src/tokens/registry.test.ts`.
   - Run `just tsc-build`.
   - Completion: each command passes, or any failure is isolated to unrelated pre-existing work.

6. Commit and push `crypto-registry`.
   - Use `$commit --push` from the `crypto-registry` repository.
   - Completion: the crypto-registry commit is pushed before syncing `agent-skills`.

7. Update `~/projects/agent-skills`.
   - Edit `skills/evm-atlas/references/atlas-overlays.json` for the new chain.
   - Run `just evm-atlas-generate`.
   - Verify with `just evm-atlas-check` and `just mdformat-check`.
   - Stage only expected evm-atlas files.
   - Run `just sync`. Completion: generated evm-atlas artifacts are synced after the crypto-registry push.

## Helper Script

Run the bundled ERC-20 metadata reader from this skill directory when enrichment needs one wrapped-native row without a
full network regeneration:

```bash
node scripts/read-erc20-metadata.mjs --rpc <url> --chain-id <id> --slug <slug> --address <erc20>
```

The script verifies `eth_chainId`, reads `decimals`, `symbol`, and `name`, lowercases the address, and prints a
`scripts/enriched.json`-shaped row.
