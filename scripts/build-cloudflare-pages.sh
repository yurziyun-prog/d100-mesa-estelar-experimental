#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
npm ci
node scripts/await-publication-checks.cjs
npm test
npm run check:syntax
node scripts/package-pages.cjs
