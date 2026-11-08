// Mesa Estelar v115 — Preparar a sessão (dados puros, sem tela e sem Firebase).
//
// Para cada cenário: testes prontos (ações do Cenário Atual) conforme o tipo de lugar,
// e a escolha de onde fixar cada ponto de teste no mapa (perto do objeto que combina
// com a ação, em chão livre e espalhados).
// Perícias separadas por ";" (formato das interações do cenário).

export const TESTES_PRONTOS={
 esgoto:[
  {titulo:'Marcas de giz na parede',icone:'🔦',pericias:'Percepção',dificuldade:'Padrão',perto:['parede'],
   evidente:'Riscos e símbolos de giz cobrem um trecho da parede úmida.',
   sucesso:'São marcas de catadores: uma seta indica a rota segura até a saída e um "≈" avisa onde a água costuma subir.',
   critico:'Além da rota, há um símbolo recente de perigo, feito às pressas por alguém ferido (há sangue no giz).',
   falha:'Parecem só rabiscos antigos.'},
  {titulo:'Comporta emperrada',icone:'⚙️',pericias:'Mecanismos;Força Bruta',dificuldade:'Difícil',perto:['grade','escotilha','parede'],
   evidente:'Uma comporta de metal enferrujada bloqueia um túnel lateral.',
   sucesso:'O mecanismo cede: a passagem lateral se abre e encurta o caminho.',
   critico:'Você também percebe como travá-la de novo depois — ótimo para isolar perseguidores.',
   falha:'Emperrada. A tentativa faz um barulho metálico que ecoa pelos túneis.'},
  {titulo:'Rastros no lodo',icone:'🐾',pericias:'Rastrear;Sobrevivência',dificuldade:'Padrão',perto:['canal','agua'],
   evidente:'Pegadas e marcas de arrasto no lodo da margem do canal.',
   sucesso:'Algo grande, de muitas patas, passou por aqui há menos de uma hora, em direção ao canal principal.',
   critico:'Há também passos humanos acompanhando a criatura, a uma distância segura: alguém está seguindo o bicho.',
   falha:'A água e o lodo apagaram os detalhes.'},
  {titulo:'Caixote preso nos canos',icone:'📦',pericias:'Força Bruta;Atletismo',dificuldade:'Padrão',perto:['caixa','caixote','barril'],
   evidente:'Um caixote de suprimentos está entalado entre dois canos.',
   sucesso:'Você solta o caixote: rações, uma lanterna e uma corda.',
   critico:'Num fundo falso, 1d3 cargas de energia embrulhadas em plástico.',
   falha:'O caixote escorrega e afunda no canal.'},
 ],
 caverna:[
  {titulo:'Veio de cristal',icone:'💎',pericias:'Percepção;Engenharia',dificuldade:'Padrão',perto:['cristal'],
   evidente:'Cristais azulados brotam de uma fenda e brilham fraco.',
   sucesso:'O brilho pulsa com correntes de ar: há uma passagem escondida atrás da parede.',
   critico:'Os cristais são valiosos e dá para soltar alguns sem derrubar o teto.',
   falha:'Só pedras bonitas.'},
  {titulo:'Teto instável',icone:'🪨',pericias:'Engenharia;Sobrevivência',dificuldade:'Difícil',perto:['pedra','rocha'],
   evidente:'Rachaduras finas correm pelo teto e há pó caindo.',
   sucesso:'Você identifica o trecho perigoso e por onde passar sem forçar a rocha.',
   critico:'Dá até para provocar o desabamento de propósito, bloqueando quem vier atrás.',
   falha:'Parece firme… até a próxima vibração.'},
  {titulo:'Ossos roídos',icone:'🦴',pericias:'Anatomia;Rastrear',dificuldade:'Padrão',perto:['esqueleto','ossada'],
   evidente:'Uma pilha de ossos em um canto, alguns ainda com restos de equipamento.',
   sucesso:'As marcas de dentes são de algo grande que volta sempre a este lugar: é um covil.',
   critico:'Entre os ossos há uma placa de identificação e um mapa parcial da mina.',
   falha:'Só ossos velhos.'},
  {titulo:'Corrente de ar',icone:'🌬️',pericias:'Percepção;Sobrevivência',dificuldade:'Padrão',perto:[],
   evidente:'A chama das lanternas tremula para um mesmo lado.',
   sucesso:'O ar vem de uma saída alternativa, a algumas dezenas de metros.',
   critico:'Você também sente o cheiro de fumaça: há gente acampada perto da saída.',
   falha:'Nada além do frio.'},
 ],
 floresta:[
  {titulo:'Trilha de caça',icone:'🐾',pericias:'Rastrear;Sobrevivência',dificuldade:'Padrão',perto:['trilha'],
   evidente:'Galhos quebrados e marcas no barro saem da trilha principal.',
   sucesso:'É uma trilha de animais que leva a uma fonte de água limpa.',
   critico:'Marcas de garra nas árvores: território de um predador grande. Melhor evitar ao anoitecer.',
   falha:'A trilha some no mato.'},
  {titulo:'Ervas e cogumelos',icone:'🌿',pericias:'Xenobiologia;Medicina;Sobrevivência',dificuldade:'Padrão',perto:['arbusto','planta'],
   evidente:'Plantas e cogumelos variados crescem à sombra das árvores.',
   sucesso:'Há ervas que servem para curativo: +1 uso de Primeiros Socorros nesta cena.',
   critico:'Também há um cogumelo que dá sono profundo — útil (e perigoso).',
   falha:'Melhor não arriscar comer nada daqui.'},
  {titulo:'Copa da árvore alta',icone:'🌲',pericias:'Atletismo;Percepção',dificuldade:'Difícil',perto:['arvore','pinheiro'],
   evidente:'Uma árvore bem mais alta que as outras domina a clareira.',
   sucesso:'Lá de cima você vê a direção do povoado mais próximo e fumaça de uma fogueira.',
   critico:'Você conta quantas pessoas estão na fogueira e vê que montam guarda.',
   falha:'Os galhos são finos demais para subir.'},
  {titulo:'Acampamento abandonado',icone:'🔥',pericias:'Percepção;Rastrear',dificuldade:'Padrão',perto:['tronco'],
   evidente:'Restos de uma fogueira e um tronco usado como banco.',
   sucesso:'As cinzas têm menos de um dia. Eram três pessoas, uma delas mancando.',
   critico:'Enterrado sob as cinzas, um bilhete queimado pela metade com um nome e um local.',
   falha:'Um acampamento qualquer.'},
 ],
 ermos:[
  {titulo:'Ruínas da mureta',icone:'🧱',pericias:'Percepção;Engenharia',dificuldade:'Padrão',perto:['mureta','parede'],
   evidente:'Restos de uma mureta antiga cortam o terreno.',
   sucesso:'Era um posto de pedágio imperial; há um depósito subterrâneo selado ao lado.',
   critico:'O selo ainda funciona com energia: dá para abri-lo com uma carga de bateria.',
   falha:'Só pedras empilhadas.'},
  {titulo:'Veículo abandonado',icone:'🚙',pericias:'Mecânica;Eletrônica',dificuldade:'Difícil',perto:['carro','caminhao'],
   evidente:'Um veículo enferrujado, de portas abertas, à beira da estrada.',
   sucesso:'O motor está morto, mas a bateria tem carga e há peças aproveitáveis.',
   critico:'Com algumas horas de trabalho, ele volta a andar (devagar).',
   falha:'Sucata pura.'},
  {titulo:'Marcas na estrada',icone:'🛞',pericias:'Rastrear',dificuldade:'Padrão',perto:['trilha','estrada'],
   evidente:'Sulcos de rodas e pegadas cruzam a estrada de terra.',
   sucesso:'Uma caravana passou ontem, carregada, rumo ao leste.',
   critico:'Uma das carroças deixa um rastro de óleo: dá para segui-la mesmo à noite.',
   falha:'O vento apagou quase tudo.'},
  {titulo:'Ossada no caminho',icone:'🦴',pericias:'Anatomia;Percepção',dificuldade:'Padrão',perto:['esqueleto','ossada'],
   evidente:'Ossos de um animal grande, já branqueados pelo sol.',
   sucesso:'Morreu de sede, não de ataque: a água por aqui é rara. Reabasteçam quando puderem.',
   critico:'Entre as costelas, uma bolsa de couro com moedas antigas.',
   falha:'Só ossos.'},
 ],
 cidade:[
  {titulo:'Cartazes na parede',icone:'📜',pericias:'Percepção;Submundo',dificuldade:'Padrão',perto:['parede','predio'],
   evidente:'Cartazes de procurados e anúncios cobrem a parede.',
   sucesso:'Um dos rostos procurados esteve no bar da esquina ontem à noite.',
   critico:'Um anúncio de "serviço de entrega" é, na verdade, um código do submundo marcando um encontro hoje.',
   falha:'Propaganda velha.'},
  {titulo:'Conversar com moradores',icone:'💬',pericias:'Influência',dificuldade:'Padrão',perto:['luminaria','poste'],
   evidente:'Moradores conversam perto do poste de luz.',
   sucesso:'Eles contam um boato útil sobre o lugar que vocês procuram.',
   critico:'Um deles oferece abrigo por uma noite, sem perguntas.',
   falha:'Desconfiam de estrangeiros e se afastam.'},
  {titulo:'Beco escuro',icone:'🕳️',pericias:'Furtividade;Percepção',dificuldade:'Padrão',perto:['beco','caixa','barril'],
   evidente:'Um beco estreito, com caixas empilhadas e pouca luz.',
   sucesso:'Há uma porta de serviço destrancada que leva aos fundos de uma loja.',
   critico:'Você nota alguém vigiando a rua de uma janela acima do beco.',
   falha:'Só lixo e um gato assustado.'},
  {titulo:'Terminal público',icone:'🖥️',pericias:'Computação;Eletrônica',dificuldade:'Difícil',perto:['terminal'],
   evidente:'Um terminal de informações público, com a tela riscada.',
   sucesso:'Você acessa os avisos da guarda: há uma patrulha marcada para esta rua em breve.',
   critico:'Também dá para apagar um registro (ou plantar um falso).',
   falha:'O terminal trava e apita.'},
 ],
 interior:[
  {titulo:'Porta trancada',icone:'🚪',pericias:'Segurança [Cofres e Fechaduras];Mecanismos;Força Bruta',dificuldade:'Padrão',perto:['porta','parede'],
   evidente:'Uma porta reforçada, trancada, com uma fechadura antiga.',
   sucesso:'A fechadura cede (ou a porta, se foi na força). O cômodo atrás está livre.',
   critico:'Você abre sem barulho e sem deixar marcas.',
   falha:'Travou de vez — e fez barulho.'},
  {titulo:'Mancha de sangue',icone:'🩸',pericias:'Anatomia;Medicina;Percepção',dificuldade:'Padrão',perto:['tapete','cama','mesa'],
   evidente:'Uma mancha escura no chão, mal limpa.',
   sucesso:'É sangue de poucos dias. Alguém ferido foi arrastado até a porta.',
   critico:'A quantidade indica um ferimento grave — e não há rastro de quem saiu daqui andando.',
   falha:'Pode ser qualquer coisa.'},
  {titulo:'Escrivaninha',icone:'🗄️',pericias:'Pesquisa;Percepção',dificuldade:'Padrão',perto:['mesa','terminal','escritorio'],
   evidente:'Uma escrivaninha com gavetas e papéis espalhados.',
   sucesso:'Entre os papéis, uma lista de pagamentos com nomes conhecidos.',
   critico:'Uma gaveta com fundo falso guarda uma chave e um chip de dados.',
   falha:'Só contas e recibos.'},
  {titulo:'Cofre na parede',icone:'🔐',pericias:'Segurança [Cofres e Fechaduras];Mecanismos',dificuldade:'Difícil',perto:['estante','parede'],
   evidente:'Atrás de um quadro torto há um pequeno cofre.',
   sucesso:'O cofre abre: créditos e documentos de identidade.',
   critico:'Você o abre sem deixar sinais — ninguém vai perceber.',
   falha:'O cofre trava; um alarme silencioso pode ter disparado.'},
  {titulo:'Cama desarrumada',icone:'🛏️',pericias:'Percepção',dificuldade:'Fácil',perto:['cama'],
   evidente:'A cama está desarrumada, como se alguém tivesse saído às pressas.',
   sucesso:'Debaixo do colchão, uma arma pequena e um bilhete com um endereço.',
   critico:'O lençol tem manchas de um remédio raro — o dono está doente.',
   falha:'Nada de interessante.'},
  {titulo:'Ouvir pela porta',icone:'👂',pericias:'Percepção',dificuldade:'Padrão',perto:['porta'],
   evidente:'Vozes abafadas vêm do outro lado de uma porta.',
   sucesso:'Duas pessoas discutem um negócio que acontece hoje à noite.',
   critico:'Você reconhece uma das vozes e descobre quantos guardas há na casa.',
   falha:'Não dá para entender nada.'},
 ],
 arena:[
  {titulo:'Estudar o adversário',icone:'👁️',pericias:'Percepção;Intuição',dificuldade:'Padrão',perto:['ringue','alvo'],
   evidente:'O adversário se aquece do outro lado.',
   sucesso:'Ele protege o lado esquerdo: +10 no primeiro ataque contra ele.',
   critico:'Ele está machucado e esconde isso: +10 em todos os ataques no primeiro turno.',
   falha:'Parece invencível.'},
  {titulo:'Apostas na arquibancada',icone:'💰',pericias:'Jogos e Apostas;Submundo',dificuldade:'Padrão',perto:['arquibancada'],
   evidente:'Apostadores gritam números e trocam fichas.',
   sucesso:'Você descobre o favorito e as chances reais: uma boa aposta paga o dobro.',
   critico:'Também descobre que a luta está combinada — e quem combinou.',
   falha:'Ninguém conversa com estranhos aqui.'},
  {titulo:'Conferir o equipamento',icone:'🔧',pericias:'Mecânica',dificuldade:'Fácil',perto:['balcao','caixa'],
   evidente:'O equipamento oficial está sobre uma mesa ao lado.',
   sucesso:'Uma das armas foi sabotada; você troca por outra.',
   critico:'Você descobre quem a sabotou.',
   falha:'Tudo parece em ordem.'},
 ],
};

