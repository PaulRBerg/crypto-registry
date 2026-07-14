import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compareStrings, renderChainsJson, renderTokensJson } from "../scripts/emit-json.js";
import { CHAINS } from "./chains/chains.js";
import { TOKEN_ADDRESS_ALIASES } from "./tokens/aliases.js";
import { TOKENS } from "./tokens/registry.js";

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "data");

const sortedTokens = [...TOKENS].sort(
  (a, b) => a.chainId - b.chainId || compareStrings(a.address, b.address)
);
const sortedChains = [...CHAINS].sort((a, b) => a.chainId - b.chainId);
const sortedAliases = [...TOKEN_ADDRESS_ALIASES].sort(
  (a, b) => a.chainId - b.chainId || compareStrings(a.historicalAddress, b.historicalAddress)
);

describe("JSON data artifacts", () => {
  it("matches the rendered token artifact and registry", () => {
    const rendered = renderTokensJson();
    const committed = readFileSync(join(DATA_DIR, "tokens.json"), "utf8");
    expect(committed).toBe(rendered);
    expect(JSON.parse(committed)).toEqual({
      aliases: sortedAliases,
      schemaVersion: 2,
      tokens: sortedTokens,
    });
  });

  it("matches the rendered chain artifact and registry", () => {
    const rendered = renderChainsJson();
    const committed = readFileSync(join(DATA_DIR, "chains.json"), "utf8");
    expect(committed).toBe(rendered);
    expect(JSON.parse(committed)).toEqual({ chains: sortedChains, schemaVersion: 1 });
  });
});
