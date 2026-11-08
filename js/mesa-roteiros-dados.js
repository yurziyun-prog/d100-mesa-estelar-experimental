// Mesa Estelar v181 — 📜 Roteiros: diálogos, gatilhos e missões (parte pura: sem banco e sem tela).
//
// Um ROTEIRO é o que o mestre escreve para a mesa andar sozinha:
//  🎯 missões (etapas que aparecem no diário dos jogadores);
//  💬 diálogos (falas de um NPC — ou de uma coisa, como a nave caída — com escolhas e testes de perícia);
//  ⚡ gatilhos: "quando [condições] → faça [efeitos]" (narrar, marcar, missão, abrir diálogo, monstro aparece,
//     NPC aparece/sai, levar o grupo a outro mapa, começar a luta, passar o relógio, sortear, esperar).
// Tudo fica em documentos que só o mestre lê; os jogadores recebem só o que está acontecendo agora.
// Pensado para crescer: as mesmas regras servem, no futuro, para a mesa rodar num servidor (sem o mestre online).

export const DOC='configuracoes/roteirosV181',DOC_EST='configuracoes/roteirosEstadoV181';
export const PUB='combatesAtivos/mesaRoteiro',PEDIDOS=PUB+'/acoes';
export const ALCANCE_NPC=3.6;
export const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
const clean=v=>JSON.parse(JSON.stringify(v??null));

// ---------------------------------------------------------------- testes
export const DIFS=['Muito fácil','Fácil','Padrão','Difícil','Formidável','Hercúleo'];
const MULT={'muito facil':2,'facil':1.5,'padrao':1,'dificil':2/3,'formidavel':.5,'herculeo':.1};
export const chance=(valor,dif='Padrão')=>Math.max(1,Math.min(99,Math.round((Number(valor)||0)*(MULT[sem(dif)]??1))));
export function rolar(valor,dif,die=1+Math.floor(Math.random()*100)){
 const ch=chance(valor,dif),ok=die<=ch,grau=die<=Math.max(1,Math.floor(ch/5))?'Crítico':ok?'Sucesso':die>=96?'Falha crítica':'Falha';
 return {die,chance:ch,sucesso:ok,grau};
}

// ---------------------------------------------------------------- catálogo (o editor usa para montar os formulários)
export const CONDICOES={
 mapa:{nome:'🗺️ Alguém do grupo está no mapa',dica:'Vale se algum personagem de jogador estiver em um destes mapas.'},
 perto:{nome:'📍 Alguém chega perto de…',dica:'De um objeto do mapa (parte do nome, ex.: "caída") ou de um ponto (x, y em metros).'},
 hora:{nome:'🕰️ Hora do jogo entre…',dica:'Ex.: de 20 até 5 = noite. Precisa do relógio do jogo.'},
 flag:{nome:'🏷️ Marca',dica:'Marcas são lembretes da história (ex.: "noite", "viu_vaelkor").'},
 missao:{nome:'🎯 Missão',dica:'A missão está numa etapa, ativa, concluída ou ainda não começou.'},
 semInimigos:{nome:'☮️ Sem criaturas de pé no mapa',dica:'Nenhuma criatura viva e acordada no mapa.'}
};
export const EFEITOS={
 narrar:{nome:'📣 Narrar',dica:'Um quadro com o texto aparece na tela de quem está no mapa.'},
 flag:{nome:'🏷️ Marcar',dica:'Liga ou desliga uma marca.'},
 missao:{nome:'🎯 Missão',dica:'Começa, muda de etapa, conclui ou falha uma missão.'},
 dialogo:{nome:'💬 Abrir diálogo',dica:'Abre um diálogo para o grupo naquele mapa.'},
 criatura:{nome:'🐾 Criatura aparece',dica:'Do banco de criaturas, perto do grupo ou numa beirada do mapa.'},
 npc:{nome:'🧑 NPC aparece',dica:'Do banco de NPCs; pode aparecer com outro nome (disfarce).'},
 remover:{nome:'👋 Alguém sai do mapa',dica:'Tira NPCs/criaturas cujo nome tenha este pedaço.'},
 levar:{nome:'🧭 Levar o grupo',dica:'Leva os personagens que estão no mapa do gatilho para outro mapa.'},
 combate:{nome:'⚔️ Começar a luta (tempo real)',dica:'Liga o combate em tempo real: o grupo contra as criaturas/NPCs do mapa.'},
 relogio:{nome:'🕰️ Passar o tempo',dica:'Avança o relógio do jogo algumas horas, ou até uma hora certa.'},
 esperar:{nome:'⏳ Esperar',dica:'Espera alguns segundos antes do próximo efeito.'},
 sortear:{nome:'🎲 Sortear',dica:'Escolhe um dos caminhos pelo peso.'}
};
export const ACOES_MISSAO={iniciar:'Começar',etapa:'Ir para a etapa',concluir:'Concluir',falhar:'Falhar'};