const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();

// Ações tiradas do campo "testes sugeridos" do cenário (uma por linha). A perícia é a
// palavra conhecida que aparecer na linha.
import {PERICIAS_EQUIVALENTES} from './mesa-sessao-cenarios.js?v=117';
// Perícias do banco (CSV de 26/09).
export const PERICIAS_BANCO=['Adestramento','Agricultura','Anatomia','Animais','Armeiro','Arte','Astrologia','Astronavegação','Atletismo','Avaliação','Canto','Cartografia','Cavalgar','Cibernética','Cibersegurança','Combate Desarmado','Comércio','Computação','Comunicações','Condução de Veículos','Conhecimentos Gerais','Criptografia','Dança','Demolições','Direito','Disfarce','Economia','Eletrônica','Enganação','Engenharia','Ensino','Esquiva','Estratégia','Etiqueta','Exotecnologia','Falsificação','Finanças','Força Bruta','Força de Vontade','Furtividade','História','Idiomas','Influência','Interrogatório','Intimidação','Intuição','Jogos e Apostas','Liderança','Língua Nativa','Linguística','Logística','Mecânica','Mecanismos','Medicina','Meditação','Mineração','Música','Natação','Navegação','Navegação a Remo','Ocultar Itens','Oratória','Percepção','Pesquisa','Pilotagem','Política','Primeiros Socorros','Psicologia','Rastrear','Região','Resistência','Robótica','Sedução','Segurança','Segurança [Cofres e Fechaduras]','Sensoriamento','Sistemas Defensivos','Sobrevivência','Submundo','Tática','Teatro','Tradição','Xenobiologia'];
const PERICIAS_CONHECIDAS=PERICIAS_BANCO;
// "Investigação, Insight, Costumes…" (nomes de outros sistemas) → perícias reais do banco.
export function periciasReais(txt){
 const out=[];
 for(const parte of String(txt||'').split(/[|,;/]/).map(x=>x.trim()).filter(Boolean)){
  const n=norm(parte).replace(/\s*\(.*\)$/,'').trim();
  const eq=Object.entries(PERICIAS_EQUIVALENTES).find(([k])=>n===norm(k)||n.startsWith(norm(k)+' '));
  if(eq){out.push(...eq[1]);continue;}
  const real=PERICIAS_BANCO.find(p=>norm(p)===n);if(real)out.push(real);
 }
 return [...new Set(out)];
}
export function acoesDosTestesSugeridos(txt){
 const out=[];
 for(const linha of String(txt||'').split(/\r?\n|;(?=\s*[A-ZÁÉÍÓÚ])/).map(l=>l.replace(/^[-•*\d.)\s]+/,'').trim()).filter(l=>l.length>4)){
  const ps=[...new Set([...PERICIAS_CONHECIDAS.filter(p=>norm(linha).includes(norm(p))),...periciasReais(linha)])];
  if(!ps.length)continue;
  let titulo=linha.replace(/\([^)]*\)/g,'').trim();
  const m=/^([^:—-]{2,30})\s*[:—-]\s*(.+)$/.exec(titulo);if(m&&PERICIAS_CONHECIDAS.some(p=>norm(m[1]).includes(norm(p))))titulo=m[2];
  titulo=titulo.replace(/^(percepcao|percepção)\s+para\s+/i,'').trim();titulo=(titulo.charAt(0).toUpperCase()+titulo.slice(1)).slice(0,48);
  out.push({titulo,icone:'🔎',pericias:ps.join(';'),dificuldade:/dif[ií]cil/i.test(linha)?'Difícil':/f[aá]cil/i.test(linha)?'Fácil':'Padrão',perto:[],evidente:linha,sucesso:'(Mestre: descreva o que foi descoberto.)',critico:'',falha:'Nada de novo.'});
 }
 return out.slice(0,6);
}

