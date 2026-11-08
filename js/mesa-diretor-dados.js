// Mesa Estelar v108 — Tabelas do Diretor de Cena (encontros, clima, nomes).
// Puro: sem acesso a banco/DOM. Testado em tests/v108-diretor.test.mjs.

// tensao: a partir de que nível de tensão (0–1) o evento pode aparecer.
// gravidade: 0 = bom/neutro, 1 = leve, 2 = sério, 3 = catástrofe.
// criaturas/npcs/objetos: [id, mínimo, máximo]
export const AMBIENTES_DIRETOR={
 esgoto:{nome:'🕳️ Esgoto / subterrâneo',base:.08,crescimento:.32,horasParaMax:3,luz:'escuro',
  climas:[{nome:'Ar parado e úmido',clima:'nenhum',peso:3},{nome:'Vapores leves',clima:'neblina',peso:3},{nome:'Goteiras e respingos',clima:'chuva',intensidade:.4,peso:2}],
  eventos:[
   {id:'ratos',nome:'Ratos curiosos',tipo:'combate',gravidade:1,peso:5,tensao:0,criaturas:[['rato_gigante_esgoto',2,4]],texto:'Olhos vermelhos refletem a luz das lanternas. Ratos gigantes se aproximam farejando — fogem se um deles for ferido gravemente.'},
   {id:'catador',nome:'Catador de túneis',tipo:'social',gravidade:0,peso:3,tensao:0,npcs:[['catador_de_tuneis']],texto:'Pip Rasco surge de uma galeria lateral. Troca informações sobre os túneis por comida ou créditos e avisa onde a água costuma subir.'},
   {id:'manutencao',nome:'Equipe de manutenção',tipo:'social',gravidade:0,peso:2,tensao:0,npcs:[['tecnica_manutencao']],texto:'Irla Venn está consertando uma válvula. Pode abrir uma comporta, indicar um atalho — ou pedir ajuda com algo que viu mais adiante.'},
   {id:'suprimentos',nome:'Caixote esquecido',tipo:'achado',gravidade:0,peso:3,tensao:0,objetos:[['pk_caixote_suprimentos',1,1]],texto:'Um caixote de suprimentos preso entre dois canos. Dentro: rações, uma lanterna e 1d3 cargas de energia (a critério do mestre).'},
   {id:'ossada',nome:'Ossada com equipamento',tipo:'achado',gravidade:0,peso:2,tensao:.1,objetos:[['esqueletos1',1,1]],texto:'Restos de alguém que não saiu daqui. Há um equipamento ainda útil entre os ossos — e marcas de mordida recentes.'},
   {id:'rastejador',nome:'Emboscada no duto',tipo:'combate',gravidade:2,peso:3,tensao:.2,criaturas:[['rastejador_de_tubulacoes',1,1]],texto:'Um duto acima do grupo range. O Rastejador de Tubulações cai sobre quem estiver mais atrás (teste de Percepção para não ser surpreendido).'},
   {id:'errantes',nome:'Errantes vagando',tipo:'combate',gravidade:2,peso:4,tensao:.15,criaturas:[['zumbi_1',2,4]],texto:'Passos arrastados ecoam na água. Errantes parasitados seguem o barulho do grupo.'},
   {id:'limo',nome:'Limo na tubulação',tipo:'combate',gravidade:1,peso:2,tensao:.1,criaturas:[['limo_de_esgoto',1,2]],texto:'O que parecia lodo no chão se mexe. O limo avança devagar na direção do calor.'},
   {id:'lagarto',nome:'Algo no canal',tipo:'combate',gravidade:2,peso:2,tensao:.3,criaturas:[['lagarto_de_galeria',1,1]],texto:'Bolhas no canal escuro. O Lagarto de Galeria tenta agarrar quem estiver mais perto da água.'},
   {id:'gas',nome:'Vapores tóxicos',tipo:'perigo',gravidade:2,peso:2,tensao:.3,perigo:{tipo:'gas',nivel:.5},texto:'Um bolsão de gás escapa de uma tubulação rachada. Teste de Resistência a cada rodada dentro da nuvem ou fadiga +1.'},
   {id:'apagao',nome:'Apagão',tipo:'perigo',gravidade:1,peso:2,tensao:.25,clima:{ambiente:'escuro'},texto:'As lâmpadas de serviço piscam e apagam. Só as lanternas do grupo iluminam agora.'},
   {id:'inchado',nome:'Inchado na passagem',tipo:'combate',gravidade:2,peso:2,tensao:.35,criaturas:[['inchado_pustulento',1,1],['zumbi_1',0,2]],texto:'Um Inchado Pustulento bloqueia a passagem estreita. Matá-lo de perto libera os esporos.'},
   {id:'enchente',nome:'Enchente súbita',tipo:'catastrofe',gravidade:3,peso:3,tensao:.55,perigo:{tipo:'enchente',nivel:.35},criaturas:[['rato_gigante_esgoto',2,3]],texto:'Um ronco distante e o nível da água começa a subir. A cada 10 minutos de jogo a água sobe mais: movimento pela metade, testes de Atletismo/Natação para não ser arrastado. Ratos fogem em pânico na direção do grupo.'},
   {id:'enxame',nome:'Enxame de ratos',tipo:'catastrofe',gravidade:3,peso:3,tensao:.6,criaturas:[['enxame_ratos',2,3],['rato_gigante_esgoto',2,4]],texto:'Um chiado crescente — centenas de ratos inundam a galeria. Algo os está expulsando lá de dentro.'},
   {id:'carnical',nome:'O Carniçal e seu bando',tipo:'catastrofe',gravidade:3,peso:2,tensao:.7,criaturas:[['cadaver_de_chefe',1,1],['zumbi_1',3,5]],texto:'O Carniçal Dominante encontrou o grupo. Os errantes se movem com ele, como se obedecessem.'},
   {id:'desabamento',nome:'Desabamento parcial',tipo:'catastrofe',gravidade:3,peso:2,tensao:.5,objetos:[['pk_pedra_grande',1,2]],perigo:{tipo:'fumaca',nivel:.6},texto:'O teto cede atrás do grupo. Poeira cobre tudo (visão reduzida) e a passagem de volta fica bloqueada. Teste de Esquiva para quem estava mais atrás.'}
  ]},
 cidade:{nome:'🏙️ Ruas de Véspera',base:.06,crescimento:.22,horasParaMax:4,luz:'dia',
  climas:[{nome:'Céu limpo',clima:'nenhum',peso:4},{nome:'Poeira no vento',clima:'poeira',peso:3},{nome:'Chuva fina',clima:'chuva',intensidade:.6,peso:2},{nome:'Neblina da manhã',clima:'neblina',peso:1}],
  eventos:[
   {id:'bisca',nome:'Batedor de carteira',tipo:'social',gravidade:1,peso:4,tensao:0,npcs:[['crianca_de_rua_1']],texto:'Um garoto esbarra no grupo e some na multidão. Teste de Percepção para notar que algo foi levado.'},
   {id:'patrulha',nome:'Patrulha da guarda',tipo:'social',gravidade:0,peso:3,tensao:0,npcs:[['guarda_generico_1']],texto:'Uma guarda pede documentos e pergunta o que o grupo faz por ali.'},
   {id:'mercador',nome:'Mercador ambulante',tipo:'social',gravidade:0,peso:3,tensao:0,npcs:[['mercante_1']],texto:'Samir Vek oferece mercadorias e rumores sobre caravanas.'},
   {id:'caes',nome:'Cães de sucata',tipo:'combate',gravidade:2,peso:2,tensao:.35,criaturas:[['cao_de_sucata',2,3]],texto:'Uma matilha de cães de sucata atravessa a rua perseguindo alguém — e muda de alvo.'},
   {id:'tempestade',nome:'Tempestade de poeira',tipo:'perigo',gravidade:1,peso:2,tensao:.2,clima:{clima:'poeira',intensidadeClima:1.8},texto:'O vento traz uma parede de poeira. Visão reduzida e testes de Percepção mais difíceis.'},
   {id:'apagao_cidade',nome:'Apagão no bairro',tipo:'perigo',gravidade:1,peso:1,tensao:.3,clima:{ambiente:'noite'},texto:'A energia cai em vários quarteirões. Lojas fecham as portas às pressas.'},
   {id:'errantes_cidade',nome:'Errantes na viela',tipo:'combate',gravidade:2,peso:2,tensao:.5,criaturas:[['zumbi_1',2,3]],texto:'Gritos numa viela: errantes parasitados atacam um morador.'}
  ]},
 ermos:{nome:'🏜️ Ermos e planícies',base:.05,crescimento:.25,horasParaMax:6,luz:'dia',
  climas:[{nome:'Sol forte',clima:'nenhum',peso:3},{nome:'Vento com poeira',clima:'poeira',peso:3},{nome:'Tempestade',clima:'chuva',intensidade:1.6,peso:1},{nome:'Brasas de queimada',clima:'brasas',peso:1}],
  eventos:[
   {id:'caravana',nome:'Caravana',tipo:'social',gravidade:0,peso:3,tensao:0,npcs:[['tessan_vey']],texto:'A caravana de Tessan Vey passa pela estrada e aceita viajantes.'},
   {id:'predador',nome:'Predador de Névoa',tipo:'combate',gravidade:2,peso:3,tensao:.2,criaturas:[['predador_de_nevoa',1,2]],texto:'Algo acompanha o grupo de longe há algum tempo.'},
   {id:'corredor',nome:'Dragão-Trombeta corredor',tipo:'combate',gravidade:2,peso:2,tensao:.35,criaturas:[['dragao_trombeta_corredor_selvagem',1,1]],texto:'Um bramido de trombeta ecoa. O trombetídeo corre em direção ao grupo.'},
   {id:'besta',nome:'A Besta Ululante',tipo:'catastrofe',gravidade:3,peso:2,tensao:.65,criaturas:[['besta_ululante',1,1]],texto:'Um coro de latidos que não vem de cães. A Besta Ululante caça.'},
   {id:'tempestade_ermos',nome:'Tempestade',tipo:'perigo',gravidade:1,peso:2,tensao:.3,clima:{clima:'chuva',intensidadeClima:1.8,ambiente:'entardecer'},texto:'O céu escurece de repente. Abrigo ou testes de Sobrevivência.'}
  ]},
 caverna:{nome:'⛏️ Cavernas e minas',base:.07,crescimento:.3,horasParaMax:3,luz:'escuro',
  climas:[{nome:'Ar parado',clima:'nenhum',peso:3},{nome:'Poeira de rocha',clima:'poeira',intensidade:.5,peso:2},{nome:'Névoa fria',clima:'neblina',peso:2}],
  eventos:[
   {id:'mineiros',nome:'Mineiros',tipo:'social',gravidade:0,peso:3,tensao:0,npcs:[['minerador_generico_1']],texto:'Tor Vask e sua equipe descansam numa galeria. Sabem de uma cavidade estranha mais abaixo.'},
   {id:'carrapatos',nome:'Carrapatos de ferro',tipo:'combate',gravidade:1,peso:3,tensao:.1,criaturas:[['carrapato_de_ferro',2,4]],texto:'Pequenos estalos metálicos nas paredes: carrapatos de ferro.'},
   {id:'mariposas',nome:'Mariposas-Cinza',tipo:'combate',gravidade:1,peso:2,tensao:.2,criaturas:[['mariposa_cinza',2,3]],texto:'A luz das lanternas atrai mariposas enormes.'},
   {id:'escavador',nome:'Escavador de Carapaça',tipo:'combate',gravidade:2,peso:2,tensao:.4,criaturas:[['escavador_de_carapaca',1,1]],texto:'A parede treme e se abre: um escavador atravessa a rocha.'},
   {id:'gas_mina',nome:'Bolsão de gás',tipo:'perigo',gravidade:2,peso:2,tensao:.35,perigo:{tipo:'gas',nivel:.45},texto:'Cheiro adocicado. Fogo aqui pode causar uma explosão.'},
   {id:'desabamento_mina',nome:'Desabamento',tipo:'catastrofe',gravidade:3,peso:2,tensao:.55,objetos:[['pk_pedra_grande',1,2]],perigo:{tipo:'fumaca',nivel:.6},texto:'Rochas despencam. A saída fica parcialmente bloqueada.'}
  ]},
 ruinas:{nome:'🏛️ Ruínas imperiais',base:.06,crescimento:.28,horasParaMax:4,luz:'noite',
  climas:[{nome:'Silêncio pesado',clima:'nenhum',peso:3},{nome:'Neblina',clima:'neblina',peso:2},{nome:'Poeira antiga',clima:'poeira',intensidade:.5,peso:2}],
  eventos:[
   {id:'registro',nome:'Terminal ainda ativo',tipo:'achado',gravidade:0,peso:3,tensao:0,objetos:[['pk_terminal',1,1]],texto:'Um terminal imperial acende quando o grupo se aproxima. Teste de Computação para acessar registros.'},
   {id:'sentinela',nome:'Sentinela em patrulha',tipo:'combate',gravidade:2,peso:3,tensao:.25,criaturas:[['sentinela_imperial',1,1]],texto:'Passos mecânicos regulares. A sentinela exige uma credencial que ninguém tem.'},
   {id:'errantes_ruina',nome:'Errantes abrigados',tipo:'combate',gravidade:2,peso:2,tensao:.3,criaturas:[['zumbi_1',2,4]],texto:'Errantes se abrigam do sol nas salas escuras.'},
   {id:'carnical_ruina',nome:'Covil do Carniçal',tipo:'catastrofe',gravidade:3,peso:2,tensao:.65,criaturas:[['cadaver_de_chefe',1,1],['zumbi_1',2,4]],texto:'Ossos roídos por todo lado. Este é o covil de um Carniçal Dominante.'}
  ]},
 floresta:{nome:'🌲 Florestas e pântanos',base:.06,crescimento:.26,horasParaMax:5,luz:'dia',
  climas:[{nome:'Sol entre as copas',clima:'nenhum',peso:3},{nome:'Neblina',clima:'neblina',peso:3},{nome:'Chuva',clima:'chuva',peso:2}],
  eventos:[
   {id:'cacador',nome:'Caçador de Névoa',tipo:'combate',gravidade:2,peso:3,tensao:.2,criaturas:[['caçador_de_nevoa',1,2]],texto:'Na neblina, uma silhueta circula o grupo.'},
   {id:'serpente',nome:'Serpente Sanguessuga',tipo:'combate',gravidade:2,peso:2,tensao:.3,criaturas:[['serpente_sanguessuga',1,1]],texto:'Algo se mexe na lama aos pés de alguém.'},
   {id:'larva',nome:'Larva Interdimensional',tipo:'achado',gravidade:0,peso:1,tensao:0,criaturas:[['larva_interdimensional',1,1]],texto:'Uma criatura com rosto de coruja observa o grupo e some no ar — reaparecendo logo adiante.'},
   {id:'nevoa_densa',nome:'Neblina densa',tipo:'perigo',gravidade:1,peso:2,tensao:.2,clima:{clima:'neblina',intensidadeClima:1.8},texto:'A neblina fecha. Fácil se perder: teste de Sobrevivência.'}
  ]}
};

