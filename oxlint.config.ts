import { defineConfig } from "oxlint";

export default defineConfig({
  categories: {
    correctness: "error",
    nursery: "off",
    pedantic: "off",
    perf: "off",
    restriction: "off",
    style: "off",
    suspicious: "error",
  },
  env: {
    browser: true,
    node: true,
  },
  ignorePatterns: ["src/tokens/data/**", "scripts/enriched.json", "data/**"],
});
