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
gh := require("gh")
rg := require("rg")

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

# Dispatch and verify an on-demand development release from current main
[group("publish"), script("bash")]
release-dev:
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
    commit_sha="$(git rev-parse HEAD)"
    if [[ "$commit_sha" != "$(git rev-parse FETCH_HEAD)" ]]; then
      echo "Error: local main must exactly match origin/main" >&2
      exit 1
    fi

    gh_bin="{{ gh }}"
    rg_bin="{{ rg }}"
    active_run="$("$gh_bin" run list \
      --workflow=release.yml \
      --limit=20 \
      --json status,url \
      --jq 'map(select(.status != "completed")) | first | .url // empty')"
    if [[ -n "$active_run" ]]; then
      echo "Error: another release workflow is active: $active_run" >&2
      exit 1
    fi

    package_name="$(jq -r '.name' package.json)"
    base_version="$(jq -r '.version' package.json)"
    if [[ ! "$base_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      echo "Error: package.json version must be a stable X.Y.Z version: $base_version" >&2
      exit 1
    fi

    echo "Repository: PaulRBerg/crypto-registry"
    echo "Branch: main"
    echo "Commit: $commit_sha"
    echo "Package: $package_name"
    echo "Base version: $base_version"
    echo "npm tag: dev"

    dist_tags_before="$(npm view "$package_name" dist-tags \
      --json \
      --registry=https://registry.npmjs.org/ \
      --color=false)"
    latest_before="$(jq -er '.latest | select(type == "string")' <<< "$dist_tags_before")"

    if ! run_output="$("$gh_bin" workflow run release.yml --ref main -f "commit_sha=$commit_sha" 2>&1)"; then
      echo "$run_output" >&2
      exit 1
    fi
    run_url="$(printf '%s\n' "$run_output" | "$rg_bin" -o 'https://github\.com/[^/]+/[^/]+/actions/runs/[0-9]+' || true)"
    if [[ ! "$run_url" =~ ^https://github.com/[^/]+/[^/]+/actions/runs/[0-9]+$ ]]; then
      echo "Error: GitHub CLI returned an unexpected workflow result: $run_output" >&2
      exit 1
    fi
    run_id="${run_url##*/}"

    echo "Workflow: $run_url"
    "$gh_bin" run watch "$run_id" --compact --exit-status

    run_head="$("$gh_bin" run view "$run_id" --json headSha --jq '.headSha')"
    if [[ "$run_head" != "$commit_sha" ]]; then
      echo "Error: workflow published unexpected commit $run_head" >&2
      exit 1
    fi

    npm_metadata="$(npm view "${package_name}@dev" version gitHead \
      --json \
      --registry=https://registry.npmjs.org/ \
      --color=false)"
    published_version="$(jq -er '.version | select(type == "string")' <<< "$npm_metadata")"
    published_git_head="$(jq -er '.gitHead | select(type == "string")' <<< "$npm_metadata")"
    if [[ "$published_git_head" != "$commit_sha" ]]; then
      echo "Error: npm dev tag points to commit $published_git_head, expected $commit_sha" >&2
      exit 1
    fi

    dist_tags="$(npm view "$package_name" dist-tags \
      --json \
      --registry=https://registry.npmjs.org/ \
      --color=false)"
    latest_version="$(jq -er '.latest | select(type == "string")' <<< "$dist_tags")"
    dev_version="$(jq -er '.dev | select(type == "string")' <<< "$dist_tags")"
    if [[ "$latest_version" != "$latest_before" ]] || [[ "$dev_version" != "$published_version" ]]; then
      echo "Error: unexpected npm dist-tags: $dist_tags" >&2
      exit 1
    fi

    echo "Published: ${package_name}@${published_version}"
    echo "Source: $published_git_head"

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