// ---------------------------------------------------------------- condições
// ctx = {pcs:[{id,nome,mapa,x,y}] (metros), hora (0–23 ou null), flags:{}, missoes:{id:{estado,etapa}},
//        objetos:mapa=>[{nome,x,y}] (metros), inimigos:mapa=>número de criaturas de pé}
// Cada condição devolve '*' (vale em qualquer mapa), um Set de mapas onde vale, ou null (não vale).
const TODOS='*';
// distância (m) de um ponto até a beirada de um objeto (girado), ou até um ponto
export function distAoAlvo(p,a){
 if(!(a?.w>0&&a?.h>0))return Math.hypot(p.x-a.x,p.y-a.y);
 const t=-(Number(a.ang)||0)*Math.PI/180,dx=p.x-a.x,dy=p.y-a.y,lx=dx*Math.cos(t)-dy*Math.sin(t),ly=dx*Math.sin(t)+dy*Math.cos(t);
 return Math.hypot(Math.max(0,Math.abs(lx)-a.w/2),Math.max(0,Math.abs(ly)-a.h/2));
}
export function avaliarCond(c,ctx){
 const pcs=ctx.pcs||[];
 switch(c?.tipo){
  case 'mapa':{const ms=new Set((c.mapas||[]).map(String));const s=new Set(pcs.filter(p=>ms.has(String(p.mapa))).map(p=>String(p.mapa)));return s.size?s:null;}
  case 'perto':{const m=String(c.mapa||'');if(!m)return null;let alvo=null;
   if(c.alvo){const o=(ctx.objetos?.(m)||[]).find(x=>sem(x.nome).includes(sem(c.alvo)));if(!o)return null;alvo=o;}
   else alvo={x:Number(c.x)||0,y:Number(c.y)||0};
   const r=Number(c.raio)||3;return pcs.some(p=>String(p.mapa)===m&&distAoAlvo(p,alvo)<=r)?new Set([m]):null;}
  case 'hora':{const h=ctx.hora;if(h==null)return null;const de=Number(c.de)||0,ate=Number(c.ate)||0;const ok=de<=ate?(h>=de&&h<ate):(h>=de||h<ate);return ok?TODOS:null;}
  case 'flag':{const v=!!ctx.flags?.[c.flag];return v===(c.valor!==false&&c.valor!=='nao')?TODOS:null;}
  case 'missao':{const st=ctx.missoes?.[c.missao];const e=String(c.etapa||'__ativa');
   const ok=e==='__nao'?!st:e==='__ativa'?st?.estado==='ativa':e==='__concluida'?st?.estado==='concluida':e==='__falhou'?st?.estado==='falhou':(st?.estado==='ativa'&&st.etapa===e);return ok?TODOS:null;}
  case 'semInimigos':{const m=String(c.mapa||'');if(!m)return null;return (ctx.inimigos?.(m)||0)===0?new Set([m]):null;}
  default:return TODOS; // condição incompleta não trava
 }
}
// todas as condições: devolve {ok, mapa} — o mapa onde aconteceu (o primeiro em comum; sem mapa, onde está a maior parte do grupo)
export function avaliar(lista=[],ctx){
 let acc=TODOS;
 for(const c of lista||[]){const r=avaliarCond(c,ctx);if(r===null)return {ok:false,mapa:''};if(r===TODOS)continue;acc=acc===TODOS?r:new Set([...acc].filter(m=>r.has(m)));if(!acc.size)return {ok:false,mapa:''};}
 if(acc!==TODOS)return {ok:true,mapa:[...acc][0]};
 return {ok:true,mapa:mapaDoGrupo(ctx.pcs)};
}
export function mapaDoGrupo(pcs=[]){const n=new Map();for(const p of pcs)n.set(String(p.mapa),(n.get(String(p.mapa))||0)+1);let m='',k=0;for(const [id,q] of n)if(q>k){k=q;m=id;}return m;}

