// Mesa Estelar v179 — 🚀 Viagem: deslocamento entre lugares distantes, a bordo da nave do grupo.
//
// O mestre prepara (origem, destino que os jogadores ACHAM que é o certo, destino REAL, roteiro) e dá a partida.
// Todos veem a mesma cena em tela cheia: o interior da nave, o planeta girando com a rota, o relógio do jogo correndo
// acelerado e o painel (o combustível sempre marca CHEIO). No caminho, cada posto recebe o seu problema — piloto,
// artilheiro, engenheiro, navegador — com poucos segundos para decidir; o teste é rolado de verdade com a perícia da
// ficha e o resultado muda a narração e o estrago na nave… mas o roteiro "Queda" sempre termina no destino real.
// Na chegada: miniaturas do grupo vão para o mapa real, ao lado dos destroços da nave; o relógio avança; a nave do grupo
// fica avariada na ficha; e o mestre recebe (só ele) a nota da sabotagem para uma investigação futura.
//
// Estado em combatesAtivos/mesaViagem (só o mestre grava); pedidos dos jogadores em combatesAtivos/mesaViagem/acoes.

const clean=v=>JSON.parse(JSON.stringify(v??null));
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
export const VIAGEM='combatesAtivos/mesaViagem',PEDIDOS=VIAGEM+'/acoes';
const POS='combatesAtivos/mapaMesaSyncDireta/posicoes',SCENE='combatesAtivos/mapaMesaSyncDiretaCena',RELOGIO='combatesAtivos/mesaRelogio';
export const POSTOS=[
 {id:'piloto',nome:'Piloto',icone:'🧑‍✈️',dica:'Manobras, decolagem, pouso'},
 {id:'artilheiro',nome:'Artilheiro',icone:'🎯',dica:'Canhões e torretas'},
 {id:'engenheiro',nome:'Engenheiro',icone:'🔧',dica:'Motores, energia, consertos'},
 {id:'navegador',nome:'Navegador',icone:'🧭',dica:'Rotas, sensores, mapas'},
 {id:'passageiro',nome:'Passageiro',icone:'🧳',dica:'Segura firme e ajuda onde puder'}
];
export const postoDe=id=>POSTOS.find(p=>p.id===id)||POSTOS[4];

// ---------------------------------------------------------------- roteiros (o que acontece no caminho)
// tarefa.posto: quem resolve ('todos' = cada tripulante faz o seu). opcao.pericias: tenta na ordem, usa a de maior valor.
export const ROTEIROS={
 queda:{nome:'Queda no caminho (meteoros + pane misteriosa)',duracaoS:150,horas:9,queda:true,eventos:[
  {id:'decolagem',abre:8,prazo:22,icone:'🛫',titulo:'Decolagem',texto:'Os motores rugem. A plataforma de Véspera fica para trás num redemoinho de areia.',
   tarefas:[{posto:'piloto',rotulo:'Tirar a nave do chão',opcoes:[
    {id:'suave',texto:'Subida suave e segura',pericias:['Pilotagem'],mod:10,sucesso:'A nave sobe macia, como se flutuasse.',falha:'Um tranco forte; a carga do porão escorrega e bate na parede.',dano:3},
    {id:'rapida',texto:'Subida rápida — ganhar tempo',pericias:['Pilotagem'],mod:-10,sucesso:'Rasgando o céu! Ganharam um bom tempo de viagem.',falha:'O casco geme com a pressão. Um alarme pisca e apaga.',dano:6}]}]},
  {id:'meteoros',abre:36,prazo:24,icone:'☄️',titulo:'Chuva de meteoros',texto:'Sobre o Deserto dos Meteoros o céu se enche de riscos de fogo. Fragmentos vêm na direção da nave!',efeito:'meteoros',
   tarefas:[
    {posto:'piloto',rotulo:'Desviar dos fragmentos',opcoes:[
     {id:'zigue',texto:'Ziguezague entre as pedras',pericias:['Pilotagem'],mod:0,sucesso:'Um balé perfeito entre as pedras em chamas.',falha:'Um fragmento raspa a asa — faíscas pela janela.',dano:12},
     {id:'mergulho',texto:'Mergulhar para baixo da chuva',pericias:['Pilotagem'],mod:-15,sucesso:'Por baixo da tempestade, só poeira acerta o casco.',falha:'O mergulho é fundo demais; a nave chacoalha inteira.',dano:15}]},
    {posto:'artilheiro',rotulo:'Destruir os maiores',opcoes:[
     {id:'rajada',texto:'Rajada contínua nos maiores',pericias:['Armas Pesadas de Energia','Armas Pesadas'],mod:0,sucesso:'Dois blocos enormes viram poeira brilhante.',falha:'Os tiros passam rentes; um bloco atinge a traseira.',dano:10},
     {id:'mirado',texto:'Tiro único, bem mirado, no maior',pericias:['Armas Pesadas de Energia','Armas Pesadas'],mod:-10,sucesso:'Um disparo, um estouro — o caminho se abre.',falha:'O tiro erra. O meteoro passa raspando a cabine.',dano:12}]},
    {posto:'navegador',rotulo:'Traçar rota pela chuva',opcoes:[
     {id:'sensores',texto:'Ler os sensores e achar o corredor livre',pericias:['Astronavegação','Percepção'],mod:0,sucesso:'Um corredor sem pedras aparece no mapa — e o piloto o segue.',falha:'Os sensores se enchem de ruído; a rota sai torta.',dano:6}]}]},
  {id:'motor',abre:72,prazo:24,icone:'⚙️',titulo:'O motor engasga',texto:'Um tranco seco. O motor de bombordo tosse… o painel diz: combustível 100%.',efeito:'pane',
   tarefas:[
    {posto:'engenheiro',rotulo:'Descobrir o que há com o motor',opcoes:[
     {id:'diagnostico',texto:'Abrir o painel do motor e diagnosticar',pericias:['Mecânica','Eletrônica'],mod:0,sucesso:'Estranho: o medidor marca tanque cheio, mas o motor está faminto, sugando vazio. Algo não bate.',falha:'Tudo parece em ordem. O painel jura que o tanque está cheio.',dano:4,pista:true},
     {id:'energia',texto:'Desviar energia da reserva para os motores',pericias:['Eletrônica','Mecânica'],mod:-5,sucesso:'A nave ganha fôlego por alguns minutos preciosos.',falha:'Um estalo, cheiro de fio queimado; a cabine fica no escuro de emergência.',dano:6}]},
    {posto:'piloto',rotulo:'Manter a nave no ar',opcoes:[
     {id:'planar',texto:'Planar para economizar o motor',pericias:['Pilotagem'],mod:0,sucesso:'A nave plana como um falcão sobre as dunas.',falha:'A nave perde altitude aos solavancos.',dano:6}]}]},
  {id:'pane',abre:104,prazo:22,icone:'🚨',titulo:'Pane geral — perdendo altitude',texto:'Os dois motores apagam. Lá embaixo, ruínas no meio do deserto. Não há escolha: vão descer ali.',efeito:'queda',
   tarefas:[
    {posto:'piloto',rotulo:'Pouso forçado',opcoes:[
     {id:'barriga',texto:'Pousar de barriga na areia',pericias:['Pilotagem'],mod:0,sucesso:'Um arrasto longo na areia — mas a nave para inteira.',falha:'A nave quica, gira e se arrasta até parar numa nuvem de poeira.',dano:20},
     {id:'clareira',texto:'Mirar a praça aberta entre as ruínas',pericias:['Pilotagem'],mod:-15,sucesso:'Que pouso! Só a frente amassada.',falha:'Uma asa bate num muro; pedras voam.',dano:25}]},
    {posto:'navegador',rotulo:'Achar onde cair',opcoes:[
     {id:'areia',texto:'Procurar areia funda, longe das pedras',pericias:['Percepção','Astronavegação'],mod:0,sucesso:'Areia funda à vista — vai amortecer o impacto!',falha:'Tudo lá embaixo parece pedra.',dano:6}]},
    {posto:'todos',rotulo:'Preparar-se para o impacto',opcoes:[
     {id:'segurar',texto:'Afivelar o cinto e proteger a cabeça',pericias:['Atletismo','Percepção'],mod:10,sucesso:'Você aguenta o tranco sem um arranhão.',falha:'O tranco joga você contra a parede — vai doer amanhã.',dano:0}]}]}
 ],
 fim:(r)=>`A nave para, torta, meio enterrada na areia. Fumaça, silêncio… e o vento soprando por entre muros antigos. Não é Therion. ${r.casco>=60?'A nave aguentou bem — mas não sai daqui sem conserto e combustível.':r.casco>=35?'A nave está muito avariada; não decola tão cedo.':'A nave está destroçada.'} A noite cai sobre as ruínas.`,
 sabotagem:'Sabotagem: o sensor do tanque foi adulterado para marcar cheio e o tanque foi esvaziado aos poucos (furo fino na linha de combustível, feito em Véspera). Quem fez? Fica para investigar.'},
 tranquila:{nome:'Viagem tranquila',duracaoS:60,horas:4,queda:false,eventos:[
  {id:'decolagem',abre:6,prazo:20,icone:'🛫',titulo:'Decolagem',texto:'Hora de partir.',tarefas:[{posto:'piloto',rotulo:'Decolar',opcoes:[{id:'suave',texto:'Subida suave',pericias:['Pilotagem'],mod:10,sucesso:'Decolagem perfeita.',falha:'Um tranco, mas nada grave.',dano:2}]}]}],
  fim:()=>`Chegada sem sustos.`}
};

