---
argument-hint: <chain-name-or-id>
disable-model-invocation: false
name: add-evm-chain
user-invocable: true
description:
  Use when adding a new EVM chain to @prb/crypto-registry and propagating it to the evm-atlas skill in
  ~/projects/agent-skills, including Chainlist/Chrome DevTools research, wrapped-native enrichment, verification,
  commits, and surgical skill publication.
---

# Add EVM Chain

Add one EVM chain to `@prb/crypto-registry`, then propagate the chain metadata into the local `evm-atlas` skill.

## Arguments

- `<chain-name-or-id>`: chain name, slug, or numeric chain ID to add.

## User-facing communication

This is a composed, two-repository workflow. When invoked directly, it owns one top-level wrapper; `$commit`,
`@publish-skills`, and other nested skills return compact phase subreceipts into it rather than opening separate
previews or final summaries.

After the harmless repository, tool, and credential-presence preflight resolves the requested chain as far as possible,
but before the first credential-consuming command, network call, or write, send:

```markdown
### ⛓️ EVM chain addition — 🔎 preview
```

Use a compact table for the resolved target, source families, RPC verification plan, cache/enrichment mode, credential
readiness, affected repositories, local write surfaces, and planned external effects. Show only whether
`ROUTEMESH_API_KEY` is available, never its value. When several metadata fields need evidence, use
`field | value | source | status`; distinguish `verified`, `single-source`, `conflicting`, and `unknown` rather than
calling every sourced value cross-checked. A short tree is useful when it clarifies the real propagation path:

```text
crypto-registry chain + token data
└── agent-skills evm-atlas metadata
    └── declared global skill installations
```

During research and validation, report named phase changes. Add counts only when the denominator is fixed from the
actual plan, for example `⏳ Research — verified 7/10 required metadata fields` or `⏳ Validation — passed 3/4 checks`.
A request sent, browser opened, retry attempted, or process still running is not progress. After generation, use a
compact `♻️ Regenerated` subreceipt naming the generated surfaces and the command that produced them; do not imply they
passed validation yet.

Keep exact commands, helper stdout/stderr, RPC payloads, URLs, chain IDs, contract addresses, hashes, commit IDs, and
diagnostics undecorated. The helper's stdout must remain one valid JSON object. Public chain identifiers are evidence
and should remain exact. Never print `.env.keys`, API keys, credential-bearing RPC URLs, personal `included.tsv` rows,
or private source-repository provenance; summarize private provenance with counts and masked or repo-relative paths.

Before each external-publication boundary, group related effects into one target-specific approval rather than asking
per command:

- Before the `crypto-registry` push, show the exact branch, remote/ref, full ahead-commit list, validation state, and
  push command. Existing ahead commits are part of the proposed push and must be visible.
- Before `@publish-skills`, show the exact `agent-skills` branch and remote/ref, attributable paths, commits that would
  be pushed, affected global repositories, and declared installation targets. Stop on unexpected attributable or staged
  paths. If any of these facts changes materially after approval, preview the new scope and ask again.

Finish with one of these outcomes:

- `### ⛓️ EVM chain addition — ✅ verified · complete` only when both repositories contain the requested metadata, all
  required checks passed, approved pushes and publication succeeded, and declared installations were verified.
- `### ⛓️ EVM chain addition — ✅ verified locally · publication pending` when the complete local change set across both
  repositories passed its required checks and only external publication approval or action remains. Replace `pending`
  with `declined` when the user declined publication; do not imply the full workflow completed.
- `### ⛓️ EVM chain addition — ✅ verified · unchanged` when the requested chain was already represented correctly,
  checks proved that state, and no write or external effect was needed.
- `### ⛓️ EVM chain addition — ⚠️ partial` when useful artifacts exist but a source field, validation gate, local
  propagation step, or attempted push, publication, or installation remains incomplete. Preserve and identify any prior
  or already-published state. If every local gate passed and only publication approval or action remains, use the
  explicit verified-locally outcome instead.
- `### ⛓️ EVM chain addition — ⚠️ review required` when evidence conflicts or a required validation failed and the
  resulting artifacts cannot yet be accepted as verified.
- `### ⛓️ EVM chain addition — ⛔ blocked · not written` when no requested artifact was written because an
  implementation choice, authoritative evidence, credential, or required tool is unavailable.
- `### ⛓️ EVM chain addition — ↩ reverted` only when local changes were actually rolled back; never imply a pushed
  commit was undone unless the compensating remote action is verified.

Follow the outcome with a compact `surface | status | change | validation | external state` table when multiple surfaces
were involved. Include the exact chain ID and public contract addresses used as evidence, repo-relative artifact paths,
generated/hand-authored distinction, source gaps, commit/push state, installation state, and the smallest next action.
Use the explicit `✅ verified locally · publication pending` outcome only when the complete local change set passed
every required check; otherwise use `⚠️ partial` or `⚠️ review required` and do not describe the result as ready for
publication approval.

