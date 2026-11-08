// Gera js/mesa-creditos-dados.js: créditos dos pacotes 3D usados no jogo (criador, licença, link no Poly Pizza, nomes dos modelos).
// Os metadados (criador, licença, link, modelos que exigem crédito) foram lidos das páginas https://poly.pizza/bundle/... em 21/10/2026.
// Os nomes dos modelos vêm dos arquivos .glb dos zips baixados. Uso: node scripts/gerar-creditos.cjs
const fs=require('fs'),path=require('path'),cp=require('child_process');
const ZIPS_DIRS=['C:/Users/yurzi/Documents/Codex/2026-09-09','C:/Users/yurzi/Downloads'];
const raiz=path.join(__dirname,'..');
// zip → {nome, criador, caminho no Poly Pizza, licença, usos, ccby:[[modelo,criador]] (modelos que exigem crédito CC-BY 3.0)}
const Q='Quaternius',L0='CC0 (domínio público)';
const P=[
 ['Animated Animal Pack-glb.zip','Animated Animal Pack',Q,'/bundle/Animated-Animal-Pack-ILAPXeUYiS',L0,'Criaturas 3D animadas (cervo, lobo, raposa…)'],
 ['Animated Dinosaur Bundle-glb.zip','Animated Dinosaur Bundle',Q,'/bundle/Animated-Dinosaur-Bundle-SmoLdBLO2K',L0,'Criaturas 3D animadas (dinossauros)'],
 ['City Pack.undefined-glb.zip','City Pack','J-Toastie','/bundle/City-Pack-kJqRAIGsw0','CC-BY 3.0 e CC0 (varia por modelo)','Cenário urbano e veículos',
  [['Flower Pot','Zsky'],['Mailbox','J-Toastie'],['Manhole Cover','J-Toastie'],['Bus stop sign','dook'],['Fence Piece / Fence End / Fence','J-Toastie'],['Floor Hole','J-Toastie'],['Cone','J-Toastie'],['Tree','Poly by Google'],['Gb Blank / RB Blank','J-Toastie'],['Greenhouse','J-Toastie'],['Building Green / Red / Red Corner / Brown Building / Pizza Corner','J-Toastie'],['Bench','Danni Bittman'],['Fire Exit / Roof Exit','J-Toastie'],['Air conditioner','Poly by Google'],['Trash Can','Zsky'],['trah bag grey','Jens Kull'],['Rock band poster','jeremy'],['Yellow Post-it','Zack Huang'],['Washing Line / ATM / Power Box / Planter & Bushes','J-Toastie'],['Fire hydrant / Stop sign / Billboard / Motorcycle / Bus / Bicycle / Van','Poly by Google'],['Bus Stop','Zsky']]],
 ['Furniture Kit-glb.zip','Furniture Kit','Kenney','/bundle/Furniture-Kit-NoG1sEUD1z',L0,'Mobília (peças de mapa)'],
 ['Furniture Pack-glb.zip','Furniture Pack',Q,'/bundle/Furniture-Pack-pgvx8Zkq8v',L0,'Mobília (peças de mapa)'],
 ['House Plants set.undefined-glb.zip','House Plants set','Isa Lousberg','/bundle/House-Plants-set-Kpj32c7VmF',L0,'Plantas de vaso (peças de mapa)'],
 ['Medieval Village Pack-glb.zip','Medieval Village Pack',Q,'/bundle/Medieval-Village-Pack-NsHhjhlrfY',L0,'Construções de vila (peças de mapa)'],
 ['Modular Dungeons Pack-glb.zip','Modular Dungeons Pack',Q,'/bundle/Modular-Dungeons-Pack-HaFPqhAp3w',L0,'Masmorra (peças de mapa)'],
 ['SC-FI Melee Asset Pack.undefined-glb.zip','SC-FI Melee Asset Pack','Qubzy','/bundle/SC-FI-Melee-Asset-Pack-XkeEyiyyrv','CC-BY 3.0 (exige crédito)','Armas corpo a corpo de ficção científica',
  [['SCI-FI Staff / Magic Wand / Sword / Scythe / Brass-Knuckles / Axe / Hammer / Blue Spear / Energy Sword / Knife / Aether Shard – Energy Sword (todos os 11)','Qubzy']]],
 ['Sci-Fi Modular Gun Pack-glb.zip','Sci-Fi Modular Gun Pack',Q,'/bundle/Sci-Fi-Modular-Gun-Pack-TbRddR9Fsu',L0,'Armas de ficção científica'],
 ['Sci-fi Pack.undefined-glb.zip','Sci-fi Pack','Dipper98','/bundle/Sci-fi-Pack-VvUkGmMQWT',L0,'Cenário de ficção científica (peças de mapa)'],
 ['Scifi Gun Pack-glb.zip','Scifi Gun Pack',Q,'/bundle/Scifi-Gun-Pack-rBroUbKkqM',L0,'Armas de ficção científica'],
 ['Space Bits.undefined-glb.zip','Space Bits','Kay Lousberg','/bundle/Space-Bits-k0H16lrI3q',L0,'Peças espaciais (peças de mapa)'],
 ['Space Habitat Kit.undefined-glb.zip','Space Habitat Kit','Crispy_Prawn','/bundle/Space-Habitat-Kit-v0UGrTL7XN','CC-BY 3.0 e CC0 (varia por modelo)','Habitat espacial (peças de mapa)',
  [['Cactus / Desert / Cactus wren / Hummingbird / Turtle / Desert marigold / Pipe organ cactus / Space probe / Moon / Space rover / International Space Station','Poly by Google'],['Desert bloom','Leigh Garland'],['Support Structure for Lighting','Peter Simcoe'],['Ladder','Marisha'],['Hand Rake','Jarlan Perez']]],
 ['Stylized Nature MegaKit.undefined-glb.zip','Stylized Nature MegaKit',Q,'/bundle/Stylized-Nature-MegaKit-T34GZFA0fm',L0,'Natureza (peças de mapa)'],
 ['Survival Pack-glb.zip','Survival Pack',Q,'/bundle/Survival-Pack-XzvQPP0yWB',L0,'Objetos de sobrevivência (peças de mapa)'],
 ['Toon Shooter Game Kit-glb.zip','Toon Shooter Game Kit',Q,'/bundle/Toon-Shooter-Game-Kit-qraiSXoAru',L0,'Personagens e criaturas 3D animados'],
 ['Ultimate Food Pack-glb.zip','Ultimate Food Pack',Q,'/bundle/Ultimate-Food-Pack-h3WC1gyRb4',L0,'Ícones de comida'],
 ['Ultimate House Interior Pack-glb.zip','Ultimate House Interior Pack',Q,'/bundle/Ultimate-House-Interior-Pack-2SXnFbwFzm',L0,'Interior de casa (peças de mapa)'],
 ['Ultimate Modular Men Pack-glb.zip','Ultimate Modular Men Pack',Q,'/bundle/Ultimate-Modular-Men-Pack-ZiH8muWqwQ',L0,'Personagens 3D animados'],
 ['Ultimate Modular Women Pack-glb.zip','Ultimate Modular Women Pack',Q,'/bundle/Ultimate-Modular-Women-Pack-aCBDXDdTNN','CC0 e CC-BY 3.0 (varia por modelo)','Personagens 3D animados',
  [['Sci Fi Character / Witch / Worker / Suit / Soldier',Q]]],
 ['Ultimate RPG Items Bundle-glb.zip','Ultimate RPG Items Bundle',Q,'/bundle/Ultimate-RPG-Items-Bundle-h8mhlZ0dG8',L0,'Ícones de itens (armas, armaduras, tesouros)'],
 ['Ultimate Space Kit-glb.zip','Ultimate Space Kit',Q,'/bundle/Ultimate-Space-Kit-YWh743lqGX',L0,'Espaço (peças de mapa)'],
 ['Ultimate Stylized Nature Pack-glb.zip','Ultimate Stylized Nature Pack',Q,'/bundle/Ultimate-Stylized-Nature-Pack-zyIyYd9yGr',L0,'Natureza (peças de mapa)'],
 // novos (baixados em 21/10/2026)
 ['Ultimate Monsters Bundle-glb.zip','Ultimate Monsters Bundle',Q,'/bundle/Ultimate-Monsters-Bundle-5oyGWAmOB6',L0,'Monstros animados'],
 ['Animated Enemies-glb.zip','Animated Enemies',Q,'/bundle/Animated-Enemies-a53OJwHrhh',L0,'Inimigos animados'],
 ['Post Apocolypse Pack.undefined-glb.zip','Post Apocolypse Pack',Q,'/bundle/Post-Apocolypse-Pack-jg0We8Clu0','CC0 e CC-BY 3.0 (varia por modelo)','Sobreviventes, zumbis e cenário pós-apocalíptico',
  [['Zombie half / Characters Pug / Big arm / Zombie / German Shepard',Q]]],
 ['Cyberpunk Game Kit-glb.zip','Cyberpunk Game Kit',Q,'/bundle/Cyberpunk-Game-Kit-Hkfxa8K8zF',L0,'Cenário e personagens cyberpunk'],
 ['Ultimate Fantasy RTS-glb.zip','Ultimate Fantasy RTS',Q,'/bundle/Ultimate-Fantasy-RTS-nSDjmACoSU',L0,'Construções e unidades de fantasia'],
 ['Pirate kit-glb.zip','Pirate kit',Q,'/bundle/Pirate-kit-0q5ulmIYqQ',L0,'Piratas, navios e cenário'],
 ['Farm Animal Pack-glb.zip','Farm Animal Pack',Q,'/bundle/Farm-Animal-Pack-1kUvRTPLzT',L0,'Animais de fazenda animados'],
 ['Animated Fish Bundle-glb.zip','Animated Fish Bundle',Q,'/bundle/Animated-Fish-Bundle-44zhHN1UbT',L0,'Peixes animados'],
 ['Animated Men Pack-glb.zip','Animated Men Pack',Q,'/bundle/Animated-Men-Pack-DAC9SDgMQT',L0,'Personagens animados'],
 ['Animated Women Pack-glb.zip','Animated Women Pack',Q,'/bundle/Animated-Women-Pack-HHSKxnk1mY',L0,'Personagens animadas'],
 ['Ultimate Guns Pack-glb.zip','Ultimate Guns Pack',Q,'/bundle/Ultimate-Guns-Pack-cpgUfI4t2F',L0,'Armas de fogo'],
 ['Farm Buildings Bundle-glb.zip','Farm Buildings Bundle',Q,'/bundle/Farm-Buildings-Bundle-ppbnhEfNEt',L0,'Construções de fazenda']
];
const ps=c=>cp.execFileSync('powershell',['-NoProfile','-Command',c],{maxBuffer:1<<26}).toString();
const achar=z=>ZIPS_DIRS.map(d=>path.join(d,z)).find(f=>fs.existsSync(f));
const limpa=n=>n.replace(/\.glb$/i,'').replace(/-[A-Za-z0-9]{8,12}$/,'').replace(/[-_]+/g,' ').trim();
const saida=[];
for(const [zip,nome,criador,caminho,lic,uso,ccby] of P){
 const f=achar(zip);let modelos=[];
 if(f){const out=ps(`Add-Type -AssemblyName System.IO.Compression.FileSystem;$z=[IO.Compression.ZipFile]::OpenRead('${f.replace(/\//g,'\\')}');$z.Entries|Where-Object {$_.Length -gt 0 -and $_.Name -match '\\.glb$'}|ForEach-Object {$_.Name};$z.Dispose()`);
  modelos=[...new Set(out.split(/\r?\n/).map(s=>s.trim()).filter(Boolean).map(limpa))].sort();}
 else console.log('zip não encontrado:',zip);
 saida.push({nome,criador,url:'https://poly.pizza'+caminho,licenca:lic,uso,modelos,...(ccby?{exigeCredito:ccby.map(([m,c])=>({modelos:m,criador:c}))}:{})});
}
const donos=[...new Set(saida.flatMap(p=>[p.criador,...(p.exigeCredito||[]).map(e=>e.criador)]))].sort((a,b)=>a.localeCompare(b));
fs.writeFileSync(path.join(raiz,'js','mesa-creditos-dados.js'),'// Gerado por scripts/gerar-creditos.cjs — créditos dos pacotes 3D (Poly Pizza). CC0 não exige crédito; CC-BY 3.0 exige (listado em exigeCredito).\nexport const PACOTES_CREDITOS='+JSON.stringify(saida)+';\nexport const CRIADORES='+JSON.stringify(donos)+';\n');
console.log('pacotes:',saida.length,'criadores:',donos.join(', '),'modelos:',saida.reduce((n,p)=>n+p.modelos.length,0));
