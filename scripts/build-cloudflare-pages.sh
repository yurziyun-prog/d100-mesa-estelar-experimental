#!/bin/sh
# v224: usa exatamente o mesmo empacotador do deploy Firebase.
# O site NAO funciona sem js/app.js: ele e montado a partir de js/app/01-25.
set -eu
node scripts/preparar-hosting.cjs
mkdir -p dist
cp -R .firebase-public/. dist/
test -s dist/index.html
test -s dist/js/app.js
echo "Cloudflare Pages: site empacotado, imports validados e js/app.js presente."
