// Mesa Estelar v112 — Tamanhos reais (dados puros, sem tela).
//
// 1) Diâmetro da miniatura de cada criatura/NPC a partir do tamanho da ficha
//    (categoria "Pequeno/Médio/Grande/Enorme/Titânico…", altura em metros e TAM).
// 2) Medidas reais para móveis do Banco de Objetos que estavam grandes demais
//    (sofás de 4 m, camas de 2,5 m, cadeiras de 1 m…). Só troca quem ainda está
//    exatamente com a medida antiga: o que o mestre ajustou à mão fica como está.

const sem=s=>String(s??'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
const num=v=>{const m=String(v??'').replace(',','.').match(/\d+(?:\.\d+)?/);return m?Number(m[0]):NaN;};

const CATEGORIAS=[
 [/titan|colossal/,8],[/gigantesc|gargantu/,5.5],[/enorme/,4],[/muito grande/,3],[/grande/,2],
 [/pesado/,1.6],[/enxame/,1.8],[/minuscul|miuda|diminut/,.45],[/pequen/,.7],[/medi/,1]
];
// v203: tamanhos conferidos à mão (a tabela da ficha dava Cila de 3 m e Macaco de Calico de 4 m). Só vale para o id certo; o mestre muda no balão.
export const TAMANHOS_FIXOS={cila:9,criatura_de_calico_1:2.1,macacodecalico:2.1,dragao_trombeta_alado_selvagem:5,dragao_trombeta_alado_domesticado:4,dragao_trombeta_corredor_selvagem:2.8,dragao_trombeta_corredor_domesticado:2.4,besta_ululante:3,montariapterodatil:3.2,enxame_mordedor:2.2,carrapato_de_ferro:.5,parasita_carniceiro:.6,larva_interdimensional:1.4,rastejante_de_cinzas:.9,serpente_sanguessuga:2.2};
// Diâmetro (m) da base da miniatura no mapa.
export function tamanhoMiniaturaM(c={}){
 if(Number(c.diametroM)>0)return Number(c.diametroM);
 if(Object.hasOwn(TAMANHOS_FIXOS,String(c.id||'')))return TAMANHOS_FIXOS[String(c.id)];
 const cat=sem(c.tamanho||c.porte||''),alt=num(c.altura),tam=Number(c.TAM||c.atributos?.TAM);
 let d=null;
 for(const [re,v] of CATEGORIAS)if(re.test(cat)){d=v;break;}
 if(d===null){
  if(Number.isFinite(tam)&&tam>0)d=tam>=70?6:tam>=35?3:tam>=24?2.4:tam>=18?1.8:tam>=14?1.2:tam<=4?.45:tam<=7?.7:1;
  else d=1;
 }
 // Dentro da categoria, a altura informada afina o tamanho (ex.: Grande de 2,4 m × Grande de 1,6 m).
 if(Number.isFinite(alt)&&alt>0&&d>=1.6&&d<=4.5)d=Math.max(d*.8,Math.min(d*1.35,alt*.95));
 if(Number.isFinite(alt)&&alt>0&&d<1&&alt<d)d=Math.max(.35,alt*1.2);
 // v114: pessoas e criaturas médias variam um pouco em volta de 1 m (altura ou TAM da ficha)
 if(d===1){
  if(Number.isFinite(alt)&&alt>=1.1&&alt<=2.8)d=1+(alt-1.75)*.5;
  else if(Number.isFinite(tam)&&tam>0)d=1+(tam-12)*.02;
  d=Math.max(1,Math.min(1.3,d)); // v196: porte médio nunca menor que 1 m (o quadrado da grade antiga)
 }
 return Math.round(Math.max(.35,Math.min(10,d))*100)/100;
}
// Criatura que não sai do lugar (séssil, fixa ao substrato, deslocamento 0).
export function criaturaImovel(c={}){
 const t=sem([c.nome,c.descricao,c.tamanho,c.altura].join(' '));
 const d=[c.deslocamento,c.movimentoTerrestre].find(v=>v!==undefined&&v!==null&&String(v).trim()!=='');
 return (d!==undefined&&Number(d)===0&&!Number(c.movimentoVoo)&&!Number(c.movimentoNatacao))||/\bcila\b|sessil|fixa-se|fundida ao substrato/.test(t);
}
// Deslocamento (m/rodada): respeita 0 (imóvel) em vez de cair no padrão 6.
export function deslocamentoM(c={},padrao=6){
 for(const v of [c.deslocamento,c.movimentoTerrestre]){if(v===undefined||v===null||String(v).trim()==='')continue;const n=Number(v);if(Number.isFinite(n))return Math.max(0,n);}
 return criaturaImovel(c)?0:padrao;
}

// Medidas antigas → novas (largura × altura em metros), mantendo a proporção do desenho.
export const TAMANHOS_OBJETOS={
 sofavermeio:{de:[4,1.5],para:[2.4,.9]},
 sofaazul1:{de:[3,4],para:[2.1,2.8]},
 sofacinza1:{de:[4,4],para:[2.6,2.6]},
 sofahippie2:{de:[4,3],para:[2.8,2.1]},
 sofavermelho2:{de:[4,4],para:[2.6,2.6]},
 sofahippie:{de:[2,2],para:[1.8,1.8]},
 poltronaamarela1:{de:[1.5,1.5],para:[.95,.95]},
 camacasal2:{de:[2.5,2.5],para:[2,2]},
 camacasalemoouvampiro:{de:[2.5,2.5],para:[2,2]},
 camacasl1:{de:[2.5,2.5],para:[2,2]},
 cadeira1:{de:[1,1],tambem:[[.65,.65]],para:[.9,.9]}, // v120: .65 ficou com cara de cadeira de criança
 cadeira2:{de:[1,1],tambem:[[.65,.65]],para:[.9,.9]}, // v120: .65 ficou com cara de cadeira de criança
 cadeira3:{de:[1,1],tambem:[[.65,.65]],para:[.9,.9]}, // v120: .65 ficou com cara de cadeira de criança
 // v125: mesas redondas ficam com 1,5 m (o tamanho registrado). 1,3 m (correção antiga) e 1 m
 // (tamanho padrão de quando a medida não vinha) voltam para 1,5 m.
 mesa1:{de:[2.5,2.5],tambem:[[1,1],[1.3,1.3]],para:[1.5,1.5]},
 mesa2:{de:[2,2],tambem:[[1,1],[1.3,1.3]],para:[1.5,1.5]},
 mesa3:{de:[4,4],para:[3,3]},
 mesa4:{de:[5,6],para:[3,3.6]},
 esqueletos1:{de:[4,4],para:[2.2,2.2]},
 planta1:{de:[1,1],para:[.8,.8]},
 planta2:{de:[1,1],para:[.8,.8]},
 pk_sofa_couro:{de:[2.4,1],para:[2.2,.92]},
 // v134: armários e baús ficaram pequenos demais no mapa
 pk_fut_armario:{de:[1.8,.6],para:[2.7,.9]},
 pk_feu_bau:{de:[1.2,.75],para:[1.7,1.05]},
};
const igual=(a,b)=>Math.abs(Number(a)-Number(b))<.011;
const medidaAntiga=(r,w,h)=>[r.de,...(r.tambem||[])].some(([a,b])=>igual(w,a)&&igual(h,b));
// Devolve o modelo com a medida nova, ou null se não precisa (ou se foi ajustado à mão).
export function corrigirModelo(m){
 const r=TAMANHOS_OBJETOS[String(m?.id||'')];if(!r)return null;
 if(!medidaAntiga(r,m.larguraM,m.alturaM))return null;
 return {...m,larguraM:r.para[0],alturaM:r.para[1]};
}
// Objeto já colocado numa cena da mesa: troca a medida mantendo o centro (e a geometria da Oficina).
export function corrigirObjetoCena(o){
 const id=String(o?.modeloId||o?.oficinaElement?.modeloId||'').split(':').pop(),r=TAMANHOS_OBJETOS[id];if(!r)return null;
 if(!medidaAntiga(r,o.larguraM,o.alturaM))return null;
 const [w,h]=r.para,out=structuredClone(o);out.larguraM=w;out.alturaM=h;
 const b=o.oficinaBounds;if(b&&Number.isFinite(Number(b.x))){const cx=Number(b.x)+Number(b.w)/2,cy=Number(b.y)+Number(b.h)/2;out.oficinaBounds={...b,x:cx-w/2,y:cy-h/2,w,h};}
 const e=o.oficinaElement;if(e&&Number.isFinite(Number(e.x))&&Number.isFinite(Number(e.w))){const cx=Number(e.x)+Number(e.w)/2,cy=Number(e.y)+Number(e.h)/2;out.oficinaElement={...e,x:cx-w/2,y:cy-h/2,w,h};}
 return out;
}
