import { defineConfig } from "oxfmt";

export default defineConfig({
  endOfLine: "lf",
  ignorePatterns: [
    "**/*.md",
    "**/*.mdx",
    "**/*.yaml",
    "**/*.yml",
    "src/tokens/data/**",
    "scripts/enriched.json",
    "data/**",
  ],
  printWidth: 100,
  semi: true,
  singleQuote: false,
  sortImports: false,
  sortPackageJson: false,
  trailingComma: "es5",
});
