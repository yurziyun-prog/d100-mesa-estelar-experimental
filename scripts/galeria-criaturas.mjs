// Galeria de REVISÃO das espécies presentes no mapa de testes (docs/galeria-criaturas.html + .png): por espécie, parado · andar · atacar · morrer, com a pessoa de referência na MESMA escala (px por metro).
// A arte vem do catálogo RESOLVIDO (mesmo caminho do jogo: cima_<id>), não de uma tabela de fontes. Rodar: node scripts/galeria-criaturas.mjs
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
const raiz=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');const imp=p=>import(pathToFileURL(path.join(raiz,p)).href);
const {SPRITES_3D}=await imp('js/mesa-sprites-3d-dados.js'),{ESCALA_FISICA}=await imp('js/mesa-escala-fisica.js'),{ESPECIES,a3DaEspecie}=await imp('js/mesa-especies-mapa.js'),{POPULACAO}=await imp('js/mesa-ecossistema.js');
const PXM=64;const ids=[...new Set(POPULACAO.map(p=>p[0]))];
const GRUPOS={insetoide:'Insetoides (bípedes, 4 braços)',artropode_alienigena:'Artrópodes alienígenas',primata_alienigena:'Primata',humanoide_monstro:'Humanoides monstruosos',voador_alienigena:'Voadores',montaria:'Montarias',animal_alienigena:'Animais alienígenas',anfibio_alienigena:'Anfíbios/aquáticos',aquatico_alienigena:'Anfíbios/aquáticos'};
const quadro=(a3,folha,qual,metros,rotulo)=>{
 const f=SPRITES_3D[a3]?.folhas?.[folha+'_lado']||SPRITES_3D[a3]?.folhas?.[folha];if(!f)return `<div class="q vazio" style="width:${Math.round(metros*PXM)}px;height:${Math.round(metros*PXM)}px"><small>${rotulo}<br>sem ${folha}</small></div>`;
 const i=qual==='meio'?Math.floor(f.quadros/2):qual==='fim'?f.quadros-1:0,t=Math.round(metros*PXM);
 return `<div class="q" title="${a3} · ${f.arquivo}" style="width:${t}px;height:${t}px;background:url('../arte/miniaturas3d/${f.arquivo}') ${f.quadros>1?(i/(f.quadros-1)*100):0}% 0/${f.quadros*100}% 100% no-repeat"><small>${rotulo}</small></div>`;
};
const pessoa=(folha,qual,rotulo)=>{const f=SPRITES_3D.cima_pessoa?.folhas?.[folha+'_lado'];if(!f)return '';const i=qual==='meio'?Math.floor(f.quadros/2):qual==='fim'?f.quadros-1:0,t=Math.round(2.2*PXM);return `<div class="q ref" style="width:${t}px;height:${t}px;background:url('../arte/miniaturas3d/${f.arquivo}') ${(i/(f.quadros-1)*100)}% 0/${f.quadros*100}% 100% no-repeat;filter:brightness(.8) sepia(.5)"><small>${rotulo}</small></div>`;};
const linhas={};
for(const id of ids){
 const e=ESPECIES[id]||{nome:id,grupo:'sem identidade'},a3=a3DaEspecie(id),tem=!!SPRITES_3D[a3],f=ESCALA_FISICA[a3],metros=f?.metros||2.2,g=GRUPOS[e.grupo]||e.grupo;
 const aviso=!tem?'<b class="av">sem arte 3D de cima no catálogo</b>':!f?'<b class="av">sem medida física (usa o dimensionamento antigo)</b>':'';
 (linhas[g]=linhas[g]||[]).push(`<tr><td class="nome"><b>${e.nome}</b><br><code>${id}</code><br>${e.anatomia||''}<br>arte: <code>${a3}</code><br>quadro ${metros} m · pegada ${f?.pegadaM??'—'} m · colisão ${f?.soloM??'—'} m · altura ${f?.alturaM??'—'} m${aviso?'<br>'+aviso:''}${SPRITES_3D[a3]?.aprovadaV205?'<br><i>arte APROVADA (Blender) preservada</i>':''}</td>
  <td>${pessoa('parado','ini','pessoa 1,75 m')}${quadro(a3,'parado','ini',metros,'parado')}${quadro(a3,'andar','meio',metros,'andar')}${quadro(a3,'atacar','meio',metros,'atacar')}${quadro(a3,'golpe','meio',metros,'golpe')}${quadro(a3,'morrer','fim',metros,'morrer')}</td></tr>`);
}
const html=`<!doctype html><meta charset="utf-8"><title>Galeria de criaturas</title><style>body{background:#241c14;color:#eee;font:13px Segoe UI,Arial;margin:16px}h2{border-bottom:1px solid #8a6a3a;margin-top:26px}table{border-collapse:collapse}td{vertical-align:top;padding:6px 10px;border-bottom:1px solid #3a2e20}td.nome{width:300px}.q{display:inline-block;position:relative;margin-right:6px;background-color:#5a4a34;border:1px dotted #8a7a5a}.q small{position:absolute;left:2px;top:2px;background:rgba(0,0,0,.6);padding:0 4px;font-size:11px}.q.ref{border-color:#6af}.q.vazio{opacity:.5}.av{color:#ffb060}code{color:#9fd}</style>
<h1>Galeria de revisão — espécies do mapa de testes (${ids.length}) · ${PXM} px por metro · pessoa de referência em azul</h1><p>Gerada por <code>scripts/galeria-criaturas.mjs</code> a partir do catálogo resolvido. Revisão de forma/escala; a prova de uso no mapa está em <code>docs/galeria-mapa/</code>.</p>
${Object.entries(linhas).map(([g,l])=>`<h2>${g}</h2><table>${l.join('')}</table>`).join('')}`;
fs.writeFileSync(path.join(raiz,'docs','galeria-criaturas.html'),html);console.log('galeria:',ids.length,'espécies');
const {chromium}=await import(pathToFileURL('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href).catch(()=>({chromium:null}));
if(chromium){const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'}),p=await b.newPage({viewport:{width:1500,height:1000}});await p.goto(pathToFileURL(path.join(raiz,'docs','galeria-criaturas.html')).href);await p.waitForTimeout(1500);await p.screenshot({path:path.join(raiz,'docs','galeria-criaturas.png'),fullPage:true});await b.close();console.log('png gerado');}
