#!/bin/bash
# Run a command with FIGMA_ACCESS_TOKEN taken from the main checkout's .env.
# Only that one variable is passed; the value is never printed.
set -euo pipefail
ENV_FILE="/Volumes/4TB Depo/development/K/kozmos-design-system-dev/.env"
value="$(sed -n 's/^[[:space:]]*FIGMA_ACCESS_TOKEN[[:space:]]*=[[:space:]]*//p' "$ENV_FILE" | head -n 1)"
value="${value%$'\r'}"
value="${value%"${value##*[![:space:]]}"}"
if [[ ${#value} -ge 2 && ( ( "${value:0:1}" == '"' && "${value: -1}" == '"' ) || ( "${value:0:1}" == "'" && "${value: -1}" == "'" ) ) ]]; then
  value="${value:1:${#value}-2}"
fi
if [[ -z "$value" ]]; then echo "FIGMA_ACCESS_TOKEN is not set in the main checkout's .env" >&2; exit 1; fi
export FIGMA_ACCESS_TOKEN="$value"
unset value
exec "$@"
