// Mesa Estelar v129 — Rechear os mapas dos cenários com armários/baús, itens e bilhetes.
//
// Para cada mapa ligado a um cenário (e ainda não recheado):
//  • usa um armário/baú/gaveta que já exista no mapa ou coloca um novo, no estilo do lugar
//    (futurista → Armário de metal; feudal galáctico → Baú brasonado; retrofuturista → Armário de metal);
//  • guarda dentro 1 a 3 itens do banco e um bilhete escrito a partir do próprio cenário
//    (objetivo, segredos, eventos) — o jogador pode ler sem levar ou guardar;
//  • solta no chão mais um item ou recado.
// Nada é apagado; cada mapa é recheado uma vez (marca "recheadoV129" no mapa).
// Módulo à parte, usado pelo botão 🎁 do 🕸️ Mapa geral (só o mestre).

import {sugerirEstilo} from './mesa-gerador-mapas.js?v=141';
import {criarObjeto} from './nova-objetos.js?v=80';
import {tipoInterativo,estadoDe,NOTA_IMG,novoUid} from './mesa-objetos.js?v=155';
import {livrePerto} from './mesa-ligacoes.js?v=154';

const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const clean=v=>JSON.parse(JSON.stringify(v??null));
const SCENE='combatesAtivos/mapaMesaSyncDiretaCena';
const hash=t=>{let h=2166136261;for(const c of String(t))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h;};

// v134: bilhetes são do mundo do jogo (rumores, registros, recados) — nunca usam as notas do mestre
// (segredos, eventos, objetivo, descrição do mestre). Escolhidos pelo estilo do lugar.
const FRASES_BILHETE={
 futurista:['Turno da noite em {lugar}: as câmeras 3 e 4 continuam desligadas. Ninguém respondeu ao chamado da central.',
  'Mensagem pessoal: se estiver lendo isto, o código antigo ainda abre a porta de serviço. Apague depois de ler. — R.',
  'Log de manutenção: vazamento de refrigerante no setor B. Peça de reposição atrasada pela terceira vez.',
  'Aviso interno: créditos vencidos não serão aceitos depois do próximo ciclo. Converta no posto mais próximo.'],
 retro:['Bilhete com marca de batom: "Me encontre em {lugar} depois do toque de recolher. Traga o que combinamos."',
  'Lista rabiscada: pilhas, fio de cobre, café sintético… e "pagar o que devo antes que venham cobrar".',
  'Recorte de jornal: "Apagão deixa {lugar} às escuras por três noites; moradores falam em vultos no telhado."',
  'Ingresso amassado de um baile no salão do porto, com um número de quarto anotado no verso.'],
 feudal:['Por ordem da Casa: o portão leste de {lugar} permanece fechado até segunda ordem.',
  'Pergaminho de selo partido: "O tributo deste ciclo foi pago em dobro. Não pergunte a quem."',
  'Lista de convidados para o banquete, com dois nomes riscados a tinta vermelha.',
  'Bilhete de um escudeiro: "Se eu não voltar até a troca da guarda, entregue minha espada a meu irmão."'],
 geral:['"Alguém passou por {lugar} antes de vocês e saiu com pressa."','Recado amassado: "Não confie no primeiro preço que oferecerem."',
  'Desenho a carvão de um mapa incompleto, com um X perto de uma escada.','"Volto amanhã. Não mexa nas caixas." — sem assinatura.']
};
export const TITULOS_BILHETE=['Pergaminho selado','Registro de dados','Bilhete amassado','Recado rabiscado'];
export function textoDoBilhete(c={},estilo='',semente=null){
 const lista=FRASES_BILHETE[estilo]||FRASES_BILHETE.geral,h=semente??hash(String(c.id||c.nome||'')+estilo);
 const corpo=lista[h%lista.length].replace(/\{lugar\}/g,String(c.nome||'este lugar'));
 const titulo=estilo==='feudal'?'Pergaminho selado':estilo==='futurista'?'Registro de dados':'Bilhete amassado';
 const abre=estilo==='futurista'?'[REGISTRO RECUPERADO]':'';
 return {titulo,texto:[abre,corpo].filter(Boolean).join(' ')};
}
// Itens do banco que fazem sentido largados num armário (sem itens enormes ou de outro tipo).
export function itensProvaveis(itens=[],semente=1){
 const bons=itens.filter(i=>/consum|municao|muni|ferrament|medic|kit|equip|util|bateria|carga|comida|racao|bebida|droga|estimul|documento|chave|ferramenta|acessorio/i.test(sem([i.categoria,i.tipo,i.nome].join(' ')))&&!/veiculo|nave|armadura pesada/i.test(sem(i.nome)));
 const lista=(bons.length?bons:itens).slice();let s=semente>>>0||1;const r=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
 for(let i=lista.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[lista[i],lista[j]]=[lista[j],lista[i]];}
 return lista;
}

