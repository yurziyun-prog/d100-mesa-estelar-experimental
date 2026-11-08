// Mesa Estelar v164 — "Cidade Baixa de Véspera · imagem IA": mapa feito da imagem de IA (arte/mapas/cidade-baixa.webp,
// 1466×1073 px, 20 px = 1 m → 73,3×53,65 m). Reconhecimento: casas e escadas à mão, toldos/palmeiras/riacho automáticos
// (arte-fonte/reconhecer_cidade_baixa.py + montar_cidade_baixa.py). As casas são terraços: 2º andar no mesmo mapa,
// alcançado pelas escadas de fora. O mestre corrige no Marcador (🖌️) e cria o interior de cada casa (🏠).

import {CIDADE_BAIXA_DADOS} from './mesa-mapa-cidade-baixa-dados.js?v=164';
import {estadoDeImagem} from './mesa-mapa-ia.js?v=163';

export const CIDADE_BAIXA={
 id:'v164_cidade_baixa_ia',nome:'Cidade Baixa de Véspera · imagem IA',arte:'arte/mapas/cidade-baixa.webp',acima:'arte/mapas/cidade-baixa-acima.webp',
 W:CIDADE_BAIXA_DADOS.W,H:CIDADE_BAIXA_DADOS.H,marcas:CIDADE_BAIXA_DADOS.marcas,
 // feira do meio: um vendedor para cada coisa
 vendedores:[
  {id:'comida',especie:'humano',x:24,y:27.5,loja:{ramos:['comida'],nome:'Comida da feira'}},
  {id:'agua',especie:'insetoide',x:30,y:27.8,loja:{ramos:['agua'],nome:'Água e bebidas'}},
  {id:'bar',especie:'zutariano',x:33.8,y:23,loja:{ramos:['bar'],nome:'Espetinhos e cerveja'}},
  {id:'roupas',especie:'nymari',x:36,y:30.5,loja:{ramos:['roupas'],nome:'Roupas e tecidos'}},
  {id:'remedios',especie:'grey',x:26,y:20,loja:{ramos:['remedios'],nome:'Ervas e remédios'}},
  {id:'pecas',especie:'robo',x:35,y:26,loja:{ramos:['pecas','curiosidades'],nome:'Sucata e curiosidades'}}
 ]
};
export function gerarCidadeBaixaIA(){
 const E=CIDADE_BAIXA;
 return estadoDeImagem({nome:E.nome,src:E.arte,W:E.W,H:E.H,marcas:E.marcas,acimaSrc:E.acima,extra:{cidadeBaixaV164:true}});
}

