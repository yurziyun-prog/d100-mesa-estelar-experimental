// Mesa Estelar v195 — 🏘️ Começar o bairro: a Cidade Baixa vira um terreno vazio, pequeno, para o Yuri construir
// (com o construtor) o trecho entre o Portão de Véspera e a Escadaria da Cidade Alta.
//
// Faz, só quando o mestre manda e confirma (menu do 🧪), com cópia de segurança de tudo antes:
//  • tira a imagem de fundo (e as marcas/casas feitas dela) da Cidade Baixa e encolhe o mapa;
//  • tira todas as ligações da Cidade Baixa e deixa só duas: Portão de Véspera ↔ Cidade Baixa ↔ Escadaria da Cidade Alta.
// Mesmo id do mapa: cenário, quem está lá e o resto continuam valendo. Os outros mapas não são tocados.

import {cenaDoEstado,LIMITE_CENA} from './mesa-mapas-ui.js?v=141';
import {ID_ESCADARIA} from './mesa-cidade-alta-mapas.js?v=151';

const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const clean=v=>JSON.parse(JSON.stringify(v??null));
export const ID_CIDADE='cenario_c002',NOME_BAIRRO='Cidade Baixa de Véspera';
export const TAMANHO_BAIRRO={W:40,H:26}; // metros (antes 73,3 × 53,65)
export const LIGACOES='combatesAtivos/mesaLigacoes';

export function estadoBairro(W=TAMANHO_BAIRRO.W,H=TAMANHO_BAIRRO.H,nome=NOME_BAIRRO){
 return {w:W,h:H,ppm:32,bg:'#b69a72',texture:'nenhuma',showGrid:false,grid:'#9a8a6a',name:nome,formatoObjetos:'refs-v1',elements:[],bairroV195:true};
}

// Os três mapas de que o bairro precisa. Procura pelo nome; devolve null onde não achar (o botão então não muda nada).
export function acharMapas(mapas){
 const reais=(mapas||[]).filter(m=>m?.id&&!m.intermediario&&!m.interior&&!m.interiorV164&&!m.naveInteriorV141);
 const nome=m=>sem((m.nome||'')+' '+m.id);
 const cidade=reais.find(m=>String(m.id)===ID_CIDADE)||reais.find(m=>/cidade baixa/.test(nome(m))&&!/imagem ia/.test(nome(m)))||null;
 const escadaria=reais.find(m=>String(m.id)===ID_ESCADARIA)||reais.find(m=>/escadaria/.test(nome(m)))||null;
 const ruim=/imagem ia|teste|alto|alta|porto|cidade baixa/;
 const portao=reais.find(m=>/^portao de vespera$/.test(sem(m.nome||'')))||reais.find(m=>/portao/.test(nome(m))&&!ruim.test(nome(m))&&m!==cidade)||null;
 return {cidade,portao,escadaria};
}

const L=(m,W,H)=>({x:+(m.x*28/W).toFixed(3),y:+(m.y*14/H).toFixed(3)}); // metros → coordenada lógica 28×14 das ligações
// Entradas do bairro: portão no canto de baixo à esquerda, escadaria no canto de cima à direita (o bairro corre entre os dois)
export const ENTRADAS=(W,H)=>({portao:L({x:1.6,y:H-3},W,H),escadaria:L({x:W-1.6,y:3},W,H)});

// Ligações novas: tira tudo que toca a Cidade Baixa e põe só Portão↔Cidade e Cidade↔Escadaria.
// A ponta do outro mapa (onde fica a porta lá) é a da ligação que já existia, se houver.
export function ligacoesBairro({ligs=[],idCidade,idPortao,idEscadaria,W=TAMANHO_BAIRRO.W,H=TAMANHO_BAIRRO.H}){
 const toca=l=>String(l?.a?.mapa)===String(idCidade)||String(l?.b?.mapa)===String(idCidade);
 const ponta=(outro,padrao)=>{const l=ligs.find(x=>toca(x)&&(String(x.a?.mapa)===String(outro)||String(x.b?.mapa)===String(outro)));
  if(!l)return padrao;const p=String(l.a?.mapa)===String(outro)?l.a:l.b;return {x:Number(p.x),y:Number(p.y)};};
 const e=ENTRADAS(W,H);
 const novas=[];
 if(idPortao)novas.push({id:'lig_v195_bairro_portao',a:{mapa:String(idPortao),...ponta(idPortao,{x:14,y:12.9})},b:{mapa:String(idCidade),...e.portao},tipo:'porta',rotulo:'Portão de Véspera',bairroV195:true});
 if(idEscadaria)novas.push({id:'lig_v195_bairro_escadaria',a:{mapa:String(idCidade),...e.escadaria},b:{mapa:String(idEscadaria),...ponta(idEscadaria,{x:14,y:12.9})},tipo:'porta',rotulo:'Escadaria da Cidade Alta',bairroV195:true});
 const removidas=ligs.filter(toca);
 return {ligs:[...ligs.filter(l=>!toca(l)),...novas],removidas,novas};
}