export const ROTULO_TENSAO=t=>t<.25?'Calmo':t<.5?'Inquieto':t<.75?'Perigoso':'Crítico';
export function tensao(amb,minutos){const a=AMBIENTES_DIRETOR[amb]||AMBIENTES_DIRETOR.esgoto;return Math.max(0,Math.min(1,minutos/(a.horasParaMax*60)));}
export function chanceEncontro(amb,minutos){const a=AMBIENTES_DIRETOR[amb]||AMBIENTES_DIRETOR.esgoto;return Math.min(.85,a.base+a.crescimento*tensao(amb,minutos));}

// Escolhe um evento; `existe(tipo,id)` diz se a criatura/NPC/objeto está no banco.
export function sortearEvento(amb,minutos,rnd=Math.random,existe=()=>true){
 const a=AMBIENTES_DIRETOR[amb]||AMBIENTES_DIRETOR.esgoto,t=tensao(amb,minutos);
 const viaveis=a.eventos.filter(e=>t>=e.tensao&&[...(e.criaturas||[]).filter(c=>c[1]>0).map(c=>existe('criaturas',c[0])),...(e.npcs||[]).map(n=>existe('npcs',n[0])),...(e.objetos||[]).map(o=>existe('objetos',o[0]))].every(Boolean));
 if(!viaveis.length)return null;
 const peso=e=>e.peso*(e.gravidade>=2?(1+t*1.6*(e.gravidade-1)):e.gravidade===0?(1.25-t*.7):1);
 const total=viaveis.reduce((s,e)=>s+peso(e),0);let x=rnd()*total;
 for(const e of viaveis){x-=peso(e);if(x<=0)return materializar(e,rnd,existe);}
 return materializar(viaveis.at(-1),rnd,existe);
}
function materializar(e,rnd,existe){
 const n=([id,a=1,b=a])=>({id,qtd:a+Math.floor(rnd()*(b-a+1))});
 return {...e,criaturas:(e.criaturas||[]).map(n).filter(c=>c.qtd>0&&existe('criaturas',c.id)),npcs:(e.npcs||[]).map(([id])=>({id})),objetos:(e.objetos||[]).map(n),chave:e.id+':'+Math.floor(rnd()*1e9)};
}
export function sortearClima(amb,rnd=Math.random){
 const a=AMBIENTES_DIRETOR[amb]||AMBIENTES_DIRETOR.esgoto,tot=a.climas.reduce((s,c)=>s+c.peso,0);let x=rnd()*tot;
 for(const c of a.climas){x-=c.peso;if(x<=0)return c;}return a.climas[0];
}

