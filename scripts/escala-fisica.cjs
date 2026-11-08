// Gera js/mesa-escala-fisica.js: tamanho FÍSICO (em metros) do quadro de cada atlas, para o desenho não depender do diâmetro do token.
// Entrada: docs/escala-fisica-medidas.json (blender --medir: extensões do modelo e ortho do render) + a tabela de alvos abaixo.
// metros = ortho * alvo / maior_extensão_do_modelo  → o corpo visto de cima mede exatamente o alvo.
// ALVOS: 'pegada' = maior dimensão do corpo visto de cima (com cauda/asas abertas quando fazem parte da silhueta); 'solo' = diâmetro de colisão no chão (sem asas/cauda).
// fonte: B = bestiário (dados/banco_criaturas_*.csv: altura/tamanho); P = PROPOSTA deste trabalho (o bestiário não traz medida utilizável) — o Yuri pode ajustar.
const fs=require('fs'),path=require('path');
const raiz=path.join(__dirname,'..');
const ALVOS={
 cavalgante_prismatico:{pegada:3.2,solo:1.4,alturaM:2.4,fonte:'B altura 2,4 m (Grande, 420 kg); comprimento P'},
 larva_interdimensional:{pegada:1.6,solo:.9,alturaM:.7,fonte:'B 1,35 (comprimento?); P'},
 rastejante_de_cinzas:{pegada:1.1,solo:.6,alturaM:.5,fonte:'B altura 0,8 (Pequeno, 32 kg); P'},
 criatura_de_calico_2:{pegada:1.1,solo:.8,alturaM:.8,fonte:'B altura 0,8 (Médio, 85 kg)'},
 criatura_de_calico_1:{pegada:1.8,solo:1.0,alturaM:2.1,fonte:'P: macaco maior que um humano, sem gigantismo (pedido do Yuri); o bestiário diz 3,9 m (Enorme), valor mantido na ficha'},
 montariapterodatil:{pegada:5.5,solo:1.1,alturaM:1.4,fonte:'P: adulto que carrega um cavaleiro; envergadura 5,5 m'},
 cao_de_sucata:{pegada:1.5,solo:.7,alturaM:.9,fonte:'P'},
 dragao_trombeta_alado_domesticado:{pegada:6.5,solo:1.6,alturaM:3.5,fonte:'B 3,5 m (Muito Grande); envergadura P'},
 dragao_trombeta_alado_selvagem:{pegada:7.5,solo:1.9,alturaM:4.2,fonte:'B 4,2 m (Enorme); envergadura P'},
 dragao_trombeta_corredor_domesticado:{pegada:3.4,solo:1.3,alturaM:2.2,fonte:'B 2,2 m (Grande, 180 kg); comprimento P'},
 dragao_trombeta_corredor_selvagem:{pegada:3.8,solo:1.5,alturaM:2.6,fonte:'B 2,6 m (Grande, 240 kg); comprimento P'},
 predador_de_nevoa:{pegada:2.4,solo:1.0,alturaM:1.9,fonte:'B 1,9 m (Médio, 96 kg); comprimento P'},
 'caçador_de_nevoa':{pegada:1.9,solo:.9,alturaM:1.4,fonte:'B 1,4 m (Médio, 70 kg); comprimento P'},
 predador_couracado:{pegada:3.2,solo:1.4,alturaM:2.2,fonte:'B 2,2 m (Grande); comprimento P'},
 besta_ululante:{pegada:3.4,solo:1.4,alturaM:2.4,fonte:'B 2,4 m no ombro (Grande)'},
 escavador_de_carapaca:{pegada:2.6,solo:1.3,alturaM:1.6,fonte:'B 1,6 m (Grande, 310 kg); comprimento P'},
 cila:{pegada:3.5,solo:2.0,alturaM:1.5,fonte:'P (sésssil; bestiário: variável)'},
 carrapato_de_ferro:{pegada:.5,solo:.3,alturaM:.25,fonte:'B altura 0,25 m (Minúsculo)'},
 parasita_carniceiro:{pegada:.7,solo:.4,alturaM:.4,fonte:'B 0,4 m (Pequeno, 8 kg)'},
 insetoide_predador:{pegada:1.2,solo:.8,alturaM:1.7,fonte:'B 1,7 m (bípede de quatro braços)'},
 insetoide_predador_1:{pegada:2.8,solo:1.3,alturaM:1.1,fonte:'B 2,1 m (Pesado, 145 kg: comprimento); P'},
 enxame_mordedor:{pegada:1.6,solo:1.2,alturaM:.3,fonte:'B 0,3 m (Enxame); área P'},
 vespa_de_vidro:{pegada:.8,solo:.4,alturaM:.4,fonte:'B 0,5 m (Pequeno)'},
 criatura1:{pegada:1.6,solo:0.7,alturaM:1,fonte:'P: bestiário sem descrição (Médio); canino'},
 criatura2:{pegada:1.9,solo:0.8,alturaM:1.1,fonte:'P: bestiário sem descrição (Médio); felino'},
 criatura3:{pegada:1.2,solo:0.6,alturaM:0.6,fonte:'P: bestiário sem descrição (Médio); inseto'},
 criatura4:{pegada:1.4,solo:0.8,alturaM:0.7,fonte:'P: bestiário sem descrição (Médio); aracnídeo'},
 criatura5:{pegada:1.6,solo:0.9,alturaM:1.8,fonte:'P: bestiário sem descrição (Médio); primata'},
 criatura6:{pegada:1.4,solo:0.8,alturaM:0.6,fonte:'P: bestiário sem descrição (Médio); larva'},
 criatura7:{pegada:4.2,solo:1,alturaM:1.2,fonte:'P: bestiário sem descrição (Médio); alado, envergadura'},
 metamorfo1:{pegada:1.4,solo:1,alturaM:0.9,fonte:'P: bestiário sem descrição (Médio); amorfo'},
 metamorfo2:{pegada:1.4,solo:1,alturaM:0.9,fonte:'P: bestiário sem descrição (Médio); amorfo'},
 metamorfo3:{pegada:1.1,solo:0.6,alturaM:1.75,fonte:'P: bestiário sem descrição (Médio); humanoide'},
 metamorfo4:{pegada:2.6,solo:0.5,alturaM:0.5,fonte:'P: bestiário sem descrição (Médio); serpente'},
};
// atlas feitos com a câmera fixa de pessoas (ortho 2,2 m, escala real do rig): pessoa e humanoides do rig Adventurer
const FIXOS={cima_pessoa:2.2,cima_zumbi_1:2.2,cima_cadaver_de_chefe:2.2,cima_vampiro_generico:2.2};
const med=JSON.parse(fs.readFileSync(path.join(raiz,'docs','escala-fisica-medidas.json'),'utf8'));
const sem=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'');
const out={};
for(const m of med){
 const a=ALVOS[m.id];if(!a){console.log('sem alvo',m.id);continue;}
 const ext=Math.max(m.comp,m.larg);
 out['cima_'+sem(m.id)]={metros:+(m.ortho*a.pegada/ext).toFixed(3),pegadaM:a.pegada,soloM:a.solo,alturaM:a.alturaM,fonte:a.fonte};
}
for(const [k,v] of Object.entries(FIXOS))out[k]={metros:v,pegadaM:null,soloM:null,alturaM:null,fonte:'câmera fixa do rig Adventurer (ortho 2,2 m, escala real)'};
// ARTE APROVADA do Yuri (dragão-trombeta corredor, Blender): mantém o tamanho em que ele aprovou (quadro = 1,6 × diâmetro antigo 2,4 m / 2,8 m)
for(const [k,metros,solo,alt,fonte] of [['cima_dragao_trombeta_corredor_domesticado',3.84,1.3,2.2,'B 2,2 m; arte aprovada: tamanho de quadro mantido'],['cima_dragao_trombeta_corredor_selvagem',4.48,1.5,2.6,'B 2,6 m; arte aprovada: tamanho de quadro mantido']])out[k]={metros,pegadaM:null,soloM:solo,alturaM:alt,fonte};
fs.writeFileSync(path.join(raiz,'js','mesa-escala-fisica.js'),'// GERADO por scripts/escala-fisica.cjs — tamanho físico (m) do quadro de cada atlas. Não editar à mão.\nexport const ESCALA_FISICA='+JSON.stringify(out)+';\n');
console.log(Object.entries(out).map(([k,v])=>k+' quadro='+v.metros+'m pegada='+v.pegadaM).join('\n'));