// ---------------------------------------------------------------- diálogos
export const novoId=(p='x')=>p+Date.now().toString(36).slice(-5)+Math.random().toString(36).slice(2,5);
export function dialogoDoNpc(dialogos=[],nomes=[],ctx){
 const ns=nomes.map(sem).filter(Boolean);
 return (dialogos||[]).find(d=>d.npc&&ns.some(n=>n.includes(sem(d.npc)))&&avaliar(d.cond||[],ctx).ok)||null;
}
// opções que aparecem agora (condição de marca e "uma vez só")
export function opcoesVisiveis(no,ctx,feitas={}){
 return (no?.opcoes||[]).filter(o=>!(o.umaVez&&feitas[o.id])&&(!o.precisaFlag||!!ctx.flags?.[o.precisaFlag])&&(!o.semFlag||!ctx.flags?.[o.semFlag]));
}
// o que os jogadores veem do diálogo (sem os destinos nem os efeitos)
export function vistaDialogo(d,noId,ctx,{feitas={},log=[],nome='',retrato='',chave=novoId('v')}={}){
 const no=(d?.nos||[]).find(n=>n.id===noId);if(!no)return null;
 return clean({chave,dialogo:d.id,no:no.id,nome:nome||d.nome||'',icone:d.icone||'💬',retrato:retrato||'',fala:no.fala||'',aberto:true,log:log.slice(-8),
  opcoes:opcoesVisiveis(no,ctx,feitas).map(o=>({id:o.id,texto:o.texto,teste:o.teste?.pericia?`${o.teste.pericia}${o.teste.dif&&sem(o.teste.dif)!=='padrao'?' · '+o.teste.dif:''}`:''})),em:Date.now()});
}
// escolher uma opção: {texto da resposta, efeitos, próximo nó ('' = fim)}
export function resolverOpcao(o,resultado=null){
 const ok=!o.teste?.pericia||!!resultado?.sucesso;
 const resp=o.teste?.pericia?(ok?(resultado?.grau==='Crítico'&&o.critico?o.critico:o.sucesso):o.falha):o.resposta;
 const vai=ok?(o.vai||''):(o.vaiFalha||o.vai||'');
 return {ok,resposta:String(resp||''),efeitos:ok?(o.efeitos||[]):(o.efeitosFalha||[]),vai:vai==='fim'?'':vai};
}