// tarefas abertas de um evento para a tripulação (puro): [{chave, tarefa, personagemId|null}]
export function tarefasDoEvento(ev,tripulantes=[],postos={}){
 const out=[];
 for(const t of ev.tarefas||[]){
  if(t.posto==='todos'){for(const p of tripulantes)out.push({chave:ev.id+':todos:'+p.id,tarefa:t,personagemId:p.id});continue;}
  const quem=tripulantes.filter(p=>postos[p.id]===t.posto);
  if(quem.length)out.push({chave:ev.id+':'+t.posto,tarefa:t,personagemId:quem[0].id,todosDoPosto:quem.map(q=>q.id)});
  else out.push({chave:ev.id+':'+t.posto,tarefa:t,personagemId:null}); // ninguém no posto: qualquer um pode tentar
 }
 return out;
}
// estrago total → casco restante (%) (puro). Queda: nunca acima de 70, nunca abaixo de 15.
export function cascoFinal(respostas={},roteiro){
 let dano=0;for(const r of Object.values(respostas))if(!r?.sucesso)dano+=Number(r?.dano)||0;
 const base=roteiro?.queda?82:100;return Math.max(roteiro?.queda?15:40,Math.min(roteiro?.queda?70:100,Math.round(base-dano)));
}
// rolagem d100 com graus (puro; o site usa a mesma tabela quando disponível)
export function rolarD100(valor,die=1+Math.floor(Math.random()*100)){
 const v=Math.max(1,Math.min(99,Math.round(valor)));const sucesso=die<=v;
 const grau=die<=Math.max(1,Math.floor(v/5))?'Crítico':sucesso?'Sucesso':die>=96?'Falha crítica':'Falha';
 return {die,valor:v,sucesso,grau};
}
// procura um espaço livre de w×h metros (centro), perto do ponto preferido (puro)
export function acharClareira(objs=[],W,H,w,h,pref={x:W*.8,y:H*.3}){
 const bl=objs.filter(o=>o.bloqueiaMovimento&&!o.destruido&&!(Number(o.andarV144??o.oficinaElement?.andarV144??1)>1)).map(o=>{const x=o.x*W/28,y=o.y*H/14,r=Math.abs(Math.round((o.angulo||0)/90))%2?[o.alturaM,o.larguraM]:[o.larguraM,o.alturaM];return {x0:x-r[0]/2,x1:x+r[0]/2,y0:y-r[1]/2,y1:y+r[1]/2};});
 const cands=[];for(let y=h/2+1;y<=H-h/2-1;y+=1)for(let x=w/2+1;x<=W-w/2-1;x+=1)cands.push({x,y,d:Math.hypot(x-pref.x,y-pref.y)});cands.sort((a,b)=>a.d-b.d);
 for(const c of cands)if(!bl.some(b=>b.x0<c.x+w/2&&b.x1>c.x-w/2&&b.y0<c.y+h/2&&b.y1>c.y-h/2))return {x:c.x,y:c.y};
 return {x:pref.x,y:pref.y};
}

