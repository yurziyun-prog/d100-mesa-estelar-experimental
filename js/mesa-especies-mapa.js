// Mesa Estelar v205 — identidade das espécies do mapa de testes: nome de exibição (o ID técnico NÃO muda), grupo, habitat e o que a espécie faz para sobreviver.
// Decisão do Yuri: INSETOIDES são bípedes de quatro braços (raça; normalmente personagens/NPCs, mas há indivíduos inimigos);
// ARTRÓPODES ALIENÍGENAS são monstros de outras anatomias (hexápodes, aracnomorfos…). "monstro", "inimigo" e "bípede" não são sinônimos.
import {ESCALA_FISICA} from './mesa-escala-fisica.js?v=205';
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
/** habitat: zona do gerador onde vive; abrigo: onde se recolhe; atividades: estados observáveis (ver mesa-vida) */
export const ESPECIES={
 insetoide_predador:{nome:'Insetoide Guerreiro',grupo:'insetoide',anatomia:'bípede, quatro braços, carapaça',jogavel:true,habitat:['caverna','calabouco'],abrigo:'caverna',atividades:['patrulhar','vigiar','construir_abrigo']},
 insetoide_predador_1:{nome:'Predador Quitinoso',grupo:'artropode_alienigena',anatomia:'hexápode de carapaça escura; caça por vibração e odor',jogavel:false,habitat:['floresta_norte'],abrigo:'floresta_norte',atividades:['emboscar','caçar','imobilizar']},
 rastejante_de_cinzas:{nome:'Artrópode de Fenda',grupo:'artropode_alienigena',anatomia:'rastejante achatado de fendas e cinzas',jogavel:false,habitat:['floresta_norte','ruinas'],abrigo:'ruinas',atividades:['forragear','fugir','esconder']},
 carrapato_de_ferro:{nome:'Carrapato de Ferro',grupo:'artropode_alienigena',anatomia:'aracnomorfo minúsculo de couraça metálica',jogavel:false,habitat:['floresta_sul'],abrigo:'floresta_sul',atividades:['parasitar','emboscar']},
 parasita_carniceiro:{nome:'Parasita Carniceiro',grupo:'artropode_alienigena',anatomia:'aracnomorfo pequeno carniceiro',jogavel:false,habitat:['pantano'],abrigo:'pantano',atividades:['carniçar','esconder']},
 escavador_de_carapaca:{nome:'Escavador de Carapaça',grupo:'artropode_alienigena',anatomia:'quadrúpede blindado escavador',jogavel:false,habitat:['caverna'],abrigo:'caverna',atividades:['escavar','guardar_toca']},
 enxame_mordedor:{nome:'Enxame de Lascas Vivas',grupo:'artropode_alienigena',anatomia:'enxame: muitos corpos pequenos tratados como um só agente',jogavel:false,habitat:['floresta_sul'],abrigo:'floresta_sul',atividades:['forragear','cercar']},
 vespa_de_vidro:{nome:'Vespa de Vidro',grupo:'voador_alienigena',anatomia:'voadora de asas translúcidas',jogavel:false,habitat:['campo_leste'],abrigo:'penhasco',atividades:['patrulhar_ar','caçar']},
 cavalgante_prismatico:{nome:'Cavalgante Prismático',grupo:'animal_alienigena',anatomia:'ungulado grande, manada',jogavel:false,habitat:['campo_oeste'],abrigo:'campo_oeste',atividades:['pastar','beber','vigiar_manada']},
 larva_interdimensional:{nome:'Larva Interdimensional',grupo:'animal_alienigena',anatomia:'larva anômala',jogavel:false,habitat:['floresta_sul'],abrigo:'floresta_sul',atividades:['pastar','esconder']},
 criatura_de_calico_1:{nome:'Macaco de Calico',grupo:'primata_alienigena',anatomia:'primata maior que um humano, anda sobre os punhos',jogavel:false,habitat:['campo_oeste'],abrigo:'campo_oeste',atividades:['forragear','construir_abrigo','defender_grupo']},
 criatura_de_calico_2:{nome:'Criatura de Calico',grupo:'animal_alienigena',anatomia:'forma amorfa pequena',jogavel:false,habitat:['pantano'],abrigo:'pantano',atividades:['pastar','beber']},
 predador_de_nevoa:{nome:'Predador de Névoa',grupo:'animal_alienigena',anatomia:'quadrúpede de caça em névoa',jogavel:false,habitat:['floresta_norte'],abrigo:'floresta_norte',atividades:['caçar','patrulhar_territorio','descansar']},
 'caçador_de_nevoa':{nome:'Caçador de Névoa',grupo:'animal_alienigena',anatomia:'quadrúpede ágil de caça',jogavel:false,habitat:['campo_leste'],abrigo:'campo_leste',atividades:['caçar','patrulhar_territorio']},
 predador_couracado:{nome:'Predador Couraçado',grupo:'anfibio_alienigena',anatomia:'quadrúpede blindado semiaquático',jogavel:false,habitat:['lago'],abrigo:'lago',atividades:['caçar_na_margem','descansar_na_agua'],aquatico:true},
 cila:{nome:'Cila',grupo:'aquatico_alienigena',anatomia:'massa fixa ao substrato com pescoços',jogavel:false,habitat:['lago'],abrigo:'lago',atividades:['espreitar'],aquatico:true},
 besta_ululante:{nome:'Besta Ululante',grupo:'animal_alienigena',anatomia:'quadrúpede de pescoço longo',jogavel:false,habitat:['ruinas'],abrigo:'ruinas',atividades:['caçar','patrulhar_territorio']},
 montariapterodatil:{nome:'Pterodáctilo de Montaria',grupo:'voador_alienigena',anatomia:'voador adulto capaz de carregar um cavaleiro',jogavel:false,habitat:['campo_oeste'],abrigo:'campo_oeste',atividades:['pastar','planar']},
 cao_de_sucata:{nome:'Cão de Sucata',grupo:'animal_alienigena',anatomia:'quadrúpede de sucata',jogavel:false,habitat:['campo_oeste'],abrigo:'campo_oeste',atividades:['forragear']},
 dragao_trombeta_corredor_domesticado:{nome:'Dragão-Trombeta Corredor (domesticado)',grupo:'montaria',anatomia:'bípede corredor',jogavel:false,habitat:['acampamento'],abrigo:'acampamento',atividades:['pastar']},
 dragao_trombeta_alado_domesticado:{nome:'Dragão-Trombeta Alado (domesticado)',grupo:'montaria',anatomia:'bípede alado',jogavel:false,habitat:['acampamento'],abrigo:'acampamento',atividades:['pastar']},
 dragao_trombeta_corredor_selvagem:{nome:'Dragão-Trombeta Corredor',grupo:'animal_alienigena',anatomia:'bípede corredor',jogavel:false,habitat:['campo_leste'],abrigo:'campo_leste',atividades:['caçar','patrulhar_territorio']},
 dragao_trombeta_alado_selvagem:{nome:'Dragão-Trombeta Alado',grupo:'voador_alienigena',anatomia:'bípede alado',jogavel:false,habitat:['cordilheira'],abrigo:'cordilheira',atividades:['planar','caçar']},
 zumbi_1:{nome:'Carniçal',grupo:'humanoide_monstro',anatomia:'humanoide infectado',jogavel:false,habitat:['ruinas'],abrigo:'ruinas',atividades:['vagar']},
 cadaver_de_chefe:{nome:'Cadáver de Chefe',grupo:'humanoide_monstro',anatomia:'humanoide, porte de um humano robusto',jogavel:false,habitat:['calabouco'],abrigo:'calabouco',atividades:['vagar']},
 vampiro_generico:{nome:'Vampiro',grupo:'humanoide_monstro',anatomia:'humanoide',jogavel:false,habitat:['calabouco'],abrigo:'calabouco',atividades:['vigiar']},
 serpente_sanguessuga:{nome:'Serpente Sanguessuga',grupo:'animal_alienigena',anatomia:'serpente do pântano',jogavel:false,habitat:['pantano'],abrigo:'pantano',atividades:['espreitar','caçar'],aquatico:false}
};
export const idDaEspecie=t=>{let d=String(t?.id||'');try{d=decodeURIComponent(d);}catch(_){}return d.replace(/^synccriatura:/,'').split('~')[0];};
export const a3DaEspecie=id=>'cima_'+sem(id);
/** nome de exibição; mantém o prefixo ("Monstro · ") e o número do exemplar */
export function nomeExibicao(id,nomeAtual,i=0){const e=ESPECIES[id];if(!e)return nomeAtual;const m=/^(Monstro · )?(.*?)(?: (\d+))?$/.exec(String(nomeAtual||''));return (m?.[1]||'Monstro · ')+e.nome+(m?.[3]?' '+m[3]:(i?' '+(i+1):''));}
/** correções de um token já salvo: nome de exibição e diâmetro de colisão (pegada no chão, sem asas/cauda). Null quando nada muda. O ID nunca muda. */
export function reparoDoToken(t){
 const id=idDaEspecie(t),e=ESPECIES[id];if(!e||!/^synccriatura/.test(decodeURIComponent(String(t?.id||''))))return null;
 const p={},nome=nomeExibicao(id,t.nome);if(nome&&nome!==t.nome)p.nome=nome;
 const f=ESCALA_FISICA[a3DaEspecie(id)];if(f?.soloM&&!t.diametroPersonalizadoV205&&Math.abs(Number(t.diametroM||0)-f.soloM)>.01)p.diametroM=f.soloM;
 return Object.keys(p).length?p:null;}
