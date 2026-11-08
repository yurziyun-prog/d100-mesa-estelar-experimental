// Mesa Estelar v172 — Veículos e naves dos cenários com as imagens novas (tamanho real) e a nave do grupo por dentro.
//
// • Carros/cargueiros antigos dos mapas viram os veículos novos, no tamanho real (mesmo lugar, mesmo nome).
// • Naves com interior (espaço-porto): o casco (o "Telhado · …", que some quando alguém entra) vira a nave nova, deitada
//   (nariz para a direita) e grande o bastante para cobrir o interior que já existe.
// • A nave do grupo é refeita: casco da Nave exploradora azul (13 × 18 m) e por dentro arsenal/porão, banheiro, cozinha,
//   mesa, 3 beliches (6 camas) e cabine com pilotagem e console de armas.

import {PECAS} from './mesa-pecas-dados.js?v=172';

const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const peca=id=>PECAS.find(p=>p.id===id);
const modeloDe=o=>String(o?.modeloId||o?.objetoBancoId||o?.oficinaElement?.modeloId||o?.oficinaElement?.objetoBancoId||'');
// carros e caminhões (sem interior): tamanho real
export const TROCA_VEICULOS={pk_vei_aerocarro_creme:'hovercar',pk_vei_aerocarro_rubi:'sedan',pk_vei_aerocarro_turquesa:'carro_turquesa',pk_vei_cargueiro:'furgao',carro1:'sedan',pk_carro_vermelho:'carro_esportivo',caminhao1:'furgao'};
// naves com interior: casco que cobre o interior
export const TROCA_NAVES={pk_nave_cargueiro_ferrugem:'cargueiro_leve',pk_nave_caca:'caca',pk_nave_disco:'disco',pk_nave_transporte:'shuttle',pk_nave_grupo:'nave_exploradora_azul'};
// v173: qualquer carro/caminhão/moto antigo (desenho ou imagem velha) pelo nome ou pelo modelo
export const GENERICOS=[[/limusine|limousine/,'limousine'],[/taxi/,'taxi_dourado'],[/esportiv|vermelh|corrida/,'carro_esportivo'],[/picape|caminhonete|pickup/,'picape'],
 [/jipe|jeep|rover|buggy|bugue|todo.?terreno|off.?road/,'rover'],[/explorador|blindad/,'explorador'],[/caminh[aã]o|caminhao|furg[aã]o|furgao|\bvan\b|onibus|cargueiro (terrestre|flutuante)|carga pesada/,'furgao'],
 [/scooter|lambreta/,'scooter_turquesa'],[/\bmoto\b|motocicleta|moto (voadora|flutuante)/,'moto_vermelha'],[/coupe|cupe/,'coupe'],[/turquesa|azul|verde/,'carro_turquesa'],[/hover|aerocarro|flutuante|voador/,'hovercar'],
 [/\bcarro\b|automovel|veiculo|sedan|sed[aã]/,'sedan']];
export function veiculoGenerico(o){
 const m=sem(modeloDe(o)),n=sem(o?.nome),t=n+' '+m.replace(/_/g,' ');
 if(/^ia_|^nave|carroca|carroça|carrinho|carreta de m[aã]o|oficina|garagem|placa|posto|rampa|estacionamento|vaga|peca|sucata|pneu|motor\b|motorista|carrossel/.test(m)||/carroca|carrinho|garagem|placa|posto|rampa|estacionamento|vaga\b|sucata|pneu|pe[cç]a|motor\b|motorista|oficina|carrossel|nave|telhado/.test(n))return '';
 if(!/carro|automovel|veiculo|caminh|furg|\bvan\b|onibus|moto|scooter|jipe|jeep|rover|buggy|picape|caminhonete|limus|limous|taxi|sedan|hover|aerocarro|coupe/.test(t))return '';
 return GENERICOS.find(([re])=>re.test(t))?.[1]||'sedan';
}
const POR_NOME=[[/^aerocarro creme$/,'hovercar'],[/^aerocarro rubi$/,'sedan'],[/^aerocarro turquesa$/,'carro_turquesa'],[/^cargueiro flutuante$/,'furgao'],[/^aerocarro$/,'sedan'],[/^aerocarro vermelho$/,'carro_esportivo']];

