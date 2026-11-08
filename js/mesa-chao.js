// Mesa Estelar v200 — O que é "chão" do mapa (piso, calçada, terreno).
// Regra do mestre: tudo no mapa pode ser arrastado com o mouse, MENOS o chão; arrastar o chão move a tela (a visão), como arrastar o mapa.
// Dados puros, sem tela.
const sem=s=>String(s??'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
const NOME_CHAO=/^(piso|chao|calcada|calcamento|pavimento|ladrilho|ladrilhos|gramado|terreno|solo|assoalho|carpete)\b/;
/** O objeto de cena é chão? (piso do Editor rápido/Oficina, "Chão do mapa", ou uma peça de piso/terreno que cobre boa parte do mapa) */
export function ehChao(o,{W=28,H=14}={}){
 if(!o||typeof o!=='object')return false;
 // v205: SÓ o chão de fundo escolhido ao criar o mapa não é arrastável (arrastá-lo move a tela). Pisos, pontes, calçadas, terrenos e manchas menores são peças comuns: o mestre arrasta tudo.
 if(o.nome==='Chão do mapa'||o.pisoV200===true)return true;
 const l=Number(o.larguraM)||0,a=Number(o.alturaM)||0,tipo=o.erTipo==='piso'||o.oficina3==='chao'||NOME_CHAO.test(sem(o.nome))||Number(o.camada??3)<=1;
 return tipo&&!o.bloqueiaMovimento&&!o.bloqueiaVisao&&l>=.8*(Number(W)||28)&&a>=.8*(Number(H)||14); // peça que cobre quase o mapa inteiro = fundo
}
