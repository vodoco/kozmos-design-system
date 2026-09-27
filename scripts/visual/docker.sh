#!/usr/bin/env bash
# The visual review on your own machine, drawn by the same Playwright image CI
# uses, so a Mac compares what CI compares: `pnpm test:visual` checks every
# story against its baseline; `pnpm test:visual:update` records new baselines
# for the stories you changed on purpose. Extra arguments go to Playwright,
# e.g. `pnpm test:visual --grep chip`.
#
# Needs Docker running and a built Storybook:
#   pnpm exec turbo run build --filter=@kozmos-ds/react...
#   pnpm --filter @kozmos-ds/docs build-storybook
set -euo pipefail

image="mcr.microsoft.com/playwright:v1.58.2-noble"
cd "$(git rev-parse --show-toplevel)"

if [ ! -f apps/docs/storybook-static/index.json ]; then
  echo "No built Storybook. Run: pnpm --filter @kozmos-ds/docs build-storybook" >&2
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  echo "Docker is not running. Start Docker Desktop, then run this again." >&2
  exit 1
fi

# The repository is mounted as it is; the image brings its own browsers and
# fonts. `--ipc=host` keeps Chromium from running out of shared memory.
exec docker run --rm --init --ipc=host \
  -v "$PWD":/work -w /work \
  -e CI \
  "$image" \
  npx playwright test -c playwright.visual.config.ts "$@"