function plano(o,p,{cobrir=null,nome}={}){
 const img=p.srcDeitada||p.src;let w=p.alturaM,h=p.larguraM; // deitada: comprimento na horizontal
 if(cobrir){const s=Math.max(1,cobrir.w/w,cobrir.h/h);w*=s;h*=s;}
 // objeto simples (sem referência ao modelo antigo: senão a mesa redesenha com a imagem velha/em pé)
 return {id:String(o.id).replace(/_v172$/,'')+'_v172',nome:nome||o.nome,name:nome||o.nome,x:Number(o.x),y:Number(o.y),angulo:Number(o.angulo)||0,imagem:img,larguraM:+w.toFixed(2),alturaM:+h.toFixed(2),
  pvMax:Number(o.pvMax)||0,pvAtual:Number(o.pvAtual??o.pvMax)||0,dureza:Number(o.dureza)||0,material:String(o.material||'metal'),destruido:false,locked:true,opacity:1,pecaV172:p.id,trocadoV172:true,...(o.fixoMestreV143?{fixoMestreV143:o.fixoMestreV143}:{})};
}
// troca numa cena (puro). Devolve {cena, trocados}
export function trocarVeiculos(cena){
 let n=0;const objs=(cena?.objects||[]).map(o=>{
  if(o?.trocadoV172||o?.pecaV172||/^ia_/.test(modeloDe(o)))return o;const m=modeloDe(o),nm=sem(o.nome);
  const v=TROCA_VEICULOS[m]||POR_NOME.find(([re])=>re.test(nm))?.[1]||(o?.bloqueiaMovimento!==false||o?.imagem||m?veiculoGenerico(o):'');
  if(v){const p=peca('ia_veiculo_'+v);if(p){n++;const pl=plano(o,p),em_pe=(Number(o.alturaM)||0)>(Number(o.larguraM)||0)*1.25;return {...pl,angulo:em_pe?((Number(o.angulo)||0)+90)%360:pl.angulo,camada:Number(o.camada)||3,bloqueiaMovimento:true};}}
  const nv=TROCA_NAVES[m]||(/^telhado · /.test(String(o.nome||'').toLowerCase())&&/nave do grupo/.test(nm)?'nave_exploradora_azul':'');
  if(nv&&m!=='pk_nave_grupo'&&!/nave do grupo/.test(nm)){const p=peca('ia_veiculo_'+nv);if(p){n++;return {...plano(o,p,{cobrir:{w:Number(o.larguraM)||10,h:Number(o.alturaM)||8}}),camada:5,bloqueiaMovimento:false,bloqueiaVisao:false,tetoV139:true};}}
  return o;});
 return {cena:{...cena,objects:objs},trocados:n};
}