// ---------------------------------------------------------------- v173: a Cidade Baixa passa a SER o mapa das ruas (cenario_c002)
export const NOME_V173='Cidade Baixa de Véspera';
// saídas nas bocas de rua da borda (metros; achadas na grade de marcas: ruas livres que chegam até a borda)
export const PORTAS_CB=[
 {x:34.5,y:52.9,lado:'sul'},{x:21,y:.8,lado:'norte'},{x:52,y:.8,lado:'norte'},{x:.8,y:3,lado:'oeste'},{x:72.5,y:31.2,lado:'leste'},
 {x:16,y:52.9,lado:'sul'},{x:42,y:52.9,lado:'sul'},{x:.8,y:16,lado:'oeste'},{x:72.5,y:48.7,lado:'leste'},{x:59,y:52.9,lado:'sul'},
 {x:2.5,y:.8,lado:'norte'},{x:26.2,y:52.9,lado:'sul'},{x:.8,y:41.7,lado:'oeste'},{x:72.5,y:15,lado:'leste'},{x:67,y:52.9,lado:'sul'},{x:4.5,y:52.9,lado:'sul'}
];
const semCB=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
// Mapa da cidade que deve ter porta na Cidade Baixa? (não: ermos, trajetos, interiores, testes, comparação)
export function mapaDaCidade(m,cen){
 if(!m?.id||m.intermediario||m.interiorV164||m.interior||m.naveInteriorV141)return false;
 const nome=semCB(m.nome),id=String(m.id);
 if(/teste|^preto$|marmore|nossa arte|imagem ia|^entre /.test(nome)||/^v16\d_|^\d+$/.test(id))return false;
 if(id==='cenario_c002')return false;
 const local=semCB(cen?.local||'');
 if(cen){if(/regiao|bosque|floresta|serra|mina|estrada|mar de|norte de|deserto|calico|area externa|cordilheira|trilha|planicie|orbita|espaco profundo/.test(local))return false;
  return /vespera/.test(local)||/vespera/.test(nome);}
 return /vespera|bateria|espaco-?porto|grande feira|cidade alta|escadaria/.test(nome);
}
// lado preferido na Cidade Baixa: cidade alta/palácio/porto alto em cima; portão e espaço-porto embaixo
export function ladoPreferido(m,cen){
 const t=semCB([m?.nome,cen?.local,cen?.nome].join(' '));
 if(/superior|cidade alta|escadaria|palacio|porto alto|fundadores|camara|conselho|tribunal|residencia/.test(t))return 'norte';
 if(/portao|espaco-?porto|espacoporto/.test(t))return 'sul';
 if(/bateria|taverna|bar\b|inferior/.test(t))return 'oeste';
 if(/feira|mercado|cavidades|panelas|patio|ringue/.test(t))return 'leste';
 return '';
}
// Liga a Cidade Baixa (ID) a quase todos os mapas da cidade. Puro: recebe e devolve a lista de ligações.
// • ligações antigas do mapa (das Ruas) vão para as bocas de rua; as do mapa "imagem IA" passam a ser deste mapa
// • mapa da cidade sem ligação direta (nem por trajeto) ganha uma porta numa boca de rua livre
export function ligarCidadeBaixa({ligs=[],mapas=[],cenarios=[],ID='cenario_c002',IA='v164_cidade_baixa_ia',W=73.3,H=53.65,uid=()=>'lig173_'+Math.random().toString(36).slice(2,8),pontoDeBorda,afastarNaBorda,max=16}){
 const N=p=>({x:+(p.x*28/W).toFixed(3),y:+(p.y*14/H).toFixed(3)});
 const OPOSTO={leste:'oeste',oeste:'leste',norte:'sul',sul:'norte'};
 let out=ligs.map(l=>({...l,a:{...l.a,mapa:String(l.a?.mapa)===IA?ID:l.a?.mapa},b:{...l.b,mapa:String(l.b?.mapa)===IA?ID:l.b?.mapa}}));
 const livres=PORTAS_CB.map((p,i)=>({...p,i,usada:false}));
 const pegar=lado=>{let p=livres.find(q=>!q.usada&&q.lado===lado)||livres.find(q=>!q.usada);if(!p)return null;p.usada=true;return p;};
 const cenDe=id=>cenarios.find(c=>String(c.mapaId||'')===String(id));
 const nomeDe=id=>mapas.find(m=>String(m.id)===String(id));
 const feitos=[];
 // 1) as ligações antigas deste mapa (menos as portas de interiores, que ficam onde estão)
 out=out.map(l=>{const lado=String(l.a?.mapa)===ID?'a':String(l.b?.mapa)===ID?'b':'';if(!lado||l.interiorV164||l.cidadeBaixaV173)return l;
  const outro=String(l[lado==='a'?'b':'a']?.mapa||''),m=nomeDe(outro)||{id:outro},pref=ladoPreferido(m,cenDe(outro))||'sul';
  const p=pegar(pref);if(!p)return l;feitos.push({mapa:outro,porta:p.i,antiga:true});return {...l,[lado]:{...l[lado],...N(p)},cidadeBaixaV173:true};});
 // 2) mapas da cidade ainda sem ligação com a Cidade Baixa
 const ligado=id=>out.some(l=>(String(l.a?.mapa)===ID&&String(l.b?.mapa)===id)||(String(l.b?.mapa)===ID&&String(l.a?.mapa)===id));
 const porTrajeto=id=>mapas.some(m=>m.intermediario&&((m.intermediario.a===ID&&m.intermediario.b===id)||(m.intermediario.b===ID&&m.intermediario.a===id)));
 const cands=mapas.filter(m=>mapaDaCidade(m,cenDe(m.id))&&!ligado(String(m.id))&&!porTrajeto(String(m.id)))
  .sort((a,b)=>(ladoPreferido(b,cenDe(b.id))?1:0)-(ladoPreferido(a,cenDe(a.id))?1:0)||String(a.nome||'').localeCompare(String(b.nome||''),'pt'));
 let novas=0;
 for(const m of cands){if(novas>=max)break;const id=String(m.id),pref=ladoPreferido(m,cenDe(id));const p=pegar(pref||'');if(!p)break;
  const ocup=out.flatMap(l=>[l.a,l.b].filter(e=>String(e?.mapa)===id));
  const usados=ocup.length,lb=OPOSTO[p.lado];let q=pontoDeBorda?pontoDeBorda(usados,lb):{x:14,y:lb==='norte'?.8:13.2};if(afastarNaBorda)q=afastarNaBorda(q,ocup);
  out.push({id:uid(),a:{mapa:ID,...N(p)},b:{mapa:id,x:+Number(q.x).toFixed(3),y:+Number(q.y).toFixed(3)},tipo:'porta',auto:true,cidadeBaixaV173:true});novas++;feitos.push({mapa:id,porta:p.i,nova:true});}
 // ligações repetidas para o mapa velho "imagem IA" (se o mapa sumiu) saem
 out=out.filter(l=>String(l.a?.mapa)!==IA&&String(l.b?.mapa)!==IA&&!(String(l.a?.mapa)===ID&&String(l.b?.mapa)===ID));
 return {ligs:out,feitos,novas};
}
