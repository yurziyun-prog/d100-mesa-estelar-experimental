# D100 Mesa Estelar | Restaurar artes locais e publicar com verificacao
# Execute no PowerShell do Windows. Nao altera dados do Firestore.
param(
 [string]$PastaOriginal = "",
 [switch]$NaoPublicar
)
$ErrorActionPreference='Stop'
$branch='chatgpt-tres-mapas-correcoes-v224'
$repo='https://github.com/yurziyun-prog/d100-mesa-estelar-experimental.git'
$workspace=Join-Path $env:USERPROFILE 'Documents\D100-Publicacao-Segura'
$checkout=Join-Path $workspace 'site'
$timestamp=Get-Date -Format 'yyyyMMdd-HHmmss'
function Informar([string]$s){ Write-Host $s -ForegroundColor Cyan }
function TemArtes([string]$p){
 if(-not $p -or -not (Test-Path $p -PathType Container)){return $false}
 foreach($item in @('arte/texturas/grama.webp','arte/texturas/madeira.webp','arte/texturas/tijolo.webp','arte/texturas/terra.webp')){
  if(-not (Test-Path (Join-Path $p $item))){return $false}
 }
 return $true
}
function EncontrarCopia {
 $raizes=@(
  (Join-Path $env:USERPROFILE 'Documents'),
  (Join-Path $env:USERPROFILE 'Desktop'),
  (Join-Path $env:USERPROFILE 'Downloads'),
  'D:\','E:\'
 ) | Where-Object { $_ -and (Test-Path $_ -PathType Container) }
 $achadas=New-Object 'System.Collections.Generic.List[string]'
 foreach($base in $raizes){
  $candidatas=@($base)
  # Busca limitada a dois niveis para evitar examinar discos inteiros.
  foreach($top in @(Get-ChildItem -Path $base -Directory -ErrorAction SilentlyContinue)){
   $candidatas+= $top.FullName
   foreach($second in @(Get-ChildItem -Path $top.FullName -Directory -ErrorAction SilentlyContinue)){
    $candidatas+= $second.FullName
   }
  }
  foreach($c in $candidatas){if(TemArtes $c){$achadas.Add($c)}}
 }
 return @($achadas | Select-Object -Unique)
}
Informar '=== D100: recuperacao segura da Casa Teste ==='
foreach($cmd in @('git','node','npx')){
 if(-not (Get-Command $cmd -ErrorAction SilentlyContinue)){throw "Instale $cmd antes de prosseguir."}
}
$origem=$PastaOriginal
if(-not (TemArtes $origem)){
 Informar 'Procurando a pasta original com grama, madeira e arvores...'
 $encontradas=@(EncontrarCopia)
 if($encontradas.Count -gt 0){
  $origem=$encontradas[0]
  Write-Host "Copia com artes encontrada: $origem" -ForegroundColor Green
 }else{
  Write-Host "Nao encontrei uma copia completa das artes neste computador." -ForegroundColor Yellow
  Write-Host "Nenhuma publicacao sera feita. Voce pode recuperar as artes da versao anterior do Firebase Hosting." -ForegroundColor Yellow
  exit 2
 }
}
if(-not (TemArtes $origem)){throw "Copia original incompleta: $origem"}
New-Item -ItemType Directory -Path $workspace -Force | Out-Null
if(Test-Path $checkout){
 $antigo=Join-Path $workspace ("site-anterior-"+$timestamp)
 Move-Item -LiteralPath $checkout -Destination $antigo
 Informar "Copia anterior preservada em: $antigo"
}
& git clone --depth 1 --single-branch --branch $branch $repo $checkout
if($LASTEXITCODE -ne 0){throw 'Nao foi possivel baixar a branch corrigida do GitHub.'}
# Copiar artes para o clone, sem modificar os arquivos originais.
foreach($nome in @('arte','imagens')){
 $source=Join-Path $origem $nome
 if(Test-Path $source -PathType Container){
  $target=Join-Path $checkout $nome
  New-Item -ItemType Directory -Force -Path $target | Out-Null
  Copy-Item -Path (Join-Path $source '*') -Destination $target -Recurse -Force
 }
}
Push-Location $checkout
try {
 Informar 'Executando verificacao de integridade e geracao do site...'
 & node scripts/preparar-hosting.cjs
 if($LASTEXITCODE -ne 0){throw 'Verificacao de artes ou de codigo falhou. Publicacao cancelada.'}
 foreach($essencial in @('arte/texturas/grama.webp','arte/texturas/madeira.webp','arte/texturas/tijolo.webp','arte/texturas/terra.webp')){
  if(-not (Test-Path (Join-Path '.firebase-public' $essencial))){throw "Arquivo ausente na versao montada: $essencial"}
 }
 $n=(Get-ChildItem '.firebase-public/arte' -Recurse -File | Measure-Object).Count
 Write-Host "Imagens na publicacao: $n" -ForegroundColor Green
 if($NaoPublicar){Informar 'Verificacao concluida. -NaoPublicar ativo: nada foi enviado.';exit 0}
 $ok=Read-Host 'Publicar agora o site completo no Firebase? Digite PUBLICAR para confirmar'
 if($ok -cne 'PUBLICAR'){Informar 'Publicacao cancelada, sem alterar o site.';exit 0}
 & npx --yes firebase-tools deploy --only hosting --project d100-mesa-estelar
 if($LASTEXITCODE -ne 0){throw 'Firebase nao confirmou a publicacao.'}
 Write-Host 'Publicacao concluida: https://d100-mesa-estelar.web.app' -ForegroundColor Green
} finally {Pop-Location}
