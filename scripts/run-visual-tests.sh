#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PLAYWRIGHT_VERSION="$(node -p "require('@playwright/test/package.json').version")"
IMAGE="mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble"

MODE="${1:-run}"
PLAYWRIGHT_ARGS="${2:-}"

if [[ "$MODE" == "update" ]]; then
  PLAYWRIGHT_ARGS="--update-snapshots ${PLAYWRIGHT_ARGS}"
fi

# The anonymous volume on /work/node_modules keeps the container's Linux
# install separate from the host's, so `npm ci` here never replaces host binaries.
docker run --rm \
  -v "$ROOT:/work" \
  -v /work/node_modules \
  -w /work \
  -e CI=1 \
  -e VITE_BASE="${VITE_BASE:-/}" \
  "$IMAGE" \
  bash -lc "npm ci && npx playwright test --project visual-desktop --project visual-mobile ${PLAYWRIGHT_ARGS}"
