#!/usr/bin/env bash
# Compose's Paparazzi goldens are recorded only here: in a Linux amd64
# container like CI's Android job (ubuntu-latest, Zulu 17), on this checkout
# (owner, 2026-10-24). CI never records; its verify on Linux is the verdict.
#
#   pnpm android:paparazzi build
#       Builds the image, kozmos-paparazzi:17, from scripts/paparazzi/Dockerfile.
#       Once, and again when the Dockerfile changes.
#   pnpm android:paparazzi recordPaparazziDebug --tests 'com.kozmos.components.button.KozmosButtonPaparazziTest'
#       Records one class's goldens into packages/android/src/test/snapshots/images/.
#   pnpm android:paparazzi verifyPaparazziDebug [--tests '<class>']
#       Verifies them, as CI does.
#
# Any other arguments go to Gradle in packages/android. Gradle builds into
# $PAPARAZZI_OUT, by default a folder of this checkout's name under the system's
# temporary directory, so the Mac's own build folder is left alone. Read the
# results by name in $PAPARAZZI_OUT/android/test-results/testDebugUnitTest/.
#
# Needs Docker running. It uses the current docker context; set DOCKER_HOST or
# DOCKER_CONTEXT to reach another daemon. The container is named after the
# checkout (PAPARAZZI_CONTAINER overrides it), so two checkouts can run at once.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
root="$(cd "$here/../.." && pwd)"
image="kozmos-paparazzi:17"
platform="linux/amd64"
checkout="$(basename "$root" | LC_ALL=C sed 's/[^A-Za-z0-9_.-]/-/g')"

if ! docker info >/dev/null 2>&1; then
  echo "Docker is not running. Start Docker Desktop, then run this again." >&2
  exit 1
fi

if [ "${1:-}" = "build" ]; then
  # The image carries the SDK licences already accepted on this machine,
  # copied from its own SDK; nothing is accepted on the caller's behalf.
  sdk="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
  props="$root/packages/android/local.properties"
  if [ -z "$sdk" ] && [ -f "$props" ]; then
    sdk="$(sed -n 's/^sdk\.dir=//p' "$props" | tail -n 1)"
  fi
  if [ -z "$sdk" ] || [ ! -d "$sdk/licenses" ]; then
    echo "No accepted Android SDK licences found. Set ANDROID_HOME to an SDK whose licences" >&2
    echo "you have accepted (Android Studio, or sdkmanager --licenses), then run this again." >&2
    exit 1
  fi
  context="$(mktemp -d)"
  trap 'rm -rf "$context"' EXIT
  cp "$here/Dockerfile" "$context/Dockerfile"
  cp -R "$sdk/licenses" "$context/licenses"
  docker build --platform "$platform" -t "$image" "$context"
  exit 0
fi

if [ "$#" -eq 0 ]; then
  echo "Usage: pnpm android:paparazzi build | recordPaparazziDebug --tests '<class>' | verifyPaparazziDebug" >&2
  exit 1
fi
if ! docker image inspect "$image" >/dev/null 2>&1; then
  echo "No $image image. Build it once: pnpm android:paparazzi build" >&2
  exit 1
fi

tmp="${TMPDIR:-/tmp}"
out="${PAPARAZZI_OUT:-${tmp%/}/kozmos-paparazzi-$checkout}"
mkdir -p "$out"
name="${PAPARAZZI_CONTAINER:-kozmos-paparazzi-$checkout}"

# A Mac's local.properties names its own SDK, which the container does not
# have. Gradle reads it before the image's ANDROID_HOME, warns that the folder
# does not exist and falls back; an empty file mounted over it for the run
# keeps the container on the image's SDK, and the checkout's copy as it is.
mask=()
if [ -f "$root/packages/android/local.properties" ]; then
  empty="$(mktemp)"
  trap 'rm -f "$empty"' EXIT
  mask=(-v "$empty":/repo/packages/android/local.properties:ro)
fi

echo "Gradle in $image ($platform) on $root; build output in $out" >&2
docker run --rm --platform "$platform" \
  --name "$name" \
  -v "$root":/repo \
  -v "$out":/build-out \
  -v "$here/build-dir.init.gradle":/init/build-dir.init.gradle:ro \
  ${mask[@]+"${mask[@]}"} \
  -v kozmos-paparazzi-gradle:/root/.gradle \
  -e LANG=C.UTF-8 \
  -e GRADLE_OPTS="-Dorg.gradle.daemon=false" \
  "$image" ./gradlew --no-daemon --no-watch-fs --init-script /init/build-dir.init.gradle "$@"
