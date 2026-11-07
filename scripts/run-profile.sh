#!/usr/bin/env bash
# Builds the production bundle (no test hooks), serves it, and runs
# scripts/profile-race.mjs inside the pinned Playwright container.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PLAYWRIGHT_VERSION="$(node -p "require('@playwright/test/package.json').version")"
IMAGE="mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble"

# The anonymous volume keeps the container's Linux node_modules off the host install.
docker run --rm \
  -v "$ROOT:/work" \
  -v /work/node_modules \
  -v /work/dist \
  -w /work \
  "$IMAGE" \
  bash -lc "npm ci --silent && npm run build --silent && \
    (npx vite preview --host 127.0.0.1 --port 4173 >/dev/null 2>&1 &) && \
    for i in \$(seq 30); do \
      node -e \"fetch('http://127.0.0.1:4173/').then(() => process.exit(0), () => process.exit(1))\" && break; \
      sleep 1; \
    done && \
    node scripts/profile-race.mjs"