// Escolhe pontos no mapa (metros) para as ações: perto do objeto que combina, em chão livre,
// longe das bordas e dos outros pontos. estado = estado da Oficina (elements com x,y,w,h,nome).
export function escolherPontos(acoes,estado,{W=28,H=14,rnd=Math.random}={}){
 const els=(estado?.elements||[]).filter(e=>e&&Number.isFinite(Number(e.x))&&Number.isFinite(Number(e.y)));
 const C=1,cw=Math.ceil(W/C),ch=Math.ceil(H/C),bloq=new Uint8Array(cw*ch);
 for(const e of els){
  if(!(e.bloqueiaMovimento===true||String(e.bloqueiaMovimento)==='true'))continue;
  const x0=Math.floor(Number(e.x)),y0=Math.floor(Number(e.y)),x1=Math.ceil(Number(e.x)+Number(e.w||1)),y1=Math.ceil(Number(e.y)+Number(e.h||1));
  for(let j=Math.max(0,y0);j<Math.min(ch,y1);j++)for(let i=Math.max(0,x0);i<Math.min(cw,x1);i++)bloq[j*cw+i]=1;
 }
 const livre=(x,y)=>{const i=Math.floor(x),j=Math.floor(y);return x>1.2&&y>1.2&&x<W-1.2&&y<H-1.2&&!bloq[j*cw+i];};
 const usados=[],out=[];
 const longe=(x,y)=>usados.every(p=>Math.hypot(p.x-x,p.y-y)>=Math.min(5,Math.max(2.5,Math.min(W,H)/4)));
 for(const a of acoes){
  let melhor=null;
  // 1) perto de um elemento cujo nome combina
  const chaves=(a.perto||[]).map(norm);
  const alvos=els.filter(e=>chaves.some(k=>norm(e.nome||e.name||e.modeloId).includes(k)));
  for(const e of alvos.sort(()=>rnd()-.5)){
   // pontos sobre a borda do elemento, afastados 0,8 m (serve para objetos pequenos e para canais/paredes compridos)
   const ex=Number(e.x),ey=Number(e.y),ew=Number(e.w||1),eh=Number(e.h||1),m=.8;
   for(let k=0;k<40&&!melhor;k++){const lado=Math.floor(rnd()*4),t=rnd();
    const x=lado<2?ex+t*ew:(lado===2?ex-m:ex+ew+m),y=lado<2?(lado===0?ey-m:ey+eh+m):ey+t*eh;
    if(livre(x,y)&&longe(x,y))melhor={x,y};}
   if(melhor)break;
  }
  // 2) senão, o chão livre mais distante dos pontos já escolhidos
  if(!melhor){let nota=-1;for(let t=0;t<220;t++){const x=1.5+rnd()*(W-3),y=1.5+rnd()*(H-3);if(!livre(x,y))continue;const d=usados.length?Math.min(...usados.map(p=>Math.hypot(p.x-x,p.y-y))):W;if(d>nota){nota=d;melhor={x,y};}}}
  if(!melhor)melhor={x:W/2,y:H/2};
  usados.push(melhor);out.push(melhor);
 }
 return out;
}
