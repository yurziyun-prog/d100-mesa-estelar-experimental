$firebaseConfig = Get-Content -LiteralPath "$env:USERPROFILE/.config/configstore/firebase-tools.json" -Raw | ConvertFrom-Json
$headersTask = @{ Authorization = 'Bearer ' + $firebaseConfig.tokens.access_token }
$rulesTask = Get-Content -LiteralPath 'firestore.rules' -Raw
$testsTask = @()
foreach($caseTask in @(@{name='Dono entra';uid='player';owner='player';active=$false;expect='ALLOW'},@{name='Outro jogador não entra';uid='impostor';owner='player';active=$false;expect='DENY'},@{name='Entrada durante combate bloqueada';uid='player';owner='player';active=$true;expect='DENY'})) {
 $testsTask += @{expectation=$caseTask.expect;request=@{path='/databases/(default)/documents/combatesAtivos/mapaMesaSyncDireta/posicoes/pj';method='create';auth=@{uid=$caseTask.uid;token=@{email='test@example.com'}};resource=@{data=@{nome='PJ';imagem='';donoUid=$caseTask.uid;x=1;y=1;revision=0;facing=0;camada=3}}};functionMocks=@(@{function='get';args=@(@{anyValue=@{}});result=@{value=@{data=@{dono=$caseTask.owner;combat=@{active=$caseTask.active}}}}})}
}
$testsTask += @{expectation='ALLOW';request=@{path='/databases/(default)/documents/combatesAtivos/mapaMesaSyncDireta';method='update';auth=@{uid='player';token=@{email='test@example.com'}};resource=@{data=@{joined=@{pj=$true};joiningActorId='pj'}}};resource=@{data=@{joined=@{}}};functionMocks=@(@{function='getAfter';args=@(@{anyValue=@{}});result=@{value=@{data=@{donoUid='player'}}}})}
$bodyTask = @{source=@{files=@(@{name='firestore.rules';content=$rulesTask})};testSuite=@{testCases=$testsTask}} | ConvertTo-Json -Depth 30
$resultTask=Invoke-RestMethod -Method Post -Headers $headersTask -ContentType 'application/json' -Body ([Text.Encoding]::UTF8.GetBytes($bodyTask)) -Uri 'https://firebaserules.googleapis.com/v1/projects/d100-mesa-estelar:test'
$resultTask.testResults | ForEach-Object { [pscustomobject]@{state=$_.state;errors=$_.errors;issues=$_.issues} } | ConvertTo-Json -Depth 10
