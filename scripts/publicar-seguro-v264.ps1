# Publicação segura da Mesa Estelar v264
# Uso: .\scripts\publicar-seguro-v264.ps1 -PastaOriginal "C:\caminho\do\mesa-sync-original"
# Execute dentro de um clone da branch atual do D100.
param([Parameter(Mandatory=$true)][string]$PastaOriginal)
$ErrorActionPreference = 'Stop'
$projeto = Split-Path -Parent $PSScriptRoot
if (!(Test-Path (Join-Path $projeto 'firebase.json'))) { throw 'Execute este script a partir da pasta scripts/ de um clone do D100.' }
if (!(Test-Path $PastaOriginal -PathType Container)) { throw "Pasta original não encontrada: $PastaOriginal" }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js não encontrado.' }
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) { throw 'npx não encontrado.' }
$origem = (Resolve-Path $PastaOriginal).Path
$destino = (Resolve-Path $projeto).Path
if ($origem -eq $destino) { throw 'A pasta original deve ser diferente da pasta de publicação.' }
# Não clonar nem apagar a fonte, e não tentar substituir as pastas por dados parciais.
foreach ($nome in @('arte','imagens')) {
    $pastaOrigem = Join-Path $origem $nome
    if (Test-Path $pastaOrigem -PathType Container) {
        $pastaDestino = Join-Path $destino $nome
        New-Item -ItemType Directory -Force -Path $pastaDestino | Out-Null
        Copy-Item -Path (Join-Path $pastaOrigem '*') -Destination $pastaDestino -Recurse -Force
        Write-Host "Artes copiadas: $nome" -ForegroundColor Green
    }
}
$essenciais = @(
 'arte/texturas/grama.webp',
 'arte/texturas/madeira.webp',
 'arte/texturas/tijolo.webp',
 'arte/texturas/terra.webp'
)
foreach ($arq in $essenciais) {
    if (!(Test-Path (Join-Path $destino $arq))) {
        throw "PUBLICAÇÃO CANCELADA: falta $arq. Procure outra cópia completa das artes."
    }
}
Push-Location $destino
try {
    Write-Host 'Preparando o site e conferindo as artes...' -ForegroundColor Cyan
    node scripts/preparar-hosting.cjs
    if ($LASTEXITCODE -ne 0) { throw 'Falha na preparação. Nada foi publicado.' }
    Write-Host 'Publicando somente arquivos do Hosting, não Firestore...' -ForegroundColor Yellow
    npx --yes firebase-tools deploy --only hosting --project d100-mesa-estelar
    if ($LASTEXITCODE -ne 0) { throw 'O Firebase não confirmou a publicação.' }
    Write-Host 'Site publicado: https://d100-mesa-estelar.web.app' -ForegroundColor Green
} finally { Pop-Location }
