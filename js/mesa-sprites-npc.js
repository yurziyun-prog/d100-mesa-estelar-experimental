// Mesa Estelar v199 — Miniaturas artísticas novas (criaturas e NPCs): qual arte usar para cada espécie/papel.
// A arte fica em arte/miniaturas/<id>.webp (384 px, token no mapa) e arte/miniaturas/grande/<id>.webp (1024 px, ficha).
// Nada é gravado no banco: o token do mapa troca a imagem ao desenhar, então vale para criaturas já postas e para as novas.
// Gerada por scripts/gerar-miniaturas-npc.cjs a partir de imagens/sprites/*.png.
const BASE='arte/miniaturas/';
export const SPRITES=new Set(["besta_ululante","cadaver_de_chefe","carrapato_de_ferro","cavalgante_prismatico","caçador_de_nevoa","cila","criatura1","criatura2","criatura3","criatura4","criatura5","criatura6","criatura7","criatura_de_calico_2","dragao_trombeta_alado_domesticado","dragao_trombeta_alado_selvagem","dragao_trombeta_corredor_domesticado","dragao_trombeta_corredor_selvagem","enxame_mordedor","escavador_de_carapaca","insetoide_predador","insetoide_predador_1","larva_interdimensional","macacodecalico","metamorfo1","metamorfo2","metamorfo3","metamorfo4","metamorfo_generico","metamorfo_psiquico","montariapterodatil","npc_combatente","npc_criatura","npc_inimigo","npc_medico","npc_mercador","parasita_carniceiro","predador_couracado","predador_de_nevoa","rastejante_de_cinzas","serpente_sanguessuga","vampiro_generico","vampiro_psiquico","vespa_de_vidro","zumbi_1"]);
// v200: variantes de arte por direção (<id>_costas.webp). Vazio por enquanto: quando houver arte de costas, é só listar o nome aqui.
export const VARIANTES=new Set([]);
try{globalThis.mesaVariantesV200=VARIANTES;}catch(_){}
// v200: folhas de andar (quadros de perna/braço lado a lado), por direção: { '<id>_andar_lado':{url:'arte/miniaturas/<id>_andar_lado.webp',quadros:6}, ... } (lado, costas, frente). Vazio por enquanto.
export const FOLHAS={};
try{globalThis.mesaFolhasV200=FOLHAS;}catch(_){}
// ids do bestiário que usam outro nome de arquivo
const ALIAS={criatura_de_calico_1:'macacodecalico'};
// arte de NPC por papel (o gerador sorteia o papel; elite usa o vampiro de casaco vermelho)
export const SPRITE_POR_PAPEL={combatente:'npc_combatente',acompanhante:'npc_combatente',inimigo:'npc_combatente',elite:'vampiro_generico',profissional:'npc_medico',mercador:'npc_mercador',plebeu:'npc_mercador'};
const chave=id=>{const k=String(id||'').replace(/~\d+$/,'');return ALIAS[k]||k;};
export const temSprite=id=>SPRITES.has(chave(id));
export const spriteDeEspecie=id=>temSprite(id)?BASE+chave(id)+'.webp':'';
export const grandeDeEspecie=id=>temSprite(id)?BASE+'grande/'+chave(id)+'.webp':'';
export const spriteDePapel=papel=>spriteDeEspecie(SPRITE_POR_PAPEL[papel]||'npc_combatente');
export const grandeDePapel=papel=>grandeDeEspecie(SPRITE_POR_PAPEL[papel]||'npc_combatente');
// id da espécie de um token de criatura do mapa (synccriatura:<id>, com ~2, ~3… para repetidos)
export function especieDoToken(t){let id=String(t?.id||'');try{id=decodeURIComponent(id);}catch(_){}const m=/^synccriatura:(.+)$/.exec(id);return m?m[1].replace(/~\d+$/,''):'';}
// arte nova do token: marcada no próprio token (spriteIdV199, NPCs gerados) ou pela espécie (criaturas do bestiário)
export function spriteDoToken(t){
 if(!t)return '';
 const marcado=String(t.spriteIdV199||'');if(marcado&&SPRITES.has(marcado))return BASE+marcado+'.webp';
 const e=especieDoToken(t);return e?spriteDeEspecie(e):'';
}
