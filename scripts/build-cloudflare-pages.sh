#!/bin/sh
# Cloudflare Pages: empacotar o site estatico experimental na pasta dist.
# Preserva as abas existentes do Mesa Estelar e inclui o jogo Orla.
set -eu
cd "$(dirname "$0")/.."
rm -rf dist
mkdir -p dist
for f in index.html mesa.html favicon.ico favicon.svg favicon-32.png apple-touch-icon.png oficina-mesa-56.png suporte-57.png; do
  if [ -f "$f" ]; then cp "$f" dist/; fi
done
for dir in js dados fontes orla; do
  if [ -d "$dir" ]; then cp -R "$dir" dist/; fi
done
test -s dist/index.html || { echo "Erro: index.html nao foi gerado"; exit 1; }
test -s dist/orla/index.html || { echo "Erro: Orla ausente do pacote"; exit 1; }
echo "Cloudflare Pages: site experimental e Orla preparados em dist/"
