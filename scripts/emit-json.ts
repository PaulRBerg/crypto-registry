import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CHAINS } from "../src/chains/chains.js";
import { TOKEN_ADDRESS_ALIASES } from "../src/tokens/aliases.js";
import { TOKENS } from "../src/tokens/registry.js";

const ROOT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = join(ROOT_DIR, "data");

// Code-unit comparison: locale-independent so the artifacts stay byte-stable
// across machines (localeCompare varies with the host locale/ICU).
export function compareStrings(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => compareStrings(a, b))
        .map(([key, entry]) => [key, sortKeys(entry)])
    );
  }
  return value;
}

const stringify = (value: unknown): string => `${JSON.stringify(sortKeys(value), null, 2)}\n`;

/** Render the canonical JSON artifact for non-TypeScript token consumers. */
export function renderTokensJson(): string {
  const aliases = [...TOKEN_ADDRESS_ALIASES].sort(
    (a, b) => a.chainId - b.chainId || compareStrings(a.historicalAddress, b.historicalAddress)
  );
  const tokens = [...TOKENS].sort(
    (a, b) => a.chainId - b.chainId || compareStrings(a.address, b.address)
  );
  return stringify({ aliases, schemaVersion: 2, tokens });
}

/** Render the canonical JSON artifact for non-TypeScript chain consumers. */
export function renderChainsJson(): string {
  const chains = [...CHAINS].sort((a, b) => a.chainId - b.chainId);
  return stringify({ chains, schemaVersion: 2 });
}

/** Write committed JSON artifacts from the current registry data. */
export function emitJson(): void {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(join(DATA_DIR, "tokens.json"), renderTokensJson());
  writeFileSync(join(DATA_DIR, "chains.json"), renderChainsJson());
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) emitJson();
