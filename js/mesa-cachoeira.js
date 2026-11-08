// Mesa Estelar v205 — cachoeira com correnteza: a peça "Cachoeira (queda de água)" só desenha o leito de pedra (miolo transparente);
// a ÁGUA é um canvas pequeno por cachoeira, animado aqui: curso superior calmo, aceleração até o lábio, queda em degraus com espuma e poço com anéis.
// É só visual: não cria força, dano nem teste na água. Um único relógio para todas as cachoeiras; para quando a aba está oculta.
const W=96,H=256,QUADRO_MS=83;
/** velocidade relativa do fluxo ao longo do comprimento (0 = nascente, 1 = fim do poço) */
export function velocidadeFluxo(f){
 if(f<.08)return .22;                       // curso superior: calmo
 if(f<.18)return .22+(f-.08)/.10*.88;       // acelera até o lábio
 if(f<.50)return 1.1;                       // queda em degraus
 if(f<.58)return 1.1-(f-.50)/.08*.2;        // degrau do meio
 if(f<.82)return .9-(f-.58)/.24*.45;        // desce desacelerando
 return .3;                                  // poço
}
/** fase acumulada (px de textura) em f no tempo t (s): integral da velocidade, para o padrão esticar onde acelera */
export const faseFluxo=(f,t)=>velocidadeFluxo(f)*t*58;
function textura(){
 const c=document.createElement('canvas');c.width=64;c.height=128;const g=c.getContext('2d');
 let s=7;const r=()=>{s=(s*16807)%2147483647;return s/2147483647;};
 for(let i=0;i<90;i++){const x=r()*64,y=r()*128,l=8+r()*26,w=1+r()*2.4,a=.12+r()*.34;g.fillStyle='rgba(255,255,255,'+a.toFixed(2)+')';for(const dy of [-128,0,128])g.fillRect(x,y+dy,w,l);}
 return c;
}
export function instalarCachoeira({controller,root=document}={}){
 const win=root.defaultView||window,tex=textura(),ativos=new Map();
 if(!root.getElementById('cqCss')){const st=root.createElement('style');st.id='cqCss';st.textContent='.cq-agua{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;image-rendering:auto}';root.head.append(st);}
 const ctl=()=>{try{return controller?.()||null;}catch(_){return null;}};
 const ehCachoeira=o=>/cachoeira/i.test(String(o?.nome||'')+' '+String(o?.idBanco||o?.catalogoId||o?.bancoId||''));
 function sincronizar(){
  const b=root.getElementById('novaSyncBoard');if(!b)return;
  const objs=(ctl()?.cenaAtual?.()?.objects||[]).filter(ehCachoeira),vivos=new Set();
  for(const o of objs){
   const nodo=[...b.querySelectorAll('[data-scene-object]')].find(n=>n.dataset.sceneObject===String(o.id));if(!nodo)continue;vivos.add(String(o.id));
   let a=ativos.get(String(o.id));
   if(!a||!a.cv.isConnected){const cv=root.createElement('canvas');cv.width=W;cv.height=H;cv.className='cq-agua';cv.dataset.cachoeira=String(o.id);nodo.prepend(cv);a={cv,g:cv.getContext('2d'),t0:performance.now()};ativos.set(String(o.id),a);}
   a.cv.style.display=nodo.style.visibility==='hidden'?'none':'';
  }
  for(const k of [...ativos.keys()])if(!vivos.has(k))ativos.delete(k);
 }
 function desenha(a,t){
  const g=a.g;g.clearRect(0,0,W,H);
  const x0=Math.round(W*.2),x1=Math.round(W*.8),cw=x1-x0;
  // cor da água por trecho (combina com lagoa/riacho): clara no raso, mais funda no poço
  const grad=g.createLinearGradient(0,0,0,H);grad.addColorStop(0,'#3f9aa0');grad.addColorStop(.5,'#35909a');grad.addColorStop(.8,'#287a88');grad.addColorStop(1,'#1f6676'); // v205: tons da lagoa e do canal (antes mais azul, destoava)
  g.globalCompositeOperation='source-over';g.fillStyle=grad;g.fillRect(x0,0,cw,H);
  // faixas de textura deslocadas pela fase local
  g.globalAlpha=.85;
  for(let y=0;y<H;y+=2){const f=y/H,sy=(((y-faseFluxo(f,t))%128)+128)%128,sx=((y*7)%32);g.drawImage(tex,sx,sy,Math.min(cw,64),2,x0,y,cw,2);if(cw>64)g.drawImage(tex,0,sy,cw-64,2,x0+64,y,cw-64,2);}
  g.globalAlpha=1;
  // espuma nos degraus (lábio e meio) e no impacto
  for(const [fy,forca] of [[.12,.55],[.54,.85]]){const y=fy*H;for(let i=0;i<9;i++){const x=x0+4+(i+.5)/9*(cw-8),j=Math.sin(t*3.1+i*1.7),r=3+2.2*Math.abs(j)+forca*2;g.fillStyle='rgba(255,255,255,'+(.35+.3*Math.abs(Math.sin(t*2.3+i))).toFixed(2)+')';g.beginPath();g.ellipse(x,y+j*3,r*1.6,r,0,0,6.283);g.fill();}}
  // poço: anéis de onda que nascem no impacto e se abrem
  for(let k=0;k<3;k++){const fase=((t*.45+k/3)%1),r=6+fase*Math.min(cw*.62,34),yc=H*.9;g.strokeStyle='rgba(255,255,255,'+(.55*(1-fase)).toFixed(2)+')';g.lineWidth=1.6;g.beginPath();g.ellipse(W/2,yc,r*1.15,r*.7,0,0,6.283);g.stroke();}
  // espuma que se espalha a jusante e some
  for(let i=0;i<14;i++){const fase=((t*.3+i*.137)%1),x=W/2+(Math.sin(i*2.4)*cw*.4)*fase,y=H*(.84+fase*.15);g.fillStyle='rgba(255,255,255,'+(.5*(1-fase)).toFixed(2)+')';g.beginPath();g.arc(x,y,1.2+fase*2.5,0,6.283);g.fill();}
  // borda macia (a água entra sob as pedras): esmaece as laterais
  g.globalCompositeOperation='destination-out';
  // bordas ORGÂNICAS: dentes de onda nas laterais (ruído por linha) em vez de corte reto; o fim do poço some devagar no canal
  for(let y=0;y<H;y+=2){const n1=Math.sin(y*.21+t*.7)*3+Math.sin(y*.063+1.3)*4,n2=Math.sin(y*.17-t*.6+2)*3+Math.sin(y*.05)*4;g.fillStyle='rgba(0,0,0,1)';g.fillRect(0,y,x0+n1+4,2);g.fillRect(x1+n2-4,y,W-(x1+n2-4),2);}
  const fim=g.createLinearGradient(0,H*.86,0,H);fim.addColorStop(0,'rgba(0,0,0,0)');fim.addColorStop(1,'rgba(0,0,0,1)');g.fillStyle=fim;g.fillRect(0,H*.86,W,H*.14);
  const bord=g.createLinearGradient(x0,0,x1,0);g.globalCompositeOperation='destination-in';bord.addColorStop(0,'rgba(0,0,0,0)');bord.addColorStop(.1,'rgba(0,0,0,1)');bord.addColorStop(.9,'rgba(0,0,0,1)');bord.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=bord;g.fillRect(0,0,W,H);g.globalCompositeOperation='source-over';
 }
 const relogio=setInterval(()=>{try{if(root.hidden||win.document?.hidden)return;sincronizar();const agora=performance.now();for(const a of ativos.values())desenha(a,win.mesaRelogioAguaV205?.()??(agora-a.t0)/1000);}catch(e){console.warn('[Cachoeira]',e);}},QUADRO_MS);relogio.unref?.();
 const api={parar:()=>clearInterval(relogio),ativas:()=>ativos.size,desenhar:()=>{sincronizar();for(const a of ativos.values())desenha(a,win.mesaRelogioAguaV205?.()??(performance.now()-a.t0)/1000);}};
 win.mesaCachoeiraV205=api;return api;
}