const ESTILO=`
#vgCena{position:fixed;inset:0;z-index:10050;background:#03060d;color:#e8eefc;font:14px 'Segoe UI',Arial,sans-serif;overflow:hidden;opacity:0;transition:opacity .8s}
#vgCena.on{opacity:1}
#vgCena .vg-estrelas{position:absolute;inset:-50%;background-image:radial-gradient(1px 1px at 20% 30%,#fff8,transparent),radial-gradient(1px 1px at 70% 60%,#fff6,transparent),radial-gradient(2px 2px at 40% 80%,#9cf8,transparent),radial-gradient(1px 1px at 85% 15%,#fff7,transparent),radial-gradient(1px 1px at 10% 70%,#fff5,transparent);background-size:220px 220px;animation:vgEstrelas 18s linear infinite}
#vgCena.rapido .vg-estrelas{animation-duration:5s}
@keyframes vgEstrelas{from{transform:translateX(0)}to{transform:translateX(-220px)}}
#vgCena .vg-cabine{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 120%,rgba(30,60,90,.55),transparent 60%),linear-gradient(180deg,rgba(0,0,0,.0) 55%,rgba(10,18,30,.95) 78%);pointer-events:none}
#vgCena .vg-janela{position:absolute;left:3%;right:3%;top:3%;bottom:30%;border-radius:40% 40% 18% 18%/22% 22% 12% 12%;box-shadow:inset 0 0 0 10px #1a2a3c,inset 0 0 60px #000,0 0 0 3px #3b5878;overflow:hidden}
#vgCena .vg-orbe{position:absolute;left:27%;top:47%;width:min(46vh,42vw);height:min(46vh,42vw);transform:translate(-50%,-50%)}
#vgCena .vg-orbe svg{width:100%;height:100%;overflow:visible}
#vgCena .vg-terra{animation:vgGira 40s linear infinite}
@keyframes vgGira{from{transform:translateX(0)}to{transform:translateX(-200px)}}
#vgCena .vg-painel{position:absolute;left:0;right:0;bottom:0;height:29%;display:grid;grid-template-columns:1fr 1.25fr 1fr;gap:14px;padding:10px 3% 14px;box-sizing:border-box}
#vgCena .vg-bloco{background:rgba(9,15,29,.88);border:1px solid #2f4664;border-radius:12px;padding:8px 12px;overflow:auto}
#vgCena .vg-bloco h4{margin:0 0 6px;font-size:12px;color:#8ee7ff;letter-spacing:.04em;text-transform:uppercase}
#vgCena .vg-medidor{display:grid;grid-template-columns:92px 1fr 62px;gap:6px;align-items:center;margin:3px 0;font-size:12.5px}
#vgCena .vg-barra{height:10px;border-radius:6px;background:#132036;overflow:hidden}
#vgCena .vg-barra>i{display:block;height:100%;border-radius:6px;transition:width .6s}
#vgCena .vg-relogio{font:700 28px 'Consolas','Courier New',monospace;color:#ffd447;text-align:center;margin-top:4px}
#vgCena .vg-rota{text-align:center;color:#c6d3e6;font-size:12.5px}
#vgCena .vg-evento{position:absolute;left:47%;right:5%;top:7%;max-height:56%;overflow:auto;background:rgba(12,20,38,.94);border:2px solid #ffb347;border-radius:14px;padding:12px 16px;box-shadow:0 10px 40px #000a;animation:vgEntra .35s ease-out}
@keyframes vgEntra{from{transform:translateY(-14px);opacity:0}to{transform:none;opacity:1}}
#vgCena .vg-evento h3{margin:0 0 4px;font-size:19px;color:#ffd447}
#vgCena .vg-evento p{margin:0 0 8px;color:#e8eefc}
#vgCena .vg-tempo{height:6px;background:#1b2a44;border-radius:4px;overflow:hidden;margin:6px 0}
#vgCena .vg-tempo>i{display:block;height:100%;background:linear-gradient(90deg,#ff5a5a,#ffd447);transition:width .25s linear}
#vgCena .vg-tarefa{border-top:1px solid #2f4664;padding-top:6px;margin-top:6px}
#vgCena .vg-tarefa b{color:#8ee7ff}
#vgCena .vg-ops{display:flex;flex-wrap:wrap;gap:6px;margin-top:5px}
#vgCena button{border-radius:10px;border:1px solid #3b5878;background:#16233a;color:#e8eefc;padding:7px 12px;cursor:pointer;font:600 13.5px 'Segoe UI',Arial,sans-serif}
#vgCena button:hover{border-color:#ffd447}
#vgCena button:disabled{opacity:.45;cursor:default}
#vgCena .vg-res{margin-top:4px;font-size:13px}
#vgCena .vg-ok{color:#7dffb0}#vgCena .vg-mal{color:#ff8a8a}
#vgCena .vg-log{font-size:12.5px;line-height:1.45}
#vgCena .vg-log div{margin-bottom:3px}
#vgCena .vg-meteoro{position:absolute;width:6px;height:6px;border-radius:50%;background:#ffd28a;box-shadow:0 0 12px 4px #ff7a2a;animation:vgMeteoro 1.6s linear forwards}
#vgCena .vg-meteoro::after{content:'';position:absolute;right:4px;top:2px;width:90px;height:2px;background:linear-gradient(90deg,transparent,#ffb36b);transform-origin:right;transform:rotate(-20deg)}
@keyframes vgMeteoro{from{transform:translate(0,0)}to{transform:translate(-70vw,30vh)}}
#vgCena.treme .vg-janela,#vgCena.treme .vg-estrelas{animation:vgTreme .12s linear infinite} /* só a janela treme: os botões ficam parados para clicar */
@keyframes vgTreme{0%{transform:translate(0,0)}25%{transform:translate(3px,-2px)}50%{transform:translate(-3px,2px)}75%{transform:translate(2px,3px)}100%{transform:translate(0,0)}}
#vgCena .vg-alarme{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,transparent 50%,rgba(255,40,40,.35));animation:vgAlarme 1s ease-in-out infinite}
@keyframes vgAlarme{50%{opacity:.25}}
#vgCena .vg-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none}
#vgCena .vg-flash.on{animation:vgFlash 2.2s ease-out forwards}
@keyframes vgFlash{0%{opacity:0}8%{opacity:1}100%{opacity:0}}
#vgCena .vg-fim{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(640px,90vw);text-align:center;background:rgba(6,10,20,.9);border:1px solid #3b5878;border-radius:16px;padding:22px 26px;font-size:17px;line-height:1.55}
#vgCena .vg-fim h2{margin:0 0 10px;color:#ffd447}
#vgCena .vg-embarque{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(760px,94vw);background:rgba(9,15,29,.95);border:1px solid #3b5878;border-radius:16px;padding:18px 20px}
#vgCena .vg-embarque h2{margin:0 0 4px;color:#ffd447}
#vgCena .vg-trip{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid #1f3048}
#vgCena .vg-postos{display:flex;gap:5px;flex-wrap:wrap}
#vgCena .vg-postos button{padding:5px 9px;font-size:12.5px}
#vgCena .vg-postos button[aria-pressed="true"]{background:#7a4a18;border-color:#ffb347}
#vgCena .vg-mestre{position:absolute;right:12px;top:12px;display:flex;gap:6px;z-index:5}
#vgCena .vg-mestre button{padding:5px 10px;font-size:12px;background:#2a1a0a;border-color:#ffb347}
#vgBotao{position:absolute;left:8px;top:8px;z-index:37;border-radius:999px;border:1px solid #8ee7ff;background:#0f1a2e;color:#e8eefc;padding:6px 12px;font:600 13px 'Segoe UI',Arial,sans-serif;cursor:pointer}
#vgPrep{position:fixed;inset:0;z-index:10040;background:rgba(3,8,18,.72);display:flex;align-items:center;justify-content:center}
#vgPrep[hidden]{display:none}
#vgPrep .c{width:min(560px,94vw);background:#101a2e;border:1px solid #3b5878;border-radius:14px;color:#e8eefc;font:13.5px 'Segoe UI',Arial,sans-serif;padding:14px 16px}
#vgPrep h3{margin:0 0 8px;color:#8ee7ff}
#vgPrep label{display:grid;grid-template-columns:150px 1fr;gap:8px;align-items:center;margin:6px 0}
#vgPrep select,#vgPrep input{background:#0b1424;border:1px solid #2f4664;border-radius:8px;color:#e8eefc;padding:5px 7px}
#vgPrep .d{color:#9fb3cc;font-size:12px;margin:2px 0 8px}
#vgPrep button{border-radius:8px;border:1px solid #2f4664;background:#16233a;color:#d8e6ff;padding:7px 12px;cursor:pointer;font:600 13px 'Segoe UI',Arial,sans-serif}
#vgPrep button.p{background:#14532d;border-color:#22c55e}
`;

