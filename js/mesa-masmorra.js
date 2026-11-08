// Mesa Estelar v184–v187 — Masmorra de treino: planta desenhada à mão no estilo dos mapas de batalha de RPG (salas de
// formatos variados ligadas por corredores, paredes finas com portas, caverna com abismo e pontes de madeira, cripta com
// sarcófagos, prisão com celas, poço, quartel e refeitório), construída com as peças da Oficina 3.0 (materiais com textura),
// objetos do Banco e as miniaturas prontas do jogo. Monstros em facções diferentes; jaulas abertas por alavanca ou armadilha.
//
// • Roda uma vez no navegador do mestre (marca em configuracoes/masmorraV184): gera o mapa "Masmorra de treino"
//   (42×20 m), põe os monstros (facção e jeito de lutar gravados no estado do tempo real) e completa o Kael Teste.
// • 🏰 (mestre, canto inferior esquerdo): levar o Kael à masmorra ou reiniciar tudo (paredes, armadilhas, monstros).
//   Na faixa 🧪 "vendo como jogador" há o botão "Recomeçar na masmorra".
// • Paredes e pedras quebram pelo ataque normal (alvo no objeto) e se reconstroem pelo 🧱 (Engenharia, Mecânica ou
//   Mineração): sucesso devolve metade dos PV, crítico tudo. No tempo real custa ~2 ações de recarga.
// • Armadilhas: só o navegador do mestre as dispara. Quem pisa testa Esquiva; falhou, leva o dano no local sorteado
//   (armadura conta). Percepção perto revela a laje. Disparada, fica visível e rearma em 30 s. Uma delas abre uma jaula.
// • Alavanca (🕹️, até 2,2 m): abre a jaula ligada a ela. As grades também quebram.
// Pedidos de jogadores vão pela fila combatesAtivos/mesaMasmorra/acoes. Módulo à parte: se falhar, o mapa segue normal.

import {cenaDoEstado,LIMITE_CENA} from './mesa-mapas-ui.js?v=141';
import {livrePerto} from './mesa-ligacoes.js?v=154';
import {restaurarObjeto,distanciaObjeto} from './nova-dano-objetos.js?v=50';
import {classificarTeste} from './nova-regras.js?v=184';
import {normalizarObjeto} from './nova-objetos.js?v=155';
import {rng} from './mesa-mapa-arte.js?v=197';
import {retangulosDeCelulas,novoCtx} from './mesa-gerador-mapas.js?v=141';
import {oPorta,oEscada,oTeto,matDe} from './mesa-construcao.js?v=189';
import {desenharObjeto,svgParaDataUrl,RECEITAS_OBJETOS,PACOTE_NOVO} from './mesa-arte-objetos.js?v=186';
import {specDeCriatura,renderizarMiniatura,MARCA_MINI} from './mesa-miniaturas.js?v=194';
import {tamanhoMiniaturaM} from './mesa-tamanhos.js?v=112';
import {zonasDeLava,suportesDeLava,contatoComLava,fatorDeEscalada,INTERVALO_MS as LAVA_INTERVALO_MS} from './mesa-lava.js?v=205';

const clean=v=>JSON.parse(JSON.stringify(v??null));
const MAP='combatesAtivos/mapaMesaSyncDireta',POS=MAP+'/posicoes',SCENE='combatesAtivos/mapaMesaSyncDiretaCena',HEALTH='combatesAtivos/mapaMesaSyncSaude',HIST='combatesAtivos/mapaMesaSyncHistorico',ESTADO_RT='combatesAtivos/mesaTempoReal';
export const PEDIDOS='combatesAtivos/mesaMasmorra/acoes';
export const ID_MASMORRA='v184_masmorra',NOME_MASMORRA='Masmorra de treino',ID_TESTE='teste_jogador_v138';
export const ID_PREVIA_194='v194_masmorra_previs',NOME_PREVIA_194='Masmorra v194 (arte nova)';
export const MAT_PAREDE='pedra-rio',MAT_PISO='pedra-polida',ESPESSURA=.3;
export const PAREDE={pv:24,dureza:2},GRADE={pv:30,dureza:4},PORTA={pv:30,dureza:3};
export const ALCANCE_RECONSTRUIR=2.2,REARMAR_MS=30000;
export const ARMADILHAS={
 estacas:{nome:'Armadilha de estacas',icone:'🪤',dano:'1d6+1',penal:0},
 laminas:{nome:'Armadilha de lâminas',icone:'🔪',dano:'2d4',penal:10}
};
export const ITENS_KAEL=[['mochila','kit_ferramentas_mecanicas'],['mochila','kit_primeiros_socorros']]; // v191: as armas ficam no chão do Quarto para ele pegar
// Itens soltos no chão do Quarto (posição em quadros): pegar com o ícone no mapa e equipar na ficha.
export const ITENS_PREPARO=[
 ['pistola_laser','Pistola Laser',5.5,2.8,'🔫'],['espada_forca','Sabre de energia (Espada de Força)',6.2,3.0,'⚔️'],['celula_lamina','Célula de Lâmina (para o sabre)',6.8,3.1,'🔋'],
 ['bateria','Bateria (para a pistola)',5.6,3.5,'🔋'],['armadura_leve','Armadura Corporal Leve',6.4,3.6,'🦺'],['kit_medico','Kit Médico Básico',7.0,3.6,'🩹']
];
export const svgItem=e=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#1d2433" stroke="#8ee7ff" stroke-width="2"/><text x="20" y="27" font-size="20" text-anchor="middle">${e}</text></svg>`);
export const PERICIAS_RECONSTRUIR=[['engenharia'],['mecânica','mecanica'],['mineração','mineracao']];
// ------------------------------------------------------------ planta copiada da referência (mapa de batalha clássico), em quadros de 1,5 m
// 30 × 18 quadros = 45 × 27 m. '.' sala/corredor · ',' caverna · '~' abismo · '=' ponte · 'S' escada · '#' rocha
export const Q=2,QW=30,QH=18,W=QW*Q,H=QH*Q,RES=Q; // v191: quadros de 2 m (corredores de 2 m: dá para andar, desviar e lutar)
export const MAPA=[
 '##############################',
 '#........S....#...#...########',
 '#........S....#...#...########',
 '#........S....#...#...########',
 '###..###.,~,,,,...#...########',
 '###......,~,,,,...#...########',
 '#.....#.,,~,,,,...#...########',
 '#.....##,,==,,,...#...########',
 '#.....##,,~#,,.............###',
 '#.....#,,,~,,,.............###',
 '#.....#,,~~,,,########.#.#####',
 '##.####,,~~,,,#..##........###',
 '##.####,#~~,,,#..##........###',
 '##.....,,,=,,,#...#..........#',
 '#.....#,,,~,,.....#........###',
 '#.....##,#~~,,#...#...#....###',
 '#.....##,,~~,,#...#...#....###',
 '#########~~###################'
];
// salas (quadros) só para nomear, pôr piso e mobília; os corredores são o resto do chão
export const SALAS=[
 {k:'altar',nome:'Sala do altar',x:1,y:1,w:4,h:3},{k:'quarto',nome:'Quarto',x:5,y:1,w:4,h:3},{k:'deposito',nome:'Depósito',x:10,y:1,w:4,h:3},
 {k:'refeitorio',nome:'Refeitório',x:1,y:6,w:5,h:5},{k:'quartel',nome:'Quartel',x:1,y:14,w:5,h:3},
 {k:'arsenal',nome:'Arsenal',x:15,y:1,w:3,h:3},{k:'cripta',nome:'Cripta (sala do chefe)',x:15,y:4,w:3,h:4},{k:'torre',nome:'Sala da torre',x:19,y:1,w:3,h:7},
 {k:'dormitorio',nome:'Dormitório',x:15,y:11,w:2,h:6},{k:'poco',nome:'Sala do poço',x:19,y:11,w:3,h:6},{k:'anfiteatro',nome:'Anfiteatro',x:23,y:11,w:4,h:6}
];
// paredes internas entre dois quadros de chão (quadros; linhas verticais em x, horizontais em y)
export const LINHAS=[
 {hor:false,x:5,y0:1,y1:4},{hor:false,x:9,y0:1,y1:4},{hor:false,x:10,y0:1,y1:4},
 {hor:true,y:4,x0:8,x1:9},{hor:true,y:4,x0:11,x1:14},{hor:true,y:4,x0:15,x1:18},{hor:true,y:6,x0:5,x1:6},
 {hor:true,y:8,x0:19,x1:22},{hor:true,y:8,x0:15,x1:18},{hor:false,x:15,y0:4,y1:8},{hor:false,x:15,y0:8,y1:10},{hor:false,x:15,y0:14,y1:15},{hor:false,x:22,y0:11,y1:15},
 {hor:true,y:11,x0:2,x1:3},{hor:false,x:4,y0:13,y1:14},{hor:true,y:14,x0:2,x1:6},{hor:false,x:3,y0:14,y1:16}
];
// portas (quadros): hor=false → porta na parede vertical x, no quadro y; hor=true → parede horizontal y, quadro x
export const PORTAS=[
 {x:5,y:2,hor:false,nome:'Porta do quarto'},{x:8,y:4,hor:true},{x:12,y:4,hor:true,nome:'Porta do depósito'},
 {x:15,y:4,hor:true,nome:'Porta do arsenal',trancada:true},{x:16,y:8,hor:true,nome:'Porta da cripta',trancada:true},{x:20,y:8,hor:true,nome:'Porta da torre'},
 {x:15,y:8,hor:false,nome:'Portão da caverna'},{x:15,y:14,hor:false,nome:'Porta do dormitório'},
 {x:22,y:12,hor:false,nome:'Porta do anfiteatro'},{x:2,y:11,hor:true},{x:4,y:13,hor:false,nome:'Porta de madeira'},{x:2,y:14,hor:true,nome:'Porta do quartel'}
];
export const ENTRADA={x:7.4*Q,y:2.3*Q}; // v191: Kael começa no Quarto, sozinho (a escada de entrada é só a chegada vinda de outros mapas)
export const ESCADAS=[{x:9.5,y:2.1,w:1,h:2.6,giro:0,nome:'Escada da entrada'},{x:23.5,y:12.6,w:1,h:1.4,giro:0,nome:'Degraus'},{x:24.5,y:12.6,w:1,h:1.4,giro:0,nome:'Degraus'},{x:24.5,y:14.9,w:1,h:1.4,giro:0,nome:'Degraus'},{x:26.5,y:14.9,w:1,h:1.4,giro:0,nome:'Degraus'},{x:28.3,y:13.5,w:1.4,h:1,giro:1,nome:'Escada de saída'}];
export const ARMADILHAS_PLANTA=[{tipo:'estacas',x:6.5,y:5.5},{tipo:'laminas',x:2.5,y:12.5},{tipo:'estacas',x:23.5,y:9.5,liberta:'j2'},{tipo:'laminas',x:13.5,y:14.5},{tipo:'estacas',x:27.5,y:13.5},{tipo:'laminas',x:20.5,y:8.5}];
export const JAULAS=[ // cela do arsenal (alavanca emperrada) e canto do anfiteatro (abre pela armadilha do corredor)
 {id:'j1',abre:'alavanca',x:16,y:2,w:2,h:2,lados:['N','W'],alavanca:{x:17.5,y:1.4,emperrada:true},monstro:{id:'predador_de_nevoa',faccao:'selvagens',alternativas:['caçador_de_nevoa','predador_couracado']}},
 {id:'j2',abre:'armadilha',x:25,y:11,w:2,h:2,lados:['W','S'],monstro:{id:'vampiro_generico',faccao:'a',alternativas:['vampiro_psiquico']}}
];
export const MOBILIA=[ // id do Banco (ou receita do jogo) · centro em quadros · opções em metros
 ['pk_fut_mesa',2.6,2.4,{w:1.3,h:2,nome:'Altar iluminado'}],['pk_feu_bau',1.5,3.4,{w:1.2,h:.8}],['pk_cristal_azul',4.2,1.5,{w:.8,h:1}],
 ['pk_mesa_quadrada',6.6,1.5,{w:1.8,h:.9,nome:'Escrivaninha'}],['pk_cadeira_madeira',6.6,2.2],['pk_cama_solteiro',8.1,3.5,{w:2.1,h:1.1}],
 ['pk_barril',10.5,1.5],['pk_barril',11.5,1.6],['pk_barril',10.6,2.4],['caixa1',12.6,1.4,{nome:'Caixote'}],['caixa2',12.6,2.3,{nome:'Caixote'}],['pk_caixote_suprimentos',13.4,2.6,{w:1.1,h:.9}],['pk_barril',10.6,3.4],['pk_barril',11.4,3.5],
 ['pk_mesa_redonda_bar',2.5,7.6,{w:2,h:2}],['pk_cadeira_madeira',1.6,7.6],['pk_cadeira_madeira',3.4,7.6],['pk_cadeira_madeira',2.5,6.7],['pk_cadeira_madeira',2.5,8.5],['pk_barril',5,6.5],['pk_barril',5.4,7.2],['pk_barril',4.6,7.3],['pk_mesa_longa',5.5,8.6,{w:.5,h:1.8,nome:'Banco de madeira',camada:2}],['pk_mesa_longa',1.3,9.5,{w:.5,h:1.8,nome:'Banco de madeira',camada:2}],['pk_barril',4.7,9.4],['pk_barril',4,10.3],['pk_barril',5.2,10.4],['pk_barril',3.3,10.5],
 ['pk_cama_solteiro',1.5,14.7,{w:1.1,h:2.1}],['pk_cama_solteiro',4.8,14.6,{w:2.1,h:1.1}],['pk_cama_solteiro',1.9,16.4,{w:2.1,h:1.1}],['pk_cama_solteiro',4.8,16.4,{w:2.1,h:1.1}],
 ['tumulo1',15.5,4.75,{w:1,h:1.7,nome:'Sarcófago'}],['tumulo1',15.5,6,{w:1,h:1.7,nome:'Sarcófago'}],['tumulo1',15.5,7.25,{w:1,h:1.7,nome:'Sarcófago'}],['tumulo1',17.5,5.6,{w:1,h:1.7,nome:'Sarcófago'}],['pk_feu_estandarte',16.5,4.4,{camada:4,w:.9,h:1.4}],
 ['pk_mesa_longa',20.5,3,{w:2.6,h:.5,nome:'Mesa de pedra'}],['pk_feu_trono',20.5,1.6,{w:1.3,h:1.3}],['pk_feu_bau',19.6,6.6,{w:1.2,h:.8}],
 ['pk_cama_solteiro',15.5,11.8,{w:1.1,h:2.1}],['pk_cama_solteiro',16.6,11.8,{w:1.1,h:2.1}],['pk_cama_solteiro',15.5,13.1,{w:1.1,h:2.1}],['caixa1',15.5,14.3,{nome:'Caixote'}],['caixa2',16.6,14.2,{nome:'Caixote'}],['caixa1',17.3,14.5,{nome:'Caixote'}],['pk_barril',15.6,15.6],['pk_barril',16.4,15.6],['pk_barril',17.3,15.4],
 ['pk_barril',19.5,11.5],['pk_barril',20.4,11.4],['pk_barril',21.3,11.5],['pk_barril',20,12.1],['pk_barril',20.4,16.2],['pk_barril',21.2,16.1],['pk_barril',19.6,16.3],
 ['esqueletos1',8.5,8.6,{w:1.6,h:1.1,nome:'Ossada',camada:1}],['esqueletos1',12.5,15.5,{w:1.6,h:1.1,nome:'Ossada',camada:1}],['pk_cristal_azul',13.2,6.6,{w:.8,h:1}],['predragay1',8,15.3,{w:.9,h:1,nome:'Cristal rosado'}],['pk_pedra_pequena',12.5,10.5],['pk_pedra_pequena',8.5,14.3],['predranova2',13.3,12.5,{w:1.2,h:1,nome:'Pedra solta'}]
];
export const POCO={x:20.5,y:14,w:2.3,h:1.9}; // quadros
export const TELHADO={sala:'quarto'}; // camada de cima: o telhado do quarto some quando alguém entra
export const MONSTROS=[
 {id:'carrapato_de_ferro',faccao:'c',x:7.6,y:14.4,alternativas:['parasita_carniceiro']},{id:'carrapato_de_ferro',faccao:'c',x:8.5,y:14.5,alternativas:['parasita_carniceiro']},
 {id:'rastejante_de_cinzas',faccao:'inimigos',x:3.5,y:9.6,alternativas:['insetoide_predador_1']},{id:'rastejante_de_cinzas',faccao:'inimigos',x:2.2,y:10.4,alternativas:['insetoide_predador_1']},
 {id:'zumbi_1',faccao:'b',x:3.4,y:15.3,alternativas:['cadaver_de_chefe']},{id:'zumbi_1',faccao:'b',x:2.8,y:14.5},
 {id:'larva_interdimensional',faccao:'neutros',comportamento:'covarde',x:12.5,y:6,alternativas:['criatura_de_calico_2']},{id:'enxame_mordedor',faccao:'b',x:8.5,y:11.5,alternativas:['enxame_ratos']},
 {id:'cadaver_de_chefe',faccao:'b',x:16.5,y:6.5,alternativas:['zumbi_1']},{id:'zumbi_1',faccao:'b',x:16.6,y:8.6},
 {id:'vampiro_psiquico',faccao:'a',x:21,y:4.4,alternativas:['vampiro_generico']},
 {id:'zumbi_1',faccao:'b',x:16.5,y:13},{id:'serpente_sanguessuga',faccao:'selvagens',x:20.6,y:12.9,alternativas:['rastejador_de_tubulacoes']},
 {id:'insetoide_predador_1',faccao:'inimigos',x:25.5,y:13.7,alternativas:['insetoide_predador']}
];
export const metros=(x,y)=>({x:+(x*28/W).toFixed(3),y:+(y*14/H).toFixed(3)}); // metros → coordenada da mesa (28×14)
const N=(x,y,w,h)=>({...metros(x,y),larguraM:+w.toFixed(3),alturaM:+h.toFixed(3)});
const hash=t=>{let h=2166136261;for(const c of String(t))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h;};
export const svgArmadilha=()=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect x="3" y="3" width="74" height="74" rx="6" fill="#2a2520" stroke="#5a5448" stroke-width="4"/><g fill="#9a8a6a" stroke="#1d1a17" stroke-width="1.5">'+[[16,22],[40,16],[62,24],[24,46],[48,42],[66,56],[20,66],[44,64]].map(([x,y])=>'<path d="M'+(x-6)+' '+(y+8)+'L'+x+' '+(y-10)+'L'+(x+6)+' '+(y+8)+'Z"/>').join('')+'</g></svg>');
export const svgArandela=()=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="#3a3630" stroke="#8a8478" stroke-width="3"/><circle cx="20" cy="20" r="9" fill="#ffd27a"/><circle cx="20" cy="20" r="4" fill="#fff6d8"/></svg>');
export const svgAlavanca=(puxada=false)=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 90"><rect x="6" y="52" width="48" height="32" rx="6" fill="#4a4a52" stroke="#1d1a17" stroke-width="3"/><rect x="14" y="60" width="32" height="16" rx="4" fill="#2a2a30"/><line x1="30" y1="66" x2="${puxada?16:44}" y2="14" stroke="#8a8a94" stroke-width="7" stroke-linecap="round"/><circle cx="${puxada?15:45}" cy="12" r="9" fill="${puxada?'#3fae6a':'#c93a2a'}" stroke="#1d1a17" stroke-width="3"/></svg>`);
const TIPO={'.':'sala','S':'sala',',':'caverna','~':'abismo','=':'ponte','#':'solido'};
const ANDAVEL=new Set(['sala','caverna','ponte']);