// ---------------------------------------------------------------- a nave do grupo por dentro
// cx,cy = centro (metros); W,H do mapa; modelos = Map(id → modelo do banco) para as imagens dos móveis antigos (pk_*)
export function naveDoGrupo(cx,cy,{W,H,modelos=new Map()}={}){
 const N=(x,y)=>({x:+(x*28/W).toFixed(3),y:+(y*14/H).toFixed(3)}),out=[];let k=0;
 const id=t=>'nave172_'+t+'_'+(k++).toString(36);
 const forma=(x,y,w,h,{cor='#4a5058',nome='Parede da nave',bloq=true,camada=3,opacity=1}={})=>out.push({id:id('s'),nome,forma:'rect',cor,borda:'#2a2e34',bordaLargura:bloq?1:0,...N(x+w/2,y+h/2),larguraM:+w.toFixed(2),alturaM:+h.toFixed(2),angulo:0,camada,bloqueiaMovimento:bloq,bloqueiaVisao:bloq,opacity,pvMax:0,pvAtual:0,dureza:20,material:'metal',naveGrupoV172:true});
 const coisa=(pid,x,y,{nome,rot=0,bloq,camada}={})=>{const p=peca(pid),m=p?null:modelos.get(pid);const src=p?.src||m?.imagem||'';if(!src)return null;
  const o={id:id('o'),nome:nome||p?.nome||m?.nome||pid,pecaV172:pid,imagem:src,...N(x,y),larguraM:Number(p?.larguraM||m?.larguraM)||1,alturaM:Number(p?.alturaM||m?.alturaM)||1,angulo:rot,
   camada:camada??(p?.camada||Number(m?.camada)||3),bloqueiaMovimento:bloq??(p?p.bloq:m?.bloqueiaMovimento!==false),bloqueiaVisao:false,pvMax:0,pvAtual:0,dureza:0,material:'',naveGrupoV172:true};out.push(o);return o;};
 // casco: 18 × 13 (nave exploradora deitada); interior 15,2 × 6 m no meio
 const x0=cx-7.6,x1=cx+7.6,y0=cy-3,y1=cy+3,t=.3;
 forma(x0,y0,x1-x0,y1-y0,{cor:'#5e646c',nome:'Piso da nave',bloq:false,camada:1});
 forma(x0,y0,x1-x0,t);forma(x0,y1-t,x1-x0,t);                         // paredes de cima e de baixo
 forma(x0,y0,t,(cy-.8)-y0);forma(x0,cy+.8,t,y1-(cy+.8));               // traseira, com a rampa no meio (porta que já existe)
 forma(x1-t,y0,t,y1-y0);                                               // nariz
 const div=x=>{forma(x,y0,t,(cy-.7)-y0);forma(x,cy+.7,t,y1-(cy+.7));};
 const a=x0+3.2,b=x0+8.6,c=x0+12;div(a);div(b);div(c);
 // banheiro (canto de cima, entre o arsenal e a cozinha), porta embaixo
 const bx1=a+2.2,by1=y0+2.3;forma(bx1-t,y0,t,by1-y0);forma(a,by1-t,.6,t);forma(a+1.4,by1-t,bx1-(a+1.4),t);
 coisa('ia_vaso_nave',a+.55,y0+.75,{nome:'Vaso sanitário'});coisa('ia_chuveiro_nave',bx1-.75,y0+.75,{nome:'Chuveiro'});coisa('ia_pia_nave',bx1-.55,by1-.6,{nome:'Pia do banheiro'});
 forma(a,y0,bx1-a,by1-y0,{cor:'#7c8a94',nome:'Piso do banheiro',bloq:false,camada:1,opacity:.85});
 // porão/arsenal (traseira)
 coisa('ia_arsenal_nave',x0+1.55,y0+.6,{nome:'Arsenal da nave'});
 coisa('pk_caixote_suprimentos',x0+.95,y1-.85,{nome:'Caixote de suprimentos'});coisa('pk_caixote_suprimentos',x0+2.3,y1-.85,{nome:'Caixote de suprimentos'});
 // cozinha e mesa (área comum)
 coisa('ia_cozinha_nave',b-1.45,y0+.7,{nome:'Cozinha da nave'});
 coisa('pk_mesa_quadrada',(a+b)/2+.3,cy+1.25,{nome:'Mesa da nave'});
 for(const [dx,dy] of [[-1.05,0],[1.05,0],[0,1.05],[0,-1.05]])coisa('pk_cadeira_estofada',(a+b)/2+.3+dx,cy+1.25+dy,{nome:'Cadeira',bloq:false,camada:2});
 // beliches (6 camas)
 coisa('pk_beliche',b+.95,y0+1.4,{nome:'Beliche da nave'});coisa('pk_beliche',b+2.45,y0+1.4,{nome:'Beliche da nave'});coisa('pk_beliche',b+.95,y1-1.4,{nome:'Beliche da nave'});
 coisa('pk_fut_armario',b+2.2,y1-.6,{nome:'Armário da tripulação',rot:0});
 // cabine: pilotagem no nariz, armas, dois assentos
 coisa('pk_fut_console',x1-1.2,cy,{nome:'Console de pilotagem'});coisa('ia_console_armas_nave',c+1.05,y0+.75,{nome:'Console de armas'});
 coisa('pk_cadeira_estofada',x1-2.3,cy-.9,{nome:'Assento do piloto',bloq:false,camada:2});coisa('pk_cadeira_estofada',x1-2.3,cy+.9,{nome:'Assento do copiloto',bloq:false,camada:2});
 coisa('pk_cadeira_estofada',c+1.05,y0+1.6,{nome:'Assento do artilheiro',bloq:false,camada:2});
 // casco (some quando alguém entra)
 const p=peca('ia_veiculo_nave_exploradora_azul');
 if(p)out.push({id:'nave172_casco',nome:'Telhado · Nave do grupo',pecaV172:p.id,imagem:p.srcDeitada||p.src,...N(cx,cy),larguraM:p.alturaM,alturaM:p.larguraM,angulo:0,camada:5,bloqueiaMovimento:false,bloqueiaVisao:false,tetoV139:true,pvMax:0,pvAtual:0,dureza:0,material:'metal',naveGrupoV172:true,trocadoV172:true});
 return out;
}

// modelo de nave do grupo (Banco → Naves) e nave possuída
export const MODELO_NAVE_GRUPO={id:'nave_do_grupo',nome:'Nave do grupo (exploradora)',icone:'🛰️',tipo:'Exploração/Multiuso',classe:'Exploradora armada',porte:'Média',cascoMax:85,blindagem:5,escudoMax:30,energiaMax:160,combustivelMax:220,
 movimento:13,manobra:3,sensores:8,capacidadeCargaKg:6000,tripulacaoMin:1,tripulacaoMax:6,passageiros:6,slotsArmas:3,vendavel:false,preco:0,nivelAcesso:'Restrito',disponivelCampanha:true,
 descricao:'Nave exploradora de porte médio (13 × 18 m) para até 6 pessoas: 3 beliches, cozinha pequena, banheiro, porão com arsenal e cabine com pilotagem e console de armas.',imagem:'arte/pecas/veiculo-nave-exploradora-azul.webp'};
