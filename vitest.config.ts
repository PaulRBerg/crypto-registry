import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const CI = Boolean(process.env.CI);
const srcDir = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  resolve: {
    alias: { "@/src": srcDir },
  },
  test: {
    environment: "node",
    globals: true,
    hideSkippedTests: true,
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
    outputFile: CI ? "./test-results.json" : undefined,
    reporters: CI ? ["github-actions", "json"] : ["default"],
  },
});