## Workflow

1. Preflight both repositories.
   - In `crypto-registry`, run `git status --short --branch`.
   - In `~/projects/agent-skills`, run `git status --short --branch`; use this path even if the prompt says
     `agents-kills`.
   - Resolve each current branch, upstream, ahead/behind count, dirty paths, and the commands/tools required by the
     workflow. Read the current `@publish-skills` runbook before describing or authorizing its effects.
   - Check only whether required credentials are available. Never print a credential or decrypted environment.
   - Treat unrelated dirty files as other agents' work. Completion: both repos' starting state is known.
   - Send the user-facing preview before any subsequent network or write action.

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
   - Before `just enrich`, list its expected generated paths and report only whether the required credential is ready.
     Its expected surfaces are `scripts/enriched.json` and the generated token modules under `src/tokens/data/`.
     Afterward, compare the actual changed paths with that set and flag unexpected output.
   - Prefer `just enrich`. If it stalls or fails on unrelated chains, run
     `node scripts/read-erc20-metadata.mjs --rpc <url> --chain-id <id> --slug <slug> --address <wrapped-native>` from
     this skill to diagnose the missing row. Treat the result as complete evidence only when the chain ID matches,
     `symbol` and `name` are non-empty strings, and `decimals` is a valid integer; a `null` field is an unresolved read,
     even though the helper exits successfully. Do not merge the diagnostic row into generated `scripts/enriched.json`
     by hand. If the normal enrichment flow cannot produce the row, stop with the truthful partial or blocked outcome
     and report the precise enrichment gap.
   - After the hand-authored chain and token inputs are final, preview `data/chains.json` and `data/tokens.json` as the
     expected `just json-gen` surfaces, run that recipe, and compare the actual changed paths with the preview. Inspect
     both JSON artifacts for the requested chain and wrapped-native metadata before treating generation as complete.
   - Do not widen support to every viem chain; add only the requested chain. Completion: generated data reflects the new
     chain, with generated files changed only by their owning generators.

5. Verify `crypto-registry`.
   - For fewer than 10 changed JS/TS/JSON files, run `just biome-check <changed files>`; otherwise run
     `just biome-check`.
   - Run `just typecheck`.
   - Run `just test src/chains/lookup.test.ts src/tokens/registry.test.ts`.
   - Run `just tsc-build`.
   - Completion: each command passes. If a repository-wide command fails only on unrelated concurrent work, obtain the
     narrowest equivalent evidence available for the changed surfaces and report the unresolved repository-wide gate as
     a caveat; do not count a failed command as passed or use a complete outcome without the required validation
     evidence.

6. Commit and push `crypto-registry`.
   - Refresh the branch/upstream state and enumerate every commit that the push would publish.
   - Present the exact push receipt described above and obtain approval before the external write.
   - Use `$commit --push` from the `crypto-registry` repository.
   - Return `$commit`'s result as a phase subreceipt. Completion: the intended commit set is verified on the upstream
     ref before publishing `agent-skills`.

7. Update `~/projects/agent-skills`.
   - Confirm the pushed `crypto-registry/data/chains.json` contains the requested chain before generating downstream
     `evm-atlas` data.
   - Edit `skills/evm-atlas/references/atlas-overlays.json` for the new chain.
   - Run `just evm-atlas-generate`.
   - Run `just prettier-write <changed-markdown-path>...`, then `just prettier-check <changed-markdown-path>...` with
     the exact expected evm-atlas Markdown paths. Verify generated registry data with `just evm-atlas-check`.
   - Inspect only the expected evm-atlas paths and leave unrelated work untouched.
   - Refresh repository/upstream state, verify the attributable and staged path sets, present the exact publication
     receipt described above, and obtain approval before external writes and global installation changes.
   - Invoke `@publish-skills` so only the changed `evm-atlas` skill and its declared targets are propagated. Do not use
     the catalog-wide `just sync` fallback. Completion: the generated evm-atlas artifacts are published after the
     crypto-registry push, the intended upstream refs contain the new commits, and every declared installation target is
     verified.

## Helper Script

Run the bundled ERC-20 metadata reader from this skill directory to diagnose a wrapped-native row that the full
enrichment flow could not read:

```bash
node scripts/read-erc20-metadata.mjs --rpc <url> --chain-id <id> --slug <slug> --address <erc20>
```

The script verifies `eth_chainId`, reads `decimals`, `symbol`, and `name`, lowercases the address, and prints a
`scripts/enriched.json`-shaped row. It can emit `null` metadata and still exit successfully; apply the completeness gate
above, and do not treat its output as a replacement for the generated enrichment flow.
