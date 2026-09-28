#!/usr/bin/env bash
# Records the drawings that fail the comparison, in the image CI uses, then
# removes the baselines of stories that are gone. Extra arguments go to
# Playwright, e.g. `pnpm test:visual:update --grep chip`: as one package script
# joined with `&&`, they reached the prune step instead, and every story ran.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
bash "$here/docker.sh" --update-snapshots=changed "$@"
node "$here/prune-baselines.mjs"
