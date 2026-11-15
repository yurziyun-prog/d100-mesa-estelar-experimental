#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
npm ci
npx playwright install --with-deps chromium
npm run check:publication
node scripts/package-pages.cjs
