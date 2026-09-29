#!/usr/bin/env bash
# Whether a pull request touches what CI's "iOS Build" job builds, for the
# Changes job (Olcay's decision 24). It writes `ios=true` or `ios=false` to
# $GITHUB_OUTPUT, from one of three outcomes, never two:
#
#   - the paths changed since $BASE are known, and one is an iOS input: true;
#   - they are known, and none is: false, a deliberate skip, which passes the
#     required check;
#   - they could not be worked out (a base this clone lacks, a malformed one,
#     one with no history in common with HEAD, or git failing any other way):
#     true, with a warning. Not knowing is never read as "nothing changed".
#
# No $BASE (a push to main) builds as well.
#
# The iOS inputs: the iOS package; the tokens it compiles against (the job
# builds @kozmos-ds/tokens first); the travel-time table its tests read with
# the web's and Android's; the scripts the job runs; the workflow; and the
# installed dependencies.
#
# scripts/ci/ios-changes.test.mjs runs the workflow's step over a scratch
# repository for each outcome.
set -u

IOS_INPUTS='^(packages/ios/|packages/tokens/|packages/product-contracts/tests/travel-time-bands\.txt$|scripts/check-ios-poi\.mjs$|scripts/figma-connect-native\.mjs$|\.github/workflows/ci\.yml$|package\.json$|pnpm-lock\.yaml$)'

base="${BASE:-}"
output="${GITHUB_OUTPUT:-/dev/stdout}"

# A failed write fails the step, and the iOS job builds when Changes fails.
decide() {
  echo "ios=$1" >>"$output" || exit 1
  exit 0
}

unknown() {
  echo "::warning title=iOS Build::$1, so iOS builds rather than skips."
  decide true
}

if [ -z "$base" ]; then
  echo "No base commit (a push to main): iOS builds."
  decide true
fi

# The list is captured before it is matched. Piped straight into `grep -q`, a
# failed diff reached grep as an empty list, and the pipeline's status was
# grep's "no match": the failure read as "no iOS changes".
if ! changed="$(git diff --name-only "$base"...HEAD)"; then
  unknown "Could not list the paths changed since $base"
fi

matched="$(grep -E "$IOS_INPUTS" <<<"$changed")"
case $? in
  0)
    echo "iOS inputs changed since $base:"
    echo "$matched" | sed 's/^/  /'
    decide true
    ;;
  1)
    echo "No iOS input changed since $base: iOS Build skips, deliberately."
    decide false
    ;;
  *)
    unknown "Could not match the paths changed since $base against the iOS inputs"
    ;;
esac