// Lê a planta: tipo de cada quadro e funções de consulta (em metros).
export function rasterizar(mapa=MAPA,salas=SALAS){
 const gw=QW,gh=QH,tipo=new Array(gw*gh).fill('solido');
 for(let j=0;j<gh;j++)for(let i=0;i<gw;i++)tipo[j*gw+i]=TIPO[mapa[j]?.[i]||'#']||'solido';
 const em=(x,y)=>{const i=Math.floor(x/Q),j=Math.floor(y/Q);return i<0||j<0||i>=gw||j>=gh?null:{tipo:tipo[j*gw+i],i,j};};
 const sala=(x,y)=>salas.find(s=>x/Q>=s.x&&x/Q<s.x+s.w&&y/Q>=s.y&&y/Q<s.y+s.h)||null;
 return {gw,gh,tipo,em,sala,andavel:(x,y)=>ANDAVEL.has(em(x,y)?.tipo)};
}

// ------------------------------------------------------------ geração (dados puros → formas da Oficina + objetos da cena)
export function gerarMasmorra({objetos=[],semente=184}={}){
 const r=rng(semente),banco=new Map((objetos||[]).filter(o=>o?.id).map(o=>[String(o.id),o])),objs=[];let n=0;const nid=t=>`mm189:${t}:${(++n).toString(36)}`;
 const R=rasterizar(),{gw,gh,tipo}=R,T=(i,j)=>i<0||j<0||i>=gw||j>=gh?'solido':tipo[j*gw+i];
 const push=o=>{objs.push(o);return o;};
 const ctx=novoCtx(W,H,semente,[]),{f,els}=ctx; // paredes, pisos, caverna, abismo e pontes são formas da Oficina (pedra, relevo, sombra)
 const forma=(x,y,w,h,o)=>{const e=f.forma(x,y,w,h,o);els.push(e);return e;};
 const rabisco=(x,y,comp,ang,k)=>{const pts=[];let px=x,py=y,a=ang;for(let i=0;i<k;i++){pts.push([Math.max(.2,Math.min(W-.2,px)),Math.max(.2,Math.min(H-.2,py))]);a+=(r()-.5)*.9;px+=Math.cos(a)*comp/k;py+=Math.sin(a)*comp/k;}return pts;};
 function peca(id,cx,cy,o={}){ // peça do Banco (modeloId) ou, se o banco não tiver, o mesmo desenho do jogo (data URL)
  const m=banco.get(id),rec=RECEITAS_OBJETOS[id]||PACOTE_NOVO.find(p=>p.id===id)||null;
  const w=o.w??(Number(m?.larguraM||rec?.larguraM)||1),h=o.h??(Number(m?.alturaM||rec?.alturaM)||1),pv=o.pv??Number(m?.pvMax??rec?.pvMax??0);
  const base={id:nid(id),nome:o.nome||String(m?.nome||rec?.nome||id),tipo:'objeto',camada:o.camada??Number(m?.camada??rec?.camada??3),bloqueiaMovimento:o.bloq??!!(m?.bloqueiaMovimento??rec?.bloqueiaMovimento),bloqueiaVisao:o.visao??!!(m?.bloqueiaVisao??rec?.bloqueiaVisao),
   pvMax:pv,pvAtual:pv,dureza:o.dureza??Number(m?.dureza??rec?.dureza??0),destrutivel:pv>0,material:String(o.material||m?.material||rec?.material||''),angulo:o.rot||0,...N(cx,cy,w,h),...(o.extra||{})};
  if(m)base.modeloId=id;else if(rec)base.imagem=svgParaDataUrl(desenharObjeto(rec,w,h,hash(id+n)));
  return push(base);
 }
 // ---- pisos: retângulos por tipo (lajota clara nas salas e corredores, como a referência; caverna escura; pontes de madeira)
 const mascara=t=>{const m=new Uint8Array(gw*gh);for(let i=0;i<gw*gh;i++)m[i]=tipo[i]===t?1:0;return m;};
 for(const q of retangulosDeCelulas(mascara('sala'),gw,gh)){const s=R.sala((q.x+.5)*Q,(q.y+.5)*Q);forma(q.x*Q,q.y*Q,q.w*Q,q.h*Q,{fill:s?'#7d7462':'#6b6355',nome:s?'Piso · '+s.nome:'Piso do corredor',camada:1,material:'lajota'});}
 for(const q of retangulosDeCelulas(mascara('caverna'),gw,gh))forma(q.x*Q-.2,q.y*Q-.2,q.w*Q+.4,q.h*Q+.4,{fill:'#1d1a16',nome:'Chão da caverna',camada:1,material:'trilha',radius:.9});
 for(const q of retangulosDeCelulas(mascara('ponte'),gw,gh))forma(q.x*Q,q.y*Q+.15,q.w*Q,q.h*Q-.3,{fill:'#7a5a38',nome:'Ponte de madeira',camada:1,material:'madeira'});
 for(const q of retangulosDeCelulas(mascara('abismo'),gw,gh))forma(q.x*Q,q.y*Q,q.w*Q,q.h*Q,{fill:'#07080b',nome:'Abismo',bloq:true,visao:false,material:'nenhum',radius:.5});
 // desgaste discreto no chão das salas e da caverna; sombra na beira do abismo
 for(let j=0;j<gh;j++)for(let i=0;i<gw;i++){const t=T(i,j);if((t==='sala'||t==='caverna')&&r()<(t==='caverna'?.26:.09)){const x=(i+.2+r()*.6)*Q,y=(j+.2+r()*.6)*Q;els.push(f.pincel(rabisco(x,y,.8+r()*1.2,r()*6.28,4),r()<.6?{brush:'cascalho',cor:'#26231f',largura:.28,opac:.5,nome:'Entulho'}:{brush:'ranhura',cor:'#1f1c18',largura:.2,opac:.45,nome:'Rachadura'}));}
  if(t==='abismo')for(const [dx,dy] of [[-1,0],[1,0]]){if(T(i+dx,j)==='caverna')els.push(f.pincel([[(i+(dx>0?1:0))*Q,j*Q],[(i+(dx>0?1:0))*Q+(r()-.5)*.3,(j+1)*Q]],{brush:'fumaca',cor:'#0a0b10',largura:1.1,opac:.5,nome:'Beira do abismo'}));}}
 // manchas de ambiente (só desenho): sangue na cripta, musgo na caverna, poças nos corredores
 const celulasDe=t=>{const out=[];for(let j=1;j<gh-1;j++)for(let i=1;i<gw-1;i++)if(T(i,j)===t)out.push([i,j]);return out;};
 const longeDoAbismo=([i,j])=>[[1,0],[-1,0],[0,1],[0,-1]].every(([dx,dy])=>T(i+dx,j+dy)!=='abismo');
 const semSala=([i,j])=>!R.sala((i+.5)*Q,(j+.5)*Q);
 const tinta=(i,j,w,h,cor,nome,op)=>{const e=forma((i+.5)*Q-w/2,(j+.5)*Q-h/2,w,h,{fill:cor,nome,camada:1,kind:'elipse',material:'nenhum',opacity:op});e.fillOpacity=op;};
 for(const [sx,sy] of [[15.8,5.2],[16.4,6.9],[17.3,5.0]]){const e=forma(sx*Q-.4,sy*Q-.32,.8,.64,{fill:'#4a120c',nome:'Mancha de sangue',camada:1,kind:'elipse',material:'nenhum',opacity:.5});e.fillOpacity=.5;}
 const musgos=celulasDe('caverna').filter(longeDoAbismo);
 for(let k=0;k<2&&musgos.length;k++){const [i,j]=musgos.splice(Math.floor(r()*musgos.length),1)[0];tinta(i,j,1.3+r()*.6,.9+r()*.4,r()<.5?'#3a4a2c':'#31452c','Musgo',.42);}
 const pocas=celulasDe('sala').filter(longeDoAbismo).filter(semSala);
 for(let k=0;k<2&&pocas.length;k++){const [i,j]=pocas.splice(Math.floor(r()*pocas.length),1)[0];tinta(i,j,1+r()*.5,.7+r()*.3,'#23262c','Poça',.5);}
 // ---- paredes (bordas de sala/corredor com rocha e linhas internas) e rochas (bordas da caverna)
 const aberturas=PORTAS.map(p=>p.hor?{hor:true,y:p.y*Q,x0:p.x*Q,x1:(p.x+1)*Q}:{hor:false,x:p.x*Q,y0:p.y*Q,y1:(p.y+1)*Q});
 const naAbertura=(hor,c,a)=>aberturas.some(ab=>ab.hor===hor&&(hor?Math.abs(ab.y-c)<1e-6&&a>=ab.x0-1e-6&&a<ab.x1-1e-6:Math.abs(ab.x-c)<1e-6&&a>=ab.y0-1e-6&&a<ab.y1-1e-6));
 const naLinha=(hor,c,a)=>LINHAS.some(l=>l.hor===hor&&(hor?l.y*Q===c&&a>=l.x0*Q-1e-6&&a<l.x1*Q-1e-6:l.x*Q===c&&a>=l.y0*Q-1e-6&&a<l.y1*Q-1e-6));
 const classe=(ta,tb,hor,c,a)=>{const A=ANDAVEL.has(ta),B=ANDAVEL.has(tb);
  if(A&&B)return naLinha(hor,c,a)?'parede':'';
  if(A!==B){const t=A?ta:tb,o=A?tb:ta;if(o==='abismo')return t==='sala'?'parede':'';return t==='caverna'?'rocha':'parede';}
  return '';};
 const arestasH=new Map(),arestasV=new Map();
 for(let j=0;j<=gh;j++)for(let i=0;i<gw;i++){const k=classe(T(i,j-1),T(i,j),true,j*Q,i*Q);if(k&&!naAbertura(true,j*Q,i*Q)){if(!arestasH.has(j))arestasH.set(j,[]);arestasH.get(j).push({i,k});}}
 for(let i=0;i<=gw;i++)for(let j=0;j<gh;j++){const k=classe(T(i-1,j),T(i,j),false,i*Q,j*Q);if(k&&!naAbertura(false,i*Q,j*Q)){if(!arestasV.has(i))arestasV.set(i,[]);arestasV.get(i).push({j,k});}}
 let paredes=0,rochas=0;const luzes=[];
 const emitir=(hor,c,a0,a1,k)=>{
  if(k==='parede'){const t=ESPESSURA,rect=hor?{x:a0-t/2,y:c-t/2,w:a1-a0+t,h:t}:{x:c-t/2,y:a0-t/2,w:t,h:a1-a0+t};const e=forma(rect.x,rect.y,rect.w,rect.h,{fill:'#b5b1a4',nome:'Parede de pedra',bloq:true,material:'pedra'});Object.assign(e,{pvMax:PAREDE.pv,pvAtual:PAREDE.pv,dureza:PAREDE.dureza,destrutivel:true});paredes++;
   // arandela (luz) no meio dos trechos de 3 m, do lado do chão
   if(a1-a0>=3&&r()<.75){const meio=(a0+a1)/2;const lado=hor?(T(Math.floor(meio/Q),Math.floor(c/Q))!=='solido'?1:-1):(T(Math.floor(c/Q),Math.floor(meio/Q))!=='solido'?1:-1);luzes.push(hor?{x:meio,y:c+lado*.35}:{x:c+lado*.35,y:meio});}
   return;}
  const L=a1-a0,q=Math.max(1,Math.round(L/1.6));
  for(let s=0;s<q;s++){const a=a0+L*(s+.5)/q,desl=(.3+r()*.25)*Q/1.5,sz=(1.2+r()*.7)*Q/1.5;const cx=hor?a:c+(T(Math.floor(c/Q),Math.floor(a/Q))==='caverna'?-desl:desl),cy=hor?c+(T(Math.floor(a/Q),Math.floor(c/Q))==='caverna'?-desl:desl):a;
   forma(cx-sz/2,cy-sz*.42,sz,sz*.84,{fill:['#39352e','#403b33','#343028','#2e2b26'][Math.floor(r()*4)],nome:'Rocha da caverna',bloq:true,kind:'elipse',material:'rocha',rot:Math.floor(r()*360)});rochas++;}
 };
 const varrer=(mapa,hor)=>{for(const [linha,lista] of mapa){lista.sort((p,q)=>(p.i??p.j)-(q.i??q.j));let ini=null,fim=null,k='';const fecha=()=>{if(ini===null)return;const a0=ini*Q,a1=(fim+1)*Q;for(let a=a0;a<a1-1e-9;a+=3)emitir(hor,linha*Q,a,Math.min(a1,a+3),k);ini=null;};
  for(const e of lista){const p=e.i??e.j;if(ini!==null&&(p!==fim+1||e.k!==k))fecha();if(ini===null){ini=p;k=e.k;}fim=p;}fecha();}};
 varrer(arestasH,true);varrer(arestasV,false);
 // ---- portas de pedra (duas trancadas, na cripta), escadas, poço, telhado do quarto (camada de cima)
 const portas=[],trancadas=[];
 for(const p of PORTAS){const cx=p.hor?(p.x+.5)*Q:p.x*Q,cy=p.hor?p.y*Q:(p.y+.5)*Q,rect=p.hor?{x:cx-(Q-ESPESSURA)/2,y:cy-ESPESSURA/2,w:Q-ESPESSURA,h:ESPESSURA}:{x:cx-ESPESSURA/2,y:cy-(Q-ESPESSURA)/2,w:ESPESSURA,h:Q-ESPESSURA};
  const o=push({...oPorta(rect,matDe(MAT_PAREDE),W,H),id:nid('porta'),nome:p.nome||'Porta de pedra',pvMax:PORTA.pv,pvAtual:PORTA.pv,dureza:PORTA.dureza,destrutivel:true,...(p.trancada?{estadoInterativo:{trancado:true,aberto:false,dificuldade:'padrao'}}:{})});portas.push(o.id);if(p.trancada)trancadas.push(o.id);}
 for(const e of ESCADAS)push({...oEscada({x:e.x*Q-e.w/2,y:e.y*Q-e.h/2,w:e.w,h:e.h},matDe('pedra-polida'),W,H,e.giro),id:nid('escada'),nome:e.nome});
 forma((POCO.x-POCO.w/2)*Q,(POCO.y-POCO.h/2)*Q,POCO.w*Q,POCO.h*Q,{fill:'#3f9f92',nome:'Poço de água',camada:1,material:'agua',radius:.5,opacity:.95});
 {const s=SALAS.find(z=>z.k===TELHADO.sala);if(s)push({...oTeto({x:s.x*Q,y:s.y*Q,w:s.w*Q,h:s.h*Q},matDe('madeira'),W,H,'g189'),id:nid('teto'),nome:'Telhado · '+s.nome});}
 // ---- luzes: arandelas nas paredes (iluminam de noite) com poça de luz discreta; braseiro no altar e na cripta
 const arandelas=luzes.slice(0,22);
 for(const l of arandelas){if(banco.has('lampada'))peca('lampada',l.x,l.y,{nome:'Arandela luminária',w:.45,h:.45,camada:4,bloq:false,visao:false,pv:0});else push({id:nid('arandela'),nome:'Arandela luminária',tipo:'objeto',camada:4,bloqueiaMovimento:false,bloqueiaVisao:false,pvMax:0,pvAtual:0,dureza:0,destrutivel:false,material:'metal',angulo:0,imagem:svgArandela(),...N(l.x,l.y,.45,.45)});const azul=R.sala(l.x,l.y)?.k==='altar';const e=forma(l.x-1.6,l.y-1.6,3.2,3.2,{fill:azul?'#8fd0ff':'#ffc777',nome:'Luz da arandela',camada:1,kind:'elipse',material:'nenhum',opacity:.08});e.fillOpacity=.08;}
 for(const [x,y] of [[16.5,7.5],[3.3,2.6],[25.5,15.9]]){peca('pk_feu_braseiro',x*Q,y*Q,{w:.9,h:.9,bloq:true,visao:false});const e=forma(x*Q-1.9,y*Q-1.9,3.8,3.8,{fill:'#ffb347',nome:'Luz do braseiro',camada:1,kind:'elipse',material:'nenhum',opacity:.1});e.fillOpacity=.1;}
 {const cx=4.2*Q,cy=1.5*Q;const e=forma(cx-1.5,cy-1.5,3,3,{fill:'#8fd0ff',nome:'Luz do cristal',camada:1,kind:'elipse',material:'nenhum',opacity:.14});e.fillOpacity=.14;}
 // ---- armadilhas, celas (grades), alavanca emperrada, mobília
 for(const a of ARMADILHAS_PLANTA){const Tt=ARMADILHAS[a.tipo],extra={opacity:.22,armadilhaV184:a.tipo,...(a.liberta?{libertaV186:a.liberta}:{})};
  if(banco.has('armadilha1'))peca('armadilha1',a.x*Q,a.y*Q,{nome:Tt.nome,w:1.2,h:1.2,camada:1,bloq:false,visao:false,pv:0,extra});
  else push({id:nid('armadilha'),nome:Tt.nome,tipo:'objeto',camada:1,bloqueiaMovimento:false,bloqueiaVisao:false,pvMax:0,pvAtual:0,dureza:0,destrutivel:false,material:'',angulo:0,imagem:svgArmadilha(),...N(a.x*Q,a.y*Q,1.2,1.2),...extra});}
 const jaulas=[];
 for(const j of JAULAS){const grades=[];let portaId=null;const jx=j.x*Q,jy=j.y*Q,jw=j.w*Q,jh=j.h*Q;
  j.lados.forEach((lado,i)=>{const t=ESPESSURA,rect=lado==='S'?{x:jx,y:jy+jh-t/2,w:jw,h:t}:lado==='N'?{x:jx,y:jy-t/2,w:jw,h:t}:lado==='E'?{x:jx+jw-t/2,y:jy,w:t,h:jh}:{x:jx-t/2,y:jy,w:t,h:jh};
   const g=peca('grade1',rect.x+rect.w/2,rect.y+rect.h/2,{nome:'Grade da cela',w:rect.w,h:rect.h,camada:3,bloq:true,visao:false,pv:GRADE.pv,dureza:GRADE.dureza,material:'metal',extra:{jaulaV186:j.id,...(i===0?{portaJaulaV186:true}:{})}});grades.push(g.id);if(i===0)portaId=g.id;});
  let alavancaId=null;if(j.alavanca)alavancaId=push({id:nid('alavanca'),nome:j.alavanca.emperrada?'Alavanca emperrada':'Alavanca',tipo:'objeto',camada:2,bloqueiaMovimento:false,bloqueiaVisao:false,pvMax:0,pvAtual:0,dureza:0,destrutivel:false,material:'metal',angulo:0,imagem:svgAlavanca(false),alavancaV186:j.id,...(j.alavanca.emperrada?{emperradaV189:true}:{}),...N(j.alavanca.x*Q,j.alavanca.y*Q,.6,.9)}).id;
  jaulas.push({id:j.id,abre:j.abre,x:jx+jw/2,y:jy+jh/2,portaId,grades,alavancaId});}
 for(const [id,x,y,o] of MOBILIA)peca(id,x*Q,y*Q,o||{});
 for(const [id,nome,x,y,emoji] of ITENS_PREPARO){const en={uid:'preparo_'+id,tipo:'item',idBanco:id,nome,imagem:svgItem(emoji)};push({id:nid('solto'),nome,tipo:'item',camada:1,bloqueiaMovimento:false,bloqueiaVisao:false,pvMax:0,pvAtual:0,dureza:0,destrutivel:false,material:'',angulo:0,imagem:en.imagem,itemSolto:en,preparoV191:true,...N(x*Q,y*Q,.6,.6)});}
 // ---- monstros (facção e lugar vêm da planta; os das celas ficam dentro delas)
 const monstros=MONSTROS.map(m=>({id:m.id,alternativas:m.alternativas||[],faccao:m.faccao||'inimigos',comportamento:m.comportamento||'',x:m.x*Q,y:m.y*Q,sala:(SALAS.findIndex(s=>m.x>=s.x&&m.x<s.x+s.w&&m.y>=s.y&&m.y<s.y+s.h)+1)||0}));
 for(const j of jaulas){const J=JAULAS.find(x=>x.id===j.id);monstros.push({id:J.monstro.id,alternativas:J.monstro.alternativas||[],faccao:J.monstro.faccao,comportamento:'',x:j.x,y:j.y,jaula:j.id});}
 const state={w:W,h:H,ppm:40,bg:'#15161a',texture:'masmorra',showGrid:false,grid:'#2c2823',name:NOME_MASMORRA,formatoObjetos:'refs-v1',elements:els,estiloV129:'feudal',masmorraV184:true,geradoV110:{tipo:'caverna',semente,variante:'masmorra-v189'}};
 return {state,objects:objs.map(o=>normalizarObjeto(o)),entrada:{...ENTRADA},salas:SALAS.map((s,i)=>({k:i+1,nome:s.nome,x:(s.x+s.w/2)*Q,y:(s.y+s.h/2)*Q})),monstros,armadilhas:ARMADILHAS_PLANTA.map(a=>({tipo:a.tipo,x:a.x*Q,y:a.y*Q,liberta:a.liberta||''})),pedras:[],paredes,rochas,luzes:arandelas.length,
  jaulas,portas,trancadas,porta:trancadas[0]||null,andavel:R.andavel,em:R.em};
}
// cena pronta para a mesa (o mesmo que o mapa salvo guarda)
export const svgSimples=(cor='#7a5a38')=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect x="3" y="3" width="34" height="34" rx="9" fill="${cor}" stroke="#1d1a17" stroke-width="3"/><path d="M8 20h24M20 8v24" stroke="rgba(0,0,0,.35)" stroke-width="3"/></svg>`);
// Sem o Banco, os desenhos do jogo pesam; acima do limite da mesa os repetidos viram um desenho simples (o Banco real não precisa disso).
export function aliviar(objs,limite=LIMITE_CENA,resto=0){
 let lista=objs.map(o=>o),tam=()=>JSON.stringify(lista).length+resto;if(tam()<=limite)return {objects:lista,aliviados:0};
 const idx=lista.map((o,i)=>[i,String(o.imagem||'').startsWith('data:')&&!o.armadilhaV184&&!o.alavancaV186&&!o.jaulaV186?o.imagem.length:0]).filter(([,n])=>n>2000).sort((a,b)=>b[1]-a[1]);let k=0;
 for(const [i] of idx){if(tam()<=limite)break;lista[i]={...lista[i],imagem:svgSimples(/barril|caixote|cama|cadeira/i.test(lista[i].nome)?'#7a5a38':'#6a6a62')};k++;}
 return {objects:lista,aliviados:k};
}
export const cenaMasmorra=(g,mid=ID_MASMORRA)=>{const c=cenaDoEstado(g.state,mid),base=JSON.stringify(c).length;const {objects}=aliviar(g.objects,LIMITE_CENA,base);return {...c,objects:[...c.objects,...objects]};};

// ------------------------------------------------------------ v196 — Núcleo Subterrâneo (planta autoral do Kimi)
// Complexo de pesquisa retro-futurista abandonado (visual Fallout/No Man's Sky) rachado por uma caverna natural com
// fosso e passarela. Paredes de blindagem bloqueiam movimento e visão; portas com teste (reator e contenção trancadas);
// criaturas em facções (neutras até serem atacadas); armadilhas; baús; escada de entrada e de descida; sala da contenção
// escondida sob telhado (só aparece quando alguém entra). Publicado como mapa SEPARADO (não toca a Masmorra de treino).
export const ID_MAPA_196='v196_complexo',NOME_MAPA_196='Núcleo Subterrâneo v196 (Kimi)',FLAG_196='configuracoes/mapa196Publicado';
// Planta autoral em quadros de 2 m (30×18 = 60×36 m). '.' piso do complexo · ',' caverna · '~' fosso · '=' passarela · 'S' escada · '#' rocha
export const MAPA_196=[
 '##############################',
 '#.......##...................#',
 '#..S....##...................#',
 '#..S....##......##.#####.#####',
 '#.......##......#............#',
 '#.......##......#............#',
 '####.######..###.............#',
 '####.######..###.............#',
 '#.......##,,,,,,,,,,,........#',
 '#.......,,,,,~~~~~,,,........#',
 '#.......,,,,,~~=~~,,,........#',
 '#.......,,,,,,~~~,,,,###.#####',
 '#.......,,,,,,~~,,,,,#.......#',
 '#.......,,SS,,,,,,,,,#.......#',
 '##########........,,,#.......#',
 '##########........,,,#.......#',
 '##########........,,,#.......#',
 '##############################'
];
export const SALAS_196=[
 {k:'docas',nome:'Docas de pouso',x:1,y:1,w:7,h:5},{k:'laboratorio',nome:'Laboratório',x:10,y:1,w:6,h:4},
 {k:'reator',nome:'Sala do reator',x:17,y:4,w:4,h:4},{k:'cantina',nome:'Cantina',x:21,y:4,w:8,h:7},
 {k:'deposito',nome:'Depósito',x:1,y:8,w:7,h:6},{k:'arquivo',nome:'Arquivo morto',x:10,y:14,w:8,h:3},
 {k:'contencao',nome:'Contenção (chefe)',x:22,y:12,w:7,h:5}
];
// paredes internas finas (arestas entre dois quadros de chão): portas só funcionam sobre essas arestas
export const LINHAS_196=[
 {hor:false,x:16,y0:1,y1:3},
 {hor:true,y:3,x0:18,x1:19},{hor:true,y:3,x0:24,x1:25},
 {hor:true,y:4,x0:18,x1:19},{hor:true,y:4,x0:24,x1:25},
 {hor:false,x:21,y0:4,y1:11},
 {hor:true,y:5,x0:12,x1:14},{hor:true,y:6,x0:4,x1:5},{hor:true,y:12,x0:24,x1:25}
];
export const PORTAS_196=[
 {x:4,y:6,hor:true,nome:'Porta das docas'},
 {x:12,y:5,hor:true,nome:'Porta do laboratório'},
 {x:16,y:1,hor:false,nome:'Porta de acesso norte'},
 {x:18,y:3,hor:true,nome:'Porta do reator',trancada:true},
 {x:24,y:3,hor:true,nome:'Porta da cantina'},
 {x:21,y:6,hor:false,nome:'Porta lateral do reator'},
 {x:21,y:10,hor:false,nome:'Portão da caverna'},
 {x:24,y:12,hor:true,nome:'Porta da contenção',trancada:true}
];
export const ENTRADA_196={x:3.4*Q,y:2.6*Q}; // Kael/PCs começam junto à escada das docas
export const ESCADAS_196=[{x:3,y:2.6,w:1,h:2.6,giro:0,nome:'Escada de entrada'},{x:10.6,y:13,w:2,h:1,giro:1,nome:'Escada de descida'}];
export const ARMADILHAS_196=[
 {tipo:'estacas',x:12.5,y:5.5},{tipo:'laminas',x:4.5,y:7.5},{tipo:'estacas',x:13.5,y:11.5},
 {tipo:'laminas',x:18.5,y:14.5,liberta:'c1'},{tipo:'estacas',x:26.5,y:1.5},{tipo:'laminas',x:24.5,y:11.5}
];
export const JAULAS_196=[ // jaula de contenção do Depósito (alavanca emperrada ao lado)
 {id:'c1',abre:'alavanca',x:5,y:11,w:2,h:2,lados:['S','N','W','E'],alavanca:{x:7.4,y:11.5,emperrada:true},monstro:{id:'predador_de_nevoa',faccao:'selvagens',alternativas:['cacador_de_nevoa','predador_couracado']}}
];
export const MOBILIA_196=[ // id do Banco (ou receita) · centro em quadros · opções em metros
 ['pk_vei_cargueiro',5.2,4.3,{w:3,h:2,nome:'Cargueiro estacionado'}],['caixa1',1.6,4.7,{nome:'Caixote'}],['caixa2',2.5,4.7,{nome:'Caixote'}],['pk_caixote_suprimentos',1.5,3.9,{w:1.1,h:.9}],
 ['pk_luminaria',2,1.4],['pk_luminaria',6,1.4],
 ['pk_mesa_quadrada',11,1.8,{w:1.8,h:.9,nome:'Bancada de análise'}],['pk_cadeira_madeira',11,2.6],['pk_mesa_quadrada',14,1.8,{w:1.8,h:.9,nome:'Bancada de análise'}],['pk_cadeira_madeira',14,2.6],
 ['pk_fut_mesa',12.5,3.5,{w:1.6,h:.8,nome:'Console central'}],['pk_cristal_azul',10.6,3.8,{w:.7,h:.9}],['pk_cristal_azul',15.3,3.7,{w:.7,h:.9}],['pk_luminaria',12.5,1.3],
 ['pk_cristal_azul',18.5,5.8,{w:1.5,h:2,nome:'Núcleo de energia'}],['pk_feu_bau',17.7,7.3,{w:1.1,h:.7,nome:'Cofre de materiais'}],['pk_feu_bau',19.5,7.3,{w:1.1,h:.7,nome:'Cofre de materiais'}],['pk_luminaria',17.4,4.6],
 ['pk_mesa_longa',24,6,{w:2.4,h:.5,nome:'Mesa de refeitório'}],['pk_mesa_longa',26.5,8,{w:2.4,h:.5,nome:'Mesa de refeitório'}],
 ['pk_cadeira_madeira',24,5.3],['pk_cadeira_madeira',24,6.7],['pk_cadeira_madeira',26.5,7.3],['pk_cadeira_madeira',26.5,8.7],
 ['pk_barril',27.8,4.6],['pk_barril',28.2,5.3],['pk_barril',22.6,4.6],['pk_mesa_redonda_bar',23,9.5,{w:1.6,h:1.6}],
 ['pk_barril',1.6,8.6],['pk_barril',2.4,8.7],['pk_barril',1.7,9.4],['caixa1',1.5,12.6,{nome:'Caixote'}],['caixa2',2.4,12.7,{nome:'Caixote'}],['pk_caixote_suprimentos',3.4,12.8,{w:1.1,h:.9}],
 ['pk_feu_bau',6.5,8.6,{w:1.2,h:.8,nome:'Baú de suprimentos'}],['pk_luminaria',4,8.5],
 ['caixa1',10.6,15.2,{nome:'Caixote'}],['caixa2',11.5,15.3,{nome:'Caixote'}],['caixa1',10.7,16.2,{nome:'Caixote'}],['pk_caixote_suprimentos',11.7,16.3,{w:1.1,h:.9}],
 ['pk_fut_mesa',16.5,15.4,{w:1.6,h:.8,nome:'Terminal de arquivo'}],['pk_luminaria',13.5,14.5],
 ['tumulo1',23,14,{w:1,h:1.7,nome:'Cápsula de contenção'}],['tumulo1',23,15.6,{w:1,h:1.7,nome:'Cápsula de contenção'}],['tumulo1',27.5,14.5,{w:1,h:1.7,nome:'Cápsula de contenção'}],
 ['pk_feu_estandarte',25,12.6,{camada:4,w:.9,h:1.4}],['pk_feu_bau',27.6,16.2,{w:1.2,h:.8,nome:'Cofre do guardião'}],
 ['predranova2',12.2,8.6,{w:1.2,h:1,nome:'Pedra solta'}],['pk_pedra_pequena',11.2,10.4],['pk_pedra_pequena',19.2,9.4],
 ['pk_cristal_azul',19.3,12.4,{w:.8,h:1,nome:'Cristal luminoso'}],['predragay1',10.8,12.6,{w:.9,h:1,nome:'Cristal rosado'}],['esqueletos1',19.4,11.4,{w:1.6,h:1.1,nome:'Ossada',camada:1}]
];
export const ITENS_196=[
 ['bateria','Bateria',16,15.7,'🔋'],['kit_medico','Kit Médico Básico',14.6,15.2,'🩹'],
 ['celula_lamina','Célula de Lâmina',6.4,8.7,'🔋'],['armadura_leve','Armadura Corporal Leve',2.6,12.5,'🦺']
];
export const TELHADO_196='contencao'; // camada de cima: a sala do chefe some até alguém entrar
export const MONSTROS_196=[
 {id:'insetoide_predador_1',faccao:'inimigos',x:19.4,y:4.8,alternativas:['insetoide_predador']},
 {id:'rastejante_de_cinzas',faccao:'neutros',x:25,y:6.5},
 {id:'rastejante_de_cinzas',faccao:'neutros',x:26.6,y:8.2,alternativas:['insetoide_predador_1']},
 {id:'cadaver_de_chefe',faccao:'a',x:25,y:14.5,alternativas:['zumbi_1']},
 {id:'zumbi_1',faccao:'a',x:23.6,y:15.2},{id:'zumbi_1',faccao:'a',x:26.4,y:15.4},
 {id:'carrapato_de_ferro',faccao:'c',x:3,y:10,alternativas:['parasita_carniceiro']},{id:'carrapato_de_ferro',faccao:'c',x:4.4,y:10.6},
 {id:'serpente_sanguessuga',faccao:'selvagens',x:13.5,y:15.2,alternativas:['rastejador_de_tubulacoes']},
 {id:'enxame_mordedor',faccao:'b',x:12,y:9.2,alternativas:['enxame_ratos']},
 {id:'larva_interdimensional',faccao:'neutros',comportamento:'covarde',x:18.6,y:12.4,alternativas:['criatura_de_calico_2']}
];

export function gerarComplexo196({objetos=[],semente=196}={}){
 const r=rng(semente),banco=new Map((objetos||[]).filter(o=>o?.id).map(o=>[String(o.id),o])),objs=[];let n=0;const nid=t=>`cx196:${t}:${(++n).toString(36)}`;
 const R=rasterizar(MAPA_196,SALAS_196),{gw,gh,tipo}=R,T=(i,j)=>i<0||j<0||i>=gw||j>=gh?'solido':tipo[j*gw+i];
 const push=o=>{objs.push(o);return o;};
 const ctx=novoCtx(W,H,semente,[]),{f,els}=ctx; // paredes, pisos, caverna, fosso e passarela são formas da Oficina (blindagem, painel, relevo, sombra)
 const forma=(x,y,w,h,o)=>{const e=f.forma(x,y,w,h,o);els.push(e);return e;};
 const rabisco=(x,y,comp,ang,k)=>{const pts=[];let px=x,py=y,a=ang;for(let i=0;i<k;i++){pts.push([Math.max(.2,Math.min(W-.2,px)),Math.max(.2,Math.min(H-.2,py))]);a+=(r()-.5)*.9;px+=Math.cos(a)*comp/k;py+=Math.sin(a)*comp/k;}return pts;};
 function peca(id,cx,cy,o={}){ // peça do Banco (modeloId) ou, se o banco não tiver, o mesmo desenho do jogo (data URL)
  const m=banco.get(id),rec=RECEITAS_OBJETOS[id]||PACOTE_NOVO.find(p=>p.id===id)||null;
  const w=o.w??(Number(m?.larguraM||rec?.larguraM)||1),h=o.h??(Number(m?.alturaM||rec?.alturaM)||1),pv=o.pv??Number(m?.pvMax??rec?.pvMax??0);
  const base={id:nid(id),nome:o.nome||String(m?.nome||rec?.nome||id),tipo:'objeto',camada:o.camada??Number(m?.camada??rec?.camada??3),bloqueiaMovimento:o.bloq??!!(m?.bloqueiaMovimento??rec?.bloqueiaMovimento),bloqueiaVisao:o.visao??!!(m?.bloqueiaVisao??rec?.bloqueiaVisao),
   pvMax:pv,pvAtual:pv,dureza:o.dureza??Number(m?.dureza??rec?.dureza??0),destrutivel:pv>0,material:String(o.material||m?.material||rec?.material||''),angulo:o.rot||0,...N(cx,cy,w,h),...(o.extra||{})};
  if(m)base.modeloId=id;else if(rec)base.imagem=svgParaDataUrl(desenharObjeto(rec,w,h,hash(id+n)));
  return push(base);
 }
 // ---- pisos: painel de metal nas salas/corredores do complexo, caverna escura, passarela de metal sobre o fosso
 const mascara=t=>{const m=new Uint8Array(gw*gh);for(let i=0;i<gw*gh;i++)m[i]=tipo[i]===t?1:0;return m;};
 for(const q of retangulosDeCelulas(mascara('sala'),gw,gh)){const s=R.sala((q.x+.5)*Q,(q.y+.5)*Q);forma(q.x*Q,q.y*Q,q.w*Q,q.h*Q,{fill:s?'#4c5257':'#454b50',nome:s?'Piso · '+s.nome:'Piso do corredor',camada:1,material:'painel'});}
 for(const q of retangulosDeCelulas(mascara('caverna'),gw,gh))forma(q.x*Q-.2,q.y*Q-.2,q.w*Q+.4,q.h*Q+.4,{fill:'#2b241b',nome:'Chão da caverna',camada:1,material:'trilha',radius:.9});
 for(const q of retangulosDeCelulas(mascara('ponte'),gw,gh))forma(q.x*Q,q.y*Q+.15,q.w*Q,q.h*Q-.3,{fill:'#4e565e',nome:'Passarela de metal',camada:1,material:'metal'});
 for(const q of retangulosDeCelulas(mascara('abismo'),gw,gh))forma(q.x*Q,q.y*Q,q.w*Q,q.h*Q,{fill:'#0a121c',nome:'Fosso',bloq:true,visao:false,material:'nenhum',radius:.5});
 // desgaste discreto no chão; sombra na beira do fosso (4 lados)
 for(let j=0;j<gh;j++)for(let i=0;i<gw;i++){const t=T(i,j);if((t==='sala'||t==='caverna')&&r()<(t==='caverna'?.26:.09)){const x=(i+.2+r()*.6)*Q,y=(j+.2+r()*.6)*Q;els.push(f.pincel(rabisco(x,y,.8+r()*1.2,r()*6.28,4),r()<.6?{brush:'cascalho',cor:'#17181c',largura:.28,opac:.5,nome:'Entulho'}:{brush:'ranhura',cor:'#121317',largura:.2,opac:.45,nome:'Risco no piso'}));}
  if(t==='abismo')for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){if(T(i+dx,j+dy)==='caverna'){const x0=(i+(dx>0?1:0))*Q,y0=(j+(dy>0?1:0))*Q,x1=dx===0?x0+(r()-.5)*.3:(i+(dx>0?1:0))*Q,y1=dy===0?y0+(r()-.5)*.3:(j+(dy>0?1:0))*Q;els.push(f.pincel([[x0,y0],[x0+(r()-.5)*.3,y0+(r()-.5)*.3],[x1,y1]],{brush:'fumaca',cor:'#08090d',largura:1.1,opac:.5,nome:'Beira do fosso'}));}}}
 // manchas de ambiente (só desenho): vazamento de óleo nas docas/corredores, sangue na contenção, musgo na caverna
 const celulasDe=t=>{const out=[];for(let j=1;j<gh-1;j++)for(let i=1;i<gw-1;i++)if(T(i,j)===t)out.push([i,j]);return out;};
 const longeDoFosso=([i,j])=>[[1,0],[-1,0],[0,1],[0,-1]].every(([dx,dy])=>T(i+dx,j+dy)!=='abismo');
 const tinta=(i,j,w,h,cor,nome,op)=>{const e=forma((i+.5)*Q-w/2,(j+.5)*Q-h/2,w,h,{fill:cor,nome,camada:1,kind:'elipse',material:'nenhum',opacity:op});e.fillOpacity=op;};
 for(const [sx,sy] of [[24.3,14.2],[25.6,15.3],[23.4,15.6]]){const e=forma(sx*Q-.4,sy*Q-.32,.8,.64,{fill:'#3d1013',nome:'Mancha de sangue',camada:1,kind:'elipse',material:'nenhum',opacity:.5});e.fillOpacity=.5;}
 const musgos=celulasDe('caverna').filter(longeDoFosso);
 for(let k=0;k<2&&musgos.length;k++){const [i,j]=musgos.splice(Math.floor(r()*musgos.length),1)[0];tinta(i,j,1.3+r()*.6,.9+r()*.4,r()<.5?'#2c3a24':'#26332a','Musgo',.42);}
 const oleos=celulasDe('sala').filter(longeDoFosso).filter(([i,j])=>!R.sala((i+.5)*Q,(j+.5)*Q));
 for(let k=0;k<2&&oleos.length;k++){const [i,j]=oleos.splice(Math.floor(r()*oleos.length),1)[0];tinta(i,j,1+r()*.5,.7+r()*.3,'#101216','Vazamento de óleo',.5);}
 // ---- paredes (bordas do complexo com blindagem e linhas internas) e rochas (bordas da caverna)
 const aberturas=PORTAS_196.map(p=>p.hor?{hor:true,y:p.y*Q,x0:p.x*Q,x1:(p.x+1)*Q}:{hor:false,x:p.x*Q,y0:p.y*Q,y1:(p.y+1)*Q});
 const naAbertura=(hor,c,a)=>aberturas.some(ab=>ab.hor===hor&&(hor?Math.abs(ab.y-c)<1e-6&&a>=ab.x0-1e-6&&a<ab.x1-1e-6:Math.abs(ab.x-c)<1e-6&&a>=ab.y0-1e-6&&a<ab.y1-1e-6));
 const naLinha=(hor,c,a)=>LINHAS_196.some(l=>l.hor===hor&&(hor?l.y*Q===c&&a>=l.x0*Q-1e-6&&a<l.x1*Q-1e-6:l.x*Q===c&&a>=l.y0*Q-1e-6&&a<l.y1*Q-1e-6));
 const classe=(ta,tb,hor,c,a)=>{const A=ANDAVEL.has(ta),B=ANDAVEL.has(tb);
  if(A&&B)return naLinha(hor,c,a)?'parede':'';
  if(A!==B){const t=A?ta:tb,o=A?tb:ta;if(o==='abismo')return t==='sala'?'parede':'';return t==='caverna'?'rocha':'parede';}
  return '';};
 const arestasH=new Map(),arestasV=new Map();
 for(let j=0;j<=gh;j++)for(let i=0;i<gw;i++){const k=classe(T(i,j-1),T(i,j),true,j*Q,i*Q);if(k&&!naAbertura(true,j*Q,i*Q)){if(!arestasH.has(j))arestasH.set(j,[]);arestasH.get(j).push({i,k});}}
 for(let i=0;i<=gw;i++)for(let j=0;j<gh;j++){const k=classe(T(i-1,j),T(i,j),false,i*Q,j*Q);if(k&&!naAbertura(false,i*Q,j*Q)){if(!arestasV.has(i))arestasV.set(i,[]);arestasV.get(i).push({j,k});}}
 let paredes=0,rochas=0;const luzes=[];
 const emitir=(hor,c,a0,a1,k)=>{
  if(k==='parede'){const t=ESPESSURA,rect=hor?{x:a0-t/2,y:c-t/2,w:a1-a0+t,h:t}:{x:c-t/2,y:a0-t/2,w:t,h:a1-a0+t};const e=forma(rect.x,rect.y,rect.w,rect.h,{fill:'#9fa4a6',nome:'Parede do complexo',bloq:true,material:'blindagem'});Object.assign(e,{pvMax:PAREDE.pv,pvAtual:PAREDE.pv,dureza:PAREDE.dureza,destrutivel:true});paredes++;
   // arandela (luz) no meio dos trechos de 3 m, do lado do chão
   if(a1-a0>=3&&r()<.75){const meio=(a0+a1)/2;const lado=hor?(T(Math.floor(meio/Q),Math.floor(c/Q))!=='solido'?1:-1):(T(Math.floor(c/Q),Math.floor(meio/Q))!=='solido'?1:-1);luzes.push(hor?{x:meio,y:c+lado*.35}:{x:c+lado*.35,y:meio});}
   return;}
  const L=a1-a0,q=Math.max(1,Math.round(L/1.6));
  for(let s=0;s<q;s++){const a=a0+L*(s+.5)/q,desl=(.3+r()*.25)*Q/1.5,sz=(1.2+r()*.7)*Q/1.5;const cx=hor?a:c+(T(Math.floor(c/Q),Math.floor(a/Q))==='caverna'?-desl:desl),cy=hor?c+(T(Math.floor(a/Q),Math.floor(c/Q))==='caverna'?-desl:desl):a;
   // v197: rocha orgânica — polígono irregular (8–12 vértices com jitter), base escura maior + topo com tom de pedra
   const n=8+Math.floor(r()*5),ini=r()*6.283,raw=[];
   for(let k=0;k<n;k++){const an=ini+k/n*6.283,j=.64+r()*.52;raw.push([cx+Math.cos(an)*sz*.66*j,cy+Math.sin(an)*sz*.52*j]);}
   const xs=raw.map(pt=>pt[0]),ys=raw.map(pt=>pt[1]);
   const bx=Math.min(...xs)-.2,by=Math.min(...ys)-.2,bw=Math.max(...xs)-Math.min(...xs)+.4,bh=Math.max(...ys)-Math.min(...ys)+.4;
   const moldar=(f,dx,dy)=>raw.map(([px,py])=>({x:+((cx+(px-cx)*f+dx)).toFixed(2),y:+((cy+(py-cy)*f+dy)).toFixed(2)}));
   const e1=forma(bx,by,bw,bh,{fill:'#211e19',nome:'Rocha da caverna',bloq:true,kind:'poligono',material:'rocha'});e1.pontos=moldar(1.16,.14,.2);
   const e2=forma(bx,by-.08,bw,bh,{fill:['#4a453c','#524c41','#423d35','#3b362f'][Math.floor(r()*4)],nome:'Rocha da caverna',bloq:false,kind:'poligono',material:'rocha'});e2.pontos=moldar(1,0,0);
   rochas++;}
 };
 const varrer=(mapa,hor)=>{for(const [linha,lista] of mapa){lista.sort((p,q)=>(p.i??p.j)-(q.i??q.j));let ini=null,fim=null,k='';const fecha=()=>{if(ini===null)return;const a0=ini*Q,a1=(fim+1)*Q;for(let a=a0;a<a1-1e-9;a+=3)emitir(hor,linha*Q,a,Math.min(a1,a+3),k);ini=null;};
  for(const e of lista){const p=e.i??e.j;if(ini!==null&&(p!==fim+1||e.k!==k))fecha();if(ini===null){ini=p;k=e.k;}fim=p;}fecha();}};
 varrer(arestasH,true);varrer(arestasV,false);
 // ---- portas (duas trancadas: reator e contenção), escadas, telhado da contenção (camada de cima)
 const portas=[],trancadas=[];
 for(const p of PORTAS_196){const cx=p.hor?(p.x+.5)*Q:p.x*Q,cy=p.hor?p.y*Q:(p.y+.5)*Q,rect=p.hor?{x:cx-(Q-ESPESSURA)/2,y:cy-ESPESSURA/2,w:Q-ESPESSURA,h:ESPESSURA}:{x:cx-ESPESSURA/2,y:cy-(Q-ESPESSURA)/2,w:ESPESSURA,h:Q-ESPESSURA};
  const o=push({...oPorta(rect,matDe(MAT_PAREDE),W,H),id:nid('porta'),nome:p.nome||'Porta do complexo',pvMax:PORTA.pv,pvAtual:PORTA.pv,dureza:PORTA.dureza,destrutivel:true,...(p.trancada?{estadoInterativo:{trancado:true,aberto:false,dificuldade:'padrao'}}:{})});portas.push(o.id);if(p.trancada)trancadas.push(o.id);}
 for(const e of ESCADAS_196)push({...oEscada({x:e.x*Q-e.w/2,y:e.y*Q-e.h/2,w:e.w,h:e.h},matDe('pedra-polida'),W,H,e.giro),id:nid('escada'),nome:e.nome});
 {const s=SALAS_196.find(z=>z.k===TELHADO_196);if(s)push({...oTeto({x:s.x*Q,y:s.y*Q,w:s.w*Q,h:s.h*Q},matDe('metal-ferrugem'),W,H,'g196'),id:nid('teto'),nome:'Telhado · '+s.nome});}
 // ---- luzes: arandelas nas paredes com poça de luz discreta; núcleo do reator em ciano; cristais e console em azul
 const arandelas=luzes.slice(0,22);
 for(const l of arandelas){if(banco.has('lampada'))peca('lampada',l.x,l.y,{nome:'Arandela luminária',w:.45,h:.45,camada:4,bloq:false,visao:false,pv:0});else push({id:nid('arandela'),nome:'Arandela luminária',tipo:'objeto',camada:4,bloqueiaMovimento:false,bloqueiaVisao:false,pvMax:0,pvAtual:0,dureza:0,destrutivel:false,material:'metal',angulo:0,imagem:svgArandela(),...N(l.x,l.y,.45,.45)});const e=forma(l.x-1.6,l.y-1.6,3.2,3.2,{fill:'#ffc777',nome:'Luz da arandela',camada:1,kind:'elipse',material:'nenhum',opacity:.08});e.fillOpacity=.08;}
 {const cx=18.5*Q,cy=5.8*Q;const e=forma(cx-2.2,cy-2.2,4.4,4.4,{fill:'#6fe7ff',nome:'Luz do núcleo',camada:1,kind:'elipse',material:'nenhum',opacity:.16});e.fillOpacity=.16;}
 for(const [x,y] of [[12.5*Q,3.5*Q],[10.6*Q,3.8*Q],[15.3*Q,3.7*Q]]){const e=forma(x-1.5,y-1.5,3,3,{fill:'#8fd0ff',nome:'Luz de pesquisa',camada:1,kind:'elipse',material:'nenhum',opacity:.1});e.fillOpacity=.1;}
 for(const [x,y] of [[19.3*Q,12.4*Q],[10.8*Q,12.6*Q]]){const e=forma(x-1.4,y-1.4,2.8,2.8,{fill:'#8fd0ff',nome:'Luz do cristal',camada:1,kind:'elipse',material:'nenhum',opacity:.12});e.fillOpacity=.12;}
 // ---- armadilhas, jaula de contenção, alavanca emperrada, mobília, itens soltos
 for(const a of ARMADILHAS_196){const Tt=ARMADILHAS[a.tipo],extra={opacity:.22,armadilhaV184:a.tipo,...(a.liberta?{libertaV186:a.liberta}:{})};
  if(banco.has('armadilha1'))peca('armadilha1',a.x*Q,a.y*Q,{nome:Tt.nome,w:1.2,h:1.2,camada:1,bloq:false,visao:false,pv:0,extra});
  else push({id:nid('armadilha'),nome:Tt.nome,tipo:'objeto',camada:1,bloqueiaMovimento:false,bloqueiaVisao:false,pvMax:0,pvAtual:0,dureza:0,destrutivel:false,material:'',angulo:0,imagem:svgArmadilha(),...N(a.x*Q,a.y*Q,1.2,1.2),...extra});}
 const jaulas=[];
 for(const j of JAULAS_196){const grades=[];let portaId=null;const jx=j.x*Q,jy=j.y*Q,jw=j.w*Q,jh=j.h*Q;
  j.lados.forEach((lado,i)=>{const t=ESPESSURA,rect=lado==='S'?{x:jx,y:jy+jh-t/2,w:jw,h:t}:lado==='N'?{x:jx,y:jy-t/2,w:jw,h:t}:lado==='E'?{x:jx+jw-t/2,y:jy,w:t,h:jh}:{x:jx-t/2,y:jy,w:t,h:jh};
   const g=peca('grade1',rect.x+rect.w/2,rect.y+rect.h/2,{nome:'Grade da contenção',w:rect.w,h:rect.h,camada:3,bloq:true,visao:false,pv:GRADE.pv,dureza:GRADE.dureza,material:'metal',extra:{jaulaV186:j.id,...(i===0?{portaJaulaV186:true}:{})}});grades.push(g.id);if(i===0)portaId=g.id;});
  let alavancaId=null;if(j.alavanca)alavancaId=push({id:nid('alavanca'),nome:j.alavanca.emperrada?'Alavanca emperrada':'Alavanca',tipo:'objeto',camada:2,bloqueiaMovimento:false,bloqueiaVisao:false,pvMax:0,pvAtual:0,dureza:0,destrutivel:false,material:'metal',angulo:0,imagem:svgAlavanca(false),alavancaV186:j.id,...(j.alavanca.emperrada?{emperradaV189:true}:{}),...N(j.alavanca.x*Q,j.alavanca.y*Q,.6,.9)}).id;
  jaulas.push({id:j.id,abre:j.abre,x:jx+jw/2,y:jy+jh/2,portaId,grades,alavancaId});}
 for(const [id,x,y,o] of MOBILIA_196)peca(id,x*Q,y*Q,o||{});
 for(const [id,nome,x,y,emoji] of ITENS_196){const en={uid:'preparo196_'+id,tipo:'item',idBanco:id,nome,imagem:svgItem(emoji)};push({id:nid('solto'),nome,tipo:'item',camada:1,bloqueiaMovimento:false,bloqueiaVisao:false,pvMax:0,pvAtual:0,dureza:0,destrutivel:false,material:'',angulo:0,imagem:en.imagem,itemSolto:en,preparoV191:true,...N(x*Q,y*Q,.6,.6)});}
 // ---- monstros (facção e lugar vêm da planta; o da jaula fica dentro dela)
 const monstros=MONSTROS_196.map(m=>({id:m.id,alternativas:m.alternativas||[],faccao:m.faccao||'inimigos',comportamento:m.comportamento||'',x:m.x*Q,y:m.y*Q,sala:(SALAS_196.findIndex(s=>m.x>=s.x&&m.x<s.x+s.w&&m.y>=s.y&&m.y<s.y+s.h)+1)||0}));
 for(const j of jaulas){const J=JAULAS_196.find(x=>x.id===j.id);monstros.push({id:J.monstro.id,alternativas:J.monstro.alternativas||[],faccao:J.monstro.faccao,comportamento:'',x:j.x,y:j.y,jaula:j.id});}
 const state={w:W,h:H,ppm:40,bg:'#101114',texture:'masmorra',showGrid:false,grid:'#2c2823',name:NOME_MAPA_196,formatoObjetos:'refs-v1',elements:els,estiloV129:'feudal',complexoV196:true,geradoV110:{tipo:'caverna',semente,variante:'complexo-v196'}};
 return {state,objects:objs.map(o=>normalizarObjeto(o)),entrada:{...ENTRADA_196},salas:SALAS_196.map((s,i)=>({k:i+1,nome:s.nome,x:(s.x+s.w/2)*Q,y:(s.y+s.h/2)*Q})),monstros,armadilhas:ARMADILHAS_196.map(a=>({tipo:a.tipo,x:a.x*Q,y:a.y*Q,liberta:a.liberta||''})),pedras:[],paredes,rochas,luzes:arandelas.length,
  jaulas,portas,trancadas,porta:trancadas[0]||null,andavel:R.andavel,em:R.em};
}

// ------------------------------------------------------------ armadilhas, jaulas e reconstrução (regras puras)
const campo=(o,k)=>o?.[k]??o?.oficinaElement?.[k];
export const ehArmadilha=o=>!!campo(o,'armadilhaV184')||/^armadilha de/i.test(String(o?.nome||''));
export const tipoArmadilha=o=>ARMADILHAS[campo(o,'armadilhaV184')]?campo(o,'armadilhaV184'):(/l[âa]mina/i.test(String(o?.nome||''))?'laminas':'estacas');
export const armada=(o,agora=Date.now())=>!(Number(campo(o,'disparadaV184')||0)>agora-REARMAR_MS);
export function dentroDe(t,o,W=28,H=14){const dx=Math.abs((Number(t.x)-Number(o.x))*W/28),dy=Math.abs((Number(t.y)-Number(o.y))*H/14);return dx<=(Number(o.larguraM)||1)/2&&dy<=(Number(o.alturaM)||1)/2;}
// Quem pisa testa Esquiva (−10 nas lâminas); fiasco = dano dobrado.
export function resolverArmadilha(tipo,esquiva,die){
 const T=ARMADILHAS[tipo]||ARMADILHAS.estacas,chance=Math.max(5,Math.min(95,Math.round(Number(esquiva)||0)-T.penal)),r=classificarTeste(chance,die);
 return {tipo,nome:T.nome,icone:T.icone,chance,die,grau:r.grau,evitou:r.sucesso,dano:T.dano,fator:r.grau==='Fiasco'?2:1};
}
// Abre a(s) grade(s)-portão de uma jaula: deixa passar, fica translúcida.
export function abrirJaula(objs,jid){return (objs||[]).map(o=>o.jaulaV186===jid&&o.portaJaulaV186&&!o.abertaV186?{...o,bloqueiaMovimento:false,opacity:.35,abertaV186:true,nome:String(o.nome||'Grade').replace(/ \(aberta\)$/,'')+' (aberta)'}:o);}
export const jaulaFechada=(objs,jid)=>(objs||[]).some(o=>o.jaulaV186===jid&&o.portaJaulaV186&&!o.abertaV186&&!o.destruido);
// Reconstruir: sucesso devolve metade dos PV (e o bloqueio), crítico devolve tudo; falha não muda nada.
export function reconstruir(o,grau){
 if(!o?.destrutivel||!(Number(o.pvMax)>0))throw Error('Isto não dá para reconstruir.');
 const pvMax=Number(o.pvMax),atual=o.destruido?0:Number(o.pvAtual??pvMax);
 if(!o.destruido&&atual>=pvMax)throw Error('Já está inteiro.');
 if(grau!=='Sucesso'&&grau!=='Crítico')return {object:o,ganho:0,grau};
 const base=o.destruido?restaurarObjeto(o):{...o},alvo=grau==='Crítico'?pvMax:Math.min(pvMax,atual+Math.ceil(pvMax/2));
 return {object:{...base,pvAtual:alvo,destruido:false},ganho:alvo-atual,grau};
}
// Kael Teste: completa o inventário com o que falta para testar tudo (sem duplicar).
export function completarKael(ficha,itens=[],novoItem=it=>({...it,idBanco:it.id})){
 const inv=clean(ficha?.inventario||{});for(const k of ['equipado','bolso','mochila'])inv[k]=Array.isArray(inv[k])?inv[k]:[];
 while(inv.equipado.length<12)inv.equipado.push(null);while(inv.mochila.length<20)inv.mochila.push(null);
 const tem=id=>['equipado','bolso','mochila'].some(k=>inv[k].some(i=>i&&String(i.idBanco||i.id||'')===id));
 const adicionados=[];
 for(const [comp,id] of ITENS_KAEL){if(tem(id))continue;const m=itens.find(i=>String(i.id)===id);if(!m)continue;let ix=inv[comp].findIndex(s=>!s);if(ix<0){if(comp==='equipado')continue;ix=inv[comp].length;}inv[comp][ix]=novoItem(m);adicionados.push(id);}
 return adicionados.length?{inventario:inv,adicionados}:null;
}
// miniatura e tamanho de um monstro do banco (miniatura pronta do jogo quando a ficha não tem imagem)
export function miniaturaDe(modelo){
 const url=String(modelo?.miniatura?.url||modelo?.imagem||'');if(url)return url;
 try{return svgParaDataUrl(renderizarMiniatura(specDeCriatura(modelo||{})))+MARCA_MINI;}catch(_){return '';}
}
export const modeloDe=(criaturas,m)=>[m.id,...(m.alternativas||[])].map(id=>(criaturas||[]).find(c=>String(c.id)===id)).find(Boolean)||null;

// ------------------------------------------------------------ instalação (navegador)
export function instalarMasmorra(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const uid=()=>{try{return String(dep.uid?.()||'');}catch(_){return '';}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const dado=()=>1+Math.floor(Math.random()*100);
 let seq=0;const novoId=()=>Date.now().toString(36)+(++seq).toString(36); // sem Math.random: só os dados usam o acaso
 let saude=null,mapa=null,cena=null,parar=[],assinado='',camada=null,botao=null,pop=null,feito=false,rodando=false,tentativas=0,previaFeita=false,previaStatus='',previaAvisada='';
 const processados=new Set(),dentro=new Set(),percebido=new Set(),ultimaRec=new Map();
 const dims=()=>({W:Number(mapa?.larguraM)||28,H:Number(mapa?.alturaM)||14});
 const nomeDe=t=>String(t?.nome||'Alguém').replace(/^(NPC|Monstro|PJ|PM)\s*[·:-]\s*/i,'');
 const toast=(t,ms=9000)=>{const n=root.createElement('div');n.textContent=t;n.style.cssText='position:fixed;left:16px;bottom:150px;z-index:9999;background:#1d1a2a;border:1px solid #c9a0ff;color:#efe6ff;padding:9px 14px;border-radius:12px;font:600 13px Segoe UI,Arial,sans-serif;max-width:560px';root.body.append(n);setTimeout(()=>n.remove(),ms);};
 const avisaPrevia=()=>{if(previaStatus&&previaStatus!==previaAvisada&&previaStatus!=='ok'){previaAvisada=previaStatus;toast('🗺️ Prévia v194: '+previaStatus,20000);}};
 const CSS=`#maCamada{position:absolute;inset:0;pointer-events:none;z-index:13}
