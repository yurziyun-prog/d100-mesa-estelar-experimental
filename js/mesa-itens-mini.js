// Mesa Estelar v192 — Miniaturas dos itens do mercado, vistas de cima, no mesmo traço dos objetos e miniaturas do mapa.
//
// Cada item do Banco (armas, ferramentas, kits, munição, armaduras, comida, tecnologia…) ganha um desenho pequeno,
// em SVG gerado no navegador (nada para baixar): contorno escuro, cores apagadas e sombra caindo para sudeste, como o resto do mapa.
// Aparece no chão do mapa (itens soltos), no painel de equipamento e onde o item não tem imagem própria.
// O tipo do desenho vem do id, do nome e da categoria do item; item que não se reconhece vira uma caixinha de suprimentos.

const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
export const TIPOS_MINI=['pistola','rifle','espada_energia','espada','faca','machado','picareta','kit_medico','nanogel','antidoto','bateria','municao','armadura','capacete','racao','agua','cafe','cerveja','lanterna','comunicador','drone','mochila','chave','respirador','oxigenio','ferramentas','extintor','scanner','corda','roupa','granada','abrigo','gerador','cortador','soldador','eletronica','escalada','robotica','sobrevivencia','mecanica','binoculos','navegador','amostras','radio','terminal','lanca','reliquia','antena','lobo','galinha','dragao','caixa'];
// Tipo do desenho de um item. Ordem importa: o mais específico primeiro.
export function tipoMini(item){
 const t0=tipoPorNome(item);
 if(t0!=='caixa'&&t0!=='ferramentas'&&t0!=='comunicador'&&t0!=='scanner')return t0;
 return refinarPelaDescricao(item,t0);
}
function tipoPorNome(item){
 const id=sem(item?.idBanco||item?.id||''),nome=sem(item?.nome||item?.name||''),cat=sem(item?.categoria||''),t=id+' '+nome;
 if(/lobo|\bcao\b|cachorro/.test(t)&&!/lobo.?estelar/.test(t))return 'lobo';
 if(/galinha|frango|pinto\b|\bave\b/.test(t))return 'galinha';
 if(/dragao|dragon|trombeta/.test(t))return 'dragao';
 if(/espada.?forca|sabre.?(de )?energia|lamina.?(de )?energia|sabre.?laser|espada.?laser|katana.?energia/.test(t))return 'espada_energia';
 if(/celula.?(de )?lamina|bateria|celula.?(de )?energia|pilha|\bcell\b/.test(t))return 'bateria';
 if(/cartucho|municao|carregador|projet/.test(t)||cat==='municao')return 'municao';
 if(/granada|explosiv|bomba|mina\b/.test(t))return 'granada';
 if(/pistola|revolver|blaster.?(de )?palma|phaser.*pistola|pistol/.test(t))return 'pistola';
 if(/rifle|carabina|escopeta|escopet|fuzil|lancador|canhao|gauss|blaster|phaser|laser/.test(t)&&cat!=='municao'&&!/bateria|celula/.test(t))return 'rifle';
 if(/sabre|espada|lamina|katana/.test(t))return 'espada';
 if(/faca|adaga|punhal|canivete/.test(t))return 'faca';
 if(/machado/.test(t))return 'machado';
 if(/picareta|marreta|martelo/.test(t))return 'picareta';
 if(/nanogel/.test(t))return 'nanogel';
 if(/antidoto|seringa|injet|vacina/.test(t))return 'antidoto';
 if(/kit.*(medic|socorro)|medic|curativo|bandagem|analisador.?biomedico/.test(t)||cat.includes('medic'))return 'kit_medico';
 if(/capacete|elmo|helm/.test(t))return 'capacete';
 if(/armadura|colete|biomesh|blindag|escudo/.test(t)||cat==='armaduras')return 'armadura';
 if(/respirador|mascara/.test(t))return 'respirador';
 if(/oxigenio/.test(t))return 'oxigenio';
 if(/extintor|espuma/.test(t))return 'extintor';
 if(/cafe|coffee|energetic/.test(t))return 'cafe';
 if(/cerveja|beer|bebida|vinho/.test(t))return 'cerveja';
 if(/agua|water|cantil|bolsa.?(de )?agua/.test(t))return 'agua';
 if(/comida|racao|refeicao|alimento|lanche/.test(t)||cat.includes('alimento')||cat==='comida')return 'racao';
 if(/lanterna|holofote|farol/.test(t))return 'lanterna';
 if(/drone/.test(t))return 'drone';
 if(/mochila|bolsa|cinto|alforje/.test(t))return 'mochila';
 if(/chave\b|key\b|cartao.?(de )?acesso/.test(t))return 'chave';
 if(/comlink|comunicador|radio|datalink|terminal|tradutor|keypad|navegador|computador|tablet|scanner|sonda|binoculos|analisador/.test(t)||cat.includes('tecnologia')||cat.includes('comunica')||cat.includes('cientifico'))return /scanner|sonda|analisador|binoculos/.test(t)?'scanner':'comunicador';
 if(/corda|cabo|rede\b|algema/.test(t))return 'corda';
 if(/roupa|capa\b|botas|chapeu|luva|viajante/.test(t)||cat==='roupas')return 'roupa';
 if(/kit|ferrament|soldador|cortador|gerador|manutencao|sobrevivencia|escalada|abrigo/.test(t)||cat.includes('ferrament')||cat.includes('sobreviv')||cat.includes('explora')||cat.includes('energia'))return 'ferramentas';
 return 'caixa';
}
// lê nome + descrição para os itens que o nome sozinho não define (kits, ferramentas, aparelhos)
function refinarPelaDescricao(item,t0){
 const t=sem((item?.id||'')+' '+(item?.nome||item?.name||'')+' '+(item?.descricao||item?.description||''));
 const R=[[/abrigo|tenda|barraca|acampamento/,'abrigo'],[/gerador|alimentar ou recarregar|fonte portatil/,'gerador'],[/cortador|termica? para cortar|macarico/,'cortador'],[/soldador|\bsolda\b/,'soldador'],
  [/eletronic|circuito/,'eletronica'],[/escalad|rapel/,'escalada'],[/robotic|servomecan/,'robotica'],[/sobreviv/,'sobrevivencia'],[/mecanic|manutenc|desmontagem|chave inglesa/,'mecanica'],[/binocul|longa distancia/,'binoculos'],
  [/navegad|navegacao|balizas|mapas/,'navegador'],[/amostra|coletar/,'amostras'],[/radio|longo alcance/,'radio'],[/terminal|computador|acesso remoto/,'terminal'],[/lanca|haste/,'lanca'],[/reliquia|desconhecid/,'reliquia'],
  [/datalink|largura de banda|antena|transmite dados/,'antena'],[/analisa|sonda|scanner|reconhecimento/,'scanner'],[/comunic|tradu|comlink/,'comunicador']];
 for(const [re,tp] of R)if(re.test(t))return tp;
 return t0;
}
const O='#15110d',SW=1.6; // contorno escuro comum
// atributos extras sobrescrevem os padrão (XML não aceita atributo repetido)
const atr=(base,extra)=>{const m={...base};for(const x of String(extra||'').matchAll(/([w-]+)="([^"]*)"/g))m[x[1]]=x[2];return Object.entries(m).map(([k,v])=>k+'="'+v+'"').join(' ');};
const poly=(pts,f,extra='')=>'<polygon '+atr({points:pts,fill:f,stroke:O,'stroke-width':SW,'stroke-linejoin':'round'},extra)+'/>';
const rect=(x,y,w,h,f,r=2,extra='')=>'<rect '+atr({x,y,width:w,height:h,rx:r,fill:f,stroke:O,'stroke-width':SW},extra)+'/>';
const ell=(x,y,rx,ry,f,extra='')=>'<ellipse '+atr({cx:x,cy:y,rx,ry,fill:f,stroke:O,'stroke-width':SW},extra)+'/>';
const circ=(x,y,r,f,extra='')=>'<circle '+atr({cx:x,cy:y,r,fill:f,stroke:O,'stroke-width':SW},extra)+'/>';
const luz=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(w,h)/2}" fill="${c}" opacity=".92"/>`;
const DESENHOS={
 pistola:()=>rect(10,22,38,12,'#4a4e56',3)+rect(44,25,10,6,'#2a2d33',2)+poly('16,34 28,34 25,52 14,52','#363a42')+rect(14,24,18,3,'#6a707a',1,'stroke="none"')+luz(30,28,12,2.5,'#3ee3ff')+rect(12,44,10,5,'#2a2d33',1,'stroke="none"')+circ(53,28,1.7,'#15110d','stroke="none"'),
 rifle:()=>rect(4,26,18,12,'#5a4632',4)+rect(5,33,15,4,'#4a3826',2,'stroke="none"')+rect(20,27,28,9,'#4a4e56',2)+rect(46,29,15,4,'#2a2d33',1.5)+rect(26,22,14,5,'#2e3a48',2)+rect(30,20,4,3,'#6a707a',1,'stroke="none"')+rect(24,36,6,13,'#363a42',2)+luz(30,30,14,2.5,'#3ee3ff'),
 espada_energia:()=>rect(6,27,14,10,'#4a4e56',3)+rect(18,22,5,20,'#8a8f99',2)+ell(41,32,21,6.5,'#7fe9ff','opacity=".22" stroke="none"')+rect(23,29,36,6,'#7fe9ff',3,'opacity=".95"')+rect(25,30.6,32,2.8,'#ffffff',1.4,'stroke="none"'),
 espada:()=>rect(5,28,12,8,'#5a4632',3)+rect(15,22,5,20,'#9a7a3a',2)+poly('20,28 58,30.5 60,32 58,33.5 20,36','#c8cdd4')+poly('23,30.4 56,31.7 56,32.6 23,31.3','#eef2f6','stroke="none"'),
 faca:()=>rect(8,29,16,7,'#5a4632',3)+rect(22,27,4,11,'#8a8f99',1.5)+poly('26,28 50,31 54,33 50,35 26,37','#c8cdd4')+poly('28,30.5 48,32.5 48,33.1 28,31.1','#eef2f6','stroke="none"'),
 machado:()=>rect(6,30,40,5,'#7a5632',2)+poly('40,18 56,14 58,33 56,50 40,46 46,32','#9aa0aa')+poly('42,20 52,17 53,30 45,29','#c8cdd4','stroke="none"')+rect(8,31,36,2,'#5a4028',1,'stroke="none"'),
 picareta:()=>rect(6,30,44,5,'#7a5632',2)+poly('42,14 56,22 60,26 54,24 46,22 40,26','#9aa0aa')+poly('42,50 56,42 60,38 54,40 46,42 40,38','#9aa0aa')+rect(8,31,40,2,'#5a4028',1,'stroke="none"'),
 kit_medico:()=>rect(10,16,44,32,'#e8e4da',6)+rect(10,16,44,7,'#c0392b',4)+rect(28,26,8,18,'#c0392b',1.5,'stroke="none"')+rect(23,31,18,8,'#c0392b',1.5,'stroke="none"')+rect(26,12,12,6,'#8a8f99',2)+rect(12,42,40,4,'#c8bfb0',2,'stroke="none"')+rect(46,18,6,3,'#8a8f99',1.5,'stroke="none"'),
 nanogel:()=>rect(10,24,36,16,'#4aa882',7)+rect(44,27,12,10,'#cfd6dc',3)+rect(14,27,24,5,'#a8f0d0',2,'stroke="none" opacity=".8"')+rect(12,35,32,3,'#2e7a58',4,'stroke="none"'),
 antidoto:()=>rect(8,28,34,9,'#d8f0e8',4)+rect(40,29.5,10,6,'#8a8f99',1.5)+poly('50,31 60,32.5 50,34','#c8cdd4')+rect(12,30,22,5,'#58d08a',2,'stroke="none"'),
 bateria:()=>rect(10,20,44,24,'#3a4252',6)+rect(52,28,6,8,'#8a8f99',2)+rect(14,24,12,16,'#35e0c2',3,'stroke="none"')+poly('34,24 28,34 33,34 30,42 40,31 34,31 38,24','#ffd54a','stroke="none"')+rect(12,22,40,3,'#5a6478',2,'stroke="none"')+rect(12,40,40,3,'#232936',2,'stroke="none"'),
 municao:()=>[0,1,2].map(i=>rect(8+i*13,14,9,32,'#c9a63a',3.5)+poly(`${8+i*13},14 ${17+i*13},14 ${12.5+i*13},7`,'#b5723a')).join('')+rect(8,46,35,5,'#5a4632',2)+rect(9,47,33,1.8,'#e8d28a',1,'stroke="none"'),
 granada:()=>circ(30,34,16,'#4f6a3a')+rect(25,14,10,8,'#8a8f99',2)+circ(42,18,5,'none','stroke-width="2"')+rect(18,30,24,3,'#2e3d22',1,'stroke="none"')+circ(24,27,5,'#6a8a4a','opacity=".8"'),
 armadura:()=>poly('14,16 26,10 38,10 50,16 54,34 46,52 18,52 10,34','#4a5260')+poly('22,20 42,20 40,44 24,44','#5e697a')+rect(28,24,8,14,'#2e3440',2)+[[18,22],[46,22],[20,48],[44,48]].map(([x,y])=>circ(x,y,1.6,'#8a95a5','stroke="none"')).join(''),
 capacete:()=>circ(32,32,19,'#5a6270')+rect(14,28,36,12,'#1d2631',6)+luz(18,31,28,3,'#3ee3ff')+circ(32,32,19,'none','stroke-width="1" opacity=".5"')+poly('20,21 28,14 36,14 44,21','#788292','opacity=".55"'),
 racao:()=>rect(10,18,44,28,'#8a7a4a',5)+rect(10,18,44,9,'#c2b27a',4)+rect(18,31,28,9,'#e8e0c0',2,'stroke="none"')+luz(22,34,20,3,'#a84a32')+rect(12,20,3,24,'#6a5a34',1,'stroke="none"')+rect(49,20,3,24,'#6a5a34',1,'stroke="none"'),
 agua:()=>rect(18,12,28,40,'#4a8ec8',9,'opacity=".95"')+rect(24,8,16,8,'#cfd6dc',3)+rect(22,24,20,14,'#bfe3ff',3,'stroke="none" opacity=".7"')+rect(21,38,22,3,'#2f6a9a',2,'stroke="none"'),
 cafe:()=>circ(30,32,17,'#e8e4da')+circ(30,32,12,'#5a3a22')+rect(44,26,12,12,'none',6,'stroke-width="3.2"')+circ(30,32,12,'none','stroke="#2a1a10" stroke-width="1" opacity=".5"')+'<path d="M24 18 Q27 13 24 8 M32 16 Q35 11 32 6" stroke="#c8cdd4" stroke-width="1.8" fill="none" opacity=".8" stroke-linecap="round"/>',
 cerveja:()=>rect(14,18,28,32,'#d8a838',6)+rect(14,18,28,10,'#fff2c8',5)+rect(40,24,12,16,'none',7,'stroke-width="3.2"')+rect(17,30,22,3,'#b8862a',1,'stroke="none"')+rect(17,38,22,3,'#b8862a',1,'stroke="none"'),
 lanterna:()=>rect(8,26,36,12,'#3a4252',4)+rect(42,23,14,18,'#2a2d33',3)+rect(54,26,5,12,'#ffe27a',2.5)+luz(14,29,18,3,'#6a707a')+'<path d="M60 24 L64 21 M60 32 L64 32 M60 40 L64 43" stroke="#ffe27a" stroke-width="1.6" fill="none" opacity=".8" stroke-linecap="round"/>',
 comunicador:()=>rect(14,10,36,44,'#2e3440',6)+rect(18,14,28,22,'#35e0c2',3,'opacity=".85"')+circ(24,44,3.5,'#c0392b')+circ(34,44,3.5,'#ffd54a')+circ(44,44,3.5,'#58d08a')+rect(20,18,24,2,'#e8fff8',1,'stroke="none"')+rect(20,23,16,2,'#e8fff8',1,'stroke="none"')+'<line x1="44" y1="10" x2="44" y2="3" stroke="#8a8f99" stroke-width="2"/><circle cx="44" cy="3" r="1.8" fill="#3ee3ff"/>',
 drone:()=>`<path d="M16 16 L48 48 M48 16 L16 48" stroke="${O}" stroke-width="6" stroke-linecap="round"/><path d="M16 16 L48 48 M48 16 L16 48" stroke="#5a6270" stroke-width="3.4" stroke-linecap="round"/>`+[[16,16],[48,16],[16,48],[48,48]].map(([x,y])=>circ(x,y,8,'#8a8f99','opacity=".85"')).join('')+rect(24,24,16,16,'#2e3440',4)+circ(32,32,3,'#3ee3ff')+circ(32,32,6,'none','stroke="#3ee3ff" stroke-width="1" opacity=".5"'),
 mochila:()=>rect(14,10,36,44,'#5a6a4a',10)+rect(20,36,24,14,'#47563a',4)+rect(24,14,16,8,'#47563a',3)+rect(28,38,8,4,'#c9a63a',1.5)+rect(18,12,5,40,'#3f4c34',2,'stroke="none"')+rect(41,12,5,40,'#3f4c34',2,'stroke="none"'),
 chave:()=>circ(16,32,10,'#c9a63a')+circ(16,32,4,'#15110d')+rect(24,30,32,5,'#c9a63a',2)+rect(44,35,5,8,'#c9a63a',1.5)+rect(52,35,5,6,'#c9a63a',1.5),
 respirador:()=>poly('10,22 54,22 50,46 38,52 26,52 14,46','#5a6270')+rect(24,30,16,14,'#2e3440',6)+circ(14,34,5,'#8a8f99')+circ(50,34,5,'#8a8f99'),
 oxigenio:()=>rect(10,22,44,22,'#4a8ec8',11)+rect(50,28,8,10,'#8a8f99',2)+rect(24,18,8,6,'#cfd6dc',2)+luz(16,30,30,4,'#e8f4ff'),
 ferramentas:()=>rect(8,20,48,28,'#b5483a',5)+rect(24,14,16,9,'none',4,'stroke-width="3"')+rect(8,31,48,4,'#6a2a22',1,'stroke="none"')+rect(10,22,44,4,'#d86a5a',2,'stroke="none"')+rect(28,29,8,8,'#c9a63a',2),
 extintor:()=>rect(16,22,32,20,'#c0392b',9)+rect(44,26,12,12,'#2a2d33',3)+rect(10,27,10,10,'#cfd6dc',3)+circ(30,32,5,'#8a8f99'),
 scanner:()=>rect(10,22,38,20,'#3a4252',5)+rect(46,26,12,12,'#2a2d33',6)+rect(14,26,22,12,'#35e0c2',3,'opacity=".8"')+circ(52,32,3,'#ffd54a'),
 corda:()=>`<circle cx="32" cy="32" r="16" fill="none" stroke="${O}" stroke-width="9"/><circle cx="32" cy="32" r="16" fill="none" stroke="#c2a468" stroke-width="6"/><circle cx="32" cy="32" r="9" fill="none" stroke="#c2a468" stroke-width="4"/>`,
 roupa:()=>poly('12,18 24,12 40,12 52,18 56,30 46,32 46,52 18,52 18,32 8,30','#6a5a8a')+rect(26,12,12,8,'#4a3f66',3),
 abrigo:()=>poly('8,50 32,10 56,50','#6a7a5a')+poly('26,50 32,28 38,50','#3f4a37')+rect(30,10,4,40,'#4a5440',1,'stroke="none" opacity=".6"')+circ(32,10,2.5,'#c9a63a'),
 gerador:()=>rect(8,20,48,28,'#5a6270',5)+rect(12,25,20,18,'#2e3440',3)+circ(44,34,8,'#ffd54a')+poly('45,28 40,35 44,35 42,41 49,33 45,33 47,28','#15110d','stroke="none"')+luz(14,28,16,2.5,'#35e0c2')+rect(34,42,3,4,'#232936',1,'stroke="none"')+rect(40,42,3,4,'#232936',1,'stroke="none"')+rect(46,42,3,4,'#232936',1,'stroke="none"'),
 cortador:()=>rect(6,29,30,9,'#8a8f99',3)+rect(34,25,12,17,'#3a4252',3)+poly('46,30 60,33 46,37','#ff9a3a')+poly('50,32 58,33 50,35','#fff2a8','stroke="none"')+rect(12,38,6,12,'#363a42',2),
 soldador:()=>rect(5,30,36,8,'#3a4252',3.5)+rect(34,31,8,6,'#c9a63a',2)+poly('42,32 56,34 42,36','#c8cdd4')+circ(57,34,3.2,'#ff7a2a')+luz(10,32,18,2.5,'#6a707a'),
 eletronica:()=>rect(9,12,46,40,'#2e7a4a',4)+rect(24,24,16,16,'#15110d',2)+[[14,18,24,18],[14,46,22,46],[50,20,40,24],[50,44,40,40]].map(l=>'<path d="M'+l[0]+' '+l[1]+' L'+l[2]+' '+l[3]+'" stroke="#c9d86a" stroke-width="1.8" fill="none"/>').join('')+circ(14,18,2.2,'#c9d86a','stroke="none"')+circ(50,44,2.2,'#c9d86a','stroke="none"')+luz(28,30,8,2,'#35e0c2'),
 escalada:()=>'<circle cx="26" cy="34" r="16" fill="none" stroke="'+O+'" stroke-width="8"/><circle cx="26" cy="34" r="16" fill="none" stroke="#c0392b" stroke-width="5"/><circle cx="26" cy="34" r="9" fill="none" stroke="#e8e4da" stroke-width="3.4"/>'+rect(40,14,14,26,'none',7,'stroke="#9aa0aa" stroke-width="4"')+rect(38,34,18,5,'#8a8f99',2),
 robotica:()=>[0,45,90,135].map(a=>'<rect x="27" y="8" width="10" height="48" rx="3" fill="#8a8f99" stroke="'+O+'" stroke-width="1.6" transform="rotate('+a+' 32 32)"/>').join('')+circ(32,32,16,'#9aa0aa')+circ(32,32,7,'#2e3440')+circ(32,32,2.5,'#3ee3ff'),
 sobrevivencia:()=>circ(24,38,15,'#c9a63a')+circ(24,38,11,'#e8e4da')+poly('24,28 27,38 24,48 21,38','#c0392b')+rect(40,12,9,40,'#5a4632',3)+poly('40,12 49,12 44.5,3','#c8cdd4'),
 mecanica:()=>rect(6,28,38,9,'#9aa0aa',4)+circ(49,32.5,10,'#9aa0aa')+rect(49,27,14,11,'#2a2d33',1,'stroke="none"')+circ(49,32.5,4.5,'#3a4252')+luz(10,31,22,2,'#c8cdd4'),
 binoculos:()=>circ(20,36,13,'#3a4252')+circ(44,36,13,'#3a4252')+circ(20,36,8,'#7fb4ff','opacity=".85"')+circ(44,36,8,'#7fb4ff','opacity=".85"')+rect(26,24,12,10,'#5a6270',3)+rect(14,12,12,12,'#2e3440',3)+rect(38,12,12,12,'#2e3440',3),
 navegador:()=>rect(14,8,36,48,'#3a4252',7)+circ(32,28,12,'#e8e4da')+poly('32,18 36,28 32,38 28,28','#c0392b')+rect(20,44,24,6,'#35e0c2',2,'opacity=".85"'),
 amostras:()=>rect(10,38,44,10,'#5a4632',3)+rect(13,10,10,38,'#bfe3ff',5,'opacity=".95"')+rect(27,10,10,38,'#a8f0d0',5,'opacity=".95"')+rect(41,10,10,38,'#ffd1a8',5,'opacity=".95"')+rect(14,26,8,20,'#4aa8e8',4,'stroke="none"')+rect(28,22,8,24,'#3ec88a',4,'stroke="none"')+rect(42,30,8,16,'#e89a4a',4,'stroke="none"'),
 radio:()=>rect(12,22,38,32,'#3a4252',5)+rect(42,4,4,20,'#8a8f99',1.5)+circ(24,38,8,'#2e3440')+circ(24,38,3,'#6a707a')+rect(34,28,12,8,'#35e0c2',2,'opacity=".85"')+circ(38,46,3,'#ffd54a'),
 terminal:()=>rect(8,14,48,30,'#2e3440',3)+rect(12,18,40,22,'#35e0c2',2,'opacity=".85"')+rect(4,46,56,9,'#5a6270',3)+rect(26,49,12,3,'#2e3440',1.5,'stroke="none"')+luz(15,22,22,2.5,'#e8fff8')+luz(15,28,14,2.5,'#e8fff8'),
 lanca:()=>rect(3,30,50,4,'#7a5632',2)+poly('50,26 63,32 50,38','#c8cdd4')+rect(44,29,8,6,'#3a4252',2)+luz(46,30.5,5,3,'#7fe9ff'),
 reliquia:()=>poly('32,6 48,22 42,54 22,54 16,22','#b58cff')+poly('32,6 48,22 32,28 16,22','#d6bcff')+poly('32,28 42,54 22,54','#8a5fe0')+luz(28,32,8,3,'#ffffff')+circ(32,41,2,'#ffffff','opacity=".9" stroke="none"'),
 antena:()=>circ(30,36,19,'#8a8f99')+circ(30,36,12,'#5a6270')+circ(30,36,3,'#3ee3ff')+rect(44,8,4,26,'#8a8f99',1.5)+circ(46,8,4,'#ffd54a'),
 lobo:()=>poly('10,30 4,38 14,40','#6a707a')+ell(32,38,12,19,'#8a8f99')+ell(32,40,7,11,'#b9bec6','stroke="none" opacity=".6"')+poly('20,52 12,62 22,58','#6a707a')+circ(32,16,9,'#8a8f99')+poly('24,10 22,2 30,8','#6a707a')+poly('40,10 42,2 34,8','#6a707a')+ell(32,22,4,3,'#2e3440')+circ(28,15,1.6,'#15110d','stroke="none"')+circ(36,15,1.6,'#15110d','stroke="none"'),
 galinha:()=>ell(32,36,15,18,'#f2efe6')+poly('32,52 28,62 36,62','#e8e4da')+ell(20,38,6,11,'#dcd8cc','stroke="none"')+ell(44,38,6,11,'#dcd8cc','stroke="none"')+circ(32,16,8,'#f2efe6')+poly('29,8 32,1 35,8','#c0392b')+poly('29,20 32,26 35,20','#e89a3a')+circ(28,15,1.5,'#15110d','stroke="none"')+circ(36,15,1.5,'#15110d','stroke="none"'),
 dragao:()=>poly('32,40 24,60 40,60','#4a8a5a')+poly('28,26 2,34 8,48 24,40','#7ab87a')+poly('36,26 62,34 56,48 40,40','#7ab87a')+ell(32,34,9,19,'#4a8a5a')+ell(32,36,5,12,'#d9cf8a','stroke="none" opacity=".8"')+circ(32,13,9,'#5a9a6a')+circ(27,12,3.4,'#ffd54a')+circ(37,12,3.4,'#ffd54a')+circ(27,12,1.4,'#15110d','stroke="none"')+circ(37,12,1.4,'#15110d','stroke="none"')+poly('27,5 25,0 30,4','#d9b36a')+poly('37,5 39,0 34,4','#d9b36a'),
 caixa:()=>rect(12,14,40,36,'#8a6a3a',4)+rect(12,14,40,10,'#a98550',4)+rect(28,24,8,26,'#6a4a22',1,'stroke="none" opacity=".6"')+rect(12,30,40,4,'#6a4a22',1,'stroke="none" opacity=".6"')+luz(19,17,11,3,'#c9a63a')
};
const cache=new Map();
export function svgMini(tipo){
 const d=DESENHOS[tipo]||DESENHOS.caixa;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><defs><filter id="s" x="-20%" y="-20%" width="150%" height="150%"><feDropShadow dx="2" dy="3" stdDeviation="1.6" flood-color="#000" flood-opacity=".5"/></filter></defs><g filter="url(#s)">${d()}</g></svg>`;
}
// Miniatura do item como data URL (guardada em cache). Bilhetes ficam de fora (têm o próprio desenho).
export function miniaturaDeItem(item){
 if(!item||item.tipo==='nota')return '';const tipo=tipoMini(item);
 if(!cache.has(tipo))cache.set(tipo,'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svgMini(tipo)));
 return cache.get(tipo);
}