// ---------------------------------------------------------------- gerador de NPC
export const ESPECIES_NPC={
 humano:{nome:'Humano',raca:'Humano',silabas:[['Ka','Lo','Mi','Ra','Te','Vo','Ze','An','Ia','Do','Sa','Ne'],['ren','la','vio','mar','dan','sel','ra','nor','lia','tes','vek','mon']],sobrenomes:['Venn','Rasco','Holt','Varn','Tessar','Korr','Vale','Dren','Saro','Mallen']},
 reptiliano:{nome:'Reptiliano',raca:'Reptiliano',silabas:[['Gru','Sa','Thra','Ka','Sss','Bo','Ze'],['llok','rk','sh','zza','ran','gor','tok']],sobrenomes:['Tann','da Pedra Quente','Garra-Lenta','do Pântano']},
 insetoide:{nome:'Insetoide',raca:'Insetoide',silabas:[["T'k","Kesh","Zz'","Kra","Ix","Tch'"],['ar','ra','esh','iik','ven','tak']],sobrenomes:['Var','da Colmeia Seca','Kel','Tikk']},
 nymari:{nome:'Nymari',raca:'Nymari',silabas:[['Me','Rha','Ny','Si','Ta','Lo'],['ral','kel','ri','mi','na','ti']],sobrenomes:['-Ti','-Kel','-Ora','-Vin']},
 zutariano:{nome:'Zutariano',raca:'Zutariano',silabas:[['Tor','Ul','Bek','Gra','Mo'],['vask','ka','dor','ren','lo']],sobrenomes:['Vask','Ren','Doran','Pick']},
 grey:{nome:'Grey',raca:'Grey Alto',silabas:[['O','Za','Pe','Ul','Iz'],['mm','rn','ll','aru','ix']],sobrenomes:['','','Aru','Senn']},
 talassio:{nome:'Talássio',raca:'Talássio',silabas:[['Oru','Pel','Mar','Sel','Aqu'],['ell','u','is','ana','o']],sobrenomes:['Pell','das Cisternas','Maro']},
 robo:{nome:'Robô',raca:'Robô',silabas:[['UR-','KX-','VT-','Q-','ZE-','MK-'],['11','27','42','7','90','3','58']],sobrenomes:['','','Mercador','Unidade de troca']}, // v160
 aeral:{nome:'Aeral',raca:'Aeral',silabas:[['Sey','Ka','Ve','Li','Ae'],['ra','keth','lis','ra','wen']],sobrenomes:['Keth','Alto-Vento','Lirr']}
};
export const PAPEIS_NPC={
 civil:{nome:'Civil',carreiras:['Comerciante de esquina','Cozinheiro','Carregador','Artesão','Estudante'],pericias:{Percepção:[25,45],Comércio:[20,45],Influência:[15,35],Esquiva:[15,30]},armas:['','Faca pequena']},
 comerciante:{nome:'Comerciante',carreiras:['Mercador','Cambista','Antiquário','Contrabandista'],pericias:{Comércio:[45,70],Avaliação:[35,60],Influência:[30,55],Percepção:[30,50]},armas:['Blaster de Palma','Faca Utilitária']},
 guarda:{nome:'Guarda / soldado',carreiras:['Guarda urbana','Soldado','Segurança particular'],pericias:{Percepção:[35,55],Atletismo:[30,50],Esquiva:[30,50],Intimidação:[25,45]},especializacoes:{'Pistolas Laser':[35,60]},armas:['Pistola Laser','Rifle Laser','Lança de Choque']},
 criminoso:{nome:'Criminoso',carreiras:['Ladrão','Capanga','Contrabandista','Informante'],pericias:{Furtividade:[40,65],Submundo:[35,60],Esquiva:[30,50],Enganação:[30,55]},armas:['Faca Utilitária','Pistola Laser']},
 tecnico:{nome:'Técnico',carreiras:['Mecânico','Técnico de energia','Médico de rua','Engenheiro'],pericias:{Mecânica:[40,65],Eletrônica:[30,60],Engenharia:[25,50],'Primeiros Socorros':[20,45]},armas:['Ferramenta elétrica','']},
 andarilho:{nome:'Andarilho',carreiras:['Caçador','Batedor','Catador','Peregrino'],pericias:{Sobrevivência:[40,65],Rastrear:[35,60],Percepção:[35,55],Furtividade:[30,50]},armas:['Faca Utilitária','Rifle Laser']}
};
const MOTIVACOES=['Pagar uma dívida antiga','Proteger a família','Ficar rico rápido','Descobrir o que aconteceu com um irmão desaparecido','Sair de Véspera','Ganhar respeito no bairro','Esconder um segredo do passado','Servir quem paga melhor','Encontrar uma relíquia imperial'];
const TRACOS=['fala rápido e gesticula muito','desconfia de estrangeiros','tem uma cicatriz no rosto e conta uma história diferente sobre ela a cada vez','é extremamente educado','ri de nervoso','coleciona pequenas peças de sucata','nunca tira as luvas','cheira a óleo de máquina','tem um animal de estimação estranho'];
const pick=(a,r)=>a[Math.floor(r()*a.length)];
export function gerarNpc({especie='',papel='',rnd=Math.random}={}){
 const e=ESPECIES_NPC[especie]||ESPECIES_NPC[pick(Object.keys(ESPECIES_NPC),rnd)],p=PAPEIS_NPC[papel]||PAPEIS_NPC[pick(Object.keys(PAPEIS_NPC),rnd)];
 const nome=(pick(e.silabas[0],rnd)+pick(e.silabas[1],rnd)+' '+pick(e.sobrenomes,rnd)).replace(/ -/,'-').trim();
 const sexo=pick(['M','F','N'],rnd),idade=String(18+Math.floor(rnd()*45));
 const d6=()=>1+Math.floor(rnd()*6),at=()=>d6()+d6()+d6();
 const attrs={FOR:at(),CON:at(),TAM:Math.max(6,at()),DES:at(),INT:Math.max(8,at()),POD:at(),CAR:at()};
 if(e.raca==='Zutariano')attrs.TAM=Math.max(5,attrs.TAM-3);if(e.raca==='Reptiliano'){attrs.FOR+=2;attrs.TAM+=2;}
 const faixa=([a,b])=>a+Math.floor(rnd()*(b-a+1));
 const pericias=Object.entries(p.pericias).map(([k,v])=>`${k}:${faixa(v)}`).join('|');
 const especs=Object.entries(p.especializacoes||{}).map(([k,v])=>`${k}:${faixa(v)}`).join('|');
 const arma=pick(p.armas,rnd),carreira=pick(p.carreiras,rnd),motivacao=pick(MOTIVACOES,rnd),traco=pick(TRACOS,rnd);
 const id='npc_'+nome.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')+'_'+Math.floor(rnd()*1e4);
 return {id,nome,tipo:'NPC',raca:e.raca,sexo,idade,carreira,conceito:`${carreira} que ${traco}`,classeSocial:pick(['Baixa','Média','Média','Alta'],rnd),sociedade:'Véspera',
  ...Object.fromEntries(Object.entries(attrs).map(([k,v])=>[k,String(v)])),motivacao,periciasTexto:pericias,especializacoesTexto:especs,armasTexto:arma,selecionavelCombate:'true',
  descricao:`${e.nome} ${sexo==='F'?'adulta':'adulto'}, ${carreira.toLowerCase()}. ${traco[0].toUpperCase()+traco.slice(1)}. Motivação: ${motivacao.toLowerCase()}.`};
}
