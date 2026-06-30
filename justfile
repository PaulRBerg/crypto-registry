# See https://github.com/PaulRBerg/devkit/blob/main/just/base.just
import "./node_modules/@prb/devkit/just/base.just"
import "./node_modules/@prb/devkit/just/npm.just"

# ---------------------------------------------------------------------------- #
#                                    RECIPES                                   #
# ---------------------------------------------------------------------------- #

# Default recipe
default:
    just --list

# Build the project (ESM + .d.ts via tsc)
@build:
    echo "🧹 Cleaning dist..."
    just clean
    echo "🔨 Compiling TypeScript..."
    just tsc-build
    echo "📦 Packing tarball..."
    npm pack --quiet
    echo "✅ Build complete"
alias b := build

# Clean the dist directory
@clean:
    nlx del-cli dist
    echo "Cleaned build files"

# Build with TypeScript CLI
@tsc-build:
    na tsc -p tsconfig.build.json

# Type check the project (tsgo, falls back to tsc)
@typecheck:
    just type-check

# Lint the codebase with Biome
@lint:
    just biome-lint

# Format the codebase with Biome + Prettier
@format:
    just full-write

# Run tests
@test *args:
    na vitest run {{ args }}
alias t := test

# Run tests with UI
@test-ui *args:
    na vitest --ui {{ args }}
alias tui := test-ui

# Regenerate src/tokens/data/*.ts from on-chain enrichment (pass --cached to skip the network)
@enrich *args:
    bun scripts/enrich.ts {{ args }}
