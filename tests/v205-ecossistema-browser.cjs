// Ecossistema vivo: habitat, sede/água, atividades visíveis, diagnóstico de inatividade, interação entre espécies. VALIDAÇÃO: harness local, mestre SIMULADO (a vida só roda no navegador do mestre)
// durante a janela de observação (DURACAO_S, padrão 150 s). O que NÃO prova: sessão real, rede real, duração de horas.
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {preparar,root}=require('./_mapa-reformado.cjs');
const DURACAO_S=Number(process.env.DURACAO_S||150);
const rel=[];const log=(...a)=>{console.log(...a);rel.push(a.join(' '));};
(async()=>{
 const {H,page,erros,id}=await preparar({removerFauna:false});
 // a jogadora no acampamento (seguro) e o papel de mestre ligado: a vida roda
 await page.evaluate(()=>window.__APP__.setMestre());await page.waitForTimeout(2500);
 const habitats=await page.evaluate(()=>{const S=window.__fs;return [...S].filter(([p,v])=>/posicoes[/]synccriatura/.test(p)&&v.habitatV205).map(([p,v])=>({id:decodeURIComponent(p.split('/').pop()),h:v.habitatV205}));});
 log('criaturas com habitat gravado:',habitats.length);assert.ok(habitats.length>=36,'as criaturas do mapa reformado têm habitat gravado: '+habitats.length);
 const amostras=[],acoes=new Map(),ativ=new Map();let foraDeHabitat=0,total=0;const aquaticaFora=[];
 const lerTudo=()=>page.evaluate(()=>{const S=window.__fs,out=[];for(const [p,v] of S){if(!/posicoes[/]synccriatura/.test(p)||!v.habitatV205)continue;out.push({id:decodeURIComponent(p.split('/').pop()),x:+(v.x*80/28).toFixed(2),y:+(v.y*50/14).toFixed(2),h:v.habitatV205});}
  const n=document.querySelectorAll('#novaSyncBoard [data-acao-v144]');const ac=[...n].map(e=>decodeURIComponent(e.dataset.token)+'|'+e.dataset.acaoV144);
  return {pos:out,ac,diag:window.mesaVidaDiagV205?window.mesaVidaDiagV205():[],ativ:window.mesaNichosV205?window.mesaNichosV205.todas():{},legs:Object.values(window.__fs.get('combatesAtivos/mesaVida')?.legs||{}).filter(l=>l.caca||l.fuga||l.acao).length};});
 const vistos=new Set();let caca=0,fuga=0,primeiroDiag=null,ultimoDiag=null;
 const t0=Date.now();
 while((Date.now()-t0)/1000<DURACAO_S){
  await page.waitForTimeout(2000);const d=await lerTudo();primeiroDiag=primeiroDiag||d.diag;ultimoDiag=d.diag;
  for(const a of d.ac)acoes.set(a,(acoes.get(a)||0)+1);for(const [k,v] of Object.entries(d.ativ))ativ.set(v,(ativ.get(v)||0)+1);
  for(const p of d.pos){total++;const h=p.h,dentro=((p.x-h.x)/(h.rx+(h.margem||3)+1))**2+((p.y-h.y)/(h.ry+(h.margem||3)+1))**2<=1;if(!dentro){foraDeHabitat++;if(h.aquatico)aquaticaFora.push(p.id);}vistos.add(p.id+'@'+Math.round(p.x)+','+Math.round(p.y));}
 }
 const movidos=new Set([...vistos].map(v=>v.split('@')[0]));const posicoesDistintas=vistos.size;
 const porCriatura={};for(const v of vistos){const k=v.split('@')[0];porCriatura[k]=(porCriatura[k]||0)+1;}
 const quemSeMexeu=Object.entries(porCriatura).filter(([k,n])=>n>=3).length;
 log('observação:',DURACAO_S,'s · amostras de posição:',total,'· fora do habitat:',foraDeHabitat,'('+(100*foraDeHabitat/Math.max(1,total)).toFixed(1)+'%)','· aquáticas fora da água/habitat:',aquaticaFora.length);
 log('quem se mexeu (≥3 posições distintas):',quemSeMexeu,'de',Object.keys(porCriatura).length);
 log('atividades vistas (contagem de amostras):',JSON.stringify(Object.fromEntries(ativ)));
 log('ações desenhadas sobre os tokens (emoji):',JSON.stringify(Object.fromEntries(acoes)).slice(0,600));
 const diag=ultimoDiag||[];const semMover=diag.filter(x=>!x.andando&&x.motivoInatividade);const motivos={};for(const x of semMover)motivos[x.motivoInatividade.replace(/\d+ s/,'N s')]=(motivos[x.motivoInatividade.replace(/\d+ s/,'N s')]||0)+1;
 log('diagnóstico (último): ',diag.length,'criaturas · andando agora:',diag.filter(x=>x.andando).length,'· parados por motivo:',JSON.stringify(motivos));
 fs.writeFileSync(path.join(root,'docs','diagnostico-ecossistema.json'),JSON.stringify({duracaoS:DURACAO_S,amostras:total,foraDeHabitat,ativ:Object.fromEntries(ativ),acoes:Object.fromEntries(acoes),motivos,diag:diag.slice(0,60)},null,1));
 assert.ok(quemSeMexeu>=8,'pelo menos 8 criaturas vivem (se mexem) durante a observação: '+quemSeMexeu);
 assert.ok(foraDeHabitat/Math.max(1,total)<=.12,'quase sempre dentro do habitat (caça e fuga podem sair): '+(100*foraDeHabitat/total).toFixed(1)+'%');
 assert.equal(aquaticaFora.length,0,'criatura aquática nunca sai do habitat: '+aquaticaFora.join(','));
 assert.ok(diag.length>=36&&diag.every(x=>x.andando||x.motivoInatividade||x.ultimaDecisao!==undefined),'o diagnóstico explica cada criatura (andando, motivo ou última decisão)');
 await page.screenshot({path:path.join(root,'docs','antes-depois','ecossistema-vivo.png')});
 const reais=erros.filter(e=>!/Failed to load resource|favicon|net::ERR|ERR_FAILED/i.test(e));log('erros:',reais.length?reais.join('|'):'nenhum');assert.equal(reais.length,0);
 log('PASS ecossistema (habitat + diagnóstico) [harness local; mestre simulado por '+DURACAO_S+' s]');await H.close();
})().catch(e=>{console.error(e);process.exit(1);});
