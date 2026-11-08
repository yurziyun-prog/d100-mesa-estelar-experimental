#!/bin/sh
# Publica os arquivos do jogo sem os videos de testes que excedem 25 MiB.
# Nenhum arquivo e removido do repositorio GitHub.
set -eu
mkdir -p dist
tar -cf - \
  --exclude='./.git' \
  --exclude='./dist' \
  --exclude='./docs/video-percurso/percurso-jogador-teste.webm' \
  . | tar -xf - -C dist
test -f dist/index.html
echo "Mesa Estelar: arquivos preparados em dist/ (video de teste pesado excluido)."
