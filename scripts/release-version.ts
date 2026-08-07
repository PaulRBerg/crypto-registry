import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const STABLE_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
const RELEASE_DATE_PATTERN = /^\d{8}$/;

export function nextDevelopmentVersion(
  baseVersion: string,
  releaseDate: string,
  publishedVersions: readonly string[]
): string {
  if (!STABLE_VERSION_PATTERN.test(baseVersion)) {
    throw new Error(`base version must be a stable X.Y.Z version: ${baseVersion}`);
  }
  if (!RELEASE_DATE_PATTERN.test(releaseDate)) {
    throw new Error(`release date must use YYYYMMDD: ${releaseDate}`);
  }

  const sameDayPattern = new RegExp(`^\\d+\\.\\d+\\.\\d+-dev\\.${releaseDate}\\.(\\d+)$`);
  let highestCounter = 0;

  for (const version of publishedVersions) {
    const match = sameDayPattern.exec(version);
    if (!match) continue;

    const counter = Number(match[1]);
    if (!Number.isSafeInteger(counter)) {
      throw new Error(`development release counter is not a safe integer: ${version}`);
    }
    highestCounter = Math.max(highestCounter, counter);
  }

  if (highestCounter === Number.MAX_SAFE_INTEGER) {
    throw new Error(`development release counter is exhausted for ${releaseDate}`);
  }
  return `${baseVersion}-dev.${releaseDate}.${highestCounter + 1}`;
}

function main(): void {
  const [baseVersion, releaseDate] = process.argv.slice(2);
  if (!baseVersion || !releaseDate) {
    throw new Error("usage: bun scripts/release-version.ts <base-version> <YYYYMMDD>");
  }

  const input: unknown = JSON.parse(readFileSync(0, "utf8"));
  if (
    typeof input !== "string" &&
    (!Array.isArray(input) || !input.every((version) => typeof version === "string"))
  ) {
    throw new Error("published versions must be a JSON string or string array");
  }

  const publishedVersions = typeof input === "string" ? [input] : input;
  process.stdout.write(`${nextDevelopmentVersion(baseVersion, releaseDate, publishedVersions)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
