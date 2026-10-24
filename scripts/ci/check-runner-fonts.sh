#!/usr/bin/env bash
# The browser jobs run in the Playwright image, and their layout checks were
# tuned on the runner's fonts: the system stack draws in DejaVu Sans there.
# The image has no DejaVu of its own; the workflows mount the runner's
# (ci.yml's web job says why). This fails, by name, when the generic families
# the browsers resolve through fontconfig are not the runner's, rather than
# leaving it to a layout check to fail as a layout that moved.
set -euo pipefail

status=0
for pair in "sans-serif=DejaVu Sans" "serif=DejaVu Serif" "monospace=DejaVu Sans Mono"; do
  generic="${pair%%=*}"
  want="${pair#*=}"
  got="$(fc-match -f '%{family[0]}' "$generic")"
  if [ "$got" = "$want" ]; then
    echo "$generic: $got"
  else
    echo "::error::$generic resolves to $got here, not $want, the runner's font that the layout checks were tuned on. Is the runner's /usr/share/fonts/truetype/dejavu still mounted into the container?"
    status=1
  fi
done
echo "$(fc-list | wc -l) font faces"
exit "$status"