// v139: armário/baú encostado numa parede (nunca no meio da sala ou do corredor). Coordenadas normalizadas 28×14.
export function pontoJuntoParede(objs=[],W=28,H=14,w=1.6,h=.8,seed=0){
 const paredes=objs.filter(o=>o?.bloqueiaMovimento&&!o.destruido&&/parede|muro|rocha|predio|prédio/i.test(String(o.nome||''))&&Math.max(Number(o.larguraM)||0,Number(o.alturaM)||0)>=2.5);
 const cands=[],kx=28/W,ky=14/H;
 for(const o of paredes){const lw=Number(o.larguraM)||1,lh=Number(o.alturaM)||1,hor=lw>=lh,comp=hor?lw:lh;
  for(let t=-comp/2+w;t<=comp/2-w;t+=Math.max(1.2,w)){for(const s of [-1,1]){
   const cx=hor?Number(o.x)+t*kx:Number(o.x)+s*(lw/2+h/2+.06)*kx,cy=hor?Number(o.y)+s*(lh/2+h/2+.06)*ky:Number(o.y)+t*ky;
   if(cx<.4||cy<.4||cx>27.6||cy>13.6)continue;const q=livrePerto(objs,cx,cy,W,H,Math.min(w,h)/2-.02);
   if(Math.abs(q.x-cx)<1e-6&&Math.abs(q.y-cy)<1e-6)cands.push({x:cx,y:cy,angulo:hor?(s<0?180:0):(s<0?90:270)});}}}
 return cands.length?cands[seed%cands.length]:null;
}
export function instalarRecheio(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const arquivo=id=>'combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id);
 async function rechearUm(c,mapa,log){
  const id=String(mapa.id),estilo=sugerirEstilo((c.nome||'')+' '+(c.local||''))||'futurista';
  const ativo=await dep.getDoc(D(SCENE)),usaAtivo=ativo.exists()&&String(ativo.data()?.mapId||'')===id;
  const caminho=usaAtivo?SCENE:arquivo(id);
  const snap=usaAtivo?ativo:await dep.getDoc(D(caminho));
  if(!snap.exists()){log(`⏭️ ${mapa.nome||id}: abra o mapa uma vez para poder rechear.`);return false;}
  const cena=snap.data(),objs=[...(cena.objects||[])],W=Number(mapa.larguraM)||28,H=Number(mapa.alturaM)||14,seed=hash(id);
  const itens=itensProvaveis(dep.itens?.()||[],seed),nota=textoDoBilhete(c,estilo);
  const pegaItem=k=>itens[k%Math.max(1,itens.length)];
  const entrada=it=>({uid:novoUid(),tipo:'item',idBanco:String(it.id),nome:String(it.nome||it.id),imagem:String(it.imagem||'')});
  // 1) recipiente: um que já existe (vazio) ou um novo, no estilo do lugar
  let k=objs.findIndex(o=>tipoInterativo(o)==='recipiente'&&!estadoDe(o).itens.length);
  if(k<0){
   const mid=estilo==='feudal'?'pk_feu_bau':'pk_fut_armario',modelo=(dep.objetos?.()||[]).find(o=>String(o.id)===mid)||(dep.objetos?.()||[]).find(o=>/bau|armario|cofre/i.test(sem(o.nome)));
   if(!modelo){log(`⚠️ ${mapa.nome||id}: nenhum armário/baú no banco ainda (o pacote de móveis entra sozinho na conta do mestre).`);return false;}
   const p=pontoJuntoParede(objs,W,H,Number(modelo.larguraM)||1.6,Number(modelo.alturaM)||.8,seed)||livrePerto(objs,4+(seed%20),2+(seed%10),W,H,.9),o=criarObjeto(modelo,{id:'rech_'+novoUid(),x:p.x,y:p.y,...(p.angulo!=null?{angulo:p.angulo}:{})});
   objs.push(o);k=objs.length-1;
  }
  const qtd=1+(seed%3),dentro=[];for(let i=0;i<qtd&&itens.length;i++)dentro.push(entrada(pegaItem(i)));
  dentro.push({uid:novoUid(),tipo:'nota',nome:nota.titulo,texto:nota.texto});
  const alvo=objs[k];objs[k]={...alvo,estadoInterativo:{...(alvo.estadoInterativo||{}),itens:[...estadoDe(alvo).itens,...dentro],trancado:(seed%4===0)||!!alvo.estadoInterativo?.trancado,dificuldade:alvo.estadoInterativo?.dificuldade||'padrao'}};
  // 2) algo solto no chão
  const p2=livrePerto(objs,24-(seed%18),12-(seed%9),W,H,.6),solto=seed%2&&itens.length>3?entrada(pegaItem(3)):{uid:novoUid(),tipo:'nota',nome:'Recado rabiscado',texto:textoDoBilhete(c,'geral',seed>>>3).texto};
  objs.push({id:'chao_'+solto.uid,nome:(solto.tipo==='nota'?'📜 ':'')+solto.nome,x:p2.x,y:p2.y,larguraM:solto.tipo==='nota'?.45:.6,alturaM:solto.tipo==='nota'?.45:.6,angulo:(seed%40)-20,camada:1,bloqueiaMovimento:false,bloqueiaVisao:false,imagem:solto.tipo==='nota'?NOTA_IMG:(solto.imagem||NOTA_IMG),itemSolto:clean(solto)});
  await dep.setDoc(D(caminho),clean({...cena,objects:objs}));
  if(usaAtivo)try{await dep.setDoc(D(arquivo(id)),clean({...cena,objects:objs}));}catch(_){}
  await dep.setDoc(D('mapas/'+id),{recheadoV129:{em:new Date().toISOString(),estilo}},{merge:true});mapa.recheadoV129=true;
  log(`🎁 ${mapa.nome||id}: ${objs[k].nome||'recipiente'} com ${dentro.length-1} item(ns) + “${nota.titulo}”${objs[k].estadoInterativo.trancado?' (trancado)':''}; ${solto.tipo==='nota'?'um recado':'um item'} no chão.`);
  return true;
 }
 async function rechear(log=()=>{}){
  if(!ehMestre())throw Error('Só o mestre.');
  const mapas=dep.mapas?.()||[],cens=(dep.cenarios?.()||[]).filter(c=>c.mapaId);let n=0;
  for(const c of cens){const m=mapas.find(x=>String(x.id)===String(c.mapaId));if(!m||m.recheadoV129)continue;try{if(await rechearUm(c,m,log))n++;}catch(e){log(`⚠️ ${m.nome||m.id}: ${e?.message||e}`);}}
  log(`🎁 ${n} mapa(s) recheado(s). Os bilhetes trazem uma pista do cenário: revise no balão do armário (✕ tira, ＋ acrescenta).`);return n;
 }
 win.mesaRecheio={rechear};
 return {rechear};
}