// v191: quem vai a bordo = personagens de jogador do mapa de partida; se não há nenhum ali, todos os personagens de jogador (a viagem não fica travada)
export function tripulacaoDe(tokens,origem){
 const pj=(tokens||[]).filter(t=>!decodeURIComponent(String(t.id)).startsWith('sync')&&t.donoUid);
 const doMapa=pj.filter(t=>String(t.mapaId||'')===String(origem||''));
 return {lista:doMapa.length?doMapa:pj,deOutroMapa:!doMapa.length&&pj.length>0};
}
export function horasAteChegada(horaChegada,partidaMs){const hp=(Number(partidaMs)||8*3600000)%86400000/3600000;let h=(Number(horaChegada??20)-hp+24)%24;if(h<3)h+=24;return +h.toFixed(2);}
export function instalarViagem(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const el=id=>root.getElementById(id);
 const D=p=>dep.doc(dep.db,...p.split('/'));
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const uid=()=>{try{return String(dep.uid?.()||'');}catch(_){return '';}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const mapas=()=>{try{return dep.mapas?.()||[];}catch(_){return [];}};
 const nomeMapa=id=>String(mapas().find(m=>String(m.id)===String(id))?.nome||id||'?');
 const agora=()=>Date.now();
 if(!el('vgCss')){const s=root.createElement('style');s.id='vgCss';s.textContent=ESTILO;root.head.append(s);}
 let v=null,cena=null,prep=null,ultimoMeteoro=0,chaveDesenho='',chegando=false,flashFeito='',fechadoEm=0;
 const processados=new Set();
 const roteiro=()=>ROTEIROS[v?.roteiro]||ROTEIROS.queda;
 const t=()=>v?.inicioVooEm?(agora()-Number(v.inicioVooEm))/1000:0;
 const meus=()=>(v?.tripulantes||[]).filter(p=>String(p.donoUid||'')===uid());

 // ------------------------------------------------------------ botão e preparação (mestre)
 function botao(){
  const b=el('novaSyncBoard'),sc=b?.parentElement;let bt=el('vgBotao');
  if(!ehMestre()||!sc){bt?.remove();return;}
  if(bt)bt.textContent=v?.ativa?'🚀 Viagem em andamento':'🚀 Viagem';
  if(!bt){bt=root.createElement('button');bt.type='button';bt.id='vgBotao';bt.textContent='🚀 Viagem';bt.title='Viagem de nave entre lugares distantes: todos veem a cena em tela cheia';
   bt.addEventListener('pointerdown',e=>e.stopPropagation());bt.addEventListener('click',()=>{if(v?.ativa){fechadoEm=0;chaveDesenho='';desenhar();}else abrirPrep();});if(getComputedStyle(sc).position==='static')sc.style.position='relative';sc.append(bt);}
 }
 function abrirPrep(){
  if(!prep){prep=root.createElement('div');prep.id='vgPrep';prep.hidden=true;root.body.append(prep);prep.addEventListener('pointerdown',e=>{if(e.target===prep)prep.hidden=true;});prep.addEventListener('click',aoClicarPrep);}
  const ms=mapas().filter(m=>m?.id&&!/^__/.test(String(m.id))&&!m.arquivadoV176).sort((a,b)=>String(a.nome||a.id).localeCompare(String(b.nome||b.id),'pt'));
  const atual=String(ctl()?.mapaAtual?.()||''),acha=re=>ms.find(m=>re.test(sem(m.nome)))?.id||'';
  const op=(sel)=>ms.map(m=>`<option value="${esc(m.id)}"${String(m.id)===sel?' selected':''}>${esc(m.nome||m.id)}</option>`).join('');
  const trip=tripulacaoDe(ctl()?.todosTokens?.()||[],atual),pcs=trip.lista;
  prep.innerHTML=`<div class="c"><h3>🚀 Preparar viagem</h3>
   <label>Partida<select data-orig>${op(atual)}</select></label>
   <label>Destino (o que os jogadores veem)<select data-dest>${op(acha(/therion/)||atual)}</select></label>
   <label>Onde chegam de verdade<select data-real><option value="">— o mesmo destino —</option>${op(acha(/cidade sem nome/))}</select></label>
   <div class="d">Se for diferente, a viagem acaba lá — sem os jogadores perceberem que era o plano.</div>
   <label>Roteiro<select data-rot>${Object.entries(ROTEIROS).map(([k,r])=>`<option value="${k}">${esc(r.nome)}</option>`).join('')}</select></label>
   <label>Duração<select data-dur><option value="">a do roteiro</option><option value="90">1,5 min</option><option value="150">2,5 min</option><option value="240">4 min</option></select></label>
   <label>Hora da chegada (jogo)<input data-hora type="number" min="0" max="23" value="20" style="width:70px"></label>
   <div class="d">Vão a bordo (${pcs.length}): ${pcs.map(p=>esc(p.nome)).join(', ')||'nenhum personagem de jogador no jogo — só você verá a viagem'}.${trip.deOutroMapa?' Nenhum jogador está neste mapa, então vão todos os personagens de jogador do jogo.':''}</div>
   <div class="d">Todos os jogadores e você veem a viagem em tela cheia, ao mesmo tempo.</div>
   <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px;flex-wrap:wrap"><button data-x>Cancelar</button><button data-ir title="Cada um escolhe o posto e você dá a partida">🧳 Embarcar (escolher postos)</button><button class="p" data-ja title="Começa agora, para todos, sem escolher postos">▶ Iniciar viagem agora</button></div></div>`;
  prep.hidden=false;
 }
 async function aoClicarPrep(e){
  if(e.target.closest('[data-x]')){prep.hidden=true;return;}
  const ja=!!e.target.closest('[data-ja]');if(!ja&&!e.target.closest('[data-ir]'))return;
  const q=s=>prep.querySelector(s)?.value||'';const orig=q('[data-orig]'),dest=q('[data-dest]'),real=q('[data-real]')||dest,rot=q('[data-rot]')||'queda';
  const pcs=tripulacaoDe(ctl()?.todosTokens?.()||[],orig).lista.map(t=>({id:String(t.id),nome:String(t.nome||'').replace(/^(PJ|NPC)\s*[·:-]\s*/i,''),donoUid:String(t.donoUid||''),imagem:String(t.imagem||'')}));
  const R=ROTEIROS[rot];const dur=Number(q('[data-dur]'))||R.duracaoS;const fator=dur/R.duracaoS;
  let nave='Nave do grupo';try{const qn=await dep.getDocs(dep.collection(dep.db,'navesPossuidas'));qn.forEach(d=>{const n=d.data();if(n?.naveDoGrupoV172)nave=String(n.nomeIndividual||nave);});}catch(_){}
  const estado={ativa:true,fase:'embarque',id:'vg'+agora().toString(36),roteiro:rot,origem:orig,destino:dest,destinoReal:real,nave,tripulantes:pcs,postos:{},respostas:{},log:[],
   duracaoS:dur,fator,horas:R.horas,horaChegada:Math.max(0,Math.min(23,Number(q('[data-hora]'))||20)),casco:100,criadoEm:agora()};
  if(ja){ // v191: começa já, para todos; quem não escolheu posto vai de passageiro
   const parte=Number(win.mesaRelogio?.agora?.())||8*3600000;Object.assign(estado,{fase:'voo',inicioVooEm:agora(),horaPartidaMs:parte,horas:horasAteChegada(estado.horaChegada,parte),log:['🛫 Partida de '+nomeMapa(orig)],postos:Object.fromEntries(pcs.map(p=>[p.id,'passageiro']))});}
  await dep.setDoc(D(VIAGEM),clean(estado));prep.hidden=true;fechadoEm=0;
 }

 // ------------------------------------------------------------ cena (todos)
 function garantirCena(){let c=el('vgCena');if(!c){c=root.createElement('div');c.id='vgCena';c.innerHTML='<div class="vg-estrelas"></div><div class="vg-janela"><div class="vg-orbe"></div></div><div class="vg-cabine"></div><div class="vg-painel"></div><div data-ev></div><div data-meio></div><div class="vg-flash"></div><div class="vg-mestre"></div>';
   c.addEventListener('click',aoClicarCena);c.addEventListener('pointerdown',e=>e.stopPropagation());root.body.append(c);requestAnimationFrame(()=>c.classList.add('on'));}return c;}
 function fecharCena(){const c=el('vgCena');if(!c)return;c.classList.remove('on');setTimeout(()=>c.remove(),800);}
 function orbe(prog,queda){
  // planeta: disco com terras que giram; rota em arco; a nave é um ponto que anda. Na queda, a rota desvia para baixo.
  const p=Math.max(0,Math.min(1,prog)),A={x:58,y:118},B={x:146,y:84},C={x:104,y:46};
  const qx=(a,c,b,s)=>({x:(1-s)*(1-s)*a.x+2*(1-s)*s*c.x+s*s*b.x,y:(1-s)*(1-s)*a.y+2*(1-s)*s*c.y+s*s*b.y});
  const corte=queda?.56:1,real=Math.min(p,corte),pt=qx(A,C,B,real);let nave=pt;
  if(queda&&p>corte){const f=(p-corte)/(1-corte);nave={x:pt.x+f*8,y:pt.y+f*30};}
  const ate=qx(A,C,B,corte);
  return `<svg viewBox="0 0 200 200"><defs><radialGradient id="vgG" cx="38%" cy="32%"><stop offset="0" stop-color="#e9c88a"/><stop offset=".6" stop-color="#b9863f"/><stop offset="1" stop-color="#4a2c12"/></radialGradient>
   <clipPath id="vgC"><circle cx="100" cy="100" r="86"/></clipPath><radialGradient id="vgS" cx="70%" cy="70%"><stop offset=".55" stop-color="#0000"/><stop offset="1" stop-color="#000b"/></radialGradient></defs>
   <circle cx="100" cy="100" r="92" fill="#6ab6ff22"/><circle cx="100" cy="100" r="86" fill="url(#vgG)"/>
   <g clip-path="url(#vgC)"><g class="vg-terra">${[0,200].map(o=>`<g transform="translate(${o},0)"><path d="M10 60 q30-20 60 0 t50 10 q20 30-10 40 t-60 0z" fill="#a9733a" opacity=".7"/><path d="M40 130 q40-10 70 10 q10 20-20 25 t-50-10z" fill="#8a5a2a" opacity=".6"/><path d="M120 40 q30 0 45 20 q-10 15-40 8z" fill="#c99a5a" opacity=".7"/><path d="M150 120 q25-5 40 15 q-20 20-45 5z" fill="#7f4f22" opacity=".6"/><circle cx="160" cy="80" r="4" fill="#3fa7c9" opacity=".8"/></g>`).join('')}</g></g>
   <circle cx="100" cy="100" r="86" fill="url(#vgS)"/>
   <path d="M${A.x} ${A.y} Q${C.x} ${C.y} ${B.x} ${B.y}" fill="none" stroke="#8ee7ff" stroke-width="1.2" stroke-dasharray="3 3" opacity=".7"/>
   <path d="M${A.x} ${A.y} Q${C.x} ${C.y} ${B.x} ${B.y}" fill="none" stroke="#ffd447" stroke-width="2" pathLength="1" stroke-dasharray="${Math.min(p,corte)} 1"/>
   ${queda&&p>corte?`<path d="M${ate.x} ${ate.y} L${nave.x} ${nave.y}" stroke="#ff6a3a" stroke-width="2" stroke-dasharray="2 2"/>`:''}
   <circle cx="${A.x}" cy="${A.y}" r="3.5" fill="#7dffb0"/><text x="${A.x-4}" y="${A.y+12}" font-size="8" fill="#e8eefc" text-anchor="middle">${esc(nomeMapa(v.origem).replace(/ de V[eé]spera/i,'').slice(0,18))}</text>
   <circle cx="${B.x}" cy="${B.y}" r="3.5" fill="#ffd447"/><text x="${B.x}" y="${B.y-7}" font-size="8" fill="#e8eefc" text-anchor="middle">${esc(nomeMapa(v.destino).replace(/\s*—.*$/,'').slice(0,18))}</text>
   <g transform="translate(${nave.x} ${nave.y})"><circle r="4.5" fill="#fff" opacity=".25"><animate attributeName="r" values="3;7;3" dur="1.4s" repeatCount="indefinite"/></circle><path d="M-4 3 L0 -5 L4 3 L0 1z" fill="#e8eefc" stroke="#0a1220" stroke-width=".6"/></g>
   ${v.fase==='fim'&&v.destinoReal!==v.destino?`<text x="${nave.x+6}" y="${nave.y+12}" font-size="8" fill="#ff8a6a">ruínas?</text>`:''}</svg>`;
 }
 function horaJogo(){
  try{const r=win.mesaRelogio;const base=Number(v?.horaPartidaMs)||(r?.agora?.()??8*3600000);const prog=Math.max(0,Math.min(1,t()/Number(v.duracaoS||150)));const ms=base+prog*Number(v.horas||9)*3600000;const d=Math.floor(ms/86400000)+1,h=Math.floor(ms%86400000/3600000),m=Math.floor(ms%3600000/60000);return `dia ${d} · ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;}catch(_){return '';}
 }
 function desenhar(){
  if(!v?.ativa&&!(v?.fase==='fim'&&agora()-Number(v?.chegouEm||0)<40000)){if(el('vgCena'))fecharCena();return;}
  if(v.fase==='fim'&&fechadoEm===Number(v.chegouEm))return;
  const c=garantirCena(),R=roteiro(),T=t(),dur=Number(v.duracaoS)||R.duracaoS,prog=v.fase==='voo'?T/dur:v.fase==='fim'?1:0;
  c.classList.toggle('rapido',v.fase==='voo');
  // painel
  const casco=v.fase==='fim'?Number(v.casco)||0:Math.max(0,100-Object.values(v.respostas||{}).filter(r=>!r.sucesso).reduce((n,r)=>n+(Number(r.dano)||0),0));
  const evAtivo=v.fase==='voo'?(R.eventos.find(e=>T>=e.abre*v.fator&&T<(e.abre+e.prazo)*v.fator+4)||null):null;
  const pane=v.fase==='voo'&&R.eventos.some(e=>e.efeito==='queda'&&T>=e.abre*v.fator);
  const motor=pane||(v.fase==='fim'&&roteiro().queda)?0:R.eventos.some(e=>e.efeito==='pane'&&T>=e.abre*v.fator)?42:100;
  const alt=v.fase==='fim'?0:pane?Math.max(0,Math.round(3200*(1-(T-R.eventos.find(e=>e.efeito==='queda').abre*v.fator)/((dur-R.eventos.find(e=>e.efeito==='queda').abre*v.fator)||1)))):v.fase==='voo'?Math.min(12000,Math.round(T*600)):0;
  const med=(n,val,cor,txt)=>`<div class="vg-medidor"><span>${n}</span><div class="vg-barra"><i style="width:${Math.max(0,Math.min(100,val))}%;background:${cor}"></i></div><span>${txt}</span></div>`;
  const pk=JSON.stringify([v.fase,Math.round(prog*200),casco,motor,alt,Object.keys(v.respostas||{}).length,v.log?.length,v.postos]);
  if(pk!==chaveDesenho){chaveDesenho=pk;
   c.querySelector('.vg-orbe').innerHTML=orbe(prog,roteiro().queda&&v.destinoReal!==v.destino||roteiro().queda);
   c.querySelector('.vg-painel').innerHTML=`<div class="vg-bloco"><h4>🛰️ ${esc(v.nave)}</h4>${med('Combustível',100,'#22c55e','100%')}${med('Motores',motor,motor>60?'#22c55e':motor>20?'#f59e0b':'#ef4444',motor+'%')}${med('Casco',casco,casco>60?'#22c55e':casco>30?'#f59e0b':'#ef4444',casco+'%')}${med('Altitude',alt/120,'#38bdf8',(alt/1000).toFixed(1).replace('.',',')+' km')}</div>
    <div class="vg-bloco"><h4>🌍 Rota</h4><div class="vg-rota">${esc(nomeMapa(v.origem))} → ${esc(nomeMapa(v.destino))}</div><div class="vg-relogio" data-rel>${esc(horaJogo())}</div><div class="vg-rota">${v.fase==='embarque'?'Aguardando a decolagem':v.fase==='fim'?'Viagem interrompida':pane?'⚠️ Perdendo altitude':'Em voo · tempo acelerado'}</div></div>
    <div class="vg-bloco vg-log"><h4>📜 Bordo</h4>${(v.log||[]).slice(-6).reverse().map(l=>`<div>${l}</div>`).join('')||'<div style="color:#9fb3cc">Tudo calmo.</div>'}</div>`;
  }else{const r=c.querySelector('[data-rel]');if(r)r.textContent=horaJogo();}
  c.classList.toggle('treme',!!(evAtivo&&['meteoros','queda'].includes(evAtivo.efeito))||pane);
  let al=c.querySelector('.vg-alarme');if(pane&&!al){al=root.createElement('div');al.className='vg-alarme';c.append(al);}else if(!pane&&al)al.remove();
  if(evAtivo?.efeito==='meteoros'&&agora()-ultimoMeteoro>380){ultimoMeteoro=agora();const m=root.createElement('div');m.className='vg-meteoro';m.style.left=(60+Math.random()*45)+'vw';m.style.top=(Math.random()*35)+'vh';c.querySelector('.vg-janela').append(m);setTimeout(()=>m.remove(),1700);}
  // embarque / evento / fim
  const meio=c.querySelector('[data-meio]'),evc=c.querySelector('[data-ev]');
  if(v.fase==='embarque'){evc.innerHTML='';meio.innerHTML=embarqueHtml();}
  else if(v.fase==='fim'){evc.innerHTML='';meio.innerHTML=`<div class="vg-fim"><h2>💥 ${esc(nomeMapa(v.destinoReal)===nomeMapa(v.destino)?'Chegada':'Pouso forçado')}</h2>${esc(v.textoFim||'')}<div style="margin-top:12px;color:#9fb3cc;font-size:13px">Casco da nave: ${Number(v.casco)}%</div><div style="margin-top:14px"><button data-continuar>▶ Continuar</button></div></div>`;
   if(flashFeito!==v.id){flashFeito=v.id;const f=c.querySelector('.vg-flash');f.classList.remove('on');void f.offsetWidth;f.classList.add('on');}}
  else{if(meio.innerHTML)meio.innerHTML='';
   // só redesenha o cartão quando algo muda (senão o botão some debaixo do dedo); a barra de tempo anda sozinha
   const fimEv=evAtivo?(evAtivo.abre+evAtivo.prazo)*v.fator:0,aberto=evAtivo?T<fimEv:false;
   const k=evAtivo?JSON.stringify([evAtivo.id,aberto,Object.entries(v.respostas||{}).filter(([q])=>q.startsWith(evAtivo.id+':')),v.postos]):'';
   if(evc.dataset.k!==k){evc.dataset.k=k;evc.innerHTML=evAtivo?eventoHtml(evAtivo,T):'';}
   const bar=evc.querySelector('.vg-tempo>i');if(bar&&evAtivo){const ini=evAtivo.abre*v.fator;bar.style.width=Math.max(0,Math.min(100,(fimEv-T)/(fimEv-ini)*100))+'%';}}
  c.querySelector('.vg-mestre').innerHTML=ehMestre()?`${v.fase==='embarque'?'<button data-decolar>🛫 Decolar</button>':''}${v.fase==='voo'?'<button data-pular>⏩ Próximo evento</button>':''}<button data-cancelar>✖ ${v.fase==='fim'?'Fechar':'Cancelar viagem'}</button>`:'';
 }
 function embarqueHtml(){
  const linhas=(v.tripulantes||[]).map(p=>{const meu=String(p.donoUid)===uid()||ehMestre(),ps=v.postos?.[p.id]||'';
   return `<div class="vg-trip"><span><b>${esc(p.nome)}</b> ${ps?`· ${postoDe(ps).icone} ${postoDe(ps).nome}`:'<span style="color:#9fb3cc">· escolhendo posto…</span>'}</span>${meu?`<span class="vg-postos">${POSTOS.map(o=>`<button data-posto="${o.id}" data-pid="${esc(p.id)}" aria-pressed="${ps===o.id}" title="${esc(o.dica)}">${o.icone} ${o.nome}</button>`).join('')}</span>`:'<span></span>'}</div>`;}).join('');
  return `<div class="vg-embarque"><h2>🧳 A bordo da ${esc(v.nave)}</h2><div style="color:#c6d3e6;margin-bottom:8px">Destino: <b>${esc(nomeMapa(v.destino))}</b>. Cada um escolhe o seu posto — no caminho, cada posto terá decisões rápidas.</div>${linhas}<div style="color:#9fb3cc;font-size:12.5px;margin-top:8px">${ehMestre()?'Quando todos escolherem, clique em 🛫 Decolar (canto de cima).':'Aguardando o capitão dar a partida…'}</div></div>`;
 }
 function eventoHtml(ev,T){
  const ini=ev.abre*v.fator,fim=(ev.abre+ev.prazo)*v.fator,rest=Math.max(0,fim-T),pct=Math.max(0,Math.min(100,rest/(fim-ini)*100));
  const ts=tarefasDoEvento(ev,v.tripulantes,v.postos);
  let h=`<div class="vg-evento"><h3>${ev.icone} ${esc(ev.titulo)}</h3><p>${esc(ev.texto)}</p><div class="vg-tempo"><i style="width:${pct}%"></i></div>`;
  for(const x of ts){const r=v.respostas?.[x.chave],quem=x.personagemId?(v.tripulantes||[]).find(p=>p.id===x.personagemId):null;
   const posso=!r&&rest>0&&(ehMestre()||(quem?String(quem.donoUid)===uid():meus().length>0));
   const rotQuem=x.tarefa.posto==='todos'?esc(quem?.nome||''):quem?`${postoDe(x.tarefa.posto).icone} ${esc(quem.nome)}`:`${postoDe(x.tarefa.posto).icone} ninguém no posto — qualquer um pode tentar`;
   h+=`<div class="vg-tarefa"><b>${esc(x.tarefa.rotulo)}</b> · <span style="color:#c6d3e6">${rotQuem}</span>`;
   if(r)h+=`<div class="vg-res ${r.sucesso?'vg-ok':'vg-mal'}">${r.hesitou?'⏳ Hesitou — o tempo acabou. ':`🎲 ${esc(r.pericia||'')} ${r.die}/${r.valor} · ${esc(r.grau)} — `}${esc(r.texto||'')}</div>`;
   else if(posso)h+=`<div class="vg-ops">${x.tarefa.opcoes.map(o=>`<button data-op="${esc(o.id)}" data-chave="${esc(x.chave)}" data-ev="${esc(ev.id)}" data-pid="${esc(x.personagemId||meus()[0]?.id||'')}">${esc(o.texto)}</button>`).join('')}</div>`;
   else h+=`<div class="vg-res" style="color:#9fb3cc">${rest>0?'decidindo…':'⏳'}</div>`;
   h+='</div>';}
  return h+'</div>';
 }
 async function aoClicarCena(e){
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.continuar!==undefined){fechadoEm=Number(v?.chegouEm)||0;fecharCena();return;}
  if(b.dataset.posto){await pedir({tipo:'posto',personagemId:b.dataset.pid,posto:b.dataset.posto});return;}
  if(b.dataset.op){b.disabled=true;b.parentElement?.querySelectorAll('button').forEach(x=>x.disabled=true);await pedir({tipo:'opcao',personagemId:b.dataset.pid,chave:b.dataset.chave,evento:b.dataset.ev,opcao:b.dataset.op});return;}
  if(!ehMestre())return;
  if(b.dataset.decolar!==undefined){const r=win.mesaRelogio,parte=Number(r?.agora?.())||8*3600000,horas=horasAteChegada(v.horaChegada,parte);
   await dep.setDoc(D(VIAGEM),{fase:'voo',inicioVooEm:agora(),horaPartidaMs:parte,horas,log:[...(v.log||[]),'🛫 Partida de '+esc(nomeMapa(v.origem))]},{merge:true});return;}
  if(b.dataset.pular!==undefined){const R=roteiro(),T=t(),prox=R.eventos.find(ev=>ev.abre*v.fator>T+1);const alvo=prox?prox.abre*v.fator:v.duracaoS;await dep.setDoc(D(VIAGEM),{inicioVooEm:Number(v.inicioVooEm)-(alvo-T)*1000},{merge:true});return;}
  if(b.dataset.cancelar!==undefined){await dep.setDoc(D(VIAGEM),{ativa:false,fase:v.fase==='fim'?'fim':'cancelada',chegouEm:0},{merge:true});fechadoEm=Number(v.chegouEm)||0;fecharCena();}
 }
 async function pedir(cmd){
  const c={...cmd,donoUid:uid(),viagem:v?.id||'',criadoEm:agora()};
  if(ehMestre()){await processar('m'+agora().toString(36),c);return;}
  try{await dep.setDoc(D(PEDIDOS+'/vg'+agora().toString(36)+Math.random().toString(36).slice(2,6)),clean(c));}catch(e){console.warn('[Viagem] pedido',e);}
 }
 // ------------------------------------------------------------ mestre: resolve pedidos, prazos e a chegada
 async function processar(id,cmd){
  if(!ehMestre()||processados.has(id)||!v||cmd.viagem!==v.id)return;processados.add(id);
  const trip=(v.tripulantes||[]).find(p=>p.id===cmd.personagemId);
  const dono=c=>cmd.donoUid===uid()||String(trip?.donoUid||'')===String(cmd.donoUid);
  if(!trip||!dono())return;
  if(cmd.tipo==='posto'&&v.fase==='embarque'&&POSTOS.some(p=>p.id===cmd.posto)){await dep.setDoc(D(VIAGEM),{postos:{[trip.id]:cmd.posto}},{merge:true});return;}
  if(cmd.tipo!=='opcao'||v.fase!=='voo'||v.respostas?.[cmd.chave])return;
  const ev=roteiro().eventos.find(e=>e.id===cmd.evento);if(!ev)return;
  const x=tarefasDoEvento(ev,v.tripulantes,v.postos).find(q=>q.chave===cmd.chave);if(!x)return;
  if(x.personagemId&&x.personagemId!==trip.id&&!(x.todosDoPosto||[]).includes(trip.id))return;
  const o=x.tarefa.opcoes.find(q=>q.id===cmd.opcao);if(!o)return;
  let melhor={nome:o.pericias[0],valor:25};
  const tok=(ctl()?.todosTokens?.()||[]).find(q=>String(q.id)===trip.id)||{id:trip.id,nome:trip.nome};
  for(const p of o.pericias){try{const r=await win.mesaObjetosV124_?.valor?.(tok,p);if(r&&Number(r.valor)>=melhor.valor&&(r.valor>0||melhor.valor<=25))melhor={nome:r.nome||p,valor:Number(r.valor)||0};}catch(_){}}
  const rol=rolarD100(Math.max(5,melhor.valor+(Number(o.mod)||0)));
  const resp={personagemId:trip.id,nome:trip.nome,opcao:o.id,pericia:melhor.nome,...rol,texto:rol.sucesso?o.sucesso:o.falha,dano:Number(o.dano)||0,pista:!!(o.pista&&rol.sucesso)};
  await dep.setDoc(D(VIAGEM),clean({respostas:{[cmd.chave]:resp},log:[...(v.log||[]),`${ev.icone} ${esc(trip.nome)}: ${esc(rol.sucesso?o.sucesso:o.falha)}`]}),{merge:true});
 }
 async function vigiaMestre(){
  if(!ehMestre()||!v?.ativa||v.fase!=='voo'||chegando)return;
  const R=roteiro(),T=t(),faltam={};
  for(const ev of R.eventos){if(T<(ev.abre+ev.prazo)*v.fator)continue;
   for(const x of tarefasDoEvento(ev,v.tripulantes,v.postos)){if(v.respostas?.[x.chave])continue;const o=x.tarefa.opcoes[0];
    faltam[x.chave]={personagemId:x.personagemId||'',nome:(v.tripulantes||[]).find(p=>p.id===x.personagemId)?.nome||'',hesitou:true,sucesso:false,grau:'Falha',die:0,valor:0,texto:o.falha,dano:Number(o.dano)||0};}}
  if(Object.keys(faltam).length)await dep.setDoc(D(VIAGEM),clean({respostas:faltam}),{merge:true});
  if(T>=Number(v.duracaoS))await chegar();
 }
 async function chegar(){
  if(chegando)return;chegando=true;
  try{
   const R=roteiro(),destino=String(v.destinoReal||v.destino),m=mapas().find(x=>String(x.id)===destino),W=Number(m?.larguraM)||28,H=Number(m?.alturaM)||14;
   const casco=cascoFinal(v.respostas,R);
   // cena do destino: destroços da nave (só na queda) e lugar para o grupo
   let objs=[];const arq=D('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(destino));
   try{const s=await dep.getDoc(arq);objs=s.exists()?(s.data()?.objects||[]):[];}catch(_){}
   const clar=acharClareira(objs,W,H,15,11,{x:W*.82,y:H*.25});
   if(R.queda){try{const s=await dep.getDoc(arq);if(s.exists()){const c=s.data(),N=(x,y)=>({x:+(x*28/W).toFixed(4),y:+(y*14/H).toFixed(4)});
     const novos=[{id:'vg_rastro_'+v.id,nome:'Rastro da queda',forma:'rect',cor:'#3b2a1a',bordaLargura:0,opacity:.45,...N(clar.x-7,clar.y+1.2),larguraM:12,alturaM:3.2,angulo:-12,camada:1,bloqueiaMovimento:false,bloqueiaVisao:false,pvMax:0,pvAtual:0,dureza:0,material:'',viagemV179:v.id},
      {id:'vg_nave_'+v.id,nome:`${v.nave} (caída)`,imagem:'arte/pecas/veiculo-nave-exploradora-azul-deitada.webp',...N(clar.x,clar.y),larguraM:13.5,alturaM:9.8,angulo:18,camada:3,bloqueiaMovimento:true,bloqueiaVisao:true,pvMax:850,pvAtual:Math.round(850*casco/100),dureza:12,material:'metal',viagemV179:v.id,naveCaidaV179:true}];
     const nova={...c,objects:[...(c.objects||[]).filter(o=>!String(o.id).startsWith('vg_')),...novos],editorRevision:Number(c.editorRevision||0)+1};
     await dep.setDoc(arq,clean(nova));objs=nova.objects;
     try{const s2=await dep.getDoc(D(SCENE));if(s2.exists()&&String(s2.data()?.mapId||'')===destino)await dep.setDoc(D(SCENE),clean(nova));}catch(_){}}}catch(e){console.warn('[Viagem] destroços',e);}}
   // o grupo desce ao lado da nave
   const {livrePerto}=await import('./mesa-ligacoes.js?v=154');const ocup=[...objs];let k=0;
   for(const p of v.tripulantes||[]){const ang=k*0.9,base={x:(clar.x-8+Math.cos(ang)*1.6)*28/W,y:(clar.y+5+Math.sin(ang)*1.2)*14/H},q=livrePerto(ocup,base.x,base.y,W,H,.6);ocup.push({x:q.x,y:q.y,larguraM:1,alturaM:1,bloqueiaMovimento:true});k++;
    try{await dep.runTransaction(dep.db,async tx=>{const r=D(POS+'/'+p.id),s=await tx.get(r);if(!s.exists())return;tx.set(r,{...s.data(),mapaId:destino,x:+q.x.toFixed(3),y:+q.y.toFixed(3),revision:Number(s.data().revision||0)+1});});}catch(e){console.warn('[Viagem] token',p.nome,e);}
    // a ficha acompanha (a tela do jogador segue a ficha)
    try{await dep.setDoc(D('personagens/'+decodeURIComponent(p.id)),{localizacaoMapaId:destino,localizacaoMapaDefinidaV92:true,...(win.__mesaLocalDoMapaV154_?{localizacaoCenarioId:String(win.__mesaLocalDoMapaV154_(destino))}:{})},{merge:true});}catch(e){console.warn('[Viagem] ficha',e);}}
   // relógio: chega na hora marcada (noite)
   try{const rs=await dep.getDoc(D(RELOGIO));const r=rs.exists()?rs.data():{};const atual=Number(win.mesaRelogio?.agora?.())||Number(r.jogoMs)||8*3600000;const alvo=Number(v.horaPartidaMs)?Number(v.horaPartidaMs)+Number(v.horas||9)*3600000:atual+Number(v.horas||9)*3600000;
    await dep.setDoc(D(RELOGIO),{jogoMs:alvo,realMs:agora()},{merge:true});}catch(e){console.warn('[Viagem] relógio',e);}
   // nave avariada na ficha
   if(R.queda)try{const qn=await dep.getDocs(dep.collection(dep.db,'navesPossuidas'));const docs=[];qn.forEach(d=>docs.push({id:d.id,...d.data()}));const naves=docs.filter(n=>n.naveDoGrupoV172);
    if(!naves.length)console.warn('[Viagem] nave do grupo não encontrada');for(const nv of naves)await dep.setDoc(D('navesPossuidas/'+nv.id),{cascoAtual:Math.round((Number(nv.modelo?.cascoMax)||85)*casco/100),combustivelAtual:0,estado:'Caída — '+nomeMapa(destino)},{merge:true});}catch(e){console.warn('[Viagem] nave',e);}
   // nota só do mestre
   if(R.sabotagem)try{await dep.setDoc(D('configuracoes/escudoMestre'),{notasViagemV179:{[v.id]:{em:new Date().toISOString(),texto:R.sabotagem,pistaAchada:Object.values(v.respostas||{}).filter(r=>r.pista).map(r=>r.nome)}}},{merge:true});}catch(_){}
   const texto=(R.fim||(()=>''))({casco});
   await dep.setDoc(D(VIAGEM),clean({fase:'fim',ativa:false,casco,textoFim:texto,chegouEm:agora(),log:[...(v.log||[]),'💥 '+(R.queda?'Pouso forçado':'Chegada')]}),{merge:true});
   try{await ctl()?.openMap?.(destino);}catch(e){console.warn('[Viagem] abrir mapa',e);}
  }finally{chegando=false;}
 }
 // ------------------------------------------------------------ assinaturas
 let assinado='',parar=[];
 function assinar(){
  parar.forEach(f=>{try{f();}catch(_){}});parar=[];
  parar.push(dep.onSnapshot(D(VIAGEM),s=>{v=s.exists()?s.data():null;chaveDesenho='';desenhar();},e=>console.warn('[Viagem]',e)));
  if(ehMestre())parar.push(dep.onSnapshot(dep.collection(dep.db,...PEDIDOS.split('/')),q=>{q.forEach(d=>{const c=d.data()||{};void processar(d.id,c).finally(()=>{dep.deleteDoc?.(D(PEDIDOS+'/'+d.id)).catch?.(()=>{});});});},e=>console.warn('[Viagem] pedidos',e)));
 }
 const vigia=setInterval(()=>{try{const k=uid()+'|'+ehMestre();if(uid()&&k!==assinado){assinado=k;assinar();}botao();desenhar();void vigiaMestre();}catch(e){console.warn('[Viagem]',e);}},400);
 win.mesaViagemV179={abrirPrep,estado:()=>v,chegar,ROTEIROS,tripulacaoDe};
 return {parar(){clearInterval(vigia);parar.forEach(f=>{try{f();}catch(_){}});}};
}