// ---------------------------------------------------------------- missões
export function aplicarMissao(est={},e,missoes=[]){
 const m=missoes.find(x=>x.id===e.missao);if(!m)return est;const st={...(est[m.id]||{})},prim=m.etapas?.[0]?.id||'';
 if(e.acao==='iniciar'){if(st.estado==='ativa')return est;return {...est,[m.id]:{estado:'ativa',etapa:e.etapa||prim,feitas:[],em:Date.now()}};}
 if(e.acao==='etapa'){const feitas=[...new Set([...(st.feitas||[]),...(st.etapa&&st.etapa!==e.etapa?[st.etapa]:[])])];return {...est,[m.id]:{...st,estado:'ativa',etapa:e.etapa||prim,feitas,em:Date.now()}};}
 if(e.acao==='concluir')return {...est,[m.id]:{...st,estado:'concluida',feitas:[...new Set([...(st.feitas||[]),...(st.etapa?[st.etapa]:[])])],em:Date.now()}};
 if(e.acao==='falhar')return {...est,[m.id]:{...st,estado:'falhou',em:Date.now()}};
 return est;
}
// diário dos jogadores: só as missões que já começaram
export function diario(missoes=[],est={}){
 return missoes.filter(m=>est[m.id]).map(m=>{const st=est[m.id],et=(m.etapas||[]);
  return {id:m.id,nome:m.nome,descricao:m.descricao||'',estado:st.estado,atual:et.find(e=>e.id===st.etapa)?.texto||'',feitas:et.filter(e=>(st.feitas||[]).includes(e.id)).map(e=>e.texto),em:st.em||0};})
  .sort((a,b)=>(a.estado==='ativa'?0:1)-(b.estado==='ativa'?0:1)||b.em-a.em);
}
export function sortear(opcoes=[],rnd=Math.random){const t=opcoes.reduce((s,o)=>s+Math.max(0,Number(o.peso)||1),0);let r=rnd()*t;for(const o of opcoes){r-=Math.max(0,Number(o.peso)||1);if(r<0)return o;}return opcoes[opcoes.length-1]||null;}
// próxima vez que o relógio marca a hora h (ms de jogo)
export function proximaHora(agoraMs,h){const DIA=86400000,base=Math.floor(agoraMs/DIA)*DIA+h*3600000;return base>agoraMs?base:base+DIA;}
// tudo o que um roteiro cita e que não existe (para avisar no editor)
export function conferir(r,{mapas=[],criaturas=[],npcs=[]}={}){
 const faltas=[],M=new Set(mapas.map(x=>String(x.id))),C=new Set(criaturas.map(x=>String(x.id))),N=new Set(npcs.map(x=>String(x.id)));
 const ds=new Set((r.dialogos||[]).map(d=>d.id)),ms=new Map((r.missoes||[]).map(m=>[m.id,new Set((m.etapas||[]).map(e=>e.id))]));
 const ver=(e,onde)=>{
  if(['narrar','dialogo','criatura','npc','remover','combate'].includes(e.tipo)&&e.mapa&&!M.has(String(e.mapa)))faltas.push(`${onde}: mapa "${e.mapa}" não existe`);
  if(e.tipo==='levar'&&!M.has(String(e.mapa||'')))faltas.push(`${onde}: levar para um mapa que não existe`);
  if(e.tipo==='criatura'&&!C.has(String(e.modelo||'')))faltas.push(`${onde}: criatura "${e.modelo||'—'}" não está no banco`);
  if(e.tipo==='npc'&&!N.has(String(e.modelo||'')))faltas.push(`${onde}: NPC "${e.modelo||'—'}" não está no banco`);
  if(e.tipo==='dialogo'&&!ds.has(e.dialogo))faltas.push(`${onde}: diálogo que não existe`);
  if(e.tipo==='missao'&&(!ms.has(e.missao)||(e.acao==='etapa'&&!ms.get(e.missao).has(e.etapa))))faltas.push(`${onde}: missão/etapa que não existe`);
  if(e.tipo==='sortear')(e.opcoes||[]).forEach((o,i)=>(o.efeitos||[]).forEach(x=>ver(x,`${onde} › sorteio ${i+1}`)));
 };
 for(const g of r.gatilhos||[]){(g.efeitos||[]).forEach(e=>ver(e,`⚡ ${g.nome}`));for(const c of g.cond||[])if(['perto','semInimigos'].includes(c.tipo)&&!M.has(String(c.mapa||'')))faltas.push(`⚡ ${g.nome}: condição com mapa que não existe`);
  for(const c of g.cond||[])if(c.tipo==='mapa'&&!(c.mapas||[]).some(m=>M.has(String(m))))faltas.push(`⚡ ${g.nome}: nenhum dos mapas existe`);}
 for(const d of r.dialogos||[]){const nos=new Set((d.nos||[]).map(n=>n.id));if(!nos.has(d.inicio))faltas.push(`💬 ${d.nome}: sem fala inicial`);
  for(const n of d.nos||[])for(const o of n.opcoes||[]){for(const v of [o.vai,o.vaiFalha])if(v&&v!=='fim'&&!nos.has(v))faltas.push(`💬 ${d.nome}: "${o.texto}" leva a uma fala que não existe`);
   [...(o.efeitos||[]),...(o.efeitosFalha||[])].forEach(e=>ver(e,`💬 ${d.nome} › "${o.texto}"`));}}
 return faltas;
}

