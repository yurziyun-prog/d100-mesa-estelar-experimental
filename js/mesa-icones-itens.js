// Mesa Estelar v201 — ícones 3D de itens (arte/itens3d, gerados por scripts/gerar-icones-itens.cjs).
// Item sem imagem própria usa o ícone cujo nome em português combina com o nome do item ("Espada longa" → espada, "Poção de cura" → poção…).
import {ICONES_ITENS} from './mesa-icones-itens-dados.js?v=201';

const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
// pares [palavra normalizada, ícone]; a palavra mais longa que aparece no nome ganha (ex.: "machado duplo" antes de "machado")
const PARES=[];
for(const ic of ICONES_ITENS)for(const w of String(ic.nomes).split('|')){const k=sem(w);if(k)PARES.push({k,ic});}
PARES.sort((a,b)=>b.k.length-a.k.length||a.ic.prio-b.ic.prio);

export function iconeParaItem(nome){
 const n=' '+sem(nome).replace(/[^a-z0-9]+/g,' ').replace(/oes( |$)/g,'ao$1')+' ';
 if(n.trim()==='')return '';
 for(const {k,ic} of PARES)if(n.includes(' '+k+' ')||n.includes(' '+k+'s '))return ic.src;
 return '';
}
export const todosIcones=()=>ICONES_ITENS.map(i=>({...i}));

// Equipamento rápido de criatura (ficha rápida do balão): bônus percentuais somados à perícia de ataque / defesa.
export const ARMAS_RAPIDAS=[
 {id:'',nome:'Sem arma',bonus:0},
 {id:'rpg_dagger',nome:'Adaga',bonus:5},{id:'rpg_knife',nome:'Faca',bonus:3},{id:'rpg_sword',nome:'Espada',bonus:10},{id:'rpg_spear',nome:'Lança',bonus:9},
 {id:'rpg_wooden_bow',nome:'Arco',bonus:7},{id:'rpg_axe_small',nome:'Machadinha',bonus:8},{id:'rpg_axe_double',nome:'Machado duplo',bonus:14},
 {id:'rpg_claymore',nome:'Montante',bonus:15},{id:'rpg_doublesided_hammer',nome:'Martelo de guerra',bonus:16},{id:'rpg_scythe',nome:'Foice',bonus:12}
];
export const DEFESAS_RAPIDAS=[
 {id:'',nome:'Sem proteção',bonus:0},
 {id:'rpg_armor_leather',nome:'Armadura de couro',bonus:6},{id:'rpg_armor_metal',nome:'Armadura de metal',bonus:12},{id:'rpg_armor_golden',nome:'Armadura dourada',bonus:15},
 {id:'rpg_shield_round',nome:'Escudo redondo',bonus:8},{id:'rpg_shield_heater',nome:'Escudo',bonus:10},{id:'rpg_shield_celtic_golden',nome:'Escudo dourado',bonus:14}
];
export const srcIcone=id=>{const i=ICONES_ITENS.find(x=>x.id===id);return i?i.src:'';};
