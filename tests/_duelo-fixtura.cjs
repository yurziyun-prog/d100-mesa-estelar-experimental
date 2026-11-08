// Fixture de DUELO (harness local, mestre simulado): ficha criada pela fábrica REAL (window.novoPersonagem) + itens do banco CSV normalizados pelo importador REAL
// (normalizarLinhaImportacao_) + criatura de verdade do bestiário. Nada aqui inventa resolvedor: ataque, defesa e dano rodam nos módulos reais.
const {preparar}=require('./_mapa-reformado.cjs');const fs=require('fs'),path=require('path');
/** CSV com ';' e aspas (formato dos bancos do projeto) */
function lerCSV(arq){
 const t=fs.readFileSync(arq,'utf8').replace(/^﻿/,''),L=[];let r=[],c='',q=false;
 for(let i=0;i<t.length;i++){const ch=t[i];
  if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}
  else if(ch==='"')q=true;
  else if(ch===';'){r.push(c);c='';}
  else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&t[i+1]==='\n')i++;r.push(c);c='';if(r.length>1||r[0])L.push(r);r=[];}
  else c+=ch;}
 if(c||r.length){r.push(c);L.push(r);}
 const cab=L[0];return L.slice(1).map(x=>Object.fromEntries(cab.map((h,i)=>[h,x[i]??''])));
}
/** perfil: 'forte' (pistola laser, perícia treinada) | 'fraco' (só desarmado) */
async function montarDuelo({criatura='zumbi_1',arma='pistola_laser',dist=1.2,perfil='forte',mapa:tipoMapa='simples'}={}){
 const simples=tipoMapa==='simples',ctx=await preparar({removerFauna:true,simples});const {page,id}=ctx;
 const itensCSV=lerCSV(path.join(__dirname,'..','dados','banco_itens_2026-09-22.csv'));
 const info=await page.evaluate(async({criatura,arma,dist,mapa,itensCSV,perfil,simples})=>{
  const W=simples?28:80,Hm=simples?14:50,kx=simples?8:46,ky=simples?7:26;
  const A=window.__APP__,e=A.ev,S=window.__fs;
  A.setMestre();window.__itensCSV=itensCSV;
  e('periciasDB=[...periciasPadrao];especializacoesDB=[...especializacoesPadrao,{id:"armas_brancas_curtas",nome:"Armas Brancas Curtas",tipo:"Combate",uso:"Corpo a corpo",formula:"FOR+DES",familiaArma:"branca_curta"}];itensDB=window.__itensCSV.map(r=>normalizarLinhaImportacao_("itens",r)).filter(Boolean);');
  S.delete('personagens/jogador_teste_1');S.delete('combatesAtivos/mapaMesaSyncDireta/posicoes/jogador_teste_1');
  // removerFauna apagou os bichos SEM avisar os módulos que já tinham lido a lista (o tempo real ainda os "via" e deixava monstros fantasmas atacarem): uma escrita-ping força a releitura
  window.__fsWrite('combatesAtivos/mapaMesaSyncDireta/posicoes/_ping',{nome:'ping',mapaId:'_nenhum',x:0,y:0,revision:0});S.delete('combatesAtivos/mapaMesaSyncDireta/posicoes/_ping');
  window.__fsWrite('combatesAtivos/mesaTempoReal',{ativo:false,pausado:false,mensagem:'',escolha:null,atualizadoEm:Date.now()}); // ponto de partida do Yuri: SEM combate nenhum e tempo real desligado
  await window.novoPersonagem();
  const cid=[...S.keys()].find(k=>/^personagens\/char_/.test(k)).split('/')[1];
  const ficha=S.get('personagens/'+cid),item=idb=>e('(()=>{const it=itensDB.find(x=>x.id==="'+idb+'");return {...it,idBanco:it.id,instanciaId:"item_t_"+Math.random().toString(36).slice(2,8),pvAtual:Number(it.pv||0),...(itemUsaMunicao_(it)?{cargaMax:cargaMaxArma_(it),cargaAtual:cargaMaxArma_(it)}:{})};})()');
  const forte=perfil==='forte';ficha.nome='Kael de teste';ficha.atributos=forte?{FOR:14,CON:14,TAM:12,DES:17,INT:14,POD:11,CAR:11}:{FOR:10,CON:9,TAM:10,DES:9,INT:10,POD:10,CAR:10};
  ficha.especializacoes=forte?{armas_brancas_curtas:{investimentos:{origem:5,carreira:10,hobbie:0,xp:0}},combate_pistola_laser:{investimentos:{origem:8,carreira:12,hobbie:0,xp:0}}}:{};
  ficha.pericias=forte?{combate_desarmado:{investimentos:{origem:3,carreira:5,hobbie:0,xp:0}},esquiva:{investimentos:{origem:3,carreira:6,hobbie:0,xp:0}}}:{};
  if(forte){ficha.inventario.equipado[0]=item(arma);if(arma!=='faca_utilitaria')ficha.inventario.equipado[1]=item('faca_utilitaria');}
  ficha.testeV138=true;ficha.fichaAprovada=true;ficha.fichaStatus='aprovada';ficha.dono='mestre1';
  window.__fsWrite('personagens/'+cid,ficha);
  const pos='combatesAtivos/mapaMesaSyncDireta/posicoes/';
  window.__fsWrite(pos+cid,{nome:'Kael de teste',imagem:'',donoUid:'mestre1',x:+(kx/W*28).toFixed(3),y:+(ky/Hm*14).toFixed(3),revision:0,facing:0,camada:3,mapaId:mapa,diametroM:1,visualV203:'',arte3dV200:'cima_pessoa'});
  if(!criatura)return {cid,criaturaId:null,nItens:e('itensDB.length')};
  const mold=(window.__moldes||[]).find(([p])=>decodeURIComponent(p).includes('synccriatura:'+criatura));
  const [mp,mv]=mold||(window.__moldes||[[0,{}]])[0];
  window.__fsWrite(pos+'synccriatura%3A'+criatura+'~900',{...mv,x:+((kx+dist+.5)/W*28).toFixed(3),y:+(ky/Hm*14).toFixed(3),mapaId:mapa,revision:0,nome:'Criatura de treino'});
  return {cid,criaturaId:'synccriatura%3A'+criatura+'~900',moldeado:!!mold,nItens:e('itensDB.length')};
 },{criatura,arma,dist,mapa:id,itensCSV,perfil,simples});
 return {...ctx,...info};
}
module.exports={montarDuelo,lerCSV};
