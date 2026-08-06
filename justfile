# See https://github.com/PaulRBerg/devkit/tree/main/just
import "./node_modules/@prb/devkit/just/settings.just"
import "./node_modules/@prb/devkit/just/utils.just"
import "./node_modules/@prb/devkit/just/npm.just"

# ---------------------------------------------------------------------------- #
#                                 DEPENDENCIES                                 #
# ---------------------------------------------------------------------------- #

na := require("na")
ni := require("ni")
nlx := require("nlx")

# ---------------------------------------------------------------------------- #
#                                   CONSTANTS                                  #
# ---------------------------------------------------------------------------- #

GLOBS_PRETTIER := "\"**/*.{md,mdx,yaml,yml}\""

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

# Clear node_modules recursively
[confirm("Are you sure you want to delete all node_modules, including in subdirectories? [y/N]"), no-cd]
@clean-modules +globs="**/node_modules":
    echo "🧹 Deleting node_modules recursively..."
    nlx del-cli --verbose {{ globs }}

# Install the Node.js dependencies; run with --frozen to install with the frozen lockfile
[no-cd]
@install *args:
    ni {{ args }}

# Build with TypeScript CLI
@tsc-build:
    na tsc -p tsconfig.build.json
alias tb := tsc-build

# Type check the project (tsgo, falls back to tsc)
@typecheck:
    just type-check

# Lint and check formatting with Oxlint/Oxfmt
@lint:
    just ox-check

# Format the codebase with Oxlint/Oxfmt + Prettier
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

# Regenerate token data through RouteMesh (pass --cached to skip the network)
[positional-arguments]
@enrich *args:
    na dotenvx run --quiet -- bun scripts/enrich.ts "$@"

# Regenerate committed JSON data artifacts without network access
@json-gen:
    bun scripts/emit-json.ts

# Validate, tag, and push a stable release from a clean, current main branch
[group("publish"), script("bash")]
release:
    set -euo pipefail

    if [[ -n "$(git status --porcelain)" ]]; then
      echo "Error: the working tree must be clean" >&2
      exit 1
    fi

    branch="$(git branch --show-current)"
    if [[ "$branch" != "main" ]]; then
      echo "Error: releases must be created from main (current branch: $branch)" >&2
      exit 1
    fi

    git fetch --quiet origin main
    if [[ "$(git rev-parse HEAD)" != "$(git rev-parse FETCH_HEAD)" ]]; then
      echo "Error: local main must exactly match origin/main" >&2
      exit 1
    fi

    version="$(jq -r '.version' package.json)"
    if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      echo "Error: package.json version must be a stable X.Y.Z version: $version" >&2
      exit 1
    fi
    tag="v$version"

    if git show-ref --verify --quiet "refs/tags/$tag"; then
      echo "Error: local tag $tag already exists" >&2
      exit 1
    fi

    if git ls-remote --exit-code --tags origin "refs/tags/$tag" >/dev/null; then
      echo "Error: remote tag $tag already exists" >&2
      exit 1
    else
      rc=$?
      if [[ "$rc" -ne 2 ]]; then
        echo "Error: could not check remote tag $tag" >&2
        exit "$rc"
      fi
    fi

    just full-check
    just test
    just build

    if [[ -n "$(git status --porcelain)" ]]; then
      echo "Error: release checks left the working tree dirty" >&2
      exit 1
    fi

    git fetch --quiet origin main
    if [[ "$(git branch --show-current)" != "main" ]] || \
       [[ "$(git rev-parse HEAD)" != "$(git rev-parse FETCH_HEAD)" ]]; then
      echo "Error: main changed while release checks were running" >&2
      exit 1
    fi

    if git show-ref --verify --quiet "refs/tags/$tag"; then
      echo "Error: tag $tag was created while release checks were running" >&2
      exit 1
    fi

    if git ls-remote --exit-code --tags origin "refs/tags/$tag" >/dev/null; then
      echo "Error: tag $tag was created while release checks were running" >&2
      exit 1
    else
      rc=$?
      if [[ "$rc" -ne 2 ]]; then
        echo "Error: could not recheck remote tag $tag" >&2
        exit "$rc"
      fi
    fi

    git tag --annotate "$tag" --message "$tag"
    git push origin "refs/tags/$tag"

# ---------------------------------------------------------------------------- #
#                                    CHECKS                                    #
# ---------------------------------------------------------------------------- #

# Check code with Oxlint/Oxfmt
[group("checks"), positional-arguments]
@ox-check +paths=".":
    na oxlint --format agent --config oxlint.config.ts --no-error-on-unmatched-pattern "$@"
    na oxfmt --check --config oxfmt.config.ts --no-error-on-unmatched-pattern "$@"
alias oc := ox-check

# Fix code with Oxlint/Oxfmt
[group("checks"), positional-arguments]
@ox-write +paths=".":
    na oxlint --fix --format agent --config oxlint.config.ts --no-error-on-unmatched-pattern "$@"
    na oxfmt --write --config oxfmt.config.ts --no-error-on-unmatched-pattern "$@"
alias ow := ox-write

# Check Prettier formatting
[group("checks"), no-cd]
@prettier-check +globs=GLOBS_PRETTIER:
    na prettier \
        --check \
        --cache \
        --log-level warn \
        --no-error-on-unmatched-pattern \
        {{ globs }}
alias pc := prettier-check

# Format using Prettier
[group("checks"), no-cd]
@prettier-write +globs=GLOBS_PRETTIER:
    na prettier \
        --write \
        --cache \
        --log-level warn \
        --no-error-on-unmatched-pattern \
        {{ globs }}
alias pw := prettier-write

# Type check with TypeScript (tsgo default, falls back to tsc if unavailable)
[group("checks"), no-cd, script("bash")]
[arg("compiler", long, short="c", help="TypeScript compiler (tsgo or tsc)")]
[arg("project", long, short="p", help="Path to tsconfig.json")]
type-check compiler="tsgo" project="tsconfig.json":
    cmd="{{ compiler }}"
    if [[ "$cmd" == "tsgo" ]] && [[ ! -x "node_modules/.bin/tsgo" ]]; then
        cmd="tsc"
    fi
    na "$cmd" --noEmit --project {{ project }}
alias tc := type-check
alias tsc-check := type-check

# Run knip checks
[group("checks"), no-cd]
@knip-check:
    na knip
alias kc := knip-check

# Run knip fixes
[group("checks"), no-cd]
@knip-write:
    na knip --fix
alias kw := knip-write

# Run all code checks
[group("checks"), no-cd]
@full-check:
    just _run-with-status ox-check
    just _run-with-status prettier-check
    just _run-with-status type-check
    echo ""
    echo '{{ GREEN }}All code checks passed!{{ NORMAL }}'
alias fc := full-check

# Run all code fixes
[group("checks"), no-cd]
@full-write:
    just _run-with-status ox-write
    just _run-with-status prettier-write
    echo ""
    echo '{{ GREEN }}All code fixes applied!{{ NORMAL }}'
alias fw := full-write