#maCamada .ma-ic{position:absolute;transform:translate(-50%,-50%);width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-size:14px;line-height:1;background:rgba(10,18,32,.84);border:1.5px solid #ffd447;pointer-events:auto;cursor:pointer;padding:0;color:#fff;opacity:.9}
#maCamada .ma-ic:hover{opacity:1;box-shadow:0 0 10px #ffd447}
#maCamada .ma-al{border-color:#8ee7ff}
#mmBotao{position:fixed;left:16px;bottom:216px;z-index:9998;width:34px;height:34px;border-radius:50%;border:1px solid #c9a0ff;background:#1d1a2a;color:#efe6ff;font-size:17px;cursor:pointer;padding:0}
#mmPop{position:fixed;left:58px;bottom:208px;z-index:9999;display:flex;flex-direction:column;gap:6px;padding:10px;border-radius:12px;background:#1d1a2a;border:1px solid #c9a0ff;color:#efe6ff;font:600 12px Segoe UI,Arial,sans-serif;min-width:260px}
#mmPop[hidden]{display:none}
#mmPop button{height:30px;border-radius:8px;border:1px solid #c9a0ff;background:#2a2440;color:#efe6ff;cursor:pointer;font:600 12px Segoe UI,Arial,sans-serif;text-align:left;padding:0 10px}
#mmPop button:disabled{opacity:.5;cursor:wait}`;
 if(!root.getElementById('mmCss')){const st=root.createElement('style');st.id='mmCss';st.textContent=CSS;root.head.append(st);}
 function ator(){const c=ctl();try{const t=c?.ator?.();return t&&c.controla?.(t)?t:null;}catch(_){return null;}}
 const cenaAqui=()=>cena&&mapa&&String(cena.mapId||'')===String(mapa.mapId||'')?cena:null;

 // ------------------------------------------------------------ montar uma vez (mestre)
 async function salvarMapa(g){
  const api=win.mesaMapasV110_;let cenaFinal=null;
  await api.salvar({id:ID_MASMORRA,nome:NOME_MASMORRA,state:g.state,cenaDe:mid=>{const c=cenaMasmorra(g,mid);cenaFinal=c;return JSON.stringify(c).length<=LIMITE_CENA?c:null;}});
  await dep.setDoc(D('mapas/'+ID_MASMORRA),{masmorraV184:{em:new Date().toISOString(),semente:184,versao:195}},{merge:true});
  return cenaFinal;
 }
 // v194: publica UMA VEZ um mapa separado com a arte nova, para comparar com a de treino sem apagar nada.
 async function publicarPrevia(){
  if(previaFeita)return;
  const flag=D('configuracoes/masmorraV194Previa');
  let erroAnterior='';
  try{const f=await dep.getDoc(flag);if(f.exists()&&!f.data()?.erro&&Number(f.data()?.versao||0)>=195){previaFeita=true;previaStatus='ok — “'+NOME_PREVIA_194+'” está na lista de Mapas';return;}erroAnterior=f.exists()?String(f.data()?.erro||''):'';}catch(_){previaStatus='sem acesso à marca de status (rede?)';avisaPrevia();return;}
  const api=win.mesaMapasV110_;
  if(!api?.salvar){previaStatus='gerador de mapas ainda não carregou — tentando de novo…';avisaPrevia();return;}
  if(!(dep.mapas?.()||[]).length){previaStatus='lista de mapas ainda não carregou — tentando…';return;}
  previaFeita=true;
  previaStatus=erroAnterior?('a criação falhou da última vez ('+erroAnterior+'); tentando de novo…'):'criando o mapa…';
  avisaPrevia();
  try{
   const g=gerarMasmorra({objetos:dep.objetos?.()||[]});
   await api.salvar({id:ID_PREVIA_194,nome:NOME_PREVIA_194,state:g.state,cenaDe:mid=>{const c=cenaMasmorra(g,mid);return JSON.stringify(c).length<=LIMITE_CENA?c:null;}});
   await dep.setDoc(flag,{em:new Date().toISOString(),versao:195});
   previaStatus='ok — “'+NOME_PREVIA_194+'” está na lista de Mapas';
   toast('🗺️ Mapa atualizado na lista de Mapas: “'+NOME_PREVIA_194+'” — a masmorra com a arte v195 para você comparar. Pode apagar quando quiser.',18000);
  }catch(e){console.warn('[Masmorra] prévia',e);const msg=String(e?.message||e);previaStatus='falhou: '+msg;avisaPrevia();try{await dep.setDoc(flag,{em:new Date().toISOString(),erro:msg},{merge:true});}catch(_){}}
 }
 // v196: publica UMA VEZ o mapa autoral do Kimi (Núcleo Subterrâneo), com criaturas em facções,
 // iluminação escura + névoa de guerra. Não toca a Masmorra de treino nem a prévia v194.
 let feito196=false,rodando196=false,status196='',avisado196='';
 const avisa196=()=>{if(status196&&status196!==avisado196&&status196!=='ok'){avisado196=status196;toast('🛰️ Núcleo v196: '+status196,20000);}};
 async function povoar196(g){
  const criaturas=dep.criaturas?.()||[],todos=ctl()?.todosTokens?.()||[],postos=[],faccoes={},comportamento={};
  for(const m of g.monstros){const modelo=modeloDe(criaturas,m);if(!modelo)continue;
   const base='synccriatura:'+modelo.id;let id=base;for(let k=2;todos.some(t=>decodeURIComponent(String(t.id))===id)||postos.includes(id);k++)id=base+'~'+k;
   const p=metros(m.x,m.y),enc=encodeURIComponent(id);
   await dep.setDoc(D(POS+'/'+enc),clean({nome:String(modelo.nome||modelo.id)+(id.includes('~')?' '+id.split('~')[1]:''),imagem:miniaturaDe(modelo),donoUid:'',x:p.x,y:p.y,revision:0,facing:Math.PI,camada:3,mapaId:ID_MAPA_196,diametroM:tamanhoMiniaturaM(modelo)}));
   postos.push(id);faccoes[enc]=m.faccao||'inimigos';if(m.comportamento)comportamento[enc]=m.comportamento;}
  if(postos.length)try{await dep.runTransaction(dep.db,async tx=>{const s=await tx.get(D(ESTADO_RT));const d=s.exists()?s.data():{};tx.set(D(ESTADO_RT),clean({...d,faccoes:{...(d.faccoes||{}),...faccoes},...(Object.keys(comportamento).length?{comportamento:{...(d.comportamento||{}),...comportamento}}:{}),atualizadoEm:Date.now()}));});}catch(e){console.warn('[Núcleo v196] facções',e);}
  return postos.length;
 }
 async function publicar196(){
  if(feito196||rodando196||!ehMestre())return;
  const flag=D(FLAG_196);
  try{const f=await dep.getDoc(flag);if(f.exists()&&!f.data()?.erro&&Number(f.data()?.versao||0)>=196){feito196=true;status196='ok — “'+NOME_MAPA_196+'” está na lista de Mapas';return;}}catch(_){status196='sem acesso à marca de status (rede?)';avisa196();return;}
  const api=win.mesaMapasV110_;
  if(!api?.salvar){status196='gerador de mapas ainda não carregou — tentando de novo…';avisa196();return;}
  if(!(dep.mapas?.()||[]).length){status196='lista de mapas ainda não carregou — tentando…';return;}
  if(!(dep.criaturas?.()||[]).length){status196='lista de criaturas ainda não carregou — tentando…';return;}
  rodando196=true;status196='criando o mapa…';avisa196();
  try{
   const g=gerarComplexo196({objetos:dep.objetos?.()||[]});
   await api.salvar({id:ID_MAPA_196,nome:NOME_MAPA_196,state:g.state,cenaDe:mid=>{const c=cenaMasmorra(g,mid);return JSON.stringify(c).length<=LIMITE_CENA?c:null;}});
   // iluminação escura + névoa de guerra + abrigo de edifício sólido (painel 🎨 do mestre pode mudar depois)
   try{await dep.setDoc(D('combatesAtivos/mesaVisual_'+encodeURIComponent(ID_MAPA_196)),{ambiente:'escuro',nevoa:true,clima:'nenhum',intensidadeClima:1,luzPersonagens:4,abrigo:3,perigo:null,mapaId:ID_MAPA_196,atualizadoEm:new Date().toISOString()});}catch(e){console.warn('[Núcleo v196] visual',e);}
   const n=await povoar196(g);
   await dep.setDoc(flag,{em:new Date().toISOString(),versao:196,feitos:['mapa publicado ('+g.paredes+' paredes, '+g.rochas+' rochas, '+g.armadilhas.length+' armadilhas, 8 portas, 2 trancadas)',n+' criaturas em facções (neutras até serem atacadas)']});
   feito196=true;status196='ok — “'+NOME_MAPA_196+'” está na lista de Mapas';
   toast('🛰️ “'+NOME_MAPA_196+'” publicado na lista de Mapas ('+n+' criaturas). Iluminação escura + névoa ligadas; ajuste no painel 🎨 se quiser.',20000);
  }catch(e){console.warn('[Núcleo v196]',e);const msg=String(e?.message||e);status196='falhou: '+msg;avisa196();try{await dep.setDoc(flag,{em:new Date().toISOString(),erro:msg},{merge:true});}catch(_){}}
  finally{rodando196=false;}
 }
 async function colocarMonstros(g){
  const criaturas=dep.criaturas?.()||[],todos=ctl()?.todosTokens?.()||[],postos=[],faccoes={},comportamento={};
  for(const m of g.monstros){const modelo=modeloDe(criaturas,m);if(!modelo)continue;
   const base='synccriatura:'+modelo.id;let id=base;for(let k=2;todos.some(t=>decodeURIComponent(String(t.id))===id)||postos.includes(id);k++)id=base+'~'+k;
   const p=metros(m.x,m.y),enc=encodeURIComponent(id);
   await dep.setDoc(D(POS+'/'+enc),clean({nome:String(modelo.nome||modelo.id)+(id.includes('~')?' '+id.split('~')[1]:''),imagem:miniaturaDe(modelo),donoUid:'',x:p.x,y:p.y,revision:0,facing:Math.PI,camada:3,mapaId:ID_MASMORRA,diametroM:tamanhoMiniaturaM(modelo)}));
   postos.push(id);faccoes[enc]=m.faccao||'inimigos';if(m.comportamento)comportamento[enc]=m.comportamento;}
  // facções e jeito de lutar ficam no estado do tempo real (valem quando o mestre ligar o ⚡)
  if(postos.length)try{await dep.setDoc(D(ESTADO_RT),clean({faccoes,...(Object.keys(comportamento).length?{comportamento}:{}),atualizadoEm:Date.now()}),{merge:true});}catch(e){console.warn('[Masmorra] facções',e);}
  return postos.length;
 }
 async function removerMonstros(){
  const toks=(ctl()?.todosTokens?.()||[]).filter(t=>String(t.mapaId||'')===ID_MASMORRA&&decodeURIComponent(String(t.id)).startsWith('synccriatura:'));
  for(const t of toks)try{await dep.deleteDoc(D(POS+'/'+t.id));}catch(e){console.warn('[Masmorra] remover',e);}
  if(toks.length)try{await dep.runTransaction(dep.db,async tx=>{const s=await tx.get(D(HEALTH));if(!s.exists())return;const hp=s.data(),actors={...(hp.actors||{})};for(const t of toks)delete actors[t.id];tx.set(D(HEALTH),clean({...hp,actors,revision:Number(hp.revision||0)+1}));});}catch(e){console.warn('[Masmorra] saúde',e);}
  return toks.length;
 }
 async function completarTeste(){
  const c=await win.criarPersonagemTesteV138_?.();if(!c)return null;
  const patch=completarKael(c,dep.itens?.()||[],dep.novoItem||(it=>({...it,idBanco:it.id})));if(!patch)return null;
  await dep.setDoc(D('personagens/'+ID_TESTE),clean({inventario:patch.inventario}),{merge:true});
  const loc=(dep.personagens?.()||[]).find(x=>String(x.id)===ID_TESTE);if(loc)loc.inventario=patch.inventario;
  return patch.adicionados;
 }
 async function irParaMasmorra(){
  const c=await win.criarPersonagemTesteV138_?.();if(!c)return false;
  const g=gerarMasmorra({objetos:dep.objetos?.()||[]}),e=metros(g.entrada.x,g.entrada.y),ref=D(POS+'/'+encodeURIComponent(ID_TESTE));
  let objs=g.objects;try{const s=await dep.getDoc(D('combatesAtivos/mapaMesaSyncCena_'+ID_MASMORRA));if(s.exists())objs=s.data().objects||objs;}catch(_){}
  const p=livrePerto(objs,e.x,e.y,W,H,.6);
  await dep.runTransaction(dep.db,async tx=>{const s=await tx.get(ref),v=s.exists()?s.data():null;
   tx.set(ref,clean({...(v||{nome:c.nome||'Kael Teste',imagem:String(c.miniatura?.url||c.imagem||''),donoUid:String(c.dono||uid()),facing:0,camada:3,diametroM:1}),x:+p.x.toFixed(3),y:+p.y.toFixed(3),mapaId:ID_MASMORRA,revision:v?Number(v.revision||0)+1:0}));});
  await dep.setDoc(D('personagens/'+ID_TESTE),{localizacaoMapaId:ID_MASMORRA,localizacaoMapaDefinidaV92:true,localizacaoCenarioId:''},{merge:true});
  if(ehMestre()&&String(ctl()?.mapaAtual?.()||'')!==ID_MASMORRA)try{await ctl()?.openMap?.(ID_MASMORRA);}catch(e){console.warn('[Masmorra] abrir mapa',e);}
  return true;
 }
 async function reiniciar(){
  const g=gerarMasmorra({objetos:dep.objetos?.()||[]});
  await removerMonstros();await salvarMapa(g);const n=await colocarMonstros(g);await irParaMasmorra();
  dentro.clear();percebido.clear();
  try{if(String(ctl()?.mapaAtual?.()||'')===ID_MASMORRA)ctl()?.refreshView?.();}catch(_){}
  return n;
 }
 async function montar(){
  if(feito||rodando||!ehMestre())return;
  const api=win.mesaMapasV110_;
  if(!api?.salvar||!(dep.mapas?.()||[]).length||!(dep.criaturas?.()||[]).length||!ctl()?.todosTokens)return;
  const flag=D('configuracoes/masmorraV184');
  try{const f=await dep.getDoc(flag);if(f.exists()){feito=true;if(Number(f.data()?.versao||0)<195&&!f.data()?.erro){/* v195: refaz a masmorra com a arte v195 (uma vez) */feito=false;rodando=true;try{const n=await reiniciar();await dep.setDoc(flag,{em:new Date().toISOString(),versao:195,feitos:['masmorra refeita na v195: paredes grossas de pedra clara com sombra no piso, lajotas com variação por tile, caverna e abismo mais escuros, vinheta nas bordas',n+' monstros']},{merge:true});toast('🏰 Masmorra de treino refeita (v195): paredes grossas de pedra clara, lajotas com variação, caverna mais escura, vinheta nas bordas.',14000);}catch(e){console.warn('[Masmorra] v195',e);await dep.setDoc(flag,{versao:195,erro:String(e?.message||e)},{merge:true});}finally{feito=true;rodando=false;}}return;}}catch(_){return;}
  if(++tentativas>2){feito=true;return;}
  rodando=true;const feitos=[];
  try{
   const g=gerarMasmorra({objetos:dep.objetos?.()||[]});
   await salvarMapa(g);feitos.push(`mapa “${NOME_MASMORRA}” (42×20 m: ${g.paredes} blocos de parede, ${g.pedras.length} pedras, ${g.armadilhas.length} armadilhas, ${g.jaulas.length} jaulas)`);
   const n=await colocarMonstros(g);if(n)feitos.push(n+' monstros em facções diferentes');
   try{const ad=await completarTeste();if(ad?.length)feitos.push('Kael Teste recebeu '+ad.join(', '));}catch(e){console.warn('[Masmorra] Kael',e);}
   await dep.setDoc(flag,{em:new Date().toISOString(),versao:195,feitos});feito=true;
   toast('🏰 Masmorra de treino pronta: '+feitos.join(' · ')+'. Use o botão 🏰 para levar o Kael até lá.',14000);
  }catch(e){console.warn('[Masmorra]',e);try{await dep.setDoc(flag,{em:new Date().toISOString(),versao:195,feitos,erro:String(e?.message||e)});feito=true;}catch(_){}}
  finally{rodando=false;}
 }

 // ------------------------------------------------------------ armadilhas (mestre)
 async function gravar(f){ // altera saúde, cena e histórico numa transação só
  await dep.runTransaction(dep.db,async tx=>{
   const [sh,sc,shi]=await Promise.all([tx.get(D(HEALTH)),tx.get(D(SCENE)),tx.get(D(HIST))]);
   const hp=sh.exists()?sh.data():{actors:{},revision:0},cn=sc.exists()?sc.data():null,hh=shi.exists()?shi.data():{entries:[],revision:0};
   const r=f({hp,cn})||{};
   if(r.hp)tx.set(D(HEALTH),clean({...r.hp,revision:Number(hp.revision||0)+1}));
   if(r.cn)tx.set(D(SCENE),clean({...r.cn,editorRevision:Number(cn?.editorRevision||0)+1}));
   if(r.msg)tx.set(D(HIST),clean({entries:[...(hh.entries||[]),{id:'mm:'+novoId(),ts:Date.now(),actorUid:'',targetUid:'',message:r.msg}].slice(-120),revision:Number(hh.revision||0)+1}));
  });
 }
 const cenaDoMapa=cn=>cn&&String(cn.mapId||'')===String(mapa?.mapId||'');
 async function disparar(t,o){
  const tipo=tipoArmadilha(o);
  if(campo(o,'reveladaV184')&&t.donoUid){let atl=0;try{atl=Number(await dep.pericia?.(t,['atletismo']))||0;}catch(_){}const die=dado(),g=classificarTeste(atl,die);
   if(g.sucesso){await gravar(()=>({msg:`🤸 ${nomeDe(t)} salta por cima da ${(ARMADILHAS[tipo]||ARMADILHAS.estacas).nome.toLowerCase()} · Atletismo ${die}/${Math.round(atl)} → ${g.grau}.`}));return;}
   await gravar(()=>({msg:`🤸 ${nomeDe(t)} tenta saltar a ${(ARMADILHAS[tipo]||ARMADILHAS.estacas).nome.toLowerCase()} · Atletismo ${die}/${Math.round(atl)} → ${g.grau} · cai em cima dela!`}));}
  let esquiva=0;try{esquiva=Number(await dep.pericia?.(t,['esquiva']))||0;}catch(_){}
  const r=resolverArmadilha(tipo,esquiva,dado());
  let res=null;if(!r.evitou)try{res=await dep.atingir(t,saude?.actors?.[t.id],mapa,{dano:r.dano,nome:r.nome,ignorarArmadura:false,fator:r.fator});}catch(e){console.warn('[Masmorra] dano',e);}
  const local=res?.dano?.local||res?.dano?.localizacao||res?.dano?.hitLocation||'';
  const jid=o.libertaV186||o.oficinaElement?.libertaV186||'';
  await gravar(({hp,cn})=>{
   const abre=jid&&cenaDoMapa(cn)&&jaulaFechada(cn.objects,jid);
   const out={msg:`${r.icone} ${nomeDe(t)} pisa numa ${r.nome.toLowerCase()} · Esquiva ${r.die}/${r.chance} → ${r.grau}`+(r.evitou?' · desvia a tempo':` · ${res?`dano ${res.total}${local?' ('+local+')':''}`:'sem dano'}${r.fator>1?' · dano dobrado':''}`)+(abre?' · 🔓 um mecanismo range: uma jaula se abre!':'')};
   if(res?.combateLab){const a={...(hp.actors?.[t.id]||{}),combateLab:res.combateLab};out.hp={...hp,actors:{...(hp.actors||{}),[t.id]:a}};}
   if(cenaDoMapa(cn)){let objs=(cn.objects||[]).map(x=>x.id===o.id?{...x,opacity:.9,reveladaV184:true,disparadaV184:Date.now()}:x);if(abre)objs=abrirJaula(objs,jid);out.cn={...cn,objects:objs};}
   return out;});
 }
 async function revelar(t,o){
  let per=0;try{per=Number(await dep.pericia?.(t,['percepção','percepcao']))||0;}catch(_){}
  const die=dado(),r=classificarTeste(per,die);if(!r.sucesso)return;
  await gravar(({cn})=>cenaDoMapa(cn)?{msg:`👁️ ${nomeDe(t)} percebe uma ${String(o.nome||'armadilha').toLowerCase()} no chão (Percepção ${die}/${Math.round(per)}).`,cn:{...cn,objects:(cn.objects||[]).map(x=>x.id===o.id?{...x,opacity:.85,reveladaV184:true}:x)}}:null);
 }
 let vigiando=false;
 async function vigiarArmadilhas(){
  if(vigiando||!ehMestre())return;const cn=cenaAqui();if(!cn)return;
  const traps=(cn.objects||[]).filter(ehArmadilha);if(!traps.length)return;
  const {W:w,H:h}=dims(),agora=Date.now();vigiando=true;
  try{
   for(const t of (ctl()?.tokensNoMapa?.()||[])){const a=saude?.actors?.[t.id];if(a?.combateLab?.morto||a?.combateLab?.inconsciente)continue;
    for(const o of traps){const k=t.id+'|'+o.id,esta=dentroDe(t,o,w,h);
     if(esta&&!dentro.has(k)){dentro.add(k);if(armada(o,agora))await disparar(t,o);}
     else if(!esta){dentro.delete(k);
      if(t.donoUid&&!campo(o,'reveladaV184')&&!percebido.has(k)&&distanciaObjeto(t,o,mapa)<=1.6){percebido.add(k);await revelar(t,o);}}}}
  }catch(e){console.warn('[Masmorra] armadilhas',e);}finally{vigiando=false;}
 }

 // ------------------------------------------------------------ 🔥 lava (mestre): queimadura por contato, perigo crescente, altura de voo (v205)
 const lavaEstado=new Map();let lavando=false;
 async function queimar(t,c,fator){
  let res=null;try{res=await dep.atingir(t,saude?.actors?.[t.id],mapa,{dano:c.dano,nome:c.calor?'calor da lava':'lava',ignorarArmadura:false,fator});}catch(e){console.warn('[Lava] dano',e);}
  const local=res?.dano?.local||res?.dano?.localizacao||res?.dano?.hitLocation||'';
  await gravar(({hp})=>{
   const out={msg:`🔥 ${nomeDe(t)} ${c.calor?'sofre o calor da lava':c.tipo==='nucleo'?'afunda no núcleo da lava':'queima na lava'} · ${res?`dano ${res.total}${local?' ('+local+')':''}`:'sem dano'}${fator>1?` · perigo crescente ×${fator}`:''}`};
   if(res?.combateLab){const a={...(hp.actors?.[t.id]||{}),combateLab:res.combateLab};out.hp={...hp,actors:{...(hp.actors||{}),[t.id]:a}};}
   return out;});
 }
 async function vigiarLava(){
  if(lavando||!ehMestre())return;const cn=cenaAqui();if(!cn)return;
  const {W:w,H:h}=dims(),zonas=zonasDeLava(cn.objects||[],w,h);if(!zonas.length){lavaEstado.clear();return;}
  const suportes=suportesDeLava(cn.objects||[],w,h),agora=Date.now();lavando=true;
  try{
   for(const t of (ctl()?.tokensNoMapa?.()||[])){
    const a=saude?.actors?.[t.id];if(a?.combateLab?.morto||t.imuneLavaV205)continue;
    const p={x:Number(t.x)*w/28,y:Number(t.y)*h/14},alt=Number(globalThis.mesaEspacoV205?.altitudePes?.(t))||0,nivel=Number(globalThis.mesaAndarV144?.doToken?.(t.id))||1;
    const c=contatoComLava(p,zonas,suportes,alt,nivel),est=lavaEstado.get(t.id)||{ticks:0,ult:0};
    if(!c){if(est.ticks)lavaEstado.set(t.id,{ticks:0,ult:0});continue;}
    if(agora-est.ult<LAVA_INTERVALO_MS)continue; // uma queimadura por intervalo e por personagem, só aqui (o mestre), nunca por cliente
    const ticks=est.ticks+1;lavaEstado.set(t.id,{ticks,ult:agora});await queimar(t,c,fatorDeEscalada(ticks));
   }
  }catch(e){console.warn('[Lava]',e);}finally{lavando=false;}
 }

 // ------------------------------------------------------------ 🧱 reconstruir e 🕹️ alavanca
 const quebrado=o=>o?.destrutivel&&Number(o.pvMax)>0&&!ehArmadilha(o)&&(o.destruido||Number(o.pvAtual??o.pvMax)<Number(o.pvMax));
 const alavancaLivre=o=>!!o?.alavancaV186&&!o.puxadaV186;
 function desenhar(){
  const b=root.getElementById('novaSyncBoard');if(!b)return;
  if(!camada||camada.parentElement!==b){camada?.remove();camada=root.createElement('div');camada.id='maCamada';camada.addEventListener('pointerdown',e=>e.stopPropagation());camada.addEventListener('click',e=>{const bt=e.target.closest('button[data-rec],button[data-alavanca]');if(!bt)return;if(bt.dataset.rec)void pedir(bt.dataset.rec,'reconstruir');else void pedir(bt.dataset.alavanca,'alavanca');});b.append(camada);}
  const a=ator(),cn=cenaAqui();let h='';
  const esc=s=>String(s||'').replace(/"/g,'&quot;');
  if(a&&cn)for(const o of (cn.objects||[])){const perto=distanciaObjeto(a,o,mapa)<=ALCANCE_RECONSTRUIR;if(!perto)continue;
   if(quebrado(o))h+=`<button type="button" class="ma-ic" data-rec="${esc(o.id)}" style="left:${Number(o.x)/28*100}%;top:${Number(o.y)/14*100}%" title="🧱 Reconstruir ${esc(o.nome||'objeto')} (PV ${o.destruido?0:Number(o.pvAtual??0)}/${Number(o.pvMax)}) · teste de Engenharia, Mecânica ou Mineração">🧱</button>`;
   else if(alavancaLivre(o))h+=`<button type="button" class="ma-ic ma-al" data-alavanca="${esc(o.id)}" style="left:${Number(o.x)/28*100}%;top:${Number(o.y)/14*100}%" title="🕹️ Puxar a alavanca">🕹️</button>`;}
  if(camada.dataset.h!==h){camada.innerHTML=h;camada.dataset.h=h;}
 }
 async function pedir(objId,tipo='reconstruir'){
  const a=ator();if(!a||!objId)return;
  const cmd={donoUid:uid(),personagemId:decodeURIComponent(String(a.id)),objId:String(objId),tipo,criadoEm:Date.now()};
  if(ehMestre())await aplicar('local'+novoId(),cmd);else await dep.setDoc(D(PEDIDOS+'/p'+novoId()),cmd);
 }
 async function aplicar(pid,cmd){
  if(processados.has(pid))return;processados.add(pid);
  try{
   const id=encodeURIComponent(String(cmd.personagemId||'')),t=ctl()?.token?.(id)||(ctl()?.todosTokens?.()||[]).find(x=>x.id===id);if(!t)throw Error('Personagem não está no mapa.');
   if(!String(pid).startsWith('local')&&String(t.donoUid||'')!==String(cmd.donoUid||''))throw Error('Pedido de quem não controla o personagem.');
   const cn=cenaAqui(),o=(cn?.objects||[]).find(x=>String(x.id)===String(cmd.objId));if(!o)throw Error('Objeto não está neste mapa.');
   if(distanciaObjeto(t,o,mapa)>ALCANCE_RECONSTRUIR+.3)throw Error('Longe demais.');
   const st=saude?.actors?.[t.id]?.combateLab;if(st?.morto||st?.inconsciente)throw Error('Inconsciente.');
   if(cmd.tipo==='alavanca'){
    if(!alavancaLivre(o))throw Error('Esta alavanca já foi puxada.');const jid=o.alavancaV186;
    if(o.emperradaV189){let valor=0,usada='';for(const nomes of [['força bruta','forca bruta'],['mecanismos']]){let v=0;try{v=Number(await dep.pericia?.(t,nomes))||0;}catch(_){}if(v>valor){valor=v;usada=nomes[0];}}
     const die=dado(),g=classificarTeste(valor,die);
     if(!g.sucesso){await gravar(({cn:c2})=>cenaDoMapa(c2)?{msg:`🕹️ ${nomeDe(t)} força a alavanca emperrada · ${usada?usada[0].toUpperCase()+usada.slice(1):'perícia'} ${die}/${Math.round(valor)} → ${g.grau} · não se mexe.`}:null);try{win.mesaTempoRealV111?.atrasar?.(t.id,1);}catch(_){}return;}
     await gravar(({cn:c2})=>cenaDoMapa(c2)?{msg:`🕹️ ${nomeDe(t)} destrava a alavanca emperrada · ${usada?usada[0].toUpperCase()+usada.slice(1):'perícia'} ${die}/${Math.round(valor)} → ${g.grau}`+(jaulaFechada(c2.objects,jid)?' · 🔓 a cela se abre!':'.'),cn:{...c2,objects:abrirJaula(c2.objects,jid).map(x=>x.id===o.id?{...x,emperradaV189:false,puxadaV186:true,imagem:svgAlavanca(true),nome:'Alavanca (puxada)'}:x)}}:null);
     try{win.mesaTempoRealV111?.atrasar?.(t.id,2);}catch(_){}return;}
    await gravar(({cn:c2})=>cenaDoMapa(c2)?{msg:`🕹️ ${nomeDe(t)} puxa a alavanca`+(jaulaFechada(c2.objects,jid)?' · 🔓 a jaula se abre!':' · nada mais acontece.'),cn:{...c2,objects:abrirJaula(c2.objects,jid).map(x=>x.id===o.id?{...x,puxadaV186:true,imagem:svgAlavanca(true),nome:'Alavanca (puxada)'}:x)}}:null);
    try{win.mesaTempoRealV111?.atrasar?.(t.id,1);}catch(_){}return;
   }
   if((ultimaRec.get(t.id)||0)>Date.now()-2500)throw Error('Ainda arrumando a última parte.');ultimaRec.set(t.id,Date.now());
   let valor=0,usada='';for(const nomes of PERICIAS_RECONSTRUIR){let v=0;try{v=Number(await dep.pericia?.(t,nomes))||0;}catch(_){}if(v>valor){valor=v;usada=nomes[0];}}
   const die=dado(),g=classificarTeste(valor,die),r=reconstruir(o,g.grau);
   const msg=`🧱 ${nomeDe(t)} tenta reconstruir ${String(o.nome||'o objeto').toLowerCase()} · ${usada?usada[0].toUpperCase()+usada.slice(1):'perícia'} ${die}/${Math.round(valor)} → ${g.grau}`+(r.ganho>0?` · PV ${r.object.pvAtual}/${o.pvMax}${r.object.pvAtual>=Number(o.pvMax)?' · inteiro de novo':''}`:' · não avança');
   await gravar(({cn:c2})=>cenaDoMapa(c2)?{msg,cn:r.ganho>0?{...c2,objects:(c2.objects||[]).map(x=>x.id===o.id?r.object:x)}:null}:{msg});
   try{win.mesaTempoRealV111?.atrasar?.(t.id,2);}catch(_){}
  }catch(e){console.warn('[Masmorra] pedido',e?.message||e);if(String(pid).startsWith('local'))toast((cmd.tipo==='alavanca'?'🕹️ ':'🧱 ')+String(e?.message||e),4000);}
  finally{if(!String(pid).startsWith('local'))try{await dep.deleteDoc?.(D(PEDIDOS+'/'+pid));}catch(_){}}
 }

 // ------------------------------------------------------------ botões
 function botoes(){
  const mestre=ehMestre()&&!win.mesaModoJogadorV138_;
  if(!mestre){botao?.remove();botao=null;pop?.remove();pop=null;}
  else if(!botao||!botao.isConnected){botao=root.createElement('button');botao.type='button';botao.id='mmBotao';botao.textContent='🏰';botao.title='Masmorra de treino: levar o Kael Teste até lá ou reiniciar (paredes, armadilhas, celas e monstros)';botao.setAttribute('aria-label',botao.title);
   botao.addEventListener('click',()=>{if(!pop){pop=root.createElement('div');pop.id='mmPop';pop.innerHTML='<button type="button" data-ir>🧪 Levar o Kael Teste à masmorra</button><button type="button" data-reiniciar>↺ Reiniciar a masmorra (paredes, armadilhas, celas e monstros)</button>';
     pop.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;b.disabled=true;try{if(b.dataset.ir!==undefined){await irParaMasmorra();toast('🏰 Kael Teste está na entrada da masmorra. Abra a aba 🧪 para jogar com ele; ligue ⚡ para os monstros agirem.');}else{const n=await reiniciar();toast(`↺ Masmorra reiniciada: ${n} monstros de volta, paredes, jaulas e armadilhas novas.`);}}catch(err){console.warn('[Masmorra]',err);toast('🏰 '+String(err?.message||err),5000);}finally{b.disabled=false;pop.hidden=true;}});
     root.body.append(pop);}else pop.hidden=!pop.hidden;});
   root.body.append(botao);}
  if(mestre&&botao){botao.title='Masmorra de treino — status da prévia v194: '+(previaStatus||'verificando…');
   if(pop&&pop.isConnected){let st=pop.querySelector('[data-previa]');if(!st){st=root.createElement('div');st.dataset.previa='';st.style.cssText='opacity:.9;padding:3px 4px 1px;border-top:1px solid #c9a0ff55;font:600 11px Segoe UI,Arial,sans-serif';pop.append(st);}st.textContent=(previaStatus?('🗺️ Prévia v194: '+previaStatus):'')+(status196?(' · 🛰️ Núcleo v196: '+status196):'');}}
  const faixa=root.getElementById('mesaFaixaJogador');
  if(faixa&&!root.getElementById('mmFaixaBtn')){const rb=root.createElement('button');rb.type='button';rb.id='mmFaixaBtn';rb.textContent='🏰 Recomeçar na masmorra';rb.title='Leva o Kael Teste para a entrada da Masmorra de treino';rb.style.cssText='margin-left:8px;border:1px solid #c9a0ff;background:#2a2440;color:#efe6ff;border-radius:8px;cursor:pointer';
   rb.addEventListener('click',async()=>{rb.disabled=true;try{await irParaMasmorra();win.location.reload();}catch(e){console.warn(e);rb.disabled=false;}});faixa.append(rb);}
 }
 function assinar(){
  parar.forEach(f=>{try{f();}catch(_){}});parar=[];
  parar.push(dep.onSnapshot(D(HEALTH),s=>{saude=s.exists()?s.data():null;},()=>{}));
  parar.push(dep.onSnapshot(D(MAP),s=>{mapa=s.exists()?s.data():null;},()=>{}));
  parar.push(dep.onSnapshot(D(SCENE),s=>{cena=s.exists()?s.data():null;},()=>{}));
  if(ehMestre())parar.push(dep.onSnapshot(dep.collection(dep.db,...PEDIDOS.split('/')),q=>{q.forEach(d=>{void aplicar(d.id,d.data()||{});});},()=>{}));
 }
 const vigia=setInterval(()=>{try{const k=uid()+'|'+ehMestre();if(!uid())return;if(k!==assinado){assinado=k;assinar();}desenhar();botoes();if(ehMestre()){void montar();void vigiarArmadilhas();void vigiarLava();void publicarPrevia();void publicar196();}}catch(e){console.warn('[Masmorra]',e);}},400);
 const api={montar,reiniciar,irParaMasmorra,pedir,aplicar,disparar,gerar:o=>gerarMasmorra({objetos:dep.objetos?.()||[],...(o||{})}),gerar196:o=>gerarComplexo196({objetos:dep.objetos?.()||[],...(o||{})}),publicar196,feito:()=>feito};
 win.mesaMasmorra=api;
 return {...api,parar(){clearInterval(vigia);parar.forEach(f=>{try{f();}catch(_){}});camada?.remove();botao?.remove();pop?.remove();root.getElementById('mmFaixaBtn')?.remove();}};
}