// ---------------------------------------------------------------- 📦 história pronta: a noite na cidade sem nome → Therion
export const CIDADE='cidade_sem_nome_20261013',THERION=['therion_arte_20261013','therion_oficina_20261013'];
// NPCs que a história usa (criados no banco se não existirem; se já houver um com o mesmo nome, usa o que existe)
export const NPCS_HISTORIA=[
 {id:'npc_roteiro_cronam',nome:'Cronam',especie:'humano',papel:'guarda',raca:'Humano',sexo:'M',idade:'41',carreira:'Guarda-costas',descricao:'Guarda-costas de Valloton. Enorme, cicatriz no queixo, fala pouco e olha muito.',FOR:'17',CON:'16',TAM:'16',DES:'13',INT:'12',POD:'13',CAR:'9'},
 {id:'npc_roteiro_encapuzado',nome:'Viajante encapuzado',especie:'humano',papel:'nobre',raca:'Humano',sexo:'M',idade:'52',carreira:'Viajante',descricao:'SEGREDO DO MESTRE: é Lord Anthorion Vaelkor disfarçado. Capa cinza, luvas finas, anel com brasão escondido.',FOR:'10',CON:'12',TAM:'12',DES:'12',INT:'17',POD:'16',CAR:'17'},
 {id:'npc_roteiro_varra',nome:'Varra, a sucateira',especie:'reptiliano',papel:'mercador',raca:'Reptiliano',sexo:'F',idade:'38',carreira:'Sucateira de caravana',descricao:'Lidera um rastejador de carga que cruza as ruínas entre Véspera e Therion. Óculos de solda, riso fácil, pechincha tudo.',FOR:'15',CON:'15',TAM:'14',DES:'12',INT:'13',POD:'11',CAR:'12'}
];
const op=(texto,x={})=>({id:novoId('o'),texto,...x});
export function historiaPronta({criatura='rastejante_de_cinzas'}={}){
 const n=(id,fala,opcoes)=>({id,fala,opcoes});
 const missoes=[
  {id:'m_perdidos',nome:'Perdidos no deserto',descricao:'A nave caiu nas ruínas de uma cidade sem nome, longe de Therion.',etapas:[{id:'noite',texto:'Sobreviver à noite na cidade sem nome.'},{id:'transporte',texto:'Achar um jeito de chegar a Therion.'},{id:'therion',texto:'Chegar a Therion.'}]},
  {id:'m_sabotagem',nome:'Quem derrubou a nave?',descricao:'O painel marcava combustível cheio. Não estava.',etapas:[{id:'vespera',texto:'Descobrir quem mexeu no combustível em Véspera.'},{id:'mandante',texto:'Descobrir a mando de quem.'}]}
 ];
 const dialogos=[
  {id:'d_nave',nome:'A nave caída',npc:'',icone:'🚀',inicio:'n1',cond:[],nos:[
   n('n1','A nave do grupo está torta, meio enterrada na areia. Ainda sai fumaça do motor de bombordo. O painel, rachado, insiste: COMBUSTÍVEL 100%.',[
    op('Abrir o painel do tanque',{teste:{pericia:'Mecânica',dif:'Padrão'},umaVez:true,sucesso:'O sensor do tanque foi adulterado: marcava cheio com o tanque vazio. E na linha de combustível há um furo fino, feito à mão. Alguém fez isso em Véspera.',falha:'Fios queimados por todo lado. Impossível dizer o que houve — por enquanto.',vai:'n1',vaiFalha:'n1',
     efeitos:[{tipo:'flag',flag:'pista_sabotagem',valor:true},{tipo:'missao',missao:'m_sabotagem',acao:'iniciar',etapa:'vespera'},{tipo:'narrar',titulo:'🔧 Sabotagem',texto:'O medidor foi adulterado e a linha de combustível furada. A nave não caiu por acaso.'}]}),
    op('Tentar o rádio de emergência',{teste:{pericia:'Eletrônica',dif:'Difícil'},umaVez:true,sucesso:'Chiado… e uma voz: “…caravana Varra, rota de Therion… passamos pelas ruínas ao amanhecer…”. Há esperança.',falha:'Só estática. O rádio solta uma faísca e morre.',vai:'n1',vaiFalha:'n1',efeitos:[{tipo:'flag',flag:'radio_caravana',valor:true}]}),
    op('Procurar suprimentos para a noite',{teste:{pericia:'Percepção',dif:'Padrão'},umaVez:true,sucesso:'Rações, uma lanterna que ainda funciona e dois cobertores térmicos. A noite vai ser menos dura.',falha:'Quase tudo se perdeu na queda.',vai:'n1',vaiFalha:'n1',efeitos:[{tipo:'flag',flag:'suprimentos',valor:true}]}),
    op('Deixar para depois',{resposta:'Vocês se afastam da carcaça.',vai:'fim'})])]},
  {id:'d_varra',nome:'Varra, a sucateira',npc:'Varra',icone:'🦎',inicio:'n1',cond:[],nos:[
   n('n1','Uma reptiliana de óculos de solda pula do rastejador de carga. — Náufragos? Hah! Therion fica a meio dia daqui. Lugar no rastejador custa.',[
    op('Pechinchar',{teste:{pericia:'Comércio',dif:'Padrão'},umaVez:true,sucesso:'— Tá, tá. Metade, e vocês ajudam a descarregar em Therion.',falha:'— Preço é preço, docinho.',vai:'n_sobe',vaiFalha:'n1'}),
    op('Convencer a levar de graça',{teste:{pericia:'Influência',dif:'Difícil'},umaVez:true,sucesso:'Varra gargalha. — Vocês têm lábia. Subam, náufragos.',falha:'— De graça só o sol do deserto.',vai:'n_sobe',vaiFalha:'n1'}),
    op('Oferecer conserto do motor dela',{teste:{pericia:'Mecânica',dif:'Padrão'},umaVez:true,sucesso:'O motor do rastejador ronca redondo. — Ora, ora. Vocês servem pra alguma coisa.',falha:'O motor tosse mais alto. Varra ri da cara de vocês.',vai:'n_sobe',vaiFalha:'n1'}),
    op('Perguntar sobre a nave caída',{precisaFlag:'pista_sabotagem',umaVez:true,teste:{pericia:'Influência',dif:'Padrão'},sucesso:'— Combustível em Véspera? Só um fornecedor abastece naves no porto: os Tessar. E eles devem favores a gente grande.',falha:'— Não me meto em briga de nave.',vai:'n1',vaiFalha:'n1',efeitos:[{tipo:'flag',flag:'pista_tessar',valor:true},{tipo:'missao',missao:'m_sabotagem',acao:'etapa',etapa:'mandante'}]}),
    op('Aceitar o preço',{resposta:'Vocês pagam o que ela pede.',vai:'n_sobe'})]),
   n('n_sobe','— Subam. E não toquem na carga.',[
    op('Partir para Therion',{resposta:'O rastejador range e parte, deixando as ruínas para trás.',vai:'fim',efeitos:[
     {tipo:'narrar',titulo:'🦎 A caravana de Varra',texto:'Meio dia sacolejando entre dunas e ossos de cidades antigas. No fim da tarde, as torres de Therion aparecem no horizonte.'},
     {tipo:'relogio',modo:'avancar',horas:6},{tipo:'missao',missao:'m_perdidos',acao:'etapa',etapa:'therion'},{tipo:'levar',mapa:THERION[0]}]}),
    op('Esperar um pouco',{resposta:'— Não demorem. O deserto não espera.',vai:'fim'})])]},
  {id:'d_cronam',nome:'Cronam',npc:'Cronam',icone:'🛡️',inicio:'n1',cond:[],nos:[
   n('n1','Um homem enorme bloqueia a passagem, braços cruzados. — Vocês. Os que caíram nas ruínas. Notícias correm rápido no deserto.',[
    op('Quem é você?',{resposta:'— Cronam.',vai:'n2'}),
    op('Como sabe da nossa queda?',{teste:{pericia:'Intuição',dif:'Padrão'},umaVez:true,sucesso:'Ele sabia antes de vocês chegarem. Alguém avisou — ou ele estava esperando.',falha:'O rosto dele é uma parede.',vai:'n1',vaiFalha:'n1',efeitos:[{tipo:'flag',flag:'cronam_sabia',valor:true}]}),
    op('Perguntar sobre Valloton',{teste:{pericia:'Influência',dif:'Difícil'},umaVez:true,sucesso:'Cronam baixa a voz.',falha:'— Esse nome não se diz em voz alta aqui.',vai:'n3',vaiFalha:'n1'}),
    op('Seguir caminho',{resposta:'Cronam dá um passo para o lado. — Por enquanto.',vai:'fim'})]),
   n('n2','— Eu protejo Valloton. Ou protegia. Não interessa a vocês.',[op('Voltar à conversa',{vai:'n1'}),op('Seguir caminho',{resposta:'— Cuidem das costas.',vai:'fim'})]),
   n('n3','— Valloton está vivo. E há quem pague caro para que continue sumido. Se descobrirem quem mexeu na nave de vocês… venham me procurar.',[
    op('Combinar um novo encontro',{resposta:'— A Taverna do Poço, depois do toque de recolher. Venham sozinhos.',vai:'fim',efeitos:[{tipo:'flag',flag:'pista_valloton',valor:true}]})])]},
  {id:'d_encapuzado',nome:'Viajante encapuzado',npc:'encapuzado',icone:'🎭',inicio:'n1',cond:[],nos:[
   n('n1','Um viajante de capa cinza, o rosto na sombra do capuz, observa vocês com interesse demais. — Sobreviventes das ruínas. Que sorte… ou que azar.',[
    op('Perguntar o nome',{resposta:'— Nomes são caros em Therion. Chamem-me de… Anthor.',vai:'n1',umaVez:true}),
    op('Reparar nas mãos dele',{teste:{pericia:'Percepção',dif:'Difícil'},umaVez:true,sucesso:'Sob a luva, o contorno de um anel com brasão: um V entre duas asas. O brasão da Casa Vaelkor.',falha:'Luvas de couro fino. Caras demais para um viajante.',vai:'n1',vaiFalha:'n1',efeitos:[{tipo:'flag',flag:'viu_vaelkor',valor:true}]}),
    op('Ler as intenções dele',{teste:{pericia:'Intuição',dif:'Difícil'},umaVez:true,sucesso:'Ele já sabia quem vocês eram antes de chegarem. E está se divertindo.',falha:'Impossível ler alguém que esconde o rosto.',vai:'n1',vaiFalha:'n1'}),
    op('Perguntar sobre a nave',{teste:{pericia:'Influência',dif:'Padrão'},umaVez:true,sucesso:'— Naves não caem sozinhas. Perguntem em Véspera quem abasteceu a de vocês.',falha:'— Acidentes acontecem. O deserto adora acidentes.',vai:'n1',vaiFalha:'n1',efeitos:[{tipo:'flag',flag:'pista_vespera',valor:true}]}),
    op('Despedir-se',{resposta:'— Voltaremos a nos ver. Tenho certeza.',vai:'fim',efeitos:[{tipo:'esperar',segundos:4},{tipo:'narrar',titulo:'🎭',texto:'O viajante se afasta e some na multidão. Por um instante, algo dourado brilha na mão dele.'},{tipo:'remover',nome:'encapuzado'}]})])]}
 ];
 const gatilhos=[
  {id:'g_ruinas',nome:'Chegada às ruínas',ativo:true,uma:true,cond:[{tipo:'mapa',mapas:[CIDADE]}],efeitos:[
   {tipo:'narrar',titulo:'🏜️ A cidade sem nome',texto:'Muros de pedra comidos pelo vento, escadarias que não levam a lugar nenhum, um silêncio pesado. Nenhum mapa tem nome para este lugar. E o sol já está baixo.'},
   {tipo:'missao',missao:'m_perdidos',acao:'iniciar',etapa:'noite'}]},
  {id:'g_nave',nome:'Perto da nave caída',ativo:true,uma:false,cond:[{tipo:'perto',mapa:CIDADE,alvo:'caída',raio:2.5}],efeitos:[{tipo:'dialogo',dialogo:'d_nave'}]},
  {id:'g_noite',nome:'Cai a noite (monstros)',ativo:true,uma:true,cond:[{tipo:'mapa',mapas:[CIDADE]},{tipo:'hora',de:20,ate:5}],efeitos:[
   {tipo:'flag',flag:'noite',valor:true},
   {tipo:'narrar',titulo:'🌙 A noite nas ruínas',texto:'O frio do deserto desce de repente. Entre as pedras, um som de raspar… e depois outro, mais perto. Algo acordou com o barulho da queda.'},
   {tipo:'esperar',segundos:25},
   {tipo:'criatura',modelo:criatura,qtd:2,onde:'meio'},
   {tipo:'flag',flag:'monstros',valor:true},
   {tipo:'narrar',titulo:'👁️ Olhos no escuro',texto:'Das frestas dos muros saem formas cinzentas, rastejando rápido demais. Elas vêm direto para vocês.'},
   {tipo:'combate'}]},
  {id:'g_vigilia',nome:'Depois da luta: vigília até o amanhecer',ativo:true,uma:true,cond:[{tipo:'mapa',mapas:[CIDADE]},{tipo:'flag',flag:'monstros',valor:true},{tipo:'semInimigos',mapa:CIDADE}],efeitos:[
   {tipo:'esperar',segundos:8},
   {tipo:'narrar',titulo:'🔥 Vigília',texto:'O resto da noite passa em silêncio. Vocês revezam a vigia ao lado da nave, ouvindo o vento — e cada estalo nas pedras.'},
   {tipo:'missao',missao:'m_perdidos',acao:'etapa',etapa:'transporte'},
   {tipo:'relogio',modo:'ate',horas:6}]},
  {id:'g_amanhecer',nome:'Amanhecer: a caravana',ativo:true,uma:true,cond:[{tipo:'mapa',mapas:[CIDADE]},{tipo:'flag',flag:'noite',valor:true},{tipo:'hora',de:6,ate:12},{tipo:'semInimigos',mapa:CIDADE}],efeitos:[
   {tipo:'narrar',titulo:'🌅 Amanhecer',texto:'O sol nasce vermelho sobre as ruínas. Ao longe, uma nuvem de poeira: um rastejador de carga, cheio de sucata, vem na direção de vocês.'},
   {tipo:'esperar',segundos:12},
   {tipo:'npc',modelo:'npc_roteiro_varra',onde:'perto'},
   {tipo:'missao',missao:'m_perdidos',acao:'etapa',etapa:'transporte'}]},
  {id:'g_therion',nome:'Chegada a Therion (Cronam ou o encapuzado)',ativo:true,uma:true,cond:[{tipo:'mapa',mapas:THERION}],efeitos:[
   {tipo:'missao',missao:'m_perdidos',acao:'concluir'},
   {tipo:'narrar',titulo:'🏙️ Therion',texto:'Terraços de pedra clara, toldos coloridos, cheiro de especiarias e óleo de motor. Depois do deserto, Therion parece outro mundo. Mas alguém já está de olho em vocês.'},
   {tipo:'esperar',segundos:45},
   {tipo:'sortear',opcoes:[
    {peso:1,efeitos:[{tipo:'npc',modelo:'npc_roteiro_cronam',onde:'perto'},{tipo:'narrar',titulo:'🛡️',texto:'Um homem enorme abre caminho pela multidão e para na frente de vocês.'}]},
    {peso:1,efeitos:[{tipo:'npc',modelo:'npc_roteiro_encapuzado',apelido:'Viajante encapuzado',onde:'perto'},{tipo:'narrar',titulo:'🎭',texto:'Um viajante de capa cinza se aproxima devagar, como quem já sabia onde encontrar vocês.'}]}]}]}
 ];
 return {missoes,dialogos,gatilhos};
}