export function instalarBairro(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const aviso=(t,ms=14000)=>{const n=root.createElement('div');n.textContent=t;n.style.cssText='position:fixed;left:16px;bottom:300px;z-index:10003;max-width:min(520px,92vw);background:#14242b;border:1px solid #6fd6c0;color:#d8fff5;padding:9px 14px;border-radius:12px;font:600 13px Segoe UI,Arial,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.5)';root.body.append(n);setTimeout(()=>n.remove(),ms);};
 const guardar=async(caminho,obj)=>{try{if((await dep.getDoc(D(caminho))).exists())return true;if(obj&&JSON.stringify(obj).length<900000)await dep.setDoc(D(caminho),clean({em:new Date().toISOString(),dados:obj}));return true;}catch(e){console.warn('[Bairro] backup',caminho,e);return false;}};
 let rodando=false;

 async function preparar({confirmar=true}={}){
  if(rodando||!ehMestre())return {ok:false,motivo:'sem permissão'};
  const api=win.mesaMapasV110_;if(!api?.salvar){aviso('O gerador de mapas ainda está carregando. Tente de novo em instantes.');return {ok:false,motivo:'carregando'};}
  const mapas=dep.mapas?.()||[],m=acharMapas(mapas);
  const falta=[!m.cidade&&'Cidade Baixa',!m.portao&&'Portão de Véspera',!m.escadaria&&'Escadaria da Cidade Alta'].filter(Boolean);
  if(falta.length){aviso('🏘️ Não achei o(s) mapa(s): '+falta.join(', ')+'. Nada foi mudado.');return {ok:false,motivo:'faltam mapas',falta};}
  const {W,H}=TAMANHO_BAIRRO;
  if(confirmar&&!win.confirm(`Começar o bairro?\n\n• “${m.cidade.nome||m.cidade.id}” perde a imagem de fundo e as casas desenhadas e passa de ${m.cidade.larguraM||'?'}×${m.cidade.alturaM||'?'} m para ${W}×${H} m, vazia, para você construir.\n• Ficam só duas ligações: “${m.portao.nome||m.portao.id}” ↔ Cidade Baixa ↔ “${m.escadaria.nome||m.escadaria.id}”. As outras ligações da Cidade Baixa são desfeitas.\n\nUma cópia de segurança de tudo é guardada antes.`))return {ok:false,motivo:'cancelado'};
  rodando=true;const feitos=[],erros=[],ID=String(m.cidade.id);
  try{
   // 1) cópias de segurança
   try{const mp=await dep.getDoc(D('mapas/'+ID));if(mp.exists())await guardar('combatesAtivos/backupBairro_mapa_v195',mp.data());}catch(e){erros.push('backup do mapa');}
   try{const c=await dep.getDoc(D('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(ID)));if(c.exists())await guardar('combatesAtivos/backupBairro_cena_v195',c.data());}catch(e){erros.push('backup da cena');}
   const ls=await dep.getDoc(D(LIGACOES)),dl=ls.exists()?ls.data()||{}:{};
   await guardar('combatesAtivos/backupBairro_ligacoes_v195',dl);
   // 2) o mapa: vazio, pequeno, sem imagem
   const st=estadoBairro(W,H,m.cidade.nome||NOME_BAIRRO);
   await api.salvar({id:ID,nome:m.cidade.nome||NOME_BAIRRO,state:st,cenaDe:mid=>{const c=cenaDoEstado(st,mid);return JSON.stringify(c).length<=LIMITE_CENA?c:null;}});
   const extra={larguraM:W,alturaM:H,imagemV163:null,marcasV163:null,cidadeBaixaV164:false,cidadeBaixaV173:false,estiloV129:'',bairroV195:{em:new Date().toISOString(),W,H}};
   await dep.setDoc(D('mapas/'+ID),clean(extra),{merge:true});
   try{const loc=(dep.mapas?.()||[]).find(x=>String(x.id)===ID);if(loc)Object.assign(loc,extra);}catch(_){}
   try{const sh=await dep.getDoc(D('combatesAtivos/mapaMesaSyncDireta'));if(sh.exists()&&String(sh.data()?.mapId||'')===ID)await dep.setDoc(D('combatesAtivos/mapaMesaSyncDireta'),{larguraM:W,alturaM:H},{merge:true});}catch(_){}
   try{await dep.setDoc(D('combatesAtivos/marcasMapa_'+encodeURIComponent(ID)),{json:'[]',mapId:ID,em:Date.now(),sincronizadoV167:true});}catch(_){}
   try{const r=await dep.getDoc(D('combatesAtivos/mesaObjetosMestre'));if(r.exists()){const v=r.data()||{},mp2={...(v.mapas||{})};if(mp2[ID]){await guardar('combatesAtivos/backupBairro_registro_v195',mp2[ID]);delete mp2[ID];await dep.setDoc(D('combatesAtivos/mesaObjetosMestre'),clean({...v,mapas:mp2}));}}}catch(e){erros.push('registro de objetos');}
   feitos.push(`Cidade Baixa ${W}×${H} m, vazia e sem imagem`);
   // 3) ligações: só as duas
   const r=ligacoesBairro({ligs:dl.ligacoes||[],idCidade:ID,idPortao:m.portao.id,idEscadaria:m.escadaria.id,W,H});
   await dep.setDoc(D(LIGACOES),clean({...dl,ligacoes:r.ligs,atualizadoEm:Date.now(),bairroV195:true}));
   feitos.push(`${r.removidas.length} ligação(ões) antiga(s) desfeita(s), 2 novas (Portão e Escadaria)`);
   // 4) quem estava no mapa vai para perto do portão (o mapa mudou de tamanho e de lugar das coisas)
   try{const e=ENTRADAS(W,H);let k=0;for(const t of (ctl()?.todosTokens?.()||[]).filter(t=>String(t.mapaId||'')===ID)){const i=k++;
    await dep.runTransaction(dep.db,async tx=>{const ref=D('combatesAtivos/mapaMesaSyncDireta/posicoes/'+t.id),s=await tx.get(ref);if(!s.exists())return;tx.set(ref,{...s.data(),x:+(e.portao.x+1.4+(i%4)*1.1).toFixed(3),y:+(e.portao.y-.6-Math.floor(i/4)*1.1).toFixed(3),revision:Number(s.data().revision||0)+1});});}}catch(e){erros.push('posições');}
   try{win.labAtualizarSelectMapas_?.();}catch(_){}
   try{if(String(ctl()?.mapaAtual?.()||'')===ID)ctl()?.refreshView?.();else await ctl()?.openMap?.(ID);}catch(_){}
   aviso('🏘️ Bairro pronto: '+feitos.join(' · ')+'. Abra o 🧪 → 👷 Construtor para construir.'+(erros.length?' ⚠️ '+erros.join(', '):''),20000);
   return {ok:true,feitos,erros};
  }catch(e){console.warn('[Bairro]',e);aviso('⚠️ Não deu certo: '+(e?.message||e)+'. As cópias de segurança estão em combatesAtivos/backupBairro_*.');return {ok:false,motivo:String(e?.message||e)};}
  finally{rodando=false;}
 }
 // v196: o Yuri pediu (várias vezes): roda SOZINHO, uma vez, quando o mestre abre o site e os mapas já carregaram (com cópia de segurança)
 let feitoAuto=false,rodandoAuto=false,tentativas=0;
 async function automatico(){
  if(feitoAuto||rodandoAuto||rodando||!ehMestre())return;
  if(!(dep.mapas?.()||[]).length||!win.mesaMapasV110_?.salvar||!ctl()?.todosTokens)return;
  const flag=D('configuracoes/bairroV196');
  try{if((await dep.getDoc(flag)).exists()){feitoAuto=true;return;}}catch(_){return;}
  if(++tentativas>8){feitoAuto=true;return;}
  rodandoAuto=true;
  try{
   const falta=Object.values(acharMapas(dep.mapas?.()||[])).some(x=>!x);if(falta&&tentativas<4)return; // espera os mapas aparecerem
   await dep.setDoc(flag,{iniciadoEm:new Date().toISOString()});
   const r=await preparar({confirmar:false});
   await dep.setDoc(flag,{em:new Date().toISOString(),ok:!!r.ok,motivo:r.motivo||'',feitos:r.feitos||[],erros:r.erros||[],falta:r.falta||[]});feitoAuto=true;
  }catch(e){console.warn('[Bairro] automático',e);}
  finally{rodandoAuto=false;}
 }
 const vigia=setInterval(()=>{try{void automatico();}catch(e){console.warn('[Bairro]',e);}},4000);vigia?.unref?.();
 win.mesaBairroV195={preparar,acharMapas:()=>acharMapas(dep.mapas?.()||[]),automatico};
 return {preparar,automatico,parar(){clearInterval(vigia);}};
}
