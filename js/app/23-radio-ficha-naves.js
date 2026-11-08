// ============================================================
// V63 — Rádio da Mesa independente do mapa
// Restaura o player flutuante para jogadores e desacopla a
// música compartilhada do protocolo de sincronização do mapa.
// ============================================================
const AUDIO_MESA_LIVE_V63_PATH_='configuracoes/audio_mesa_ao_vivo_v1';
let audioMesaLiveV63Unsub_=null;

function audioMesaLiveV63Ref_(){
    return doc(db,...AUDIO_MESA_LIVE_V63_PATH_.split('/'));
}
function audioMesaLiveV63Normalizar_(st){
    const x=st&&typeof st==='object'?st:{};
    const playlist=Array.isArray(x.playlist)?x.playlist.map(t=>({
        id:String(t?.id||''),nome:String(t?.nome||''),url:String(t?.url||''),
        categoria:String(t?.categoria||''),ordem:Number(t?.ordem||0)
    })).filter(t=>t.url):[];
    return {
        schema:1,
        id:String(x.id||''),
        nome:String(x.nome||''),
        url:String(x.url||''),
        categoria:String(x.categoria||''),
        mode:String(x.mode||'single'),
        momento:String(x.momento||''),
        playlist,
        playlistIndex:Math.max(0,Number(x.playlistIndex||0)),
        playing:!!x.playing,
        inicioTs:Number(x.inicioTs||Date.now()),
        atualizadoEm:Number(x.atualizadoEm||Date.now())
    };
}
async function audioMesaLiveV63Publicar_(st){
    if(!batalhaEhMestre_()||!currentUserUid)return;
    const payload=audioMesaLiveV63Normalizar_({...st,atualizadoEm:Date.now()});
    try{
        await setDoc(audioMesaLiveV63Ref_(),payload,{merge:false});
    }catch(e){
        console.warn('Rádio da Mesa: não foi possível publicar o estado',e);
        notificar_('Não foi possível sincronizar a música com os jogadores.','erro',4500);
    }
}
function audioMesaLiveV63Aplicar_(data){
    const remoto=audioMesaLiveV63Normalizar_(data||{playing:false,inicioTs:Date.now()});
    labEstado_.audioMesaLab=remoto;
    // Força o player a reconsiderar a faixa quando o mestre troca ou para.
    labAudioUltimaChave490_='';
    try{labAudioAplicar490_();}catch(e){console.warn('Rádio da Mesa: reprodução',e);}
    try{labAudioFloat490_();}catch(e){console.warn('Rádio da Mesa: painel',e);}
    try{gmMusicaSelectorRender510_();}catch(_){}
}
function iniciarAudioMesaAoVivoV63_(){
    audioMesaLiveV63Unsub_?.();audioMesaLiveV63Unsub_=null;
    if(!auth.currentUser)return;
    // O ícone deve existir mesmo antes de haver uma música em execução.
    try{labAudioFloat490_();}catch(_){}
    audioMesaLiveV63Unsub_=onSnapshot(audioMesaLiveV63Ref_(),snap=>{
        audioMesaLiveV63Aplicar_(snap.exists()?snap.data():{playing:false,inicioTs:Date.now()});
    },e=>{
        console.warn('Rádio da Mesa indisponível',e);
        try{labAudioFloat490_();}catch(_){}
    });
}
function pararAudioMesaAoVivoV63_(){
    audioMesaLiveV63Unsub_?.();audioMesaLiveV63Unsub_=null;
    try{labAudioParar500_();}catch(_){try{labAudioParar490_();}catch(__){}}
    document.getElementById('labAudioMesaFloat')?.remove();
}

// Espelha no documento leve de áudio as ações do mestre. O rádio continua
// funcionando mesmo quando o Mapa da Mesa usa outro protocolo de sincronização.
const gmMusicaTocarIdV63Base_=window.gmMusicaTocarId510_;
window.gmMusicaTocarId510_=function(id){
    const r=gmMusicaTocarIdV63Base_?.(id);
    queueMicrotask(()=>audioMesaLiveV63Publicar_(labEstado_.audioMesaLab));
    return r;
};
const gmMusicaTocarMomentoV63Base_=window.gmMusicaTocarMomento510_;
window.gmMusicaTocarMomento510_=function(moment){
    const r=gmMusicaTocarMomentoV63Base_?.(moment);
    queueMicrotask(()=>audioMesaLiveV63Publicar_(labEstado_.audioMesaLab));
    return r;
};
const gmMusicaTocarLegadoV63Base_=window.gmMusicaTocar490_;
window.gmMusicaTocar490_=function(i){
    const r=gmMusicaTocarLegadoV63Base_?.(i);
    queueMicrotask(()=>audioMesaLiveV63Publicar_(labEstado_.audioMesaLab));
    return r;
};
const gmMusicaPararV63Base_=window.gmMusicaParar490_;
window.gmMusicaParar490_=function(){
    const r=gmMusicaPararV63Base_?.();
    queueMicrotask(()=>audioMesaLiveV63Publicar_(labEstado_.audioMesaLab));
    return r;
};

// Se uma playlist avança no navegador do mestre, publica a nova faixa para
// que os jogadores saltem para o mesmo item e para o mesmo ponto temporal.
if(typeof labAudioAvancar510_==='function'){
    const labAudioAvancarV63Base_=labAudioAvancar510_;
    labAudioAvancar510_=function(){
        const r=labAudioAvancarV63Base_();
        if(batalhaEhMestre_())queueMicrotask(()=>audioMesaLiveV63Publicar_(labEstado_.audioMesaLab));
        return r;
    };
}

// O rádio existe para qualquer usuário autenticado, em qualquer aba do site.
if(typeof onAuthStateChanged==='function'&&typeof auth!=='undefined')onAuthStateChanged(auth,user=>{
    if(user)setTimeout(iniciarAudioMesaAoVivoV63_,0);
    else pararAudioMesaAoVivoV63_();
});

console.info('[Mesa Estelar] v63 rádio compartilhado carregado');
window.__MESA_PATCH__='v63-radio-compartilhado';

// ===== v64 · objetos de mapa: corte de margens + rótulos X/Y =====
function objMapaCropAlphaCanvasV64_(canvas,minAlpha=6){
    try{
        const ctx=canvas.getContext('2d',{willReadFrequently:true});
        const w=canvas.width|0,h=canvas.height|0;
        if(!w||!h)return canvas;
        const img=ctx.getImageData(0,0,w,h),d=img.data;
        let minX=w,minY=h,maxX=-1,maxY=-1;
        for(let y=0;y<h;y++){
            for(let x=0;x<w;x++){
                const a=d[(y*w+x)*4+3]||0;
                if(a>minAlpha){if(x<minX)minX=x;if(y<minY)minY=y;if(x>maxX)maxX=x;if(y>maxY)maxY=y;}
            }
        }
        if(maxX<0||maxY<0)return canvas;
        if(minX===0&&minY===0&&maxX===w-1&&maxY===h-1)return canvas;
        const ow=maxX-minX+1,oh=maxY-minY+1;
        const out=document.createElement('canvas');
        out.width=Math.max(1,ow);out.height=Math.max(1,oh);
        out.getContext('2d').drawImage(canvas,minX,minY,ow,oh,0,0,ow,oh);
        return out;
    }catch(_){return canvas;}
}
function objMapaArquivoParaDataV64Carregar_(src){
    return new Promise((resolve,reject)=>{
        const im=new Image();
        im.onload=()=>resolve(im);
        im.onerror=reject;
        im.src=src;
    });
}
function objMapaGerarDataURLV64_(im,opt={}){
    const max=Number(opt.max||320),trim=opt.trim!==false;
    let scale=Math.min(1,max/Math.max(im.width||1,im.height||1)),data='';
    for(let tentativa=0;tentativa<4;tentativa++){
        let c=document.createElement('canvas');
        c.width=Math.max(1,Math.round((im.width||1)*scale));
        c.height=Math.max(1,Math.round((im.height||1)*scale));
        const ctx=c.getContext('2d');
        ctx.clearRect(0,0,c.width,c.height);
        ctx.drawImage(im,0,0,c.width,c.height);
        if(trim)c=objMapaCropAlphaCanvasV64_(c,6);
        try{data=c.toDataURL('image/webp',Math.max(.55,.82-tentativa*.09));}
        catch(_){data=c.toDataURL('image/png');}
        if(data.length<95000)break;
        scale*=.78;
    }
    return data;
}
const objMapaArquivoParaDataV64Base_=(typeof objMapaArquivoParaData_==='function')?objMapaArquivoParaData_:null;
objMapaArquivoParaData_=function(f){
    return new Promise((resolve,reject)=>{
        if(!f||!String(f.type||'').startsWith('image/'))return reject(new Error('Arquivo inválido'));
        const rd=new FileReader();
        rd.onerror=reject;
        rd.onload=async()=>{
            try{const im=await objMapaArquivoParaDataV64Carregar_(rd.result);resolve(objMapaGerarDataURLV64_(im,{trim:true}));}
            catch(e){
                if(objMapaArquivoParaDataV64Base_)objMapaArquivoParaDataV64Base_(f).then(resolve,reject);
                else reject(e);
            }
        };
        rd.readAsDataURL(f);
    });
};
window.objMapaLerImagem_=function(ev){
    const f=ev?.target?.files?.[0];if(!f||!f.type.startsWith('image/'))return;
    objMapaArquivoParaData_(f).then(data=>{
        const p=document.getElementById('objMapaImagemPreview');
        if(!p)return;
        p.src=data;p.dataset.imagem=data;
        const url=document.getElementById('objMapaImagemUrl');if(url)url.value='';
        notificar_('Imagem carregada. Margens transparentes foram ajustadas automaticamente quando detectadas.','sucesso',3200);
    }).catch(e=>{console.error('objMapaLerImagem v64',e);notificar_('Não foi possível carregar a imagem.','erro',4000);});
};
window.objMapaCortarMargensTransparentes_=function(){
    const p=document.getElementById('objMapaImagemPreview');
    if(!p)return;
    const src=String(p.dataset?.imagem||p.src||'').trim();
    if(!src){notificar_('Carregue uma imagem primeiro.','aviso');return;}
    objMapaArquivoParaDataV64Carregar_(src).then(im=>{
        const antesW=im.naturalWidth||im.width||0,antesH=im.naturalHeight||im.height||0;
        let c=document.createElement('canvas');c.width=antesW;c.height=antesH;c.getContext('2d').drawImage(im,0,0,antesW,antesH);
        const cortado=objMapaCropAlphaCanvasV64_(c,6);
        if(cortado.width===c.width&&cortado.height===c.height){notificar_('Não encontrei margens transparentes relevantes para cortar.','aviso',2800);return;}
        const data=cortado.toDataURL('image/png');
        p.src=data;p.dataset.imagem=data;
        const url=document.getElementById('objMapaImagemUrl');if(url)url.value='';
        notificar_(`Margens transparentes cortadas (${antesW}×${antesH} → ${cortado.width}×${cortado.height}).`,'sucesso',3800);
    }).catch(e=>{console.error('Cortar margens transparentes',e);notificar_('Não foi possível cortar as margens desta imagem.','erro',4000);});
};
function objMapaAprimorarEditorV64_(){
    try{
        const campoX=document.getElementById('objMapaLargura');
        const campoY=document.getElementById('objMapaAltura');
        if(campoX?.parentElement){
            const label=campoX.parentElement;
            if(!label.dataset.v64xy){label.dataset.v64xy='1';if(label.firstChild&&label.firstChild.nodeType===3)label.firstChild.nodeValue='Comprimento (X, m)';}
        }
        if(campoY?.parentElement){
            const label=campoY.parentElement;
            if(!label.dataset.v64xy){label.dataset.v64xy='1';if(label.firstChild&&label.firstChild.nodeType===3)label.firstChild.nodeValue='Largura (Y, m)';}
        }
        const bloco=document.querySelector('#editorObjetoMapaBanco div[style*="background:rgba(0,0,0,.12)"]');
        if(bloco&&!document.getElementById('objMapaTrimBtnV64')){
            const btn=document.createElement('button');
            btn.type='button';btn.id='objMapaTrimBtnV64';btn.className='btn-small';
            btn.textContent='📐 Cortar margens transparentes';
            btn.onclick=()=>window.objMapaCortarMargensTransparentes_();
            bloco.insertBefore(btn,bloco.children[1]||null);
            const dica=document.createElement('small');
            dica.id='objMapaTrimHintV64';
            dica.style.color='#8ea7c8';
            dica.textContent='Use este botão quando a imagem parecer pequena demais dentro do espaço em metros por causa de bordas transparentes.';
            bloco.appendChild(dica);
        }
    }catch(e){console.warn('objMapaAprimorarEditorV64',e);}
}
const preencherEditorObjetoMapaV64Base_=(typeof preencherEditorObjetoMapa_==='function')?preencherEditorObjetoMapa_:null;
if(preencherEditorObjetoMapaV64Base_)preencherEditorObjetoMapa_=function(){
    const r=preencherEditorObjetoMapaV64Base_.apply(this,arguments);
    setTimeout(objMapaAprimorarEditorV64_,0);
    return r;
};
if(typeof setTimeout==='function')setTimeout(objMapaAprimorarEditorV64_,0);
console.info('[Mesa Estelar] v64 objetos de mapa: corte de margens carregado');
window.__MESA_PATCH__='v64-objetos-margens';

// ===== v65 · editor manual de transparência para Objetos de Mapa =====
let objMapaMascaraV65_=null;
function objMapaMascaraModalV65_(){
    let modal=document.getElementById('objMapaMascaraModalV65');
    if(modal)return modal;
    modal=document.createElement('div');
    modal.id='objMapaMascaraModalV65';
    modal.style.cssText='display:none;position:fixed;inset:0;z-index:100000;background:rgba(3,5,16,.88);padding:24px;overflow:auto;';
    modal.innerHTML=`
      <div style="max-width:980px;margin:0 auto;background:#171a35;border:1px solid rgba(0,212,255,.45);border-radius:16px;padding:18px;box-shadow:0 18px 70px rgba(0,0,0,.55);color:#fff;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px;">
          <div><h3 style="margin:0;color:#9ee7ff;">🧽 Limpeza manual da imagem</h3><small style="color:#9fb3cf;">Apague restos de fundo ou restaure partes apagadas nesta edição.</small></div>
          <button type="button" class="btn-small" id="objMapaMascaraFecharV65">✕ Fechar</button>
        </div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px;padding:10px;border-radius:10px;background:rgba(255,255,255,.05);">
          <button type="button" class="btn-small btn-select" id="objMapaMascaraApagarV65">🧽 Apagar</button>
          <button type="button" class="btn-small" id="objMapaMascaraRestaurarV65">🖌️ Restaurar</button>
          <label style="display:flex;align-items:center;gap:7px;margin:0;">Tamanho <input id="objMapaMascaraPincelV65" type="range" min="2" max="80" value="24" style="width:150px;margin:0;"><span id="objMapaMascaraPincelValorV65" style="min-width:36px;">24 px</span></label>
          <button type="button" class="btn-small" id="objMapaMascaraDesfazerV65">↶ Desfazer</button>
          <button type="button" class="btn-small" id="objMapaMascaraResetV65">↺ Reiniciar</button>
        </div>
        <div id="objMapaMascaraCanvasWrapV65" style="position:relative;display:flex;justify-content:center;align-items:center;min-height:360px;max-height:65vh;overflow:auto;border-radius:12px;border:1px solid rgba(255,255,255,.16);padding:18px;background-color:#d7d7d7;background-image:linear-gradient(45deg,#aaa 25%,transparent 25%),linear-gradient(-45deg,#aaa 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#aaa 75%),linear-gradient(-45deg,transparent 75%,#aaa 75%);background-size:24px 24px;background-position:0 0,0 12px,12px -12px,-12px 0px;">
          <canvas id="objMapaMascaraCanvasV65" style="max-width:100%;height:auto;touch-action:none;cursor:crosshair;image-rendering:auto;box-shadow:0 0 0 1px rgba(0,0,0,.25);"></canvas>
        </div>
        <div style="display:flex;gap:9px;justify-content:flex-end;flex-wrap:wrap;margin-top:13px;">
          <button type="button" class="btn-small" id="objMapaMascaraCancelarV65">Cancelar</button>
          <button type="button" class="btn-save" id="objMapaMascaraAplicarV65">✅ Aplicar à prévia</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    const fechar=()=>objMapaMascaraFecharV65_(false);
    modal.querySelector('#objMapaMascaraFecharV65').onclick=fechar;
    modal.querySelector('#objMapaMascaraCancelarV65').onclick=fechar;
    modal.addEventListener('mousedown',e=>{if(e.target===modal)fechar();});
    modal.querySelector('#objMapaMascaraApagarV65').onclick=()=>objMapaMascaraModoV65_('apagar');
    modal.querySelector('#objMapaMascaraRestaurarV65').onclick=()=>objMapaMascaraModoV65_('restaurar');
    const slider=modal.querySelector('#objMapaMascaraPincelV65');
    slider.oninput=()=>{const v=modal.querySelector('#objMapaMascaraPincelValorV65');if(v)v.textContent=`${slider.value} px`;};
    modal.querySelector('#objMapaMascaraDesfazerV65').onclick=()=>objMapaMascaraDesfazerV65_();
    modal.querySelector('#objMapaMascaraResetV65').onclick=()=>objMapaMascaraResetV65_();
    modal.querySelector('#objMapaMascaraAplicarV65').onclick=()=>objMapaMascaraFecharV65_(true);
    const canvas=modal.querySelector('#objMapaMascaraCanvasV65');
    let desenhando=false,ultimo=null;
    const ponto=e=>{
        const r=canvas.getBoundingClientRect();
        const sx=canvas.width/Math.max(1,r.width),sy=canvas.height/Math.max(1,r.height);
        return {x:(e.clientX-r.left)*sx,y:(e.clientY-r.top)*sy};
    };
    canvas.addEventListener('pointerdown',e=>{
        if(!objMapaMascaraV65_)return;
        canvas.setPointerCapture?.(e.pointerId);
        objMapaMascaraSalvarUndoV65_();
        desenhando=true;ultimo=ponto(e);objMapaMascaraPintarV65_(ultimo,ultimo);
        e.preventDefault();
    });
    canvas.addEventListener('pointermove',e=>{
        if(!desenhando||!ultimo)return;
        const p=ponto(e);objMapaMascaraPintarV65_(ultimo,p);ultimo=p;e.preventDefault();
    });
    const parar=e=>{desenhando=false;ultimo=null;try{canvas.releasePointerCapture?.(e.pointerId);}catch(_){}};
    canvas.addEventListener('pointerup',parar);canvas.addEventListener('pointercancel',parar);canvas.addEventListener('pointerleave',e=>{if(e.buttons===0)parar(e);});
    return modal;
}
function objMapaMascaraModoV65_(modo){
    if(!objMapaMascaraV65_)return;
    objMapaMascaraV65_.modo=modo;
    const modal=objMapaMascaraModalV65_();
    const a=modal.querySelector('#objMapaMascaraApagarV65'),r=modal.querySelector('#objMapaMascaraRestaurarV65');
    a.classList.toggle('btn-select',modo==='apagar');r.classList.toggle('btn-select',modo==='restaurar');
}
function objMapaMascaraSalvarUndoV65_(){
    const s=objMapaMascaraV65_;if(!s)return;
    const ctx=s.canvas.getContext('2d',{willReadFrequently:true});
    try{s.undo.push(ctx.getImageData(0,0,s.canvas.width,s.canvas.height));if(s.undo.length>20)s.undo.shift();}catch(_){}
}
function objMapaMascaraDesfazerV65_(){
    const s=objMapaMascaraV65_;if(!s||!s.undo.length)return;
    const img=s.undo.pop();s.canvas.getContext('2d').putImageData(img,0,0);
}
function objMapaMascaraResetV65_(){
    const s=objMapaMascaraV65_;if(!s)return;
    objMapaMascaraSalvarUndoV65_();
    const ctx=s.canvas.getContext('2d');ctx.clearRect(0,0,s.canvas.width,s.canvas.height);ctx.drawImage(s.original,0,0);
}
function objMapaMascaraPintarV65_(a,b){
    const s=objMapaMascaraV65_;if(!s)return;
    const ctx=s.canvas.getContext('2d');
    const brush=Math.max(2,Number(document.getElementById('objMapaMascaraPincelV65')?.value||24));
    const dist=Math.hypot(b.x-a.x,b.y-a.y),passos=Math.max(1,Math.ceil(dist/Math.max(1,brush*.24)));
    if(s.modo==='apagar'){
        ctx.save();ctx.globalCompositeOperation='destination-out';ctx.fillStyle='rgba(0,0,0,1)';
        for(let i=0;i<=passos;i++){const t=i/passos,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;ctx.beginPath();ctx.arc(x,y,brush/2,0,Math.PI*2);ctx.fill();}
        ctx.restore();
    }else{
        ctx.save();ctx.beginPath();
        for(let i=0;i<=passos;i++){const t=i/passos,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;ctx.moveTo(x+brush/2,y);ctx.arc(x,y,brush/2,0,Math.PI*2);}
        ctx.clip();ctx.clearRect(0,0,s.canvas.width,s.canvas.height);ctx.drawImage(s.original,0,0);ctx.restore();
    }
}
window.objMapaAbrirEditorManualV65_=function(){
    const prev=document.getElementById('objMapaImagemPreview');
    const src=String(prev?.dataset?.imagem||prev?.src||'').trim();
    if(!src){notificar_('Carregue uma imagem antes de abrir a limpeza manual.','aviso');return;}
    const modal=objMapaMascaraModalV65_(),canvas=modal.querySelector('#objMapaMascaraCanvasV65');
    const im=new Image();
    if(/^https?:/i.test(src))im.crossOrigin='anonymous';
    im.onload=()=>{
        const w=im.naturalWidth||im.width,h=im.naturalHeight||im.height;
        canvas.width=w;canvas.height=h;
        const ctx=canvas.getContext('2d');ctx.clearRect(0,0,w,h);ctx.drawImage(im,0,0,w,h);
        const original=document.createElement('canvas');original.width=w;original.height=h;original.getContext('2d').drawImage(im,0,0,w,h);
        objMapaMascaraV65_={canvas,original,modo:'apagar',undo:[]};
        objMapaMascaraModoV65_('apagar');
        modal.style.display='block';
    };
    im.onerror=()=>notificar_('Não foi possível abrir essa imagem para edição manual. Imagens externas podem bloquear edição por segurança do navegador.','erro',6000);
    im.src=src;
};
function objMapaMascaraFecharV65_(aplicar){
    const modal=document.getElementById('objMapaMascaraModalV65'),s=objMapaMascaraV65_;
    if(aplicar&&s){
        try{
            let c=s.canvas;
            if(typeof objMapaCropAlphaCanvasV64_==='function')c=objMapaCropAlphaCanvasV64_(c,6);
            let data='';try{data=c.toDataURL('image/webp',.92);}catch(_){data=c.toDataURL('image/png');}
            const p=document.getElementById('objMapaImagemPreview');
            if(p){p.src=data;p.dataset.imagem=data;}
            const url=document.getElementById('objMapaImagemUrl');if(url)url.value='';
            notificar_('Limpeza manual aplicada à prévia. Salve o objeto para gravar a alteração.','sucesso',4200);
        }catch(e){console.error('Aplicar limpeza manual',e);notificar_('Não foi possível aplicar a edição manual.','erro',5000);return;}
    }
    if(modal)modal.style.display='none';
    objMapaMascaraV65_=null;
}
function objMapaAprimorarEditorV65_(){
    try{
        const bloco=document.querySelector('#editorObjetoMapaBanco div[style*="background:rgba(0,0,0,.12)"]');
        if(bloco&&!document.getElementById('objMapaManualBtnV65')){
            const btn=document.createElement('button');btn.type='button';btn.id='objMapaManualBtnV65';btn.className='btn-small';btn.textContent='🧽 Limpar manualmente';btn.onclick=()=>window.objMapaAbrirEditorManualV65_();
            const trim=document.getElementById('objMapaTrimBtnV64');
            if(trim&&trim.parentElement===bloco)bloco.insertBefore(btn,trim.nextSibling);else bloco.insertBefore(btn,bloco.children[1]||null);
        }
    }catch(e){console.warn('objMapaAprimorarEditorV65',e);}
}
const preencherEditorObjetoMapaV65Base_=(typeof preencherEditorObjetoMapa_==='function')?preencherEditorObjetoMapa_:null;
if(preencherEditorObjetoMapaV65Base_)preencherEditorObjetoMapa_=function(){
    const r=preencherEditorObjetoMapaV65Base_.apply(this,arguments);setTimeout(objMapaAprimorarEditorV65_,0);return r;
};
if(typeof setTimeout==='function')setTimeout(objMapaAprimorarEditorV65_,0);
console.info('[Mesa Estelar] v65 limpeza manual de imagens carregada');
window.__MESA_PATCH__='v65-limpeza-manual-imagem';

// ===== v66 · primeira camada da nova navegação da ficha =====
function instalarEstilosNavegacaoV66_(){
    if(document.getElementById('mesaNavV66Styles'))return;
    const style=document.createElement('style');
    style.id='mesaNavV66Styles';
    style.textContent=`
      /* Cabeçalho mais compacto, sem eliminar controles existentes. */
      #appScreen > h1[data-i18n="appTitle"]{display:none!important;}
      #appScreen > .user-header{
        position:relative;display:grid;grid-template-columns:minmax(220px,1fr) auto auto;
        align-items:center;gap:14px;padding:11px 16px;margin-bottom:12px;
        background:linear-gradient(90deg,rgba(35,17,58,.94),rgba(15,34,68,.94));
      }
      #appBrandV66{display:flex;align-items:center;gap:10px;min-width:0;}
      #appBrandV66 .brand-mark{width:34px;height:34px;border-radius:9px;display:grid;place-items:center;
        border:1px solid rgba(0,212,255,.48);background:rgba(0,212,255,.09);font-size:1.15rem;flex:0 0 auto;}
      #appBrandV66 .brand-copy{min-width:0;}
      #appBrandV66 .brand-title{font-weight:800;color:#fff;font-size:1.02rem;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      #appBrandV66 .brand-user{margin-top:4px;color:#bcd4ec;font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      #appScreen > .user-header > .user-info{display:none!important;}
      #appScreen > .user-header .lang-selector{margin:0;justify-content:flex-end;}
      #appScreen > .user-header .lang-btn{padding:6px 11px;}
      #appScreen > .user-header .btn-logout{padding:8px 15px;margin:0;}

      /* As grandes áreas do sistema permanecem numa única faixa horizontal. */
      #appScreen > .tabs{
        justify-content:flex-start;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;
        gap:8px;margin:0 0 18px;padding:4px 2px 8px;scrollbar-width:thin;
      }
      #appScreen > .tabs > .tab-btn{flex:0 0 auto;white-space:nowrap;padding:10px 16px;}

      /* Ficha: seleção em cima quando necessária; contexto persistente à esquerda. */
      #ficha .char-manager{margin-bottom:16px;transition:opacity .16s ease,transform .16s ease;}
      #ficha .char-manager.char-manager-collapsed-v66{display:none;}
      #charWorkspaceV66{display:grid;grid-template-columns:210px minmax(0,1fr);gap:16px;align-items:start;}
      #charContextV66{
        position:sticky;top:12px;padding:16px 14px;border-radius:16px;
        border:1px solid rgba(0,212,255,.25);background:linear-gradient(180deg,rgba(0,212,255,.09),rgba(255,255,255,.035));
        box-shadow:0 10px 30px rgba(0,0,0,.14);min-width:0;
      }
      #charContextV66.hidden{display:none!important;}
      #charContextV66 .context-avatar{width:96px;height:96px;margin:0 auto 11px;border-radius:50%;overflow:hidden;
        display:grid;place-items:center;background:linear-gradient(135deg,#00d4ff,#314b91);border:3px solid #00d4ff;
        box-shadow:0 0 18px rgba(0,212,255,.28);font-size:2.4rem;}
      #charContextV66 .context-avatar img{width:100%;height:100%;object-fit:cover;}
      #charContextV66 .context-name{text-align:center;color:#fff;font-size:1.1rem;font-weight:800;line-height:1.15;word-break:break-word;}
      #charContextV66 .context-meta{text-align:center;color:#9fb4cd;font-size:.78rem;line-height:1.35;margin:7px 0 13px;}
      #charContextV66 .context-label{text-align:center;color:#71e9ff;font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px;}
      #charContextV66 .context-switch{width:100%;padding:9px 10px;border:1px solid rgba(255,255,255,.2);border-radius:9px;
        background:rgba(255,255,255,.08);color:#fff;cursor:pointer;font-weight:700;}
      #charContextV66 .context-switch:hover{border-color:#00d4ff;background:rgba(0,212,255,.11);}
      #characterSection{min-width:0;}
      #characterSection > .char-tabs{
        flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;gap:7px;padding:5px 2px 10px;margin-bottom:16px;
        scrollbar-width:thin;position:sticky;top:0;z-index:15;
        background:linear-gradient(180deg,rgba(17,16,46,.97) 72%,rgba(17,16,46,0));
      }
      #characterSection > .char-tabs .char-tab-btn{flex:0 0 auto;white-space:nowrap;padding:9px 13px;}
      #charSelectorCloseV66{margin-left:auto;}
      #ficha.char-picker-open-v66 #charWorkspaceV66{opacity:.82;}

      @media(max-width:900px){
        #appScreen > .user-header{grid-template-columns:1fr auto;}
        #appScreen > .user-header .lang-selector{grid-column:1/-1;grid-row:2;justify-content:flex-start;}
        #charWorkspaceV66{grid-template-columns:1fr;}
        #charContextV66{position:relative;top:auto;display:grid;grid-template-columns:74px minmax(0,1fr) auto;gap:10px;align-items:center;padding:11px 12px;}
        #charContextV66 .context-avatar{width:68px;height:68px;margin:0;grid-row:1/4;}
        #charContextV66 .context-label,#charContextV66 .context-name,#charContextV66 .context-meta{text-align:left;margin:0;}
        #charContextV66 .context-switch{grid-column:3;grid-row:1/4;width:auto;white-space:nowrap;}
      }
      @media(max-width:600px){
        #appBrandV66 .brand-title{font-size:.9rem;}
        #appScreen > .user-header{grid-template-columns:1fr auto;padding:9px 10px;}
        #charContextV66{grid-template-columns:58px minmax(0,1fr);}
        #charContextV66 .context-avatar{width:54px;height:54px;}
        #charContextV66 .context-switch{grid-column:1/-1;grid-row:auto;}
      }
    `;
    document.head.appendChild(style);
}
function montarCabecalhoV66_(){
    const header=document.querySelector('#appScreen > .user-header');
    if(!header||document.getElementById('appBrandV66'))return;
    const brand=document.createElement('div');brand.id='appBrandV66';
    brand.innerHTML=`<div class="brand-mark">✦</div><div class="brand-copy"><div class="brand-title">D100 · Mesa Estelar RPG</div><div class="brand-user" id="brandUserV66"></div></div>`;
    header.insertBefore(brand,header.firstChild);
    atualizarCabecalhoV66_();
}
function atualizarCabecalhoV66_(){
    const out=document.getElementById('brandUserV66');if(!out)return;
    const role=document.getElementById('userRole')?.textContent?.trim()||'';
    const user=document.getElementById('currentUser')?.textContent?.trim()||'';
    out.textContent=[role,user].filter(Boolean).join(' · ');
}
function personagemAtualV66_(){return (userCharacters||[]).find(c=>String(c.id)===String(currentCharId))||null;}
function montarWorkspaceFichaV66_(){
    const ficha=document.getElementById('ficha'),section=document.getElementById('characterSection'),manager=ficha?.querySelector('.char-manager');
    if(!ficha||!section||!manager)return;
    let work=document.getElementById('charWorkspaceV66');
    if(!work){
        work=document.createElement('div');work.id='charWorkspaceV66';
        const aside=document.createElement('aside');aside.id='charContextV66';aside.className='hidden';
        aside.innerHTML=`
          <div class="context-label">Personagem ativo</div>
          <div class="context-avatar" id="charContextAvatarV66">👤</div>
          <div class="context-name" id="charContextNameV66">—</div>
          <div class="context-meta" id="charContextMetaV66"></div>
          <button type="button" class="context-switch" onclick="abrirSeletorPersonagemV66_()">⇄ Trocar personagem</button>`;
        ficha.insertBefore(work,section);
        work.appendChild(aside);work.appendChild(section);
    }
    if(!document.getElementById('charSelectorCloseV66')){
        const h=manager.querySelector('h3');
        if(h){
            const row=document.createElement('div');row.style.cssText='display:flex;align-items:center;gap:10px;margin-bottom:12px;';
            h.parentNode.insertBefore(row,h);row.appendChild(h);h.style.margin='0';
            const close=document.createElement('button');close.id='charSelectorCloseV66';close.type='button';close.className='btn-small';close.textContent='Fechar seleção';close.onclick=()=>fecharSeletorPersonagemV66_();row.appendChild(close);
        }
    }
    atualizarContextoPersonagemV66_();
}
function atualizarContextoPersonagemV66_(){
    const c=personagemAtualV66_(),aside=document.getElementById('charContextV66'),manager=document.querySelector('#ficha .char-manager');
    if(!aside||!manager)return;
    if(!c){aside.classList.add('hidden');manager.classList.remove('char-manager-collapsed-v66');return;}
    aside.classList.remove('hidden');
    const av=document.getElementById('charContextAvatarV66');
    if(av)av.innerHTML=c.imagem?`<img src="${escaparHtmlInventario_(c.imagem)}" alt="${escaparHtmlInventario_(c.nome||'Personagem')}">`:'👤';
    const nm=document.getElementById('charContextNameV66');if(nm)nm.textContent=c.nome||tr_('unnamedCharacter')||'Personagem';
    const meta=document.getElementById('charContextMetaV66');
    if(meta)meta.textContent=[c.raca||c.raça||'',c.origem||'',c.carreira||''].filter(Boolean).join(' · ');
}
window.abrirSeletorPersonagemV66_=function(){
    const ficha=document.getElementById('ficha'),manager=ficha?.querySelector('.char-manager');if(!manager)return;
    manager.classList.remove('char-manager-collapsed-v66');ficha.classList.add('char-picker-open-v66');
    manager.scrollIntoView({behavior:'smooth',block:'start'});
};
window.fecharSeletorPersonagemV66_=function(){
    const ficha=document.getElementById('ficha'),manager=ficha?.querySelector('.char-manager');if(!manager)return;
    if(!currentCharId)return;
    manager.classList.add('char-manager-collapsed-v66');ficha.classList.remove('char-picker-open-v66');
};
function recolherSeletorSeTemPersonagemV66_(){
    const ficha=document.getElementById('ficha'),manager=ficha?.querySelector('.char-manager');
    if(currentCharId&&manager){manager.classList.add('char-manager-collapsed-v66');ficha?.classList.remove('char-picker-open-v66');}
    atualizarContextoPersonagemV66_();
}
function iniciarNavegacaoV66_(){
    instalarEstilosNavegacaoV66_();montarCabecalhoV66_();montarWorkspaceFichaV66_();
    if(typeof MutationObserver==='function'){
        const info=document.getElementById('currentUser');if(info&&!info.dataset.navObsV66){info.dataset.navObsV66='1';new MutationObserver(atualizarCabecalhoV66_).observe(info,{childList:true,subtree:true,characterData:true});}
        const role=document.getElementById('userRole');if(role&&!role.dataset.navObsV66){role.dataset.navObsV66='1';new MutationObserver(atualizarCabecalhoV66_).observe(role,{childList:true,subtree:true,characterData:true});}
        const sec=document.getElementById('characterSection');if(sec&&!sec.dataset.navObsV66){sec.dataset.navObsV66='1';new MutationObserver(()=>{atualizarContextoPersonagemV66_();if(!sec.classList.contains('hidden'))recolherSeletorSeTemPersonagemV66_();}).observe(sec,{attributes:true,attributeFilter:['class']});}
        const nm=document.getElementById('charName');if(nm&&!nm.dataset.navObsV66){nm.dataset.navObsV66='1';new MutationObserver(()=>atualizarContextoPersonagemV66_()).observe(nm,{childList:true,subtree:true,characterData:true});}
    }
    recolherSeletorSeTemPersonagemV66_();
}
const selecionarPersonagemV66Base_=window.selecionarPersonagem;
window.selecionarPersonagem=async function(){
    const r=await selecionarPersonagemV66Base_.apply(this,arguments);
    montarWorkspaceFichaV66_();recolherSeletorSeTemPersonagemV66_();
    return r;
};
const novoPersonagemV66Base_=window.novoPersonagem;
window.novoPersonagem=function(){
    window.abrirSeletorPersonagemV66_();
    return novoPersonagemV66Base_.apply(this,arguments);
};
const mostrarAbaV66Base_=window.mostrarAba;
window.mostrarAba=function(abaId,btn){
    const r=mostrarAbaV66Base_.apply(this,arguments);
    if(abaId==='ficha'){montarWorkspaceFichaV66_();atualizarContextoPersonagemV66_();}
    return r;
};
if(typeof window.addEventListener==='function')window.addEventListener('personagem-selecionado',()=>{if(typeof setTimeout==='function')setTimeout(()=>{montarWorkspaceFichaV66_();recolherSeletorSeTemPersonagemV66_();},0);});
if(typeof document!=='undefined'){
    if(document.readyState==='loading'&&typeof document.addEventListener==='function')document.addEventListener('DOMContentLoaded',iniciarNavegacaoV66_);
    else iniciarNavegacaoV66_();
    if(typeof setTimeout==='function')setTimeout(iniciarNavegacaoV66_,250);
}
console.info('[Mesa Estelar] v66 navegação da ficha carregada');
window.__MESA_PATCH__='v66-navegacao-ficha';

// ===== v67 · navegação interna da ficha na coluna lateral =====
function instalarEstilosNavegacaoV67_(){
    if(document.getElementById('mesaNavV67Styles'))return;
    const style=document.createElement('style');
    style.id='mesaNavV67Styles';
    style.textContent=`
      /* A identidade do personagem fica na lateral; a foto duplicada do cabeçalho da aba Personagem desaparece. */
      #char-personagem .character-header > #charAvatar{display:none!important;}
      #char-personagem .character-header{gap:0;margin-bottom:22px;}
      #char-personagem .character-header .char-info{min-width:0;}

      /* Navegação da ficha passa a pertencer ao cartão lateral do personagem. */
      #charContextV66{display:flex;flex-direction:column;align-items:stretch;}
      #charContextV66 .context-avatar{flex:0 0 auto;}
      #charContextV66 .context-name,#charContextV66 .context-meta,#charContextV66 .context-label{flex:0 0 auto;}
      #charContextV66 .char-tabs.char-tabs-v67{
        display:flex!important;flex-direction:column;align-items:stretch;gap:7px;
        margin:3px 0 12px;padding:12px 0;border-top:1px solid rgba(255,255,255,.10);
        border-bottom:1px solid rgba(255,255,255,.10);overflow:visible;position:static;background:none;
      }
      #charContextV66 .char-tabs.char-tabs-v67 .char-tab-btn{
        width:100%;min-height:42px;display:flex;align-items:center;justify-content:flex-start;
        text-align:left;white-space:normal;padding:9px 11px;border-radius:9px;font-size:.91rem;
      }
      #charContextV66 .char-tabs.char-tabs-v67 .char-tab-btn.active{
        box-shadow:inset 3px 0 0 #00d4ff,0 0 14px rgba(0,212,255,.12);
      }
      #charContextV66 .context-switch{margin-top:auto;}
      #characterSection > .char-tabs{display:none!important;}

      @media(max-width:900px){
        #charContextV66{display:grid;grid-template-columns:74px minmax(0,1fr) auto;gap:8px 10px;align-items:center;}
        #charContextV66 .context-avatar{grid-column:1;grid-row:1/4;}
        #charContextV66 .context-label{grid-column:2;grid-row:1;}
        #charContextV66 .context-name{grid-column:2;grid-row:2;}
        #charContextV66 .context-meta{grid-column:2;grid-row:3;}
        #charContextV66 .char-tabs.char-tabs-v67{
          grid-column:1/-1;grid-row:4;flex-direction:row;overflow-x:auto;overflow-y:hidden;
          padding:9px 0;margin:2px 0 0;border-bottom:0;scrollbar-width:thin;
        }
        #charContextV66 .char-tabs.char-tabs-v67 .char-tab-btn{
          width:auto;flex:0 0 auto;white-space:nowrap;min-height:39px;padding:8px 11px;
        }
        #charContextV66 .context-switch{grid-column:1/-1;grid-row:5;margin-top:0;}
      }
      @media(max-width:600px){
        #charContextV66{grid-template-columns:58px minmax(0,1fr);}
        #charContextV66 .context-avatar{grid-column:1;grid-row:1/4;}
        #charContextV66 .context-label,#charContextV66 .context-name,#charContextV66 .context-meta{grid-column:2;}
        #charContextV66 .char-tabs.char-tabs-v67{grid-column:1/-1;}
      }
    `;
    document.head.appendChild(style);
}
function moverAbasFichaParaLateralV67_(){
    const aside=document.getElementById('charContextV66');
    const section=document.getElementById('characterSection');
    if(!aside||!section)return;
    let tabs=aside.querySelector('.char-tabs.char-tabs-v67');
    if(!tabs){
        tabs=section.querySelector(':scope > .char-tabs')||section.querySelector('.char-tabs');
        if(!tabs)return;
        tabs.classList.add('char-tabs-v67');
        const botaoTrocar=aside.querySelector('.context-switch');
        if(botaoTrocar)aside.insertBefore(tabs,botaoTrocar);else aside.appendChild(tabs);
    }
}
function iniciarNavegacaoV67_(){
    instalarEstilosNavegacaoV67_();
    if(typeof montarWorkspaceFichaV66_==='function')montarWorkspaceFichaV66_();
    moverAbasFichaParaLateralV67_();
}
const montarWorkspaceFichaV67Base_=(typeof montarWorkspaceFichaV66_==='function')?montarWorkspaceFichaV66_:null;
if(montarWorkspaceFichaV67Base_)montarWorkspaceFichaV66_=function(){
    const r=montarWorkspaceFichaV67Base_.apply(this,arguments);
    moverAbasFichaParaLateralV67_();
    return r;
};
if(typeof window.mostrarAba==='function'){
    const mostrarAbaV67Base_=window.mostrarAba;
    window.mostrarAba=function(){
        const r=mostrarAbaV67Base_.apply(this,arguments);
        if(arguments[0]==='ficha')setTimeout(iniciarNavegacaoV67_,0);
        return r;
    };
}
if(typeof document!=='undefined'){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciarNavegacaoV67_);
    else iniciarNavegacaoV67_();
    setTimeout(iniciarNavegacaoV67_,250);
}
console.info('[Mesa Estelar] v67 navegação interna lateral carregada');
window.__MESA_PATCH__='v67-navegacao-interna-lateral';

// ===== v68 · Mapa da Mesa compacto + indicador explícito de sincronização =====
function novaMapaCompactoV68_(){
    const host=document.getElementById('sincronizacao-nova');
    const panel=document.getElementById('novaSyncMasterPanel');
    if(!host||!panel||panel.dataset.v68Compact==='1')return;
    panel.dataset.v68Compact='1';

    const style=document.createElement('style');
    style.id='novaMapaCompactoStyleV68';
    style.textContent=`
      #sincronizacao-nova>.form-section{padding-top:14px}
      #sincronizacao-nova>.form-section>h2{font-size:1.35rem;margin-bottom:2px!important}
      #sincronizacao-nova>.form-section>p{margin:0 0 8px!important;font-size:.9rem;color:#93a7c2!important}
      #novaSyncStatus{position:absolute!important;left:-99999px!important;width:1px!important;height:1px!important;overflow:hidden!important}
      #novaMapTopV68{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin:0 0 7px}
      #novaSyncPillV68{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;border:1px solid rgba(86,240,138,.38);background:rgba(86,240,138,.09);color:#aef6c5;font-size:.79rem;font-weight:800;white-space:nowrap}
      #novaSyncPillV68[data-state="saving"]{border-color:rgba(255,193,7,.48);background:rgba(255,193,7,.09);color:#ffe096}
      #novaSyncPillV68[data-state="error"]{border-color:rgba(255,95,95,.52);background:rgba(255,95,95,.10);color:#ffb3b3}
      #novaSyncPillV68[data-state="connecting"]{border-color:rgba(126,190,255,.45);background:rgba(126,190,255,.08);color:#b9ddff}
      #novaSyncMasterPanel{padding:7px 8px!important;margin-bottom:6px!important}
      #novaSyncMasterTitle{display:none!important}
      #novaMapPrimaryV68{display:flex;gap:7px;align-items:center;flex-wrap:wrap}
      #novaMapPrimaryV68 #novaSyncTurno{flex:1 1 320px;margin:0!important;padding:3px 0;font-size:.82rem!important}
      #novaMapPrimaryV68 .nova-acting-row{margin:0!important;flex:1 1 auto}
      #novaMapPrimaryV68 button,#novaMapPrimaryV68 select{height:36px!important;min-height:36px!important}
      #novaMapPrimaryV68 .nova-acting-label{font-size:.83rem!important}
      #novaMapSetupV68{margin-top:5px;border-top:1px solid rgba(255,255,255,.09);padding-top:4px}
      #novaMapSetupV68>summary{cursor:pointer;user-select:none;display:inline-flex;align-items:center;gap:6px;color:#b7c8e3;font-size:.8rem;font-weight:800;padding:3px 1px}
      #novaMapSetupBodyV68{display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding-top:5px}
      #novaMapSetupBodyV68 button,#novaMapSetupBodyV68 select,#novaMapSetupBodyV68 input{height:34px!important;min-height:34px!important;font-size:.8rem!important;padding:5px 8px!important}
      #novaMapSetupBodyV68 #novaSyncMapa{min-width:150px!important;max-width:240px!important}
      #novaMapSetupBodyV68 #novaSyncQuickSearch{min-width:170px!important;max-width:270px!important}
      #novaSyncOrdem{margin:3px 0 0!important;font-size:.78rem!important;line-height:1.22!important}
      #novaSyncActionPanel{padding:6px 8px!important;margin-bottom:6px!important}
      #novaSyncActionPanel .nova-action-row{gap:6px!important}
      .nova-board-scroll{margin-top:2px}
      @media(max-width:760px){
        #novaMapPrimaryV68{align-items:stretch}
        #novaMapPrimaryV68 #novaSyncTurno{flex-basis:100%}
        #novaMapSetupBodyV68>*{max-width:100%!important}
      }
    `;
    document.head.appendChild(style);

    const sync=document.getElementById('novaSyncStatus');
    const top=document.createElement('div');top.id='novaMapTopV68';
    const hint=document.createElement('span');hint.textContent='Mesa compartilhada';hint.style.cssText='color:#8da4c2;font-size:.78rem;font-weight:700;';
    const pill=document.createElement('span');pill.id='novaSyncPillV68';pill.dataset.state='connecting';pill.textContent='● Conectando…';
    top.append(hint,pill);
    panel.parentElement?.insertBefore(top,panel);

    const updatePill=()=>{
        const t=String(sync?.textContent||'').trim();
        let state='ok',label='● Sincronizado';
        if(!t||/aguardando|conect/i.test(t)){state='connecting';label='● Conectando…';}
        else if(/salvando|enviando|sincronizando/i.test(t)){state='saving';label='↻ Salvando…';}
        else if(/erro|falha|offline|desconect/i.test(t)){state='error';label='⚠ Falha de sincronização';}
        else{
            const m=t.match(/(\d+)\s+personagem/i);
            label='● Sincronizado'+(m?` · ${m[1]} no mapa`:'');
        }
        pill.dataset.state=state;pill.textContent=label;pill.title=t||label;
    };
    updatePill();
    if(sync)new MutationObserver(updatePill).observe(sync,{childList:true,subtree:true,characterData:true});

    const primary=document.createElement('div');primary.id='novaMapPrimaryV68';
    const turno=document.getElementById('novaSyncTurno');
    const acting=panel.querySelector('.nova-acting-row');
    const start=document.getElementById('novaSyncStart'),end=document.getElementById('novaSyncEnd');
    if(turno)primary.append(turno);
    if(acting)primary.append(acting);
    if(start)primary.append(start);
    if(end)primary.append(end);
    panel.prepend(primary);

    const details=document.createElement('details');details.id='novaMapSetupV68';
    const summary=document.createElement('summary');summary.textContent='⚙️ Preparar / organizar mesa';
    const body=document.createElement('div');body.id='novaMapSetupBodyV68';
    details.append(summary,body);
    const ids=['novaSyncInit','novaSyncMapa','novaSyncQuickSearch','novaSyncQuickAdd','novaSyncRandom','novaSyncClear','novaSyncRestore'];
    ids.forEach(id=>{const el=document.getElementById(id);if(el)body.append(el);});
    const erro=document.getElementById('novaSyncErro');if(erro)body.after(erro);
    const ordem=document.getElementById('novaSyncOrdem');if(ordem)details.after(ordem);
    panel.append(details);

    [...panel.children].forEach(ch=>{
        if(ch===primary||ch===details||ch===ordem||ch===erro)return;
        if(ch instanceof HTMLElement){
            const meaningful=[...ch.children].some(c=>c.id||c.querySelector?.('[id]'));
            if(!meaningful&&!(ch.textContent||'').trim())ch.style.display='none';
        }
    });
}
function novaMapaGarantirCompactoV68_(){if(typeof setTimeout==='function')setTimeout(novaMapaCompactoV68_,0);else novaMapaCompactoV68_();}
const mostrarAbaV68Base_=window.mostrarAba;
if(typeof mostrarAbaV68Base_==='function')window.mostrarAba=function(id){
    const r=mostrarAbaV68Base_.apply(this,arguments);
    if(id==='sincronizacao-nova')novaMapaGarantirCompactoV68_();
    return r;
};
if(typeof setTimeout==='function')setTimeout(novaMapaCompactoV68_,600);
console.info('[Mesa Estelar] v68 Mapa da Mesa compacto carregado');
window.__MESA_PATCH__='v68-mapa-compacto';

// ===== v72 · refinamento da ficha + navegação modular do Escudo do Mestre =====
function instalarEstilosInterfaceV72_(){
    if(document.getElementById('mesaInterfaceV72Styles'))return;
    const style=document.createElement('style');
    style.id='mesaInterfaceV72Styles';
    style.textContent=`
      /* Resumo rápido do personagem ativo. */
      #charQuickV72{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:2px 0 12px;padding:10px 0 12px;border-bottom:1px solid rgba(255,255,255,.10)}
      #charQuickV72 .quick-card{min-width:0;padding:8px 7px;border-radius:9px;background:rgba(0,0,0,.17);border:1px solid rgba(255,255,255,.09);text-align:center}
      #charQuickV72 .quick-label{display:block;color:#8da6bd;font-size:.68rem;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px}
      #charQuickV72 .quick-value{display:block;color:#fff;font-size:.83rem;font-weight:800;line-height:1.25;overflow-wrap:anywhere}
      #charQuickV72 .quick-card[data-state="warning"]{border-color:rgba(255,193,7,.32);background:rgba(255,193,7,.06)}
      #charQuickV72 .quick-card[data-state="danger"]{border-color:rgba(255,90,90,.38);background:rgba(255,90,90,.07)}
      #charQuickV72 .quick-card[data-state="good"]{border-color:rgba(86,240,138,.27);background:rgba(86,240,138,.05)}

      /* Escudo do Mestre: as áreas passam a ter uma navegação lateral própria. */
      #escudo>.form-section{display:grid;grid-template-columns:205px minmax(0,1fr);column-gap:16px;align-items:start}
      #escudo>.form-section>h3,#escudo>.form-section>p{grid-column:1/-1}
      #escudo .gm-subtabs{
        grid-column:1;display:flex!important;flex-direction:column;align-items:stretch;gap:7px!important;
        position:sticky;top:12px;margin:0!important;padding:10px!important;border:1px solid rgba(0,212,255,.17)!important;
        border-radius:13px;background:rgba(0,0,0,.15);max-height:calc(100vh - 40px);overflow:auto;scrollbar-width:thin;
      }
      #escudo .gm-subtabs .gm-subtab-btn{width:100%;min-height:41px;display:flex;justify-content:flex-start;align-items:center;text-align:left;white-space:normal;padding:9px 10px}
      #escudo .gm-subtabs .gm-subtab-btn.active{box-shadow:inset 3px 0 0 #00d4ff,0 0 13px rgba(0,212,255,.11)}
      #escudo .gm-sub-content,#escudo #gm-admin-host{grid-column:2;min-width:0;margin:0!important}
      #escudo .gm-sub-content.hidden,#escudo #gm-admin-host.hidden{display:none!important}
      #escudo .gm-sub-content>.form-section:first-child{margin-top:0}

      /* Os painéis do mestre ficam visualmente mais leves, mas nenhum controle é removido. */
      #gm-sub-campanha>div[style*="padding:16px"]{box-shadow:0 8px 22px rgba(0,0,0,.10)}
      #gm-sub-campanha #gmCampaignStats{margin-bottom:12px!important}
      #gmMusica510{padding:14px!important;border-radius:12px!important;background:rgba(155,89,182,.055)!important;border:1px solid rgba(155,89,182,.20)!important}
      #gmMusica510 h3{font-size:1.02rem!important;color:#debaff!important;margin:0 0 10px!important}

      @media(max-width:980px){
        #escudo>.form-section{grid-template-columns:1fr}
        #escudo>.form-section>h3,#escudo>.form-section>p,#escudo .gm-subtabs,#escudo .gm-sub-content,#escudo #gm-admin-host{grid-column:1}
        #escudo .gm-subtabs{position:static;flex-direction:row;overflow-x:auto;overflow-y:hidden;max-height:none;padding:7px!important;margin:0 0 12px!important;scrollbar-width:thin}
        #escudo .gm-subtabs .gm-subtab-btn{width:auto;flex:0 0 auto;white-space:nowrap;min-height:39px}
      }
      @media(max-width:900px){
        #charQuickV72{grid-column:1/-1;grid-row:4;grid-template-columns:repeat(4,minmax(110px,1fr));overflow-x:auto;padding:8px 0;margin:0;scrollbar-width:thin}
        #charContextV66 .char-tabs.char-tabs-v67{grid-row:5}
        #charContextV66 .context-switch{grid-row:6}
      }
      @media(max-width:600px){#charQuickV72{grid-template-columns:repeat(4,118px)}}
    `;
    document.head.appendChild(style);
}
function resumoPVPersonagemV72_(c){
    const combat=c?.combate||{};
    try{
        if(Number.isFinite(Number(combat.pvGlobalAtual))){
            const max=typeof calcularPVGlobalMax_==='function'?Number(calcularPVGlobalMax_(c)||0):0;
            const atual=Number(combat.pvGlobalAtual||0);
            return {texto:max?`${Math.max(0,atual)}/${max}`:String(Math.max(0,atual)),estado:max&&atual<=max*.35?'danger':max&&atual<max?'warning':'good'};
        }
        const hit=combat.hitLocations||{};
        const maxs=typeof pvMaxLocais_==='function'?pvMaxLocais_(c):{};
        const ks=[...new Set([...Object.keys(maxs||{}),...Object.keys(hit||{})])].filter(k=>Number.isFinite(Number(maxs?.[k]??hit?.[k])));
        if(ks.length){
            let cur=0,max=0,feridos=0;
            for(const k of ks){const m=Math.max(0,Number(maxs?.[k]??hit?.[k]??0));const a=Math.max(0,Number(hit?.[k]??m));cur+=Math.min(m,a);max+=m;if(a<m)feridos++;}
            return {texto:feridos?`${cur}/${max} · ${feridos} local${feridos===1?'':'is'}`:`${cur}/${max}`,estado:feridos?'warning':'good'};
        }
    }catch(_){ }
    return {texto:'—',estado:''};
}
function resumoPPPersonagemV72_(c){
    try{
        const tem=(typeof temPsiquismoInvestido_==='function'&&temPsiquismoInvestido_(c))||Number(c?.pontosMagiaGastos||0)>0;
        if(!tem)return null;
        const max=Math.max(0,Number(c?.atributos?.POD||0));
        return `${Math.max(0,max-Number(c?.pontosMagiaGastos||0))}/${max}`;
    }catch(_){return null;}
}
function montarResumoPersonagemV72_(){
    const aside=document.getElementById('charContextV66');if(!aside)return;
    let box=document.getElementById('charQuickV72');
    if(!box){
        box=document.createElement('div');box.id='charQuickV72';
        const tabs=aside.querySelector('.char-tabs.char-tabs-v67');
        if(tabs)aside.insertBefore(box,tabs);else aside.appendChild(box);
    }
    atualizarResumoPersonagemV72_();
}
function atualizarResumoPersonagemV72_(){
    const box=document.getElementById('charQuickV72'),c=typeof personagemAtualV66_==='function'?personagemAtualV66_():null;
    if(!box||!c)return;
    const pv=resumoPVPersonagemV72_(c);
    const fad=String(c?.combate?.fadiga||'Fresh');
    let fadTxt=fad;try{if(typeof traduzirNomeFadiga_==='function')fadTxt=traduzirNomeFadiga_(fad);}catch(_){}
    const pp=resumoPPPersonagemV72_(c);
    const sorteMax=Math.max(0,Number(c?.atributos?.CAR||0));
    const sorte=Number.isFinite(Number(c?.pontosSorte))?Number(c.pontosSorte):sorteMax;
    const fadEstado=['Fresh'].includes(fad)?'good':['Winded','Tired'].includes(fad)?'warning':'danger';
    const cards=[
      {l:'PV',v:pv.texto,s:pv.estado},
      {l:'Fadiga',v:fadTxt||'—',s:fadEstado},
      ...(pp!==null?[{l:'PP',v:pp,s:''}]:[]),
      {l:'Sorte',v:String(Math.max(0,sorte)),s:''}
    ];
    box.innerHTML=cards.map(x=>`<div class="quick-card" data-state="${x.s||''}"><span class="quick-label">${escaparHtmlInventario_(x.l)}</span><span class="quick-value">${escaparHtmlInventario_(x.v)}</span></div>`).join('');
}
function iniciarInterfaceV72_(){
    instalarEstilosInterfaceV72_();
    try{if(typeof montarWorkspaceFichaV66_==='function')montarWorkspaceFichaV66_();}catch(_){}
    montarResumoPersonagemV72_();
}
if(typeof montarWorkspaceFichaV66_==='function'){
    const montarWorkspaceFichaV72Base_=montarWorkspaceFichaV66_;
    montarWorkspaceFichaV66_=function(){const r=montarWorkspaceFichaV72Base_.apply(this,arguments);montarResumoPersonagemV72_();return r;};
}
if(typeof window.selecionarPersonagem==='function'){
    const selecionarPersonagemV72Base_=window.selecionarPersonagem;
    window.selecionarPersonagem=async function(){const r=await selecionarPersonagemV72Base_.apply(this,arguments);setTimeout(()=>{montarResumoPersonagemV72_();atualizarResumoPersonagemV72_();},0);return r;};
}
if(typeof window.mostrarAba==='function'){
    const mostrarAbaV72Base_=window.mostrarAba;
    window.mostrarAba=function(){const r=mostrarAbaV72Base_.apply(this,arguments);if(arguments[0]==='ficha')setTimeout(iniciarInterfaceV72_,0);return r;};
}
if(typeof document!=='undefined'){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciarInterfaceV72_);else iniciarInterfaceV72_();
    setTimeout(iniciarInterfaceV72_,300);
    setInterval(()=>{try{atualizarResumoPersonagemV72_();}catch(_){}},1600);
}
console.info('[Mesa Estelar] v72 refinamento de interface carregado');
window.__MESA_PATCH__='v72-interface-estavel';

// ===== v73 · NPCs comerciantes + interações do Cenário Atual =====
let npcComercioEstoqueSelecionadoV73_=new Set();
const comercioCenarioNegociacaoV73_={};
function boolV73_(v){return v===true||v===1||['1','true','sim','yes','s'].includes(String(v??'').trim().toLowerCase());}
function listaIdsV73_(v){
    if(Array.isArray(v))return v.map(String).map(x=>x.trim()).filter(Boolean);
    return String(v||'').split(/[|;,\n]+/).map(x=>x.trim()).filter(Boolean);
}
function comercioNPCCfgV73_(n){
    return {
      comerciante:boolV73_(n?.comerciante),
      nome:String(n?.comercioNome||'').trim()||String(n?.nome||'Comerciante'),
      compraPct:Math.max(1,Number(n?.comercioCompraPct)||100),
      vendaPct:Math.max(0,Number(n?.comercioVendaPct)||50),
      barganha:n?.comercioBarganha===undefined?true:boolV73_(n?.comercioBarganha),
      resistencia:Math.max(1,Math.min(99,Number(n?.comercioResistencia)||50)),
      compraJogador:n?.comercioCompraJogador===undefined?true:boolV73_(n?.comercioCompraJogador),
      estoqueIds:listaIdsV73_(n?.estoqueComercio)
    };
}
window.npcComercioToggleV73_=function(){
    const on=!!document.getElementById('dbNPCComerciante')?.checked;
    const box=document.getElementById('dbNPCComercioCamposV73');if(box)box.style.display=on?'block':'none';
    if(on)renderNPCComercioEstoqueV73_();
};
window.npcComercioEstoqueMarcarV73_=function(id,checked){
    id=String(id||'');if(!id)return;
    if(checked)npcComercioEstoqueSelecionadoV73_.add(id);else npcComercioEstoqueSelecionadoV73_.delete(id);
};
window.renderNPCComercioEstoqueV73_=function(){
    const host=document.getElementById('dbNPCComercioEstoque');if(!host)return;
    const busca=normalizarTextoCombate_(document.getElementById('dbNPCComercioBusca')?.value||'');
    const lista=[...(itensDB||[])].filter(i=>{
        const hay=normalizarTextoCombate_(`${getNome(i)} ${i.categoria||''} ${i.tipo||''}`);
        return !busca||hay.includes(busca);
    }).sort((a,b)=>getNome(a).localeCompare(getNome(b),'pt-BR'));
    host.innerHTML=lista.map(i=>`<label style="display:flex;align-items:center;gap:7px;margin:0;padding:6px 7px;border-radius:6px;background:rgba(255,255,255,.035);font-weight:500;">
      <input type="checkbox" style="width:auto;" ${npcComercioEstoqueSelecionadoV73_.has(String(i.id))?'checked':''} onchange="npcComercioEstoqueMarcarV73_('${String(i.id).replace(/'/g,"\\'")}',this.checked)">
      <span style="min-width:0;"><b>${escaparHtmlInventario_(getNome(i))}</b><br><small style="color:#999;">${escaparHtmlInventario_(i.categoria||'')} · ${Number(i.preco||0).toLocaleString('pt-BR')} rec.</small></span>
    </label>`).join('')||'<span style="color:#888;">Nenhum item encontrado.</span>';
};
const preencherModalNPCBancoV73Base_=(typeof preencherModalNPCBanco_==='function')?preencherModalNPCBanco_:null;
if(preencherModalNPCBancoV73Base_)preencherModalNPCBanco_=function(n=null){
    const r=preencherModalNPCBancoV73Base_.apply(this,arguments);
    const cfg=comercioNPCCfgV73_(n||{});
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v??'';};
    const chk=(id,v)=>{const e=document.getElementById(id);if(e)e.checked=!!v;};
    chk('dbNPCComerciante',cfg.comerciante);set('dbNPCComercioNome',n?.comercioNome||'');set('dbNPCComercioCompraPct',cfg.compraPct);
    set('dbNPCComercioVendaPct',cfg.vendaPct);set('dbNPCComercioResistencia',cfg.resistencia);chk('dbNPCComercioBarganha',cfg.barganha);chk('dbNPCComercioCompraJogador',cfg.compraJogador);
    set('dbNPCComercioBusca','');npcComercioEstoqueSelecionadoV73_=new Set(cfg.estoqueIds);npcComercioToggleV73_();
    return r;
};
const salvarNPCBancoV73Base_=(typeof window!=='undefined'&&typeof window.salvarNPCBanco_==='function')?window.salvarNPCBanco_:null;
if(salvarNPCBancoV73Base_)window.salvarNPCBanco_=async function(){
    const nome=String(document.getElementById('dbNPCNome')?.value||'').trim();
    const idDigitado=String(document.getElementById('dbNPCId')?.value||'').trim();
    const idPrevisto=idDigitado||normalizarTextoCombate_(nome).replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
    const cfg={
      comerciante:!!document.getElementById('dbNPCComerciante')?.checked,
      comercioNome:String(document.getElementById('dbNPCComercioNome')?.value||'').trim(),
      comercioCompraPct:Math.max(1,Number(document.getElementById('dbNPCComercioCompraPct')?.value)||100),
      comercioVendaPct:Math.max(0,Number(document.getElementById('dbNPCComercioVendaPct')?.value)||50),
      comercioBarganha:!!document.getElementById('dbNPCComercioBarganha')?.checked,
      comercioResistencia:Math.max(1,Math.min(99,Number(document.getElementById('dbNPCComercioResistencia')?.value)||50)),
      comercioCompraJogador:!!document.getElementById('dbNPCComercioCompraJogador')?.checked,
      estoqueComercio:[...npcComercioEstoqueSelecionadoV73_].join('|')
    };
    const r=await salvarNPCBancoV73Base_.apply(this,arguments);
    if(!idPrevisto)return r;
    const n=(npcsDB||[]).find(x=>String(x.id)===String(idPrevisto))||[...(npcsDB||[])].reverse().find(x=>String(x.nome||'')===nome);
    if(n){Object.assign(n,cfg);try{await setDoc(doc(db,'npcs',String(n.id)),cfg,{merge:true});}catch(e){console.warn('Comércio NPC v73',e);}try{renderizarBancoNPCs_();}catch(_){}}
    // Se o comerciante já estiver no cenário ativo, republica a interface pública.
    try{if(userData?.role==='mestre'&&typeof publicarCampanhaAtual_==='function')await publicarCampanhaAtual_();}catch(e){console.warn('Republicar cenário após comércio',e);}
    return r;
};

function comerciantePublicoV73_(n){
    const c=comercioNPCCfgV73_(n);if(!c.comerciante)return null;
    return {id:String(n.id),nome:String(n.nome||'Comerciante'),imagem:String(n.imagem||''),tipo:String(n.tipo||'NPC'),
      comercioNome:c.nome,compraPct:c.compraPct,vendaPct:c.vendaPct,barganha:c.barganha,resistencia:c.resistencia,compraJogador:c.compraJogador,estoqueIds:c.estoqueIds};
}
function comerciantesCenarioAtivoV73_(){
    // v141: comerciantes genéricos ("Comerciante N", várias raças) e comerciantes que estão em algum mapa ficam sempre disponíveis
    const extra=[];try{const ids=new Set((novaSyncController_?.todosTokens?.()||[]).map(t=>decodeURIComponent(String(t.id||''))).filter(i=>i.startsWith('syncnpc:')).map(i=>i.slice(8).split('~')[0]));
     for(const n of (npcsDB||[]))if(n?.genericoV141||ids.has(String(n?.id))){const p=comerciantePublicoV73_(n);if(p)extra.push(p);}}catch(_){}
    const c=(cenariosDB||[]).find(x=>String(x.id)===String(estadoCampanhaMestre?.cenarioId));
    const base=c?(c.personagensCena||[]).filter(v=>v.visivel&&String(v.id).startsWith('npcdb:')).map(v=>{
        const n=npcBancoPorId_(String(v.id).slice(6));return n?comerciantePublicoV73_(n):null;
    }).filter(Boolean):[];
    const vistos=new Set();return [...base,...extra].filter(m=>!vistos.has(m.id)&&vistos.add(m.id));
}
window.publicarComerciantesV141_=async function(){
    if(userData?.role!=='mestre')return;
    const comerciantes=comerciantesCenarioAtivoV73_(),interacoes={...(campanhaPublica_?.interacoes||{}),comerciantes};
    campanhaPublica_={...(campanhaPublica_||{}),interacoes};
    await setDoc(doc(db,'configuracoes','campanhaPublica'),{interacoes},{merge:true});
};
// v158: o jogador não lê o banco de NPCs. Quando um comerciante entra num mapa (UR-17 na Última Bateria, Hessa…),
// o mestre republica a lista pública na hora, sem depender de ativar um cenário.
(()=>{if(typeof setInterval!=='function')return;let ultimaV158='';setInterval(()=>{try{if(userData?.role!=='mestre'||!novaSyncController_?.todosTokens)return;
  const sig=comerciantesCenarioAtivoV73_().map(m=>m.id+':'+(m.estoqueIds||[]).join(',')+':'+m.compraPct+':'+m.vendaPct).sort().join('|');
  if(sig===ultimaV158)return;ultimaV158=sig;void window.publicarComerciantesV141_?.();}catch(e){console.warn('comerciantes v158',e);}},15000);})();
const publicarCampanhaAtualV73Base_=(typeof publicarCampanhaAtual_==='function')?publicarCampanhaAtual_:null;
if(publicarCampanhaAtualV73Base_)publicarCampanhaAtual_=async function(){
    const r=await publicarCampanhaAtualV73Base_.apply(this,arguments);
    if(userData?.role!=='mestre')return r;
    const comerciantes=comerciantesCenarioAtivoV73_();
    const interacoes={...(campanhaPublica_?.interacoes||{}),comerciantes};
    campanhaPublica_={...(campanhaPublica_||{}),interacoes};
    try{await setDoc(doc(db,'configuracoes','campanhaPublica'),{interacoes},{merge:true});}catch(e){console.warn('Publicar comerciantes v73',e);}
    try{renderizarCenarioAtualPublico_();}catch(_){}
    return r;
};

function garantirModalComercioCenarioV73_(){
    let m=document.getElementById('cenarioComercioModalV73');if(m)return m;
    m=document.createElement('div');m.id='cenarioComercioModalV73';m.className='modal-overlay';
    m.innerHTML=`<div class="modal-content" style="max-width:1040px;max-height:92vh;overflow:auto;position:relative;">
      <span class="close-modal" onclick="fecharComercioCenarioV73_()">&times;</span>
      <div id="cenarioComercioConteudoV73"></div></div>`;
    document.body.appendChild(m);return m;
}
window.fecharComercioCenarioV73_=function(){document.getElementById('cenarioComercioModalV73')?.classList.remove('active');};
function comerciantePublicoPorIdV73_(id){if(String(id||'').startsWith('loja:')){try{const l=window.mesaLojasV163?.porId?.(id);if(l)return l;}catch(_){}} // v163: loja de um comerciante do mapa
    const ctx=(typeof window!=='undefined'&&typeof window.obterInteracoesContextuaisV91_==='function')?window.obterInteracoesContextuaisV91_():(campanhaPublica_?.interacoes||{});const achado=(ctx?.comerciantes||[]).find(x=>String(x.id)===String(id));if(achado)return achado;
    // v152: comerciante que está no mapa mas não no cenário publicado (ex.: UR-17 quando o grupo chegou pela mesa) — usa o NPC do banco
    try{const n=(npcsDB||[]).find(x=>String(x.id)===String(id));return n&&typeof comerciantePublicoV73_==='function'?comerciantePublicoV73_(n):null;}catch(_){return null;}}
function chaveNegV73_(charId,merchantId){return `${String(charId)}::${String(merchantId)}`;}
function estadoNegV73_(charId,merchantId){return comercioCenarioNegociacaoV73_[chaveNegV73_(charId,merchantId)]||null;}
function precoCompraComercianteV73_(item,m,state){
    let mult=Math.max(.01,Number(m?.compraPct||100)/100);if(state?.compraMult)mult*=state.compraMult;
    return Math.max(0,Math.floor(precoComQualidade_(item,'Básica')*mult));
}
function precoVendaComercianteV73_(registro,m,state){
    const item=registro.item,banco=(itensDB||[]).find(x=>String(x.id)===String(item.idBanco||item.id))||item;
    const max=Math.max(0,Number(banco.pv??item.pv??0)),atual=Math.max(0,Number(item.pvAtual??max)),cond=max>0?Math.min(1,atual/max):1;
    let mult=Math.max(0,Number(m?.vendaPct||0)/100);if(state?.vendaMult)mult*=state.vendaMult;
    return Math.max(0,Math.floor(Number(banco.preco||item.preco||0)*mult*cond));
}
function comercioResultadoOpostoV73_(atk,def){
    if(def.grau==='Crítico')return false;if(atk.grau==='Crítico'&&def.grau!=='Crítico')return true;
    if(!def.sucesso)return !!atk.sucesso;if(!atk.sucesso)return false;
    return Number(atk.margem||0)>Number(def.margem||0);
}
window.rolarBarganhaCenarioV73_=function(id){
    const m=comerciantePublicoPorIdV73_(id),char=obterPersonagemAtual_();if(!m||!char||!m.barganha)return;
    const pid=String(document.getElementById('cenarioComercioSkillV73')?.value||'');const p=(periciasDB||[]).find(x=>String(x.id)===pid);if(!p)return;
    const bruto=obterValorRegistroPericia_(char,p.id,false),arm=valorPericiaComArmadura_(char,p,bruto),aj=aplicarDificuldadeEFadiga_(char,arm.valor,'padrao',0);
    if(aj.bloqueado){notificar_('A fadiga impede a barganha.','aviso');return;}
    const rollP=Math.floor(Math.random()*100)+1,rollN=Math.floor(Math.random()*100)+1;
    const rp=classificarD100_(aj.valor,rollP),rn=classificarD100_(Math.max(1,Number(m.resistencia||50)),rollN),venceu=comercioResultadoOpostoV73_(rp,rn);
    let compraMult=1,vendaMult=1,txt='Sem alteração de preço.';
    if(venceu){const crit=rp.grau==='Crítico';compraMult=crit?.80:.90;vendaMult=crit?1.20:1.10;txt=crit?'Excelente acordo: preços melhoraram bastante.':'Acordo favorável: preços melhoraram.';}
    else if(String(rp.grau).toLowerCase().includes('fiasco')){compraMult=1.05;vendaMult=.95;txt='A negociação piorou ligeiramente os preços.';}
    comercioCenarioNegociacaoV73_[chaveNegV73_(char.id,m.id)]={compraMult,vendaMult,player:{roll:rollP,valor:aj.valor,grau:rp.grau,pericia:getNome(p)},npc:{roll:rollN,valor:Number(m.resistencia||50),grau:rn.grau},txt};
    somDado_();renderComercioCenarioV73_(id);notificar_(`${getNome(p)} ${rollP}/${aj.valor} × comerciante ${rollN}/${m.resistencia}: ${txt}`,'info',5200);
};
window.renderComercioCenarioV73Publico_=id=>{try{renderComercioCenarioV73_(id);}catch(_){}};
window.abrirComercioCenarioV73_=function(id){const m=garantirModalComercioCenarioV73_();m.classList.add('active');renderComercioCenarioV73_(id);};
function renderComercioCenarioV73_(id){
    const m=comerciantePublicoPorIdV73_(id),host=document.getElementById('cenarioComercioConteudoV73');if(!m||!host)return;
    const char=obterPersonagemAtual_(),state=char?estadoNegV73_(char.id,m.id):null,ids=new Set((m.estoqueIds||[]).map(String));
    const itens=(itensDB||[]).filter(i=>ids.has(String(i.id))).sort((a,b)=>getNome(a).localeCompare(getNome(b),'pt-BR'));
    const skills=char?periciasNegociacaoLocal_(char):[];
    const neg=state?`${state.player.pericia}: ${state.player.roll}/${state.player.valor} (${state.player.grau}) × ${state.npc.roll}/${state.npc.valor} (${state.npc.grau}) · ${state.txt}`:'Nenhuma barganha realizada nesta visita.';
    const venda=(char&&m.compraJogador)?percorrerInventarioItens_(char).filter(r=>ids.has(String(r.item.idBanco||r.item.id))):[];
    host.innerHTML=`<div style="display:flex;gap:12px;align-items:center;margin-bottom:12px;">
      ${m.imagem?`<img src="${escaparHtmlInventario_(m.imagem)}" style="width:68px;height:68px;border-radius:12px;object-fit:cover;">`:'<div style="width:68px;height:68px;border-radius:12px;background:rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;font-size:2em;">🛒</div>'}
      <div><h2 style="margin:0;color:#ffd166;">🛒 ${escaparHtmlInventario_(m.comercioNome||m.nome)}</h2><div style="color:#aaa;">${escaparHtmlInventario_(m.nome)} · ${escaparHtmlInventario_(m.tipo||'NPC')}</div>${char?`<small>${escaparHtmlInventario_(char.nome)} · ${Number(char.recursos||0).toLocaleString('pt-BR')} recursos</small>`:'<small style="color:#ffbd7a;">Selecione um personagem na aba Ficha para negociar.</small>'}</div>
    </div>
    ${char&&m.barganha?`<div style="padding:10px;border-radius:9px;background:rgba(155,89,182,.07);border:1px solid rgba(155,89,182,.22);margin-bottom:12px;"><strong>🤝 Barganha</strong><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:7px;"><select id="cenarioComercioSkillV73">${skills.map(x=>`<option value="${escaparHtmlInventario_(x.p.id)}">${escaparHtmlInventario_(getNome(x.p))} (${x.val})</option>`).join('')||'<option value="">Sem perícia adequada</option>'}</select><button class="btn-small btn-select" ${skills.length?'':'disabled'} onclick="rolarBarganhaCenarioV73_('${String(m.id).replace(/'/g,"\\'")}')">🎲 Barganhar</button></div><small style="display:block;margin-top:6px;color:#aaa;">${escaparHtmlInventario_(neg)}</small></div>`:''}
    <h3 style="margin:12px 0 8px;">Estoque</h3><div class="market-grid">${itens.map(i=>{const ok=char?acessoPermitidoItem_(char,i):false,preco=precoCompraComercianteV73_(i,m,state),nome=escaparHtmlInventario_(getNome(i));return `<div class="market-card">${i.imagem?`<img src="${escaparHtmlInventario_(i.imagem)}" alt="${nome}">`:'<div class="market-card-placeholder">📦</div>'}<div><h4>${nome}</h4>${char?badgeAcesso_(i,ok):''}<div class="market-meta">${escaparHtmlInventario_(i.categoria||'')} · <strong>${preco.toLocaleString('pt-BR')}</strong> recursos</div><button class="market-buy" ${char&&ok?'':'disabled'} onclick="comprarComercianteCenarioV73_('${String(m.id).replace(/'/g,"\\'")}','${String(i.id).replace(/'/g,"\\'")}')">${!char?'Selecione personagem':ok?'Comprar':'Sem acesso'}</button></div></div>`;}).join('')||'<p style="color:#888;">Este comerciante não tem itens cadastrados.</p>'}</div>
    ${char&&m.compraJogador?`<h3 style="margin:18px 0 8px;">Vender para ${escaparHtmlInventario_(m.nome)}</h3><div style="display:grid;gap:6px;">${venda.map(r=>{const preco=precoVendaComercianteV73_(r,m,state);return `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border-radius:8px;background:rgba(255,255,255,.04);"><span>${escaparHtmlInventario_(getNome(r.item))}</span><span><b>${preco.toLocaleString('pt-BR')}</b> <button class="btn-small" ${preco>0?'':'disabled'} onclick="venderComercianteCenarioV73_('${String(m.id).replace(/'/g,"\\'")}','${r.comp}',${r.index})">Vender</button></span></div>`;}).join('')||'<div style="color:#888;">Você não possui itens que este comerciante negocie.</div>'}</div>`:''}`;
}
window.comprarComercianteCenarioV73_=async function(mid,itemId){
    const m=comerciantePublicoPorIdV73_(mid),char=obterPersonagemAtual_(),item=(itensDB||[]).find(i=>String(i.id)===String(itemId));if(!m||!char||!item)return;
    if(!(m.estoqueIds||[]).map(String).includes(String(item.id)))return;
    if(await novaCompraBloqueada_(char))return;if(!acessoPermitidoItem_(char,item)){notificar_('Este personagem não possui o nível de acesso necessário.','aviso');return;}
    const state=estadoNegV73_(char.id,m.id),preco=precoCompraComercianteV73_(item,m,state),rec=Number(char.recursos||0);if(rec<preco){notificar_('Recursos insuficientes.','aviso');return;}
    const inv=normalizarInventario_(char),slot=inv.mochila.findIndex(x=>!x);if(slot<0){notificar_('Mochila cheia.','aviso');return;}
    inv.mochila[slot]={...item,idBanco:item.id,instanciaId:`merc_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,pvAtual:Number(item.pv||0),origemAquisicao:`comerciante:${m.id}`,precoPago:preco,adquiridoEm:new Date().toISOString(),...(itemUsaMunicao_(item)?{cargaMax:cargaMaxArma_(item),cargaAtual:0}:{})};
    char.inventario=inv;char.recursos=rec-preco;delete comercioCenarioNegociacaoV73_[chaveNegV73_(char.id,m.id)];
    await setDoc(doc(db,'personagens',char.id),{inventario:inv,recursos:char.recursos},{merge:true});
    try{await registrarEventoMestreNoPersonagem_(char,'Comércio',`${getNome(item)} comprado de ${m.nome} por ${preco}`,{subtipo:'npc_compra',npcId:m.id,itemId:item.id,preco});}catch(_){}
    somCaixaRegistradora_();renderizarInventario(char);renderComercioCenarioV73_(m.id);
};
window.venderComercianteCenarioV73_=async function(mid,comp,index){
    const m=comerciantePublicoPorIdV73_(mid),char=obterPersonagemAtual_();if(!m||!char||!m.compraJogador)return;
    const inv=normalizarInventario_(char),item=inv?.[comp]?.[index];if(!item)return;if(!(m.estoqueIds||[]).map(String).includes(String(item.idBanco||item.id))){notificar_('Este comerciante não negocia esse item.','aviso');return;}
    const state=estadoNegV73_(char.id,m.id),preco=precoVendaComercianteV73_({item,comp,index},m,state);if(preco<=0)return;
    inv[comp][index]=null;char.inventario=inv;char.recursos=Number(char.recursos||0)+preco;delete comercioCenarioNegociacaoV73_[chaveNegV73_(char.id,m.id)];
    await setDoc(doc(db,'personagens',char.id),{inventario:inv,recursos:char.recursos},{merge:true});
    try{await registrarEventoMestreNoPersonagem_(char,'Comércio',`${getNome(item)} vendido a ${m.nome} por ${preco}`,{subtipo:'npc_venda',npcId:m.id,itemId:item.idBanco||item.id,preco});}catch(_){}
    somCaixaRegistradora_();renderizarInventario(char);renderComercioCenarioV73_(m.id);
};
function anexarInteracoesCenarioV73_(){
    const comerciantes=campanhaPublica_?.interacoes?.comerciantes||[];
    const alvos=['globalCurrentScenarioPublic','charCurrentScenarioPublic'].map(id=>document.getElementById(id)).filter(Boolean);
    alvos.forEach(el=>{
        el.querySelector('#cenarioInteracoesV73')?.remove();
        const box=document.createElement('div');box.id='cenarioInteracoesV73';box.style.marginTop='16px';
        box.innerHTML=`<div style="padding:14px;border-radius:11px;background:rgba(0,212,255,.045);border:1px solid rgba(0,212,255,.18);"><h3 style="margin:0 0 5px;color:#8feaff;">🧭 Interações do cenário</h3><div style="color:#999;margin-bottom:10px;">Ações disponíveis neste local sem depender do mapa.</div>${comerciantes.length?`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:9px;">${comerciantes.map(m=>`<div style="display:flex;align-items:center;gap:9px;padding:10px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);">${m.imagem?`<img src="${escaparHtmlInventario_(m.imagem)}" style="width:54px;height:54px;border-radius:10px;object-fit:cover;">`:'<div style="width:54px;height:54px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.07);font-size:1.6em;">🛒</div>'}<div style="min-width:0;flex:1;"><b>${escaparHtmlInventario_(m.nome)}</b><br><small style="color:#aaa;">${escaparHtmlInventario_(m.comercioNome||'Comércio')}</small><br><button class="btn-small btn-select" style="margin-top:6px;" onclick="abrirComercioCenarioV73_('${String(m.id).replace(/'/g,"\\'")}')">🛒 Comércio</button></div></div>`).join('')}</div>`:'<div style="color:#777;">Nenhuma interação especial publicada neste cenário.</div>'}</div>`;
        el.appendChild(box);
    });
}
const renderizarCenarioAtualPublicoV73Base_=(typeof renderizarCenarioAtualPublico_==='function')?renderizarCenarioAtualPublico_:null;
if(renderizarCenarioAtualPublicoV73Base_)renderizarCenarioAtualPublico_=function(){const r=renderizarCenarioAtualPublicoV73Base_.apply(this,arguments);try{anexarInteracoesCenarioV73_();}catch(e){console.warn('Interações cenário v73',e);}return r;};

console.info('[Mesa Estelar] v73 comércio por NPC e interações de cenário carregados');
window.__MESA_PATCH__='v73-cenario-comercio';

// ===== v74 · serviços de NPC, mercado negro e tabela de cenários =====
function parseServicosComercioV74_(v){
    if(Array.isArray(v))return v.map(x=>typeof x==='string'?x:{...x}).filter(Boolean);
    return String(v||'').split(/\r?\n|\|\|/).map(x=>x.trim()).filter(Boolean).map((linha,idx)=>{
        const p=linha.split('|').map(x=>String(x||'').trim());
        return {id:`srv_${idx}`,nome:p[0]||`Serviço ${idx+1}`,preco:Math.max(0,Number(String(p[1]||'0').replace(',','.'))||0),descricao:p.slice(2).join(' | ').trim()};
    });
}
const comercioNPCCfgV74Base_=comercioNPCCfgV73_;
comercioNPCCfgV73_=function(n){
    const c=comercioNPCCfgV74Base_(n||{});
    c.mercadoNegro=boolV73_(n?.comercioMercadoNegro);
    c.prestadorServicos=boolV73_(n?.prestadorServicos)||!!String(n?.servicosComercio||'').trim();
    c.servicos=parseServicosComercioV74_(n?.servicosComercio);
    return c;
};
window.npcComercioToggleV73_=function(){
    const comerciante=!!document.getElementById('dbNPCComerciante')?.checked;
    const prestador=!!document.getElementById('dbNPCPrestadorServicos')?.checked;
    const box=document.getElementById('dbNPCComercioCamposV73');if(box)box.style.display=(comerciante||prestador)?'block':'none';
    if(comerciante)renderNPCComercioEstoqueV73_();
};
const preencherModalNPCBancoV74Base_=(typeof preencherModalNPCBanco_==='function')?preencherModalNPCBanco_:null;
if(preencherModalNPCBancoV74Base_)preencherModalNPCBanco_=function(n=null){
    const r=preencherModalNPCBancoV74Base_.apply(this,arguments);
    const chk=(id,v)=>{const e=document.getElementById(id);if(e)e.checked=!!v;};
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v??'';};
    chk('dbNPCPrestadorServicos',boolV73_(n?.prestadorServicos)||!!String(n?.servicosComercio||'').trim());
    chk('dbNPCComercioMercadoNegro',boolV73_(n?.comercioMercadoNegro));
    set('dbNPCServicosComercio',n?.servicosComercio||'');
    npcComercioToggleV73_();
    return r;
};
const salvarNPCBancoV74Base_=window.salvarNPCBanco_;
window.salvarNPCBanco_=async function(){
    const nome=String(document.getElementById('dbNPCNome')?.value||'').trim();
    const idDigitado=String(document.getElementById('dbNPCId')?.value||'').trim();
    const idPrevisto=idDigitado||normalizarTextoCombate_(nome).replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
    const extra={
      comercioMercadoNegro:!!document.getElementById('dbNPCComercioMercadoNegro')?.checked,
      prestadorServicos:!!document.getElementById('dbNPCPrestadorServicos')?.checked,
      servicosComercio:String(document.getElementById('dbNPCServicosComercio')?.value||'').trim()
    };
    const r=await salvarNPCBancoV74Base_.apply(this,arguments);
    const n=(npcsDB||[]).find(x=>String(x.id)===String(idPrevisto))||[...(npcsDB||[])].reverse().find(x=>String(x.nome||'')===nome);
    if(n){Object.assign(n,extra);try{await setDoc(doc(db,'npcs',String(n.id)),extra,{merge:true});}catch(e){console.warn('Serviços NPC v74',e);}}
    try{if(userData?.role==='mestre'&&typeof publicarCampanhaAtual_==='function')await publicarCampanhaAtual_();}catch(_){}
    return r;
};
comerciantePublicoV73_=function(n){
    const c=comercioNPCCfgV73_(n);if(!c.comerciante&&!c.prestadorServicos)return null;
    return {id:String(n.id),nome:String(n.nome||'NPC'),imagem:String(n.imagem||''),tipo:String(n.tipo||'NPC'),
      comerciante:!!c.comerciante,prestadorServicos:!!c.prestadorServicos,comercioNome:c.nome,compraPct:c.compraPct,vendaPct:c.vendaPct,barganha:c.barganha,
      resistencia:c.resistencia,compraJogador:c.compraJogador,estoqueIds:c.estoqueIds,mercadoNegro:!!c.mercadoNegro,servicos:c.servicos};
};
function precoServicoComercianteV74_(srv,m,state){return Math.max(0,Math.round(Number(srv?.preco||0)*Number(state?.compraMult||1)));}
window.contratarServicoCenarioV74_=async function(mid,idx){
    const m=comerciantePublicoPorIdV73_(mid),char=obterPersonagemAtual_();if(!m||!char)return;
    const srv=(m.servicos||[])[Number(idx)];if(!srv)return;
    const state=estadoNegV73_(char.id,m.id),preco=precoServicoComercianteV74_(srv,m,state),rec=Number(char.recursos||0);
    if(rec<preco){notificar_('Recursos insuficientes para contratar este serviço.','aviso');return;}
    if(!confirm(`Contratar “${srv.nome}” por ${preco.toLocaleString('pt-BR')} recursos?`))return;
    char.recursos=rec-preco;delete comercioCenarioNegociacaoV73_[chaveNegV73_(char.id,m.id)];
    await setDoc(doc(db,'personagens',char.id),{recursos:char.recursos},{merge:true});
    try{await registrarEventoMestreNoPersonagem_(char,'Serviço',`${srv.nome} contratado com ${m.nome} por ${preco}`,{subtipo:'npc_servico',npcId:m.id,servico:srv.nome,preco});}catch(_){}
    somCaixaRegistradora_();renderComercioCenarioV73_(m.id);notificar_(`${srv.nome} contratado. ${srv.descricao||'O efeito deve ser resolvido conforme a cena e as regras.'}`,'info',6500);
};
renderComercioCenarioV73_=function(id){
    const m=comerciantePublicoPorIdV73_(id),host=document.getElementById('cenarioComercioConteudoV73');if(!m||!host)return;
    const char=obterPersonagemAtual_(),state=char?estadoNegV73_(char.id,m.id):null,ids=new Set((m.estoqueIds||[]).map(String));
    const itens=(itensDB||[]).filter(i=>ids.has(String(i.id))).sort((a,b)=>getNome(a).localeCompare(getNome(b),'pt-BR'));
    const skills=char?periciasNegociacaoLocal_(char):[];
    const neg=state?`${state.player.pericia}: ${state.player.roll}/${state.player.valor} (${state.player.grau}) × ${state.npc.roll}/${state.npc.valor} (${state.npc.grau}) · ${state.txt}`:'Nenhuma barganha realizada nesta visita.';
    const venda=(char&&m.compraJogador)?percorrerInventarioItens_(char).filter(r=>ids.has(String(r.item.idBanco||r.item.id))):[];
    const servicos=m.servicos||[];
    host.innerHTML=`<div style="display:flex;gap:12px;align-items:center;margin-bottom:12px;">
      ${m.imagem?`<img src="${escaparHtmlInventario_(m.imagem)}" style="width:68px;height:68px;border-radius:12px;object-fit:cover;">`:'<div style="width:68px;height:68px;border-radius:12px;background:rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;font-size:2em;">🛒</div>'}
      <div><h2 style="margin:0;color:#ffd166;">${m.mercadoNegro?'🕶️':m.comerciante?'🛒':'🧰'} ${escaparHtmlInventario_(m.comercioNome||m.nome)}</h2><div style="color:#aaa;">${escaparHtmlInventario_(m.nome)} · ${escaparHtmlInventario_(m.tipo||'NPC')}</div>${m.mercadoNegro?'<small style="color:#ffbd7a;">Mercado negro: o estoque pode contornar restrições normais de acesso.</small><br>':''}${char?`<small>${escaparHtmlInventario_(char.nome)} · ${Number(char.recursos||0).toLocaleString('pt-BR')} recursos</small>`:'<small style="color:#ffbd7a;">Selecione um personagem na aba Ficha para negociar.</small>'}</div>
    </div>
    ${char&&m.barganha?`<div style="padding:10px;border-radius:9px;background:rgba(155,89,182,.07);border:1px solid rgba(155,89,182,.22);margin-bottom:12px;"><strong>🤝 Barganha</strong><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:7px;"><select id="cenarioComercioSkillV73">${skills.map(x=>`<option value="${escaparHtmlInventario_(x.p.id)}">${escaparHtmlInventario_(getNome(x.p))} (${x.val})</option>`).join('')||'<option value="">Sem perícia adequada</option>'}</select><button class="btn-small btn-select" ${skills.length?'':'disabled'} onclick="rolarBarganhaCenarioV73_('${String(m.id).replace(/'/g,"\\'")}')">🎲 Barganhar</button></div><small style="display:block;margin-top:6px;color:#aaa;">${escaparHtmlInventario_(neg)}</small></div>`:''}
    ${m.comerciante?`<h3 style="margin:12px 0 8px;">Estoque</h3><div class="market-grid">${itens.map(i=>{const normal=char?acessoPermitidoItem_(char,i):false,ok=!!char&&(normal||m.mercadoNegro),preco=precoCompraComercianteV73_(i,m,state),nome=escaparHtmlInventario_(getNome(i));return `<div class="market-card">${i.imagem?`<img src="${escaparHtmlInventario_(i.imagem)}" alt="${nome}">`:'<div class="market-card-placeholder">📦</div>'}<div><h4>${nome}</h4>${char?(m.mercadoNegro&&!normal?'<span style="display:inline-block;padding:3px 8px;border:1px solid #ff9f43;border-radius:999px;color:#ffbd7a;font-size:.82em;">Mercado negro</span>':badgeAcesso_(i,normal)):''}<div class="market-meta">${escaparHtmlInventario_(i.categoria||'')} · <strong>${preco.toLocaleString('pt-BR')}</strong> recursos</div><button class="market-buy" ${ok?'':'disabled'} onclick="comprarComercianteCenarioV73_('${String(m.id).replace(/'/g,"\\'")}','${String(i.id).replace(/'/g,"\\'")}')">${!char?'Selecione personagem':ok?'Comprar':'Sem acesso'}</button></div></div>`;}).join('')||'<p style="color:#888;">Este comerciante não tem itens cadastrados.</p>'}</div>`:''}
    ${servicos.length?`<h3 style="margin:18px 0 8px;">Serviços</h3><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:8px;">${servicos.map((s,i)=>{const preco=precoServicoComercianteV74_(s,m,state);return `<div style="padding:11px;border-radius:9px;background:rgba(0,212,255,.045);border:1px solid rgba(0,212,255,.16);"><b>🧰 ${escaparHtmlInventario_(s.nome)}</b><div style="color:#aaa;margin:5px 0;">${escaparHtmlInventario_(s.descricao||'Serviço disponível neste estabelecimento.')}</div><strong>${preco.toLocaleString('pt-BR')} recursos</strong> <button class="btn-small btn-select" ${char?'':'disabled'} onclick="contratarServicoCenarioV74_('${String(m.id).replace(/'/g,"\\'")}',${i})">Contratar</button></div>`;}).join('')}</div>`:''}
    ${char&&m.comerciante&&m.compraJogador?`<h3 style="margin:18px 0 8px;">Vender para ${escaparHtmlInventario_(m.nome)}</h3><div style="display:grid;gap:6px;">${venda.map(r=>{const preco=precoVendaComercianteV73_(r,m,state);return `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border-radius:8px;background:rgba(255,255,255,.04);"><span>${escaparHtmlInventario_(getNome(r.item))}</span><span><b>${preco.toLocaleString('pt-BR')}</b> <button class="btn-small" ${preco>0?'':'disabled'} onclick="venderComercianteCenarioV73_('${String(m.id).replace(/'/g,"\\'")}','${r.comp}',${r.index})">Vender</button></span></div>`;}).join('')||'<div style="color:#888;">Você não possui itens que este comerciante negocie.</div>'}</div>`:''}`;
};
window.comprarComercianteCenarioV73_=async function(mid,itemId){
    const m=comerciantePublicoPorIdV73_(mid),char=obterPersonagemAtual_(),item=(itensDB||[]).find(i=>String(i.id)===String(itemId));if(!m||!char||!item||!m.comerciante)return;
    if(!(m.estoqueIds||[]).map(String).includes(String(item.id)))return;
    if(await novaCompraBloqueada_(char))return;
    if(!m.mercadoNegro&&!acessoPermitidoItem_(char,item)){notificar_('Este personagem não possui o nível de acesso necessário.','aviso');return;}
    const state=estadoNegV73_(char.id,m.id),preco=precoCompraComercianteV73_(item,m,state),rec=Number(char.recursos||0);if(rec<preco){notificar_('Recursos insuficientes.','aviso');return;}
    const inv=normalizarInventario_(char),slot=inv.mochila.findIndex(x=>!x);if(slot<0){notificar_('Mochila cheia.','aviso');return;}
    inv.mochila[slot]={...item,idBanco:item.id,instanciaId:`merc_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,pvAtual:Number(item.pv||0),origemAquisicao:`comerciante:${m.id}`,precoPago:preco,adquiridoEm:new Date().toISOString(),...(itemUsaMunicao_(item)?{cargaMax:cargaMaxArma_(item),cargaAtual:0}:{})};
    char.inventario=inv;char.recursos=rec-preco;delete comercioCenarioNegociacaoV73_[chaveNegV73_(char.id,m.id)];
    await setDoc(doc(db,'personagens',char.id),{inventario:inv,recursos:char.recursos},{merge:true});
    try{await registrarEventoMestreNoPersonagem_(char,'Comércio',`${getNome(item)} comprado de ${m.nome} por ${preco}`,{subtipo:m.mercadoNegro?'mercado_negro_compra':'npc_compra',npcId:m.id,itemId:item.id,preco});}catch(_){}
    somCaixaRegistradora_();renderizarInventario(char);renderComercioCenarioV73_(m.id);
};
anexarInteracoesCenarioV73_=function(){
    const perfis=campanhaPublica_?.interacoes?.comerciantes||[];
    const alvos=['globalCurrentScenarioPublic','charCurrentScenarioPublic'].map(id=>document.getElementById(id)).filter(Boolean);
    alvos.forEach(el=>{
        el.querySelector('#cenarioInteracoesV73')?.remove();const box=document.createElement('div');box.id='cenarioInteracoesV73';box.style.marginTop='16px';
        box.innerHTML=`<div style="padding:14px;border-radius:11px;background:rgba(0,212,255,.045);border:1px solid rgba(0,212,255,.18);"><h3 style="margin:0 0 5px;color:#8feaff;">🧭 Interações do cenário</h3><div style="color:#999;margin-bottom:10px;">Ações disponíveis neste local sem depender do mapa.</div>${perfis.length?`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:9px;">${perfis.map(m=>{const rot=m.comerciante&&m.prestadorServicos?'🛒 Comércio / Serviços':m.comerciante?'🛒 Comércio':'🧰 Serviços';return `<div style="display:flex;align-items:center;gap:9px;padding:10px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);">${m.imagem?`<img src="${escaparHtmlInventario_(m.imagem)}" style="width:54px;height:54px;border-radius:10px;object-fit:cover;">`:'<div style="width:54px;height:54px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.07);font-size:1.6em;">🧭</div>'}<div style="min-width:0;flex:1;"><b>${escaparHtmlInventario_(m.nome)}</b><br><small style="color:#aaa;">${escaparHtmlInventario_(m.comercioNome||'Interação')}</small><br><button class="btn-small btn-select" style="margin-top:6px;" onclick="abrirComercioCenarioV73_('${String(m.id).replace(/'/g,"\\'")}')">${rot}</button></div></div>`;}).join('')}</div>`:'<div style="color:#777;">Nenhuma interação especial publicada neste cenário.</div>'}</div>`;
        el.appendChild(box);
    });
};
const renderizarBancoCenariosV74Base_=(typeof renderizarBancoCenarios==='function')?renderizarBancoCenarios:null;
if(renderizarBancoCenariosV74Base_)renderizarBancoCenarios=function(){
    const container=document.getElementById('listaBancoCenarios');if(!container)return;
    if(!cenariosDB.length){container.innerHTML='<p style="color:#aaa;">Nenhum cenário cadastrado.</p>';return;}
    const esc=escaparBanco_;
    const linhas=[...cenariosDB].sort((a,b)=>String(a.id||'').localeCompare(String(b.id||''))).map(c=>{
        const img=c.imagem?`<img class="db-item-thumb" src="${esc(c.imagem)}" alt="${esc(c.nome||'')}">`:`<div class="db-item-thumb placeholder">🪐</div>`;
        const destinos=[c.destino1,c.destino2,c.destino3].filter(Boolean).join(' · ');
        return `<tr><td>${img}</td><td><strong>${esc(c.id||'')}</strong></td><td><strong>${esc(c.nome||'')}</strong><br><small style="color:#888;">${esc(c.local||'')}</small></td><td style="max-width:135px;white-space:normal;">${esc(c.tipo||'')}</td><td style="max-width:120px;white-space:normal;">${esc(c.estadoInicial||'')}</td><td style="min-width:380px;max-width:500px;white-space:normal;">${esc(c.descricaoJogadores||'')}</td><td style="min-width:380px;max-width:500px;white-space:normal;color:#ffd6a0;">${esc(c.descricaoGM||'')}</td><td style="max-width:220px;white-space:normal;">${esc(c.npcsCena||'')}</td><td style="max-width:180px;white-space:normal;">${esc(destinos)}</td><td class="actions"><button class="btn-small btn-select" onclick="editarCenarioBanco('${esc(c.id)}')">Editar</button><button class="btn-small btn-delete" onclick="removerCenarioBanco('${esc(c.id)}')">Remover</button></td></tr>`;
    }).join('');
    container.innerHTML=`<div class="db-table-wrap"><table class="db-table" style="min-width:1900px;table-layout:fixed;"><colgroup><col style="width:90px"><col style="width:70px"><col style="width:220px"><col style="width:130px"><col style="width:115px"><col style="width:430px"><col style="width:430px"><col style="width:220px"><col style="width:180px"><col style="width:110px"></colgroup><thead><tr><th>Imagem</th><th>ID</th><th>Cenário / Local</th><th>Tipo</th><th>Estado</th><th>Descrição Jogadores</th><th>Descrição GM</th><th>NPCs</th><th>Destinos</th><th>Ações</th></tr></thead><tbody>${linhas}</tbody></table></div>`;
};
console.info('[Mesa Estelar] v74 serviços, mercado negro e cenários carregados');
window.__MESA_PATCH__='v74-servicos-cenarios';

// ===== v76 · Cenário Atual como central genérica de interações + polimento visual =====
function instalarEstilosV76_(){
    if(document.getElementById('mesaV76Styles'))return;
    const st=document.createElement('style');st.id='mesaV76Styles';st.textContent=`
      /* Resumo lateral compacto: uma linha por informação, sem gomos grandes. */
      #charQuickV72{display:flex!important;flex-direction:column!important;gap:3px!important;margin:3px 0 10px!important;padding:7px 2px 9px!important;overflow:visible!important;border-bottom:1px solid rgba(255,255,255,.10)!important}
      #charQuickV72 .quick-card{display:flex!important;align-items:center!important;gap:7px!important;padding:1px 2px!important;min-height:0!important;background:transparent!important;border:0!important;border-radius:0!important;text-align:left!important}
      #charQuickV72 .quick-label{display:none!important}
      #charQuickV72 .quick-value{font-size:.82rem!important;font-weight:400!important;color:#aeb6c9!important;line-height:1.35!important;overflow-wrap:anywhere!important}
      #charQuickV72 .quick-icon{width:1.25em;text-align:center;flex:0 0 1.25em}
      #charQuickV72 .quick-card[data-state="warning"] .quick-value{color:#ffd166!important}
      #charQuickV72 .quick-card[data-state="danger"] .quick-value{color:#ff9696!important}
      #charQuickV72 .quick-card[data-state="good"] .quick-value{color:#b9d8d2!important}

      /* Banco de cenários: nenhuma célula invade a vizinha e Ações fica vertical. */
      #listaBancoCenarios .db-table{table-layout:fixed!important}
      #listaBancoCenarios .db-table th,#listaBancoCenarios .db-table td{box-sizing:border-box!important;overflow:hidden!important;overflow-wrap:anywhere!important;word-break:break-word!important;white-space:normal!important;vertical-align:top!important}
      #listaBancoCenarios .db-table td.actions{padding:8px!important}
      #listaBancoCenarios .db-table td.actions .btn-small{display:block!important;width:100%!important;min-width:0!important;margin:0 0 6px!important;white-space:normal!important}

      /* Interações do cenário */
      .cenario-v76-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:9px}
      .cenario-v76-card{padding:11px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09)}
      .cenario-v76-card .acao-topo{display:flex;gap:9px;align-items:flex-start}
      .cenario-v76-icon{width:38px;height:38px;display:flex;align-items:center;justify-content:center;border-radius:9px;background:rgba(0,212,255,.08);font-size:1.3rem;flex:0 0 38px}
      .cenario-v76-desc{color:#aeb6c9;font-size:.88rem;line-height:1.38;margin:6px 0}
      .cenario-v76-result{margin-top:7px;padding:7px 8px;border-radius:7px;background:rgba(86,240,138,.055);border:1px solid rgba(86,240,138,.13);font-size:.85rem;color:#cce9d6}
      @media(max-width:900px){#charQuickV72{grid-column:1/-1;grid-row:4;display:grid!important;grid-template-columns:repeat(2,minmax(150px,1fr))!important;gap:3px 12px!important}}
    `;document.head.appendChild(st);
}
function fadigaLocalV76_(nivel){
    const pt={Fresh:'Descansado',Winded:'Ofegante',Tired:'Cansado',Wearied:'Fatigado',Exhausted:'Exausto',Debilitated:'Debilitado',Incapacitated:'Incapacitado','Semi-Conscious':'Semiconsciente',Comatose:'Comatoso',Dead:'Morto'};
    const en={Fresh:'Fresh',Winded:'Winded',Tired:'Tired',Wearied:'Wearied',Exhausted:'Exhausted',Debilitated:'Debilitated',Incapacitated:'Incapacitated','Semi-Conscious':'Semi-Conscious',Comatose:'Comatose',Dead:'Dead'};
    const zh={Fresh:'精力充沛',Winded:'气喘',Tired:'疲倦',Wearied:'疲劳',Exhausted:'精疲力竭',Debilitated:'虚弱',Incapacitated:'失能','Semi-Conscious':'半清醒',Comatose:'昏迷',Dead:'死亡'};
    return (idiomaAtual==='en'?en:idiomaAtual==='zh'?zh:pt)[String(nivel||'Fresh')]||String(nivel||'—');
}
atualizarResumoPersonagemV72_=function(){
    const box=document.getElementById('charQuickV72'),c=typeof personagemAtualV66_==='function'?personagemAtualV66_():null;if(!box||!c)return;
    const pv=resumoPVPersonagemV72_(c),fad=String(c?.combate?.fadiga||'Fresh'),pp=resumoPPPersonagemV72_(c),sorteMax=Math.max(0,Number(c?.atributos?.CAR||0)),sorte=Number.isFinite(Number(c?.pontosSorte))?Number(c.pontosSorte):sorteMax;
    const fadEstado=fad==='Fresh'?'good':['Winded','Tired'].includes(fad)?'warning':'danger';
    const rows=[{i:'❤️',v:`PV ${pv.texto}`,s:pv.estado},{i:'😮‍💨',v:fadigaLocalV76_(fad),s:fadEstado},...(pp!==null?[{i:'✨',v:`PP ${pp}`,s:''}]:[]),{i:'⭐',v:`Sorte ${Math.max(0,sorte)}`,s:''}];
    box.innerHTML=rows.map(x=>`<div class="quick-card" data-state="${x.s||''}"><span class="quick-icon">${x.i}</span><span class="quick-value">${escaparHtmlInventario_(x.v)}</span></div>`).join('');
};

function dificuldadeIdV76_(v){const n=normalizarTextoCombate_(v||'padrao');if(n.includes('hercul'))return 'herculeo';if(n.includes('formid'))return 'formidavel';if(n.includes('dific'))return 'dificil';if(n.includes('facil'))return 'facil';return 'padrao';}
function parseInteracoesCenarioV76_(v){
    if(Array.isArray(v))return v;
    return String(v||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map((linha,idx)=>{
        const p=linha.split('|').map(x=>x.trim());
        return {id:`acao_${idx}_${normalizarTextoCombate_(p[0]||'acao').replace(/[^a-z0-9]+/g,'_')}`,titulo:p[0]||`Interação ${idx+1}`,icone:p[1]||'🧭',pericia:p[2]||'—',dificuldade:p[3]||'Padrão',evidente:p[4]||'',sucesso:p[5]||'',critico:p[6]||p[5]||'',falha:p[7]||''};
    });
}
function garantirCampoInteracoesV76_(){
    const ta=document.getElementById('dbScenarioInteracoesV76');if(ta)return ta;
    const anchor=document.getElementById('dbScenarioTestes')?.closest('div[style*="display:grid"]');if(!anchor)return null;
    const box=document.createElement('div');box.id='dbScenarioInteractionsV76';box.style.cssText='margin:14px 0;padding:14px;border-radius:10px;background:rgba(0,212,255,.045);border:1px solid rgba(0,212,255,.18);';
    box.innerHTML='<strong style="color:#8feaff;">🧭 Interações do Cenário Atual</strong><div style="color:#999;font-size:.84em;margin:4px 0 9px;">Uma interação por linha: <b>Título|Ícone|Perícia|Dificuldade|Descrição evidente|Sucesso|Crítico|Falha</b>.</div><textarea id="dbScenarioInteracoesV76" rows="7"></textarea>';
    anchor.after(box);return box.querySelector('textarea');
}
const preencherModalCenarioBancoV76Base_=(typeof preencherModalCenarioBanco_==='function')?preencherModalCenarioBanco_:null;
if(preencherModalCenarioBancoV76Base_)preencherModalCenarioBanco_=function(c=null){const r=preencherModalCenarioBancoV76Base_.apply(this,arguments);const ta=garantirCampoInteracoesV76_();if(ta)ta.value=String(c?.interacoesTexto||'');return r;};
const salvarCenarioBancoModalV76Base_=window.salvarCenarioBancoModal;
window.salvarCenarioBancoModal=async function(){
    const idAntes=String(document.getElementById('dbScenarioIdOriginal')?.value||'').trim(),nome=String(document.getElementById('dbScenarioNome')?.value||'').trim(),txt=String(document.getElementById('dbScenarioInteracoesV76')?.value||'').trim();
    const id=idAntes||slugId_(nome);const r=await salvarCenarioBancoModalV76Base_.apply(this,arguments);if(!id)return r;
    try{await setDoc(doc(db,'cenarios',id),{interacoesTexto:txt},{merge:true});const c=(cenariosDB||[]).find(x=>String(x.id)===id);if(c)c.interacoesTexto=txt;if(String(estadoCampanhaMestre?.cenarioId||'')===id&&userData?.role==='mestre')await publicarCampanhaAtual_();}catch(e){console.warn('Salvar interações cenário v76',e);}return r;
};
function interacoesPublicasCenarioV76_(){
    const c=(cenariosDB||[]).find(x=>String(x.id)===String(estadoCampanhaMestre?.cenarioId));if(!c)return [];
    return parseInteracoesCenarioV76_(c.interacoesTexto).map(a=>({id:a.id,titulo:a.titulo,icone:a.icone,pericia:a.pericia,dificuldade:a.dificuldade,evidente:a.evidente,sucesso:a.sucesso,critico:a.critico,falha:a.falha}));
}
const publicarCampanhaAtualV76Base_=(typeof publicarCampanhaAtual_==='function')?publicarCampanhaAtual_:null;
if(publicarCampanhaAtualV76Base_)publicarCampanhaAtual_=async function(){
    const r=await publicarCampanhaAtualV76Base_.apply(this,arguments);if(userData?.role!=='mestre')return r;
    const acoes=interacoesPublicasCenarioV76_(),interacoes={...(campanhaPublica_?.interacoes||{}),acoes};campanhaPublica_={...(campanhaPublica_||{}),interacoes};
    try{await setDoc(doc(db,'configuracoes','campanhaPublica'),{interacoes},{merge:true});renderizarCenarioAtualPublico_();}catch(e){console.warn('Publicar interações v76',e);}return r;
};
function acharPericiaInteracaoV76_(nome){const n=normalizarTextoCombate_(nome||'');if(!n||n==='—'||n==='-'||n==='sem teste')return null;return (periciasDB||[]).find(p=>String(p.id)===String(nome)||normalizarTextoCombate_(getNome(p))===n||normalizarTextoCombate_(p.nome||'')===n)||null;}
function descobertaInteracaoV76_(char,acao){return char?.cenarioDescobertas?.[String(campanhaPublica_?.cenarioId||'')]?.[String(acao.id)]||null;}
async function salvarDescobertaInteracaoV76_(char,acao,texto,grau,rolagem,valor){
    const cid=String(campanhaPublica_?.cenarioId||'cenario'),all={...(char.cenarioDescobertas||{})},sc={...(all[cid]||{})};sc[String(acao.id)]={titulo:acao.titulo,texto,grau,rolagem:Number(rolagem||0),valor:Number(valor||0),em:new Date().toISOString()};all[cid]=sc;char.cenarioDescobertas=all;await setDoc(doc(db,'personagens',char.id),{cenarioDescobertas:all},{merge:true});
}
window.executarInteracaoCenarioV76_=async function(id){
    const ctx=(typeof window!=='undefined'&&typeof window.obterInteracoesContextuaisV91_==='function')?window.obterInteracoesContextuaisV91_():(campanhaPublica_?.interacoes||{});const ac=(ctx?.acoes||[]).find(x=>String(x.id)===String(id)),char=obterPersonagemAtual_();if(!ac){notificar_('Interação indisponível.','aviso');return;}if(!char){notificar_('Selecione um personagem na aba Ficha.','aviso');return;}
    const p=acharPericiaInteracaoV76_(ac.pericia);let texto='',grau='Interação',roll=0,valor=0;
    if(!p){texto=ac.sucesso||ac.evidente||'Você conclui a interação.';grau='Sem teste';}
    else{
        const bruto=obterValorRegistroPericia_(char,p.id,false),arm=valorPericiaComArmadura_(char,p,bruto),aj=aplicarDificuldadeEFadiga_(char,arm.valor,dificuldadeIdV76_(ac.dificuldade),0);
        if(aj.bloqueado){notificar_('O estado atual do personagem impede este teste.','aviso');return;}
        valor=Number(aj.valor||0);roll=Math.floor(Math.random()*100)+1;const r=classificarD100_(valor,roll);grau=String(r.grau||'');
        if(grau==='Crítico')texto=ac.critico||ac.sucesso||ac.evidente||'Você percebe algo importante.';else if(r.sucesso)texto=ac.sucesso||ac.evidente||'A ação é bem-sucedida.';else texto=ac.falha||'Você não descobre nada além do que já era evidente.';
        try{somDado_();}catch(_){}
    }
    const sucesso=grau==='Sem teste'||grau==='Crítico'||(!/falha|fiasco/i.test(grau)&&(!p||roll<=valor));if(sucesso&&texto)try{await salvarDescobertaInteracaoV76_(char,ac,texto,grau,roll,valor);}catch(e){console.warn('Salvar descoberta v76',e);}
    notificar_(`${ac.icone||'🧭'} ${ac.titulo}${p?` · ${getNome(p)} ${roll}/${valor} (${grau})`:''}: ${texto}`,'info',7000);renderizarCenarioAtualPublico_();
};
function cardAcaoCenarioV76_(a,char){
    const d=char?descobertaInteracaoV76_(char,a):null;return `<div class="cenario-v76-card"><div class="acao-topo"><div class="cenario-v76-icon">${escaparHtmlInventario_(a.icone||'🧭')}</div><div style="min-width:0;flex:1;"><b>${escaparHtmlInventario_(a.titulo)}</b>${a.pericia&&a.pericia!=='—'?`<br><small style="color:#8fa8bc;">${escaparHtmlInventario_(a.pericia)} · ${escaparHtmlInventario_(a.dificuldade||'Padrão')}</small>`:''}</div></div>${a.evidente?`<div class="cenario-v76-desc">${escaparHtmlInventario_(a.evidente)}</div>`:''}${d?`<div class="cenario-v76-result">✓ ${escaparHtmlInventario_(d.texto||'Descoberto')}</div>`:`<button class="btn-small btn-select" style="margin-top:7px;" ${char?'':'disabled'} onclick="executarInteracaoCenarioV76_('${String(a.id).replace(/'/g,"\\'")}')">${a.pericia&&a.pericia!=='—'?'🎲 Testar':'▶ Interagir'}</button>`}</div>`;
}
anexarInteracoesCenarioV73_=function(){
    const merchants=campanhaPublica_?.interacoes?.comerciantes||[],acoes=campanhaPublica_?.interacoes?.acoes||[],char=obterPersonagemAtual_();
    const alvos=['globalCurrentScenarioPublic','charCurrentScenarioPublic'].map(id=>document.getElementById(id)).filter(Boolean);
    alvos.forEach(el=>{el.querySelector('#cenarioInteracoesV73')?.remove();const box=document.createElement('div');box.id='cenarioInteracoesV73';box.style.marginTop='16px';
      const ahtml=acoes.length?`<h4 style="color:#8feaff;margin:12px 0 8px;">Ações e descobertas</h4><div class="cenario-v76-grid">${acoes.map(a=>cardAcaoCenarioV76_(a,char)).join('')}</div>`:'';
      const mhtml=merchants.length?`<h4 style="color:#ffd166;margin:14px 0 8px;">Comércio e serviços</h4><div class="cenario-v76-grid">${merchants.map(m=>{const rot=m.comerciante&&m.prestadorServicos?'🛒 Comércio / Serviços':m.comerciante?'🛒 Comércio':'🧰 Serviços';return `<div class="cenario-v76-card" style="display:flex;align-items:center;gap:9px;">${m.imagem?`<img src="${escaparHtmlInventario_(m.imagem)}" style="width:54px;height:54px;border-radius:10px;object-fit:cover;">`:'<div class="cenario-v76-icon">🧭</div>'}<div style="min-width:0;flex:1;"><b>${escaparHtmlInventario_(m.nome)}</b><br><small style="color:#aaa;">${escaparHtmlInventario_(m.comercioNome||'Interação')}</small><br><button class="btn-small btn-select" style="margin-top:6px;" onclick="abrirComercioCenarioV73_('${String(m.id).replace(/'/g,"\\'")}')">${rot}</button></div></div>`;}).join('')}</div>`:'';
      box.innerHTML=`<div style="padding:14px;border-radius:11px;background:rgba(0,212,255,.045);border:1px solid rgba(0,212,255,.18);"><h3 style="margin:0 0 5px;color:#8feaff;">🧭 Interações do cenário</h3><div style="color:#999;margin-bottom:8px;">Ações disponíveis neste local sem depender do mapa.</div>${ahtml}${mhtml}${!acoes.length&&!merchants.length?'<div style="color:#777;">Nenhuma interação especial publicada neste cenário.</div>':''}</div>`;el.appendChild(box);});
};

// Banco de cenários: mantém descrições largas, reduz Tipo/Estado e empilha Ações.
renderizarBancoCenarios=function(){
    const container=document.getElementById('listaBancoCenarios');if(!container)return;if(!cenariosDB.length){container.innerHTML='<p style="color:#aaa;">Nenhum cenário cadastrado.</p>';return;}const esc=escaparBanco_;
    const linhas=[...cenariosDB].sort((a,b)=>String(a.id||'').localeCompare(String(b.id||''))).map(c=>{const img=c.imagem?`<img class="db-item-thumb" src="${esc(c.imagem)}" alt="${esc(c.nome||'')}">`:`<div class="db-item-thumb placeholder">🪐</div>`,destinos=[c.destino1,c.destino2,c.destino3].filter(Boolean).join(' · ');return `<tr><td>${img}</td><td><strong>${esc(c.id||'')}</strong></td><td><strong>${esc(c.nome||'')}</strong><br><small style="color:#888;">${esc(c.local||'')}</small></td><td>${esc(c.tipo||'')}</td><td>${esc(c.estadoInicial||'')}</td><td>${esc(c.descricaoJogadores||'')}</td><td style="color:#ffd6a0;">${esc(c.descricaoGM||'')}</td><td>${esc(c.npcsCena||'')}</td><td>${esc(destinos)}</td><td class="actions"><button class="btn-small btn-select" onclick="editarCenarioBanco('${esc(c.id)}')">Editar</button><button class="btn-small btn-delete" onclick="removerCenarioBanco('${esc(c.id)}')">Remover</button></td></tr>`;}).join('');
    container.innerHTML=`<div class="db-table-wrap"><table class="db-table" style="min-width:1880px;table-layout:fixed;"><colgroup><col style="width:86px"><col style="width:64px"><col style="width:210px"><col style="width:105px"><col style="width:100px"><col style="width:450px"><col style="width:450px"><col style="width:185px"><col style="width:150px"><col style="width:100px"></colgroup><thead><tr><th>Imagem</th><th>ID</th><th>Cenário / Local</th><th>Tipo</th><th>Estado</th><th>Descrição Jogadores</th><th>Descrição GM</th><th>NPCs</th><th>Destinos</th><th>Ações</th></tr></thead><tbody>${linhas}</tbody></table></div>`;
};
if(typeof document!=='undefined')instalarEstilosV76_();
console.info('[Mesa Estelar] v76 interações genéricas de cenário carregadas');
window.__MESA_PATCH__='v76-interacoes-cenario';

// ===== v77 · comércio/serviços: limites diários de barganha + editor guiado de interações =====
function instalarEstilosV77_(){
    if(document.getElementById('mesaV77Styles'))return;
    const st=document.createElement('style');st.id='mesaV77Styles';st.textContent=`
      #cenarioComercioModalV73 .modal-content{padding-top:26px!important}
      #cenarioComercioModalV73 .close-modal{
        position:absolute!important;top:10px!important;right:10px!important;
        width:38px!important;height:38px!important;border-radius:7px!important;
        display:flex!important;align-items:center!important;justify-content:center!important;
        background:#dc3545!important;color:#fff!important;border:1px solid rgba(255,255,255,.28)!important;
        font-size:28px!important;font-weight:800!important;line-height:1!important;cursor:pointer!important;
        z-index:20!important;box-shadow:0 4px 12px rgba(0,0,0,.32)!important;
      }
      #cenarioComercioModalV73 .close-modal:hover{filter:brightness(1.12)}
      .barganha-v77-aviso{margin-top:7px;padding:7px 9px;border-radius:7px;background:rgba(255,193,7,.08);border:1px solid rgba(255,193,7,.18);color:#e8d39b;font-size:.84em;line-height:1.35}
      .barganha-v77-bloqueio{background:rgba(220,53,69,.10);border-color:rgba(220,53,69,.30);color:#ffb4bc}
      #cenarioInteracoesBuilderV77{margin-top:10px;padding:12px;border-radius:9px;background:rgba(0,0,0,.14);border:1px solid rgba(255,255,255,.10)}
      #cenarioInteracoesBuilderV77 .v77-grid{display:grid;grid-template-columns:1.1fr 80px 1fr 140px;gap:8px;align-items:end}
      #cenarioInteracoesBuilderV77 .v77-wide{grid-column:1/-1}
      #cenarioInteracoesBuilderV77 textarea{min-height:58px}
      @media(max-width:900px){#cenarioInteracoesBuilderV77 .v77-grid{grid-template-columns:1fr 1fr}.v77-wide{grid-column:1/-1!important}}
    `;document.head.appendChild(st);
}
function diaCampanhaV77_(){return Math.max(1,Math.floor(Number(campanhaPublica_?.diaCampanha||estadoCampanhaMestre?.diaCampanha||1)));}
function comercioDiarioV77_(char,criar=false){
    if(!char)return null;const dia=String(diaCampanhaV77_());
    if(criar){char.comercioBarganhaDiaria={...(char.comercioBarganhaDiaria||{})};char.comercioBarganhaDiaria[dia]={...(char.comercioBarganhaDiaria[dia]||{})};}
    return char.comercioBarganhaDiaria?.[dia]||null;
}
function comercioNpcDiaV77_(char,mid,criar=false){
    const d=comercioDiarioV77_(char,criar);if(!d)return null;
    if(criar)d[String(mid)]={...(d[String(mid)]||{}),usadas:{...(d[String(mid)]?.usadas||{})}};
    return d[String(mid)]||null;
}
function comercioBarganhaEstadoPersistenteV77_(char,mid){return comercioNpcDiaV77_(char,mid,false)||{usadas:{},bloqueado:false,fiasco:false};}
async function salvarComercioDiarioV77_(char){
    if(!char?.id)return;await setDoc(doc(db,'personagens',char.id),{comercioBarganhaDiaria:char.comercioBarganhaDiaria||{}},{merge:true});
}
function periciaUsadaHojeV77_(char,mid,pid){return !!comercioBarganhaEstadoPersistenteV77_(char,mid).usadas?.[String(pid)];}
function penalidadeFiascoV77_(char,mid){return !!comercioBarganhaEstadoPersistenteV77_(char,mid).fiasco;}
const precoCompraComercianteV77Base_=precoCompraComercianteV73_;
precoCompraComercianteV73_=function(item,m,state){
    let r=precoCompraComercianteV77Base_.apply(this,arguments);const char=obterPersonagemAtual_();
    if(char&&penalidadeFiascoV77_(char,m?.id))r=Math.ceil(r*1.25);
    return r;
};
const precoVendaComercianteV77Base_=precoVendaComercianteV73_;
precoVendaComercianteV73_=function(registro,m,state){
    let r=precoVendaComercianteV77Base_.apply(this,arguments);const char=obterPersonagemAtual_();
    if(char&&penalidadeFiascoV77_(char,m?.id))r=Math.floor(r*.80);
    return r;
};
window.rolarBarganhaCenarioV73_=async function(id){
    const m=comerciantePublicoPorIdV73_(id),char=obterPersonagemAtual_();if(!m||!char||!m.barganha)return;
    const pid=String(document.getElementById('cenarioComercioSkillV73')?.value||''),p=(periciasDB||[]).find(x=>String(x.id)===pid);if(!p)return;
    const status=comercioNpcDiaV77_(char,m.id,true);
    if(status.bloqueado){notificar_('Uma falha crítica encerrou as tentativas de barganha com este comerciante neste dia.','aviso',5200);return;}
    if(status.usadas?.[pid]){notificar_('Esta perícia já foi usada para barganhar com este comerciante hoje.','aviso',4200);return;}
    const bruto=obterValorRegistroPericia_(char,p.id,false),arm=valorPericiaComArmadura_(char,p,bruto),aj=aplicarDificuldadeEFadiga_(char,arm.valor,'padrao',0);
    if(aj.bloqueado){notificar_('A fadiga impede a barganha.','aviso');return;}
    const rollP=Math.floor(Math.random()*100)+1,rollN=Math.floor(Math.random()*100)+1;
    const rp=classificarD100_(aj.valor,rollP),rn=classificarD100_(Math.max(1,Number(m.resistencia||50)),rollN),venceu=comercioResultadoOpostoV73_(rp,rn);
    let compraMult=1,vendaMult=1,txt='Sem alteração de preço.';
    const fiasco=/fiasco|falha crítica|falha critica/i.test(String(rp.grau||''));
    if(venceu){const crit=rp.grau==='Crítico';compraMult=crit?.80:.90;vendaMult=crit?1.20:1.10;txt=crit?'Excelente acordo: preços melhoraram bastante.':'Acordo favorável: preços melhoraram.';}
    else if(fiasco){compraMult=1.25;vendaMult=.80;txt='Falha crítica: a negociação azedou. Os preços pioraram bastante e não haverá nova barganha com este comerciante hoje.';}
    status.usadas[pid]={em:new Date().toISOString(),grau:String(rp.grau||''),roll:rollP,valor:aj.valor};
    if(fiasco){status.bloqueado=true;status.fiasco=true;status.bloqueadoEm=new Date().toISOString();}
    comercioCenarioNegociacaoV73_[chaveNegV73_(char.id,m.id)]={compraMult,vendaMult,player:{roll:rollP,valor:aj.valor,grau:rp.grau,pericia:getNome(p)},npc:{roll:rollN,valor:Number(m.resistencia||50),grau:rn.grau},txt};
    try{await salvarComercioDiarioV77_(char);}catch(e){console.warn('Salvar limite diário de barganha',e);}
    somDado_();renderComercioCenarioV73_(id);notificar_(`${getNome(p)} ${rollP}/${aj.valor} × comerciante ${rollN}/${m.resistencia}: ${txt}`,'info',6500);
};
function atualizarEstadoBarganhaV77_(mid){
    const char=obterPersonagemAtual_(),sel=document.getElementById('cenarioComercioSkillV73'),btn=sel?.parentElement?.querySelector('button[onclick*="rolarBarganhaCenarioV73"]');if(!char||!sel)return;
    const st=comercioBarganhaEstadoPersistenteV77_(char,mid),pid=String(sel.value||'');
    [...sel.options].forEach(o=>{const usada=!!st.usadas?.[String(o.value)];o.disabled=usada;o.textContent=o.textContent.replace(/ · usada hoje$/,'')+(usada?' · usada hoje':'');});
    if(st.bloqueado){if(btn)btn.disabled=true;}
    else if(btn)btn.disabled=!pid||!!st.usadas?.[pid];
    const bloco=sel.closest('div[style*="background:rgba(155,89,182"]')||sel.parentElement?.parentElement;
    if(bloco){bloco.querySelector('.barganha-v77-aviso')?.remove();const msg=document.createElement('div');msg.className='barganha-v77-aviso'+(st.bloqueado?' barganha-v77-bloqueio':'');msg.textContent=st.bloqueado?'Falha crítica hoje: novas tentativas com este comerciante estão bloqueadas e os preços permanecem desfavoráveis até o próximo dia de campanha.':'Limite: uma tentativa por perícia, por comerciante, em cada dia de campanha.';bloco.appendChild(msg);}
    sel.onchange=()=>atualizarEstadoBarganhaV77_(mid);
}
const renderComercioCenarioV77Base_=renderComercioCenarioV73_;
renderComercioCenarioV73_=function(id){const r=renderComercioCenarioV77Base_.apply(this,arguments);setTimeout(()=>atualizarEstadoBarganhaV77_(id),0);return r;};

function limparCampoInteracaoV77_(s){return String(s||'').replace(/[|\r\n]+/g,' ').replace(/\s+/g,' ').trim();}
function opcoesPericiaInteracaoV77_(){return ['<option value="—">— Sem teste —</option>',...(periciasDB||[]).slice().sort((a,b)=>getNome(a).localeCompare(getNome(b),'pt-BR')).map(p=>`<option value="${escaparHtmlInventario_(getNome(p))}">${escaparHtmlInventario_(getNome(p))}</option>`) ].join('');}
function instalarConstrutorInteracoesV77_(){
    const box=document.getElementById('dbScenarioInteractionsV76'),ta=document.getElementById('dbScenarioInteracoesV76');if(!box||!ta||document.getElementById('cenarioInteracoesBuilderV77'))return;
    const b=document.createElement('div');b.id='cenarioInteracoesBuilderV77';
    b.innerHTML=`<strong style="color:#ffd166;">➕ Adicionar interação guiada</strong><div style="color:#999;font-size:.82em;margin:3px 0 9px;">A descrição superficial aparece sempre. Se escolher uma perícia, sucesso/crítico/falha dependem do teste.</div><div class="v77-grid">
      <label>Título<input id="v77AcaoTitulo" type="text" placeholder="Examinar o painel"></label>
      <label>Ícone<input id="v77AcaoIcone" type="text" value="🔎" maxlength="6"></label>
      <label>Perícia<select id="v77AcaoPericia">${opcoesPericiaInteracaoV77_()}</select></label>
      <label>Dificuldade<select id="v77AcaoDificuldade"><option>Padrão</option><option>Fácil</option><option>Difícil</option><option>Formidável</option><option>Hercúleo</option></select></label>
      <label class="v77-wide">Descrição superficial<textarea id="v77AcaoEvidente" placeholder="O que qualquer personagem percebe sem rolar."></textarea></label>
      <label class="v77-wide">Em sucesso<textarea id="v77AcaoSucesso" placeholder="Informação revelada em um sucesso."></textarea></label>
      <label class="v77-wide">Em crítico<textarea id="v77AcaoCritico" placeholder="Informação adicional em um crítico."></textarea></label>
      <label class="v77-wide">Em falha<textarea id="v77AcaoFalha" placeholder="Mensagem em caso de falha, se desejar."></textarea></label>
    </div><button type="button" class="btn-small btn-select" style="margin-top:9px;" onclick="adicionarInteracaoGuiadaV77_()">➕ Adicionar à lista</button>`;
    box.insertBefore(b,ta);const nota=document.createElement('small');nota.style.cssText='display:block;color:#8ea7c8;margin:7px 0 4px;';nota.textContent='Lista avançada (uma linha por interação):';ta.before(nota);
}
window.adicionarInteracaoGuiadaV77_=function(){
    const ta=document.getElementById('dbScenarioInteracoesV76');if(!ta)return;
    const titulo=limparCampoInteracaoV77_(document.getElementById('v77AcaoTitulo')?.value);if(!titulo){notificar_('Dê um título à interação.','aviso');return;}
    const vals=[titulo,limparCampoInteracaoV77_(document.getElementById('v77AcaoIcone')?.value)||'🧭',limparCampoInteracaoV77_(document.getElementById('v77AcaoPericia')?.value)||'—',limparCampoInteracaoV77_(document.getElementById('v77AcaoDificuldade')?.value)||'Padrão',limparCampoInteracaoV77_(document.getElementById('v77AcaoEvidente')?.value),limparCampoInteracaoV77_(document.getElementById('v77AcaoSucesso')?.value),limparCampoInteracaoV77_(document.getElementById('v77AcaoCritico')?.value),limparCampoInteracaoV77_(document.getElementById('v77AcaoFalha')?.value)];
    ta.value=(ta.value.trim()?ta.value.trim()+'\n':'')+vals.join('|');
    ['v77AcaoTitulo','v77AcaoEvidente','v77AcaoSucesso','v77AcaoCritico','v77AcaoFalha'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});notificar_('Interação adicionada à lista. Salve o cenário para publicar.','sucesso',3000);
};
const preencherModalCenarioBancoV77Base_=(typeof preencherModalCenarioBanco_==='function')?preencherModalCenarioBanco_:null;
if(preencherModalCenarioBancoV77Base_)preencherModalCenarioBanco_=function(){const r=preencherModalCenarioBancoV77Base_.apply(this,arguments);setTimeout(instalarConstrutorInteracoesV77_,0);return r;};
if(typeof document!=='undefined'){instalarEstilosV77_();setTimeout(instalarConstrutorInteracoesV77_,0);}
console.info('[Mesa Estelar] v77 barganha diária e construtor de interações carregados');
window.__MESA_PATCH__='v77-comercio-servicos';

// ===== v78 · side quest de mapas CSV + seletor da Mesa + perícias do banco =====
async function recarregarMapasSilenciosoV78_(){
    if(!userData||userData.role!=='mestre')return;
    try{
        const q=await getDocs(collection(db,'mapas'));
        mapasDB=[];
        q.forEach(d=>{const x={id:d.id,...d.data()};if(x.tipo!=='mapa-parte')mapasDB.push(x);});
        mapasDB.sort((a,b)=>String(a.nome||a.id||'').localeCompare(String(b.nome||b.id||''),'pt-BR',{sensitivity:'base'}));
        if(typeof labMesclarMapasLocais_==='function')labMesclarMapasLocais_();
    }catch(e){console.warn('[v78] Não foi possível recarregar mapas silenciosamente',e);}
}
function sincronizarSelectMapaDiretoV78_(){
    const sel=document.getElementById('novaSyncMapa');if(!sel)return;
    const atual=String(sel.value||'');
    const lista=[...(mapasDB||[])].filter(m=>m.tipo!=='mapa-parte'&&!m?.hiddenMesaLive&&!String(m?.id||'').startsWith('__mesa_live__')).sort((a,b)=>String(a.nome||a.id||'').localeCompare(String(b.nome||b.id||''),'pt-BR',{sensitivity:'base'}));
    sel.replaceChildren(...lista.map(m=>{const o=document.createElement('option');o.value=String(m.id);o.textContent=String(m.nome||m.id);return o;}));
    if(lista.some(m=>String(m.id)===atual))sel.value=atual;
}
async function atualizarMapasUIV78_(){
    await recarregarMapasSilenciosoV78_();
    try{renderizarBancoMapas_();}catch(_){}
    try{labAtualizarSelectMapas_();}catch(_){}
    try{gm2populateMapSelect();}catch(_){}
    try{sincronizarSelectMapaDiretoV78_();}catch(_){}
}
const novaSyncAbrirV78Base_=window.novaSyncAbrir_;
if(typeof novaSyncAbrirV78Base_==='function')window.novaSyncAbrir_=async function(){
    if(userData?.role==='mestre')await recarregarMapasSilenciosoV78_();
    const r=await novaSyncAbrirV78Base_.apply(this,arguments);
    setTimeout(sincronizarSelectMapaDiretoV78_,0);
    return r;
};
const recarregarBancoMapasV78Base_=window.recarregarBancoMapas_;
if(typeof recarregarBancoMapasV78Base_==='function')window.recarregarBancoMapas_=async function(){
    const r=await recarregarBancoMapasV78Base_.apply(this,arguments);
    sincronizarSelectMapaDiretoV78_();
    return r;
};
['excluirMapaBancoAdmin_','renomearMapaBanco_','duplicarMapaBanco_'].forEach(nome=>{
    const base=window[nome];if(typeof base!=='function')return;
    window[nome]=async function(){const r=await base.apply(this,arguments);await atualizarMapasUIV78_();return r;};
});

function mapasCsvBoolV78_(v,padrao=true){
    if(v===true||v===false)return v;const s=String(v??'').trim().toLowerCase();if(!s)return padrao;return !['0','false','nao','não','no','oculta','oculto'].includes(s);
}
function mapasCsvNumeroV78_(v,padrao){const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:padrao;}
function mapasCsvJsonV78_(v){
    const s=String(v??'').trim();if(!s)return {};
    try{return JSON.parse(s);}catch(e){throw new Error('Campo dados_json contém JSON inválido.');}
}
async function mapaParaLinhaCsvV78_(base){
    const m=await labMapaHidratar_(base);
    const payload={oficina2State:m.oficina2State||null,desenhos:Array.isArray(m.desenhos)?m.desenhos:[],formas:Array.isArray(m.formas)?m.formas:[],objetos:Array.isArray(m.objetos)?m.objetos:[]};
    return {id:String(m.id||''),nome:String(m.nome||m.id||''),larguraM:Number(m.larguraM||28),alturaM:Number(m.alturaM||14),pxPorMetro:Number(m.pxPorMetro||32),fundo:String(m.fundo||'#d7d7d7'),corGrade:String(m.corGrade||'#777777'),gradeVisivel:m.gradeVisivel!==false,textura:String(m.textura||'nenhuma'),dados_json:JSON.stringify(payload)};
}
function baixarTextoCsvV78_(nome,cabecalhos,linhas){
    const conteudo='\uFEFF'+[cabecalhos.join(';'),...linhas.map(x=>linhaCSV_(cabecalhos,x))].join('\r\n');
    const blob=new Blob([conteudo],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=nome;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);try{somSalvar_();}catch(_){}
}
window.exportarMapasCSVV78_=async function(){
    if(userData?.role!=='mestre'){notificar_('Apenas o mestre pode exportar mapas.','aviso');return;}
    await recarregarMapasSilenciosoV78_();
    const lista=[...(mapasDB||[])].filter(m=>m.tipo!=='mapa-parte'&&!m.__local&&!m.hiddenMesaLive&&!String(m.id||'').startsWith('__mesa_live__'));
    if(!lista.length){notificar_('Não há mapas do Firestore para exportar.','aviso');return;}
    try{
        const linhas=[];for(const m of lista)linhas.push(await mapaParaLinhaCsvV78_(m));
        const cab=['id','nome','larguraM','alturaM','pxPorMetro','fundo','corGrade','gradeVisivel','textura','dados_json'];
        const d=new Date(),data=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        baixarTextoCsvV78_(`banco_mapas_${data}.csv`,cab,linhas);notificar_(`${linhas.length} mapa(s) exportado(s).`,'sucesso',3500);
    }catch(e){console.error('Exportar mapas CSV',e);notificar_('Não foi possível exportar os mapas: '+e.message,'erro',6500);}
};
window.baixarTemplateMapasCSVV78_=function(){
    const cab=['id','nome','larguraM','alturaM','pxPorMetro','fundo','corGrade','gradeVisivel','textura','dados_json'];
    const exemplo={id:'mapa_exemplo',nome:'Mapa Exemplo',larguraM:28,alturaM:14,pxPorMetro:32,fundo:'#d7d7d7',corGrade:'#777777',gradeVisivel:true,textura:'nenhuma',dados_json:JSON.stringify({oficina2State:null,desenhos:[],formas:[],objetos:[]})};
    baixarTextoCsvV78_('template_mapas.csv',cab,[exemplo]);
};
window.importarMapasCSVV78_=async function(input){
    if(userData?.role!=='mestre'){notificar_('Apenas o mestre pode importar mapas.','aviso');if(input)input.value='';return;}
    const file=input?.files?.[0];if(!file)return;
    Papa.parse(file,{header:true,skipEmptyLines:'greedy',delimiter:'',transformHeader:h=>String(h||'').replace(/^\uFEFF/,'').trim(),complete:async results=>{
        try{
            if(results.errors?.length)throw new Error(results.errors[0].message||'CSV inválido');
            const rows=(results.data||[]).filter(r=>String(r.id||r.nome||'').trim());if(!rows.length)throw new Error('CSV vazio.');
            await recarregarMapasSilenciosoV78_();let gravados=0;
            for(const r of rows){
                const nome=String(r.nome||r.id||'Mapa').trim(),id=String(r.id||labMapaSlug_(nome)).trim();if(!id)continue;
                const payload=mapasCsvJsonV78_(r.dados_json);
                const existente=(mapasDB||[]).find(m=>String(m.id)===id);
                const dados={id,nome,larguraM:Math.max(4,mapasCsvNumeroV78_(r.larguraM,28)),alturaM:Math.max(4,mapasCsvNumeroV78_(r.alturaM,14)),pxPorMetro:Math.max(8,mapasCsvNumeroV78_(r.pxPorMetro,32)),fundo:String(r.fundo||'#d7d7d7'),corGrade:String(r.corGrade||'#777777'),gradeVisivel:mapasCsvBoolV78_(r.gradeVisivel,true),textura:String(r.textura||'nenhuma'),oficina2State:payload.oficina2State||null,desenhos:Array.isArray(payload.desenhos)?payload.desenhos:[],formas:Array.isArray(payload.formas)?payload.formas:[],objetos:Array.isArray(payload.objetos)?payload.objetos:[],criadoPor:String(existente?.criadoPor||currentUserUid||''),atualizadoEm:new Date().toISOString()};
                await labMapaSalvarFirestore_(dados,Number(existente?.partes||0));gravados++;
            }
            await atualizarMapasUIV78_();notificar_(`${gravados} mapa(s) importado(s)/atualizado(s). Os demais mapas foram preservados.`,'sucesso',5500);
        }catch(e){console.error('Importar mapas CSV',e);notificar_('Não foi possível importar os mapas: '+e.message,'erro',7500);}finally{if(input)input.value='';}
    },error:e=>{if(input)input.value='';notificar_('Não foi possível ler o CSV: '+e.message,'erro',6500);}});
};

function atualizarSelectPericiasInteracaoV78_(){
    const sel=document.getElementById('v77AcaoPericia');if(!sel)return;
    const atual=String(sel.value||'—');
    const lista=[...(periciasDB||[])].sort((a,b)=>getNome(a).localeCompare(getNome(b),'pt-BR',{sensitivity:'base'}));
    sel.innerHTML='<option value="—">— Sem teste —</option>'+lista.map(p=>`<option value="${escaparHtmlInventario_(getNome(p))}">${escaparHtmlInventario_(getNome(p))}</option>`).join('');
    if([...sel.options].some(o=>o.value===atual))sel.value=atual;
}
const preencherModalCenarioBancoV78Base_=(typeof preencherModalCenarioBanco_==='function')?preencherModalCenarioBanco_:null;
if(preencherModalCenarioBancoV78Base_)preencherModalCenarioBanco_=function(){const r=preencherModalCenarioBancoV78Base_.apply(this,arguments);setTimeout(atualizarSelectPericiasInteracaoV78_,0);return r;};

if(typeof setTimeout==='function')setTimeout(()=>{sincronizarSelectMapaDiretoV78_();atualizarSelectPericiasInteracaoV78_();},1000);
console.info('[Mesa Estelar] v78 mapas CSV, seletor da Mesa e perícias do banco carregados');
window.__MESA_PATCH__='v78-mapas-csv';

// ===== v80 · vínculo opcional Cenário ↔ Mapa + robustez visual de mapas importados =====
let cenarioMapaGuardV80_=false;
function cenarioMapaAutoAtivoV80_(){
    // v93: abrir um mapa é navegação do mestre, não viagem da mesa.
    // O vínculo automático continua disponível como opção explícita, mas nasce desligado.
    try{return localStorage.getItem('mesa_cenario_mapa_auto_v80')==='1';}catch(_){return false;}
}
window.cenarioMapaAutoV80_=function(v){
    try{localStorage.setItem('mesa_cenario_mapa_auto_v80',v?'1':'0');}catch(_){}
    const ck=document.getElementById('gmScenarioMapAutoV80');if(ck)ck.checked=!!v;
    notificar_(v?'Vínculo automático cenário ↔ mapa ativado.':'Vínculo automático desativado. Cenários e mapas podem ser abertos independentemente.','info',3200);
};
function mapasVinculaveisV80_(){
    return [...(mapasDB||[])].filter(m=>m?.tipo!=='mapa-parte'&&!m?.hiddenMesaLive&&!String(m?.id||'').startsWith('__mesa_live__')).sort((a,b)=>String(a.nome||a.id||'').localeCompare(String(b.nome||b.id||''),'pt-BR',{sensitivity:'base'}));
}
function popularMapaVinculadoCenarioV80_(valor=''){
    const sel=document.getElementById('dbScenarioMapaId');if(!sel)return;
    const atual=String(valor||sel.value||'');
    const lista=mapasVinculaveisV80_();
    sel.replaceChildren(new Option('— Nenhum mapa vinculado —',''),...lista.map(m=>new Option(`${m.nome||m.id} · ${m.id}`,String(m.id))));
    if([...sel.options].some(o=>o.value===atual))sel.value=atual;else sel.value='';
}
const preencherModalCenarioBancoV80Base_=(typeof preencherModalCenarioBanco_==='function')?preencherModalCenarioBanco_:null;
if(preencherModalCenarioBancoV80Base_)preencherModalCenarioBanco_=function(c=null){
    popularMapaVinculadoCenarioV80_(c?.mapaId||'');
    const r=preencherModalCenarioBancoV80Base_.apply(this,arguments);
    popularMapaVinculadoCenarioV80_(c?.mapaId||'');
    return r;
};
const recarregarBancoMapasV80Base_=window.recarregarBancoMapas_;
if(typeof recarregarBancoMapasV80Base_==='function')window.recarregarBancoMapas_=async function(){
    const r=await recarregarBancoMapasV80Base_.apply(this,arguments);popularMapaVinculadoCenarioV80_();return r;
};
function cenarioDoMapaV80_(mapaId){if(typeof window!=='undefined'&&window.__mesaCenarioParaMapaV156_)return window.__mesaCenarioParaMapaV156_(mapaId);return (cenariosDB||[]).find(c=>String(c.mapaId||'')===String(mapaId||''))||null;}
async function ativarCenarioSemTrocarMapaV80_(c){
    if(!c||userData?.role!=='mestre')return;
    if(String(estadoCampanhaMestre?.cenarioId||'')===String(c.id))return;
    estadoCampanhaMestre={...(estadoCampanhaMestre||{}),cenarioId:c.id,cenario:c.nome||c.id};
    await setDoc(doc(db,'configuracoes','escudoMestre'),{campanha:estadoCampanhaMestre},{merge:true});
    await publicarCampanhaAtual_();
    cenarioSelecionadoMestreId_=String(c.id);
    try{preencherEstadoCampanha_();renderizarCenarioMestre_();}catch(_){}
    notificar_(`🪐 Cenário ativo alterado para “${c.nome||c.id}” pelo mapa vinculado.`,'info',4200);
}
window.abrirMapaVinculadoCenarioV80_=async function(cenarioId){
    const c=(cenariosDB||[]).find(x=>String(x.id)===String(cenarioId))||obterCenarioSelecionadoMestre_();
    if(!c?.mapaId){notificar_('Este cenário não possui mapa vinculado.','aviso');return;}
    try{
        cenarioMapaGuardV80_=true;
        await window.abrirMapaDaMesa_();
        await novaSyncController_.openMap(String(c.mapaId));
    }catch(e){console.error('Abrir mapa vinculado v80',e);notificar_('Não foi possível abrir o mapa vinculado: '+(e?.message||e),'erro',7000);}
    finally{cenarioMapaGuardV80_=false;}
};
const ativarCenarioMestreV80Base_=window.ativarCenarioMestre;
if(typeof ativarCenarioMestreV80Base_==='function')window.ativarCenarioMestre=async function(){
    const c=obterCenarioSelecionadoMestre_();
    const r=await ativarCenarioMestreV80Base_.apply(this,arguments);
    if(c?.mapaId&&cenarioMapaAutoAtivoV80_()&&!cenarioMapaGuardV80_){
        try{cenarioMapaGuardV80_=true;await window.abrirMapaDaMesa_();await novaSyncController_.openMap(String(c.mapaId));}
        catch(e){console.warn('Vínculo cenário→mapa v80',e);notificar_(`Cenário ativado, mas o mapa vinculado não pôde ser aberto: ${e?.message||e}`,'aviso',6500);}
        finally{cenarioMapaGuardV80_=false;}
    }
    return r;
};
const renderizarCenarioMestreV80Base_=(typeof renderizarCenarioMestre_==='function')?renderizarCenarioMestre_:null;
if(renderizarCenarioMestreV80Base_)renderizarCenarioMestre_=function(){
    const r=renderizarCenarioMestreV80Base_.apply(this,arguments);
    const ck=document.getElementById('gmScenarioMapAutoV80');if(ck)ck.checked=cenarioMapaAutoAtivoV80_();
    const c=obterCenarioSelecionadoMestre_(),host=document.getElementById('gmScenarioDetail');
    if(c&&host&&!document.getElementById('gmScenarioMapLinkV80')){
        const map=c.mapaId?(mapasDB||[]).find(m=>String(m.id)===String(c.mapaId)):null;
        const box=document.createElement('div');box.id='gmScenarioMapLinkV80';box.style.cssText='margin-top:12px;padding:13px;border-radius:10px;background:rgba(0,212,255,.055);border:1px solid rgba(0,212,255,.22);';
        box.innerHTML=c.mapaId
          ? `<strong style="color:#8feaff;">🗺️ Mapa vinculado</strong><div style="margin:6px 0;color:#ccd7e7;">${escaparHtmlInventario_(map?.nome||c.mapaId)} <small style="color:#829bb3;">${escaparHtmlInventario_(c.mapaId)}</small></div><button class="btn-small btn-select" onclick="abrirMapaVinculadoCenarioV80_('${String(c.id).replace(/'/g,"\\'")}')">🗺️ Abrir mapa vinculado</button>`
          : '<strong style="color:#8feaff;">🗺️ Mapa vinculado</strong><div style="margin-top:6px;color:#8997aa;">Nenhum. O cenário continua funcionando normalmente sem mapa.</div>';
        host.appendChild(box);
    }
    return r;
};

// Abrir manualmente um mapa pode ativar o cenário que aponta para ele. A preferência
// pode ser desligada no Escudo do Mestre para permitir navegação totalmente independente.
const abrirMapaV80Base_=(typeof novaSyncController_!=='undefined'&&typeof novaSyncController_.openMap==='function')?novaSyncController_.openMap.bind(novaSyncController_):null;
if(abrirMapaV80Base_)novaSyncController_.openMap=async function(id){
    const r=await abrirMapaV80Base_.apply(this,arguments);
    if(userData?.role==='mestre'&&cenarioMapaAutoAtivoV80_()&&!cenarioMapaGuardV80_){
        const c=cenarioDoMapaV80_(id);
        if(c&&String(estadoCampanhaMestre?.cenarioId||'')!==String(c.id)){
            try{cenarioMapaGuardV80_=true;await ativarCenarioSemTrocarMapaV80_(c);}
            catch(e){console.warn('Vínculo mapa→cenário v80',e);}
            finally{cenarioMapaGuardV80_=false;}
        }
    }
    return r;
};

if(typeof setTimeout==='function')setTimeout(()=>{popularMapaVinculadoCenarioV80_();const ck=document.getElementById('gmScenarioMapAutoV80');if(ck)ck.checked=cenarioMapaAutoAtivoV80_();},700);
console.info('[Mesa Estelar] v80 vínculo cenário↔mapa e robustez de objetos importados carregados');
window.__MESA_PATCH__='v80-cenario-mapa';

// ============================================================================
// v82 · ENTIDADES VINCULADAS / BANCO DE COMPANHEIROS
// Companheiros são opcionais e persistem dentro da ficha de um único personagem.
// O modelo fica no banco privado do mestre; a instância vinculada leva um snapshot,
// portanto jogadores não precisam de permissão para ler /companheiros.
// ============================================================================
let companheirosDBV82_=[];
const COMPANHEIROS_COL_V82_='companheiros';
const COMPANHEIROS_CSV_V82_=['id','nome','icone','categoria','especie','tamanho','pvMax','movimento','capacidadeCargaKg','montaria','combatente','controlavel','robotico','energiaMax','vendavel','preco','nivelAcesso','disponivelCampanha','habilidadesTexto','imagem','descricao'];

function boolV82_(v,def=false){
    if(v===true||v===false)return v;
    const n=normalizarTextoCombate_(v??'');
    if(['true','1','sim','yes','s','x'].includes(n))return true;
    if(['false','0','nao','no','n'].includes(n))return false;
    return def;
}
function numV82_(v,def=0){const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:def;}
function escV82_(v){return typeof escaparHtmlInventario_==='function'?escaparHtmlInventario_(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function slugV82_(v){return normalizarTextoCombate_(v||'companheiro').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'')||`companheiro_${Date.now()}`;}
function modeloCompanheiroV82_(raw={}){
    const cat=String(raw.categoria||'Animal').trim()||'Animal';
    const robotico=boolV82_(raw.robotico,/rob[oô]|drone/i.test(cat));
    return {
      id:String(raw.id||slugV82_(raw.nome)).trim(),nome:String(raw.nome||'Companheiro').trim(),icone:String(raw.icone||(/drag/i.test(raw.nome||'')?'🐉':robotico?'🤖':'🐾')).trim(),
      categoria:cat,especie:String(raw.especie||'').trim(),tamanho:String(raw.tamanho||'').trim(),pvMax:Math.max(0,numV82_(raw.pvMax,1)),movimento:Math.max(0,numV82_(raw.movimento,0)),
      capacidadeCargaKg:Math.max(0,numV82_(raw.capacidadeCargaKg,0)),montaria:boolV82_(raw.montaria),combatente:boolV82_(raw.combatente),controlavel:boolV82_(raw.controlavel,true),robotico,
      energiaMax:Math.max(0,numV82_(raw.energiaMax,0)),vendavel:boolV82_(raw.vendavel),preco:Math.max(0,numV82_(raw.preco,0)),nivelAcesso:String(raw.nivelAcesso||'Comum').trim()||'Comum',
      disponivelCampanha:raw.disponivelCampanha===undefined||raw.disponivelCampanha===''?true:boolV82_(raw.disponivelCampanha,true),habilidadesTexto:String(raw.habilidadesTexto||'').trim(),
      imagem:String(raw.imagem||'').trim(),descricao:String(raw.descricao||'').trim()
    };
}
function defaultsCompanheirosV82_(){return [
  modeloCompanheiroV82_({id:'galinha_domestica',nome:'Galinha doméstica',icone:'🐔',categoria:'Animal',especie:'Galliforme doméstico',tamanho:'Minúsculo',pvMax:2,movimento:3,capacidadeCargaKg:0,montaria:false,combatente:false,controlavel:false,robotico:false,vendavel:true,preco:12,nivelAcesso:'Comum',habilidadesTexto:'Faz barulho; pode denunciar a posição do dono em situações de furtividade.',descricao:'Uma galinha comum. Não concede bônus e sua principal importância é narrativa.'}),
  modeloCompanheiroV82_({id:'lobo_companheiro',nome:'Lobo companheiro',icone:'🐺',categoria:'Animal',especie:'Canídeo',tamanho:'Médio',pvMax:12,movimento:6,capacidadeCargaKg:5,montaria:false,combatente:true,controlavel:true,robotico:false,vendavel:true,preco:850,nivelAcesso:'Comum',habilidadesTexto:'Rastrear; faro aguçado; combate corpo a corpo.',descricao:'Lobo domesticado e treinado para acompanhar um personagem.'}),
  modeloCompanheiroV82_({id:'drone_auxiliar_zk4',nome:'Drone auxiliar ZK-4',icone:'🤖',categoria:'Drone',especie:'Unidade robótica',tamanho:'Pequeno',pvMax:8,movimento:8,capacidadeCargaKg:10,montaria:false,combatente:false,controlavel:true,robotico:true,energiaMax:20,vendavel:true,preco:2400,nivelAcesso:'Comum',habilidadesTexto:'Voo; iluminação; sensores básicos; transporte leve.',descricao:'Drone pessoal utilitário capaz de acompanhar seu proprietário e carregar equipamentos leves.'}),
  modeloCompanheiroV82_({id:'dragao_trombeta_domesticado',nome:'Dragão Trombeta domesticado',icone:'🐉',categoria:'Criatura',especie:'Dragão Trombeta',tamanho:'Grande',pvMax:28,movimento:8,capacidadeCargaKg:120,montaria:true,combatente:true,controlavel:true,robotico:false,vendavel:true,preco:3000,nivelAcesso:'Comum',habilidadesTexto:'Montaria; corrida; ataque natural. Treinamento e vínculo narrativo obrigatórios.',descricao:'Um Dragão Trombeta domesticado e vinculado a um personagem. Não representa animais alugados ou montarias temporárias.'})
];}

async function carregarCompanheirosBancoV82_(){
    if(userData?.role!=='mestre'){companheirosDBV82_=[];return companheirosDBV82_;}
    try{const q=await getDocs(collection(db,COMPANHEIROS_COL_V82_));companheirosDBV82_=[];q.forEach(d=>companheirosDBV82_.push(modeloCompanheiroV82_({id:d.id,...d.data()})));companheirosDBV82_.sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));}
    catch(e){console.warn('Banco de companheiros indisponível:',e);companheirosDBV82_=[];}
    return companheirosDBV82_;
}

function instalarEstilosCompanheirosV82_(){
    if(document.getElementById('companheirosV82Styles'))return;
    const st=document.createElement('style');st.id='companheirosV82Styles';st.textContent=`
      #charCompanionsV82{margin:2px 0 11px;padding:8px 0 10px;border-bottom:1px solid rgba(255,255,255,.10)}
      #charCompanionsV82 .cv82-title{color:#8feaff;font-size:.69rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px}
      #charCompanionsV82 .cv82-link{width:100%;display:flex;gap:7px;align-items:center;text-align:left;padding:5px 6px;margin:2px 0;border:1px solid rgba(255,255,255,.09);border-radius:8px;background:rgba(255,255,255,.035);color:#d8e0ee;cursor:pointer}
      #charCompanionsV82 .cv82-link:hover{border-color:rgba(0,212,255,.45);background:rgba(0,212,255,.07)}
      #charCompanionsV82 .cv82-avatar{width:31px;height:31px;border-radius:7px;overflow:hidden;background:rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font-size:1.15rem;flex:0 0 31px}
      #charCompanionsV82 .cv82-avatar img{width:100%;height:100%;object-fit:cover}
      #charCompanionsV82 .cv82-copy{min-width:0;flex:1}.cv82-name{font-size:.78rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cv82-meta{font-size:.67rem;color:#8fa2b7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .cv82-badge{display:inline-flex;padding:2px 6px;border-radius:999px;background:rgba(0,212,255,.08);border:1px solid rgba(0,212,255,.18);font-size:.74rem;color:#bdefff;margin:2px 3px 2px 0}
      .cv82-modal-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:9px}.cv82-modal-grid label{display:flex;flex-direction:column;gap:4px;color:#cbd5e1;font-size:.85rem}
      .cv82-modal-grid input,.cv82-modal-grid select,.cv82-modal-grid textarea{width:100%;box-sizing:border-box}
      .cv82-model-card{display:grid;grid-template-columns:60px minmax(0,1fr) auto;gap:11px;align-items:center;padding:10px;margin:7px 0;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(255,255,255,.035)}
      .cv82-model-img{width:60px;height:60px;border-radius:9px;overflow:hidden;background:rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;font-size:1.8rem}.cv82-model-img img{width:100%;height:100%;object-fit:cover}
      .cv82-model-actions{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end}.cv82-model-card.off{opacity:.55}
      @media(max-width:900px){#charCompanionsV82{grid-column:1/-1;grid-row:5;display:flex;gap:5px;overflow-x:auto;border-bottom:0;padding:4px 0}.cv82-title{display:none!important}#charCompanionsV82 .cv82-link{min-width:155px;max-width:200px}.cv82-model-card{grid-template-columns:48px minmax(0,1fr)}.cv82-model-actions{grid-column:1/-1;justify-content:flex-start}}
    `;document.head.appendChild(st);
}

function garantirBancoCompanheirosV82_(){
    const banco=document.getElementById('banco');if(!banco)return;
    const tabs=banco.querySelector(':scope .form-section > .tabs');if(!tabs)return;
    if(!document.getElementById('tabBancoCompanheirosV82')){
      const b=document.createElement('button');b.id='tabBancoCompanheirosV82';b.className='tab-btn';b.textContent='Companheiros';b.onclick=()=>window.mostrarBancoAba('companheiros',b);
      const alvo=[...tabs.children].find(x=>/Criaturas/i.test(x.textContent||''));if(alvo)alvo.after(b);else tabs.appendChild(b);
    }
    if(!document.getElementById('banco-companheiros')){
      const pane=document.createElement('div');pane.id='banco-companheiros';pane.className='tab-content';pane.innerHTML=`
        <h4 style="color:#fff;margin-bottom:6px;">🐾 Banco de Companheiros</h4>
        <p style="color:#aaa;margin-bottom:13px;">Modelos reutilizáveis de animais, robôs, drones e outras entidades persistentes vinculáveis a um único personagem. Montarias temporárias não precisam ser cadastradas aqui.</p>
        <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px;align-items:center;">
          <button class="btn-small btn-select" onclick="novoCompanheiroBancoV82_()">➕ Novo modelo</button>
          <button class="btn-small" onclick="restaurarCompanheirosBasicosV82_()">🌱 Criar modelos básicos</button>
          <button class="btn-small" onclick="carregarCompanheirosBancoV82_().then(renderizarBancoCompanheirosV82_)">🔄 Atualizar lista</button>
          <input id="importCompanheirosV82" type="file" accept=".csv,text/csv" hidden onchange="importarCompanheirosCSVV82_(this)">
          <button class="btn-small" onclick="document.getElementById('importCompanheirosV82').click()">📥 Importar/Atualizar CSV</button>
          <button class="btn-small" onclick="exportarCompanheirosCSVV82_()">📤 Exportar CSV</button>
          <button class="btn-small" onclick="baixarTemplateCompanheirosV82_()">📄 Template CSV</button>
        </div><div id="listaBancoCompanheirosV82"></div>`;
      const ref=document.getElementById('banco-criaturas');if(ref)ref.after(pane);else banco.querySelector('.form-section')?.appendChild(pane);
    }
}

function renderizarBancoCompanheirosV82_(){
    const host=document.getElementById('listaBancoCompanheirosV82');if(!host)return;
    if(!companheirosDBV82_.length){host.innerHTML='<p style="color:#999;padding:12px 0;">Nenhum modelo cadastrado. Use “Criar modelos básicos” ou adicione um novo.</p>';return;}
    host.innerHTML=companheirosDBV82_.map(m=>`<div class="cv82-model-card ${m.disponivelCampanha===false?'off':''}">
      <div class="cv82-model-img">${m.imagem?`<img src="${escV82_(m.imagem)}" alt="">`:escV82_(m.icone||'🐾')}</div>
      <div><b>${escV82_(m.nome)}</b><div style="color:#9fb4cd;font-size:.82rem;margin-top:3px;">${escV82_([m.categoria,m.especie,m.tamanho].filter(Boolean).join(' · '))}</div><div style="margin-top:4px;">${m.montaria?'<span class="cv82-badge">Montaria</span>':''}${m.combatente?'<span class="cv82-badge">Combatente</span>':'<span class="cv82-badge">Não combatente</span>'}${m.robotico?'<span class="cv82-badge">Robótico</span>':''}${m.vendavel?`<span class="cv82-badge">Vendável · ${Math.round(m.preco||0)} rec.</span>`:''}</div></div>
      <div class="cv82-model-actions"><button class="btn-small" onclick="editarCompanheiroBancoV82_('${escV82_(m.id)}')">Editar</button><button class="btn-small btn-select" onclick="abrirVincularCompanheiroV82_('${escV82_(m.id)}')">🔗 Vincular</button><button class="btn-small btn-delete" onclick="removerCompanheiroBancoV82_('${escV82_(m.id)}')">Remover</button></div></div>`).join('');
}

async function abrirBancoCompanheirosV82_(){await carregarCompanheirosBancoV82_();renderizarBancoCompanheirosV82_();}
const mostrarBancoAbaV82Base_=window.mostrarBancoAba;
window.mostrarBancoAba=function(abaId,btn){garantirBancoCompanheirosV82_();const r=mostrarBancoAbaV82Base_.apply(this,arguments);if(abaId==='companheiros')abrirBancoCompanheirosV82_();return r;};

function garantirModalModeloCompanheiroV82_(){
    let modal=document.getElementById('modalCompanheiroBancoV82');if(modal)return modal;
    modal=document.createElement('div');modal.id='modalCompanheiroBancoV82';modal.className='modal-overlay';modal.innerHTML=`<div class="modal-content" style="max-width:1000px;"><span class="close" onclick="fecharCompanheiroBancoV82_()">&times;</span><h3 id="tituloCompanheiroBancoV82">🐾 Modelo de companheiro</h3><input id="cv82Orig" type="hidden">
      <div class="cv82-modal-grid">
        <label>ID<input id="cv82Id" placeholder="lobo_companheiro"></label><label>Nome<input id="cv82Nome"></label><label>Ícone<input id="cv82Icone" value="🐾"></label>
        <label>Categoria<select id="cv82Categoria"><option>Animal</option><option>Robô</option><option>Drone</option><option>Criatura</option><option>Outro</option></select></label><label>Espécie / modelo<input id="cv82Especie"></label><label>Tamanho<input id="cv82Tamanho" placeholder="Pequeno, Médio..."></label>
        <label>PV máximo<input id="cv82Pv" type="number" min="0" step="1" value="1"></label><label>Movimento (m)<input id="cv82Mov" type="number" min="0" step="0.5" value="0"></label><label>Carga máxima (kg)<input id="cv82Carga" type="number" min="0" step="0.5" value="0"></label>
        <label>Energia máxima<input id="cv82Energia" type="number" min="0" step="1" value="0"></label><label>Preço<input id="cv82Preco" type="number" min="0" step="1" value="0"></label><label>Acesso<select id="cv82Acesso"><option>Comum</option><option>Restrito</option><option>Militar</option><option>Proibido</option></select></label>
      </div>
      <div style="display:flex;gap:13px;flex-wrap:wrap;margin:11px 0;"><label><input id="cv82Montaria" type="checkbox"> Montaria</label><label><input id="cv82Combatente" type="checkbox"> Combatente</label><label><input id="cv82Controlavel" type="checkbox" checked> Controlável</label><label><input id="cv82Robotico" type="checkbox"> Robótico</label><label><input id="cv82Vendavel" type="checkbox"> Vendável</label><label><input id="cv82Disponivel" type="checkbox" checked> Disponível na campanha</label></div>
      <div class="cv82-modal-grid"><label style="grid-column:1/-1">Habilidades / capacidades<textarea id="cv82Habilidades" rows="3"></textarea></label><label style="grid-column:1/-1">Descrição<textarea id="cv82Descricao" rows="4"></textarea></label><label style="grid-column:1/-1">Imagem por URL<input id="cv82Imagem" type="url" placeholder="https://..."></label><label>Ou enviar imagem<input id="cv82ImagemFile" type="file" accept="image/*" onchange="companheiroLerImagemV82_(event)"></label><div style="display:flex;justify-content:center;align-items:center"><img id="cv82Preview" alt="Prévia" style="width:96px;height:96px;object-fit:contain;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12)"></div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;"><button class="btn-save" onclick="salvarCompanheiroBancoV82_()">💾 Salvar modelo</button><button class="btn-small" onclick="fecharCompanheiroBancoV82_()">Cancelar</button></div></div>`;document.body.appendChild(modal);return modal;
}
function campoV82_(id,v){const e=document.getElementById(id);if(e)e.value=v??'';}function checkV82_(id,v){const e=document.getElementById(id);if(e)e.checked=!!v;}
function preencherModalModeloV82_(m=null){garantirModalModeloCompanheiroV82_();campoV82_('cv82Orig',m?.id||'');campoV82_('cv82Id',m?.id||'');campoV82_('cv82Nome',m?.nome||'');campoV82_('cv82Icone',m?.icone||'🐾');campoV82_('cv82Categoria',m?.categoria||'Animal');campoV82_('cv82Especie',m?.especie||'');campoV82_('cv82Tamanho',m?.tamanho||'');campoV82_('cv82Pv',m?.pvMax??1);campoV82_('cv82Mov',m?.movimento??0);campoV82_('cv82Carga',m?.capacidadeCargaKg??0);campoV82_('cv82Energia',m?.energiaMax??0);campoV82_('cv82Preco',m?.preco??0);campoV82_('cv82Acesso',m?.nivelAcesso||'Comum');campoV82_('cv82Habilidades',m?.habilidadesTexto||'');campoV82_('cv82Descricao',m?.descricao||'');campoV82_('cv82Imagem',m?.imagem||'');checkV82_('cv82Montaria',m?.montaria);checkV82_('cv82Combatente',m?.combatente);checkV82_('cv82Controlavel',m?.controlavel!==false);checkV82_('cv82Robotico',m?.robotico);checkV82_('cv82Vendavel',m?.vendavel);checkV82_('cv82Disponivel',m?.disponivelCampanha!==false);const p=document.getElementById('cv82Preview');if(p)p.src=m?.imagem||'';document.getElementById('tituloCompanheiroBancoV82').textContent=m?`🐾 Editar — ${m.nome}`:'🐾 Novo modelo de companheiro';}
window.novoCompanheiroBancoV82_=()=>{preencherModalModeloV82_(null);document.getElementById('modalCompanheiroBancoV82').classList.add('active');};
window.editarCompanheiroBancoV82_=id=>{const m=companheirosDBV82_.find(x=>String(x.id)===String(id));if(!m)return;preencherModalModeloV82_(m);document.getElementById('modalCompanheiroBancoV82').classList.add('active');};
window.fecharCompanheiroBancoV82_=()=>document.getElementById('modalCompanheiroBancoV82')?.classList.remove('active');
window.companheiroLerImagemV82_=function(ev){const f=ev?.target?.files?.[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{const im=new Image();im.onload=()=>{const max=360,sc=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*sc));c.height=Math.max(1,Math.round(im.height*sc));c.getContext('2d').drawImage(im,0,0,c.width,c.height);let data='';try{data=c.toDataURL('image/webp',.82);}catch(_){data=c.toDataURL('image/png');}campoV82_('cv82Imagem',data);const p=document.getElementById('cv82Preview');if(p)p.src=data;};im.src=rd.result;};rd.readAsDataURL(f);};
window.salvarCompanheiroBancoV82_=async function(){
    if(userData?.role!=='mestre')return;const v=id=>String(document.getElementById(id)?.value||'').trim(),orig=v('cv82Orig'),id=v('cv82Id')||slugV82_(v('cv82Nome'));if(!id||!v('cv82Nome'))return notificar_('Informe ID e nome.','aviso');
    const m=modeloCompanheiroV82_({id,nome:v('cv82Nome'),icone:v('cv82Icone'),categoria:v('cv82Categoria'),especie:v('cv82Especie'),tamanho:v('cv82Tamanho'),pvMax:v('cv82Pv'),movimento:v('cv82Mov'),capacidadeCargaKg:v('cv82Carga'),energiaMax:v('cv82Energia'),preco:v('cv82Preco'),nivelAcesso:v('cv82Acesso'),habilidadesTexto:v('cv82Habilidades'),descricao:v('cv82Descricao'),imagem:v('cv82Imagem'),montaria:document.getElementById('cv82Montaria')?.checked,combatente:document.getElementById('cv82Combatente')?.checked,controlavel:document.getElementById('cv82Controlavel')?.checked,robotico:document.getElementById('cv82Robotico')?.checked,vendavel:document.getElementById('cv82Vendavel')?.checked,disponivelCampanha:document.getElementById('cv82Disponivel')?.checked});
    try{if(orig&&orig!==id)await deleteDoc(doc(db,COMPANHEIROS_COL_V82_,orig));await setDoc(doc(db,COMPANHEIROS_COL_V82_,id),m);await carregarCompanheirosBancoV82_();renderizarBancoCompanheirosV82_();fecharCompanheiroBancoV82_();notificar_('Modelo de companheiro salvo.','info');}catch(e){console.error(e);notificar_('Não foi possível salvar o modelo.','erro');}
};
window.removerCompanheiroBancoV82_=async id=>{if(userData?.role!=='mestre'||!confirm('Remover este modelo do banco? Instâncias já vinculadas às fichas continuarão existindo.'))return;try{await deleteDoc(doc(db,COMPANHEIROS_COL_V82_,id));companheirosDBV82_=companheirosDBV82_.filter(x=>x.id!==id);renderizarBancoCompanheirosV82_();}catch(e){console.error(e);notificar_('Não foi possível remover o modelo.','erro');}};
window.restaurarCompanheirosBasicosV82_=async()=>{if(userData?.role!=='mestre')return;try{for(const m of defaultsCompanheirosV82_())await setDoc(doc(db,COMPANHEIROS_COL_V82_,m.id),m,{merge:true});await carregarCompanheirosBancoV82_();renderizarBancoCompanheirosV82_();notificar_('Modelos básicos criados/atualizados.','info');}catch(e){console.error(e);notificar_('Não foi possível criar os modelos básicos.','erro');}};

function garantirModalVincularCompanheiroV82_(){
    let m=document.getElementById('modalVincularCompanheiroV82');if(m)return m;m=document.createElement('div');m.id='modalVincularCompanheiroV82';m.className='modal-overlay';m.innerHTML=`<div class="modal-content" style="max-width:650px;"><span class="close" onclick="document.getElementById('modalVincularCompanheiroV82').classList.remove('active')">&times;</span><h3>🔗 Vincular companheiro</h3><input id="cv82VincModelo" type="hidden"><div class="cv82-modal-grid"><label>Personagem<select id="cv82VincChar"></select></label><label>Nome individual<input id="cv82VincNome"></label><label style="grid-column:1/-1">Observação inicial<textarea id="cv82VincObs" rows="3"></textarea></label></div><small style="display:block;color:#9fb4cd;margin:8px 0;">Isto cria uma instância persistente na ficha escolhida. O modelo do banco não é alterado.</small><button class="btn-save" onclick="confirmarVinculoCompanheiroV82_()">🔗 Vincular à ficha</button></div>`;document.body.appendChild(m);return m;
}
window.abrirVincularCompanheiroV82_=function(id){if(userData?.role!=='mestre')return;const mod=companheirosDBV82_.find(x=>String(x.id)===String(id));if(!mod)return;garantirModalVincularCompanheiroV82_();campoV82_('cv82VincModelo',id);campoV82_('cv82VincNome',mod.nome);campoV82_('cv82VincObs','');const sel=document.getElementById('cv82VincChar');const chars=(userCharacters||[]).filter(c=>String(c.tipo||'pc').toLowerCase()!=='npc');sel.innerHTML=chars.map(c=>`<option value="${escV82_(c.id)}">${escV82_(c.nome||'Sem nome')}${c.dono===currentUserUid?' · PM':' · PJ'}</option>`).join('');document.getElementById('modalVincularCompanheiroV82').classList.add('active');};
window.confirmarVinculoCompanheiroV82_=async function(){
    if(userData?.role!=='mestre')return;const mid=String(document.getElementById('cv82VincModelo')?.value||''),cid=String(document.getElementById('cv82VincChar')?.value||''),mod=companheirosDBV82_.find(x=>String(x.id)===mid),char=(userCharacters||[]).find(c=>String(c.id)===cid);if(!mod||!char)return notificar_('Escolha um modelo e personagem válidos.','aviso');
    const inst={instanciaId:`comp_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,modeloId:mod.id,nomeIndividual:String(document.getElementById('cv82VincNome')?.value||mod.nome).trim()||mod.nome,estado:'Saudável',pvAtual:mod.pvMax,pvMax:mod.pvMax,energiaAtual:mod.energiaMax,energiaMax:mod.energiaMax,observacoes:String(document.getElementById('cv82VincObs')?.value||'').trim(),vinculadoEm:new Date().toISOString(),modelo:JSON.parse(JSON.stringify(mod))};
    const arr=Array.isArray(char.companheiros)?[...char.companheiros]:[];arr.push(inst);char.companheiros=arr;try{await setDoc(doc(db,'personagens',char.id),{companheiros:arr},{merge:true});document.getElementById('modalVincularCompanheiroV82').classList.remove('active');renderizarVinculosPersonagemV82_();notificar_(`${inst.nomeIndividual} foi vinculado a ${char.nome||'personagem'}.`,'info',3500);}catch(e){console.error(e);notificar_('Não foi possível criar o vínculo.','erro');}
};

function companheiroModelInstV82_(inst){return modeloCompanheiroV82_({...(inst?.modelo||{}),id:inst?.modeloId||inst?.modelo?.id||''});}
function montarVinculosPersonagemV82_(){
    instalarEstilosCompanheirosV82_();const aside=document.getElementById('charContextV66');if(!aside)return;let box=document.getElementById('charCompanionsV82');if(!box){box=document.createElement('div');box.id='charCompanionsV82';const tabs=aside.querySelector('.char-tabs.char-tabs-v67'),sw=aside.querySelector('.context-switch');if(tabs)aside.insertBefore(box,tabs);else if(sw)aside.insertBefore(box,sw);else aside.appendChild(box);}renderizarVinculosPersonagemV82_();
}
function renderizarVinculosPersonagemV82_(){
    const box=document.getElementById('charCompanionsV82'),c=typeof personagemAtualV66_==='function'?personagemAtualV66_():null;if(!box)return;const arr=Array.isArray(c?.companheiros)?c.companheiros:[];if(!c||!arr.length){box.style.display='none';box.innerHTML='';return;}box.style.display='block';box.innerHTML=`<div class="cv82-title">Vínculos / Companheiros</div>${arr.map(inst=>{const m=companheiroModelInstV82_(inst),pv=Number.isFinite(Number(inst.pvAtual))&&Number(m.pvMax)>0?`PV ${Math.max(0,Number(inst.pvAtual))}/${m.pvMax}`:'';return `<button class="cv82-link" onclick="abrirFichaCompanheiroV82_('${escV82_(inst.instanciaId)}')"><span class="cv82-avatar">${m.imagem?`<img src="${escV82_(m.imagem)}" alt="">`:escV82_(m.icone||'🐾')}</span><span class="cv82-copy"><span class="cv82-name">${escV82_(inst.nomeIndividual||m.nome)}</span><span class="cv82-meta">${escV82_([m.categoria,pv,inst.estado].filter(Boolean).join(' · '))}</span></span></button>`;}).join('')}`;
}
function garantirModalFichaCompanheiroV82_(){let m=document.getElementById('modalFichaCompanheiroV82');if(m)return m;m=document.createElement('div');m.id='modalFichaCompanheiroV82';m.className='modal-overlay';m.innerHTML='<div class="modal-content" style="max-width:850px;"><span class="close" onclick="document.getElementById(\'modalFichaCompanheiroV82\').classList.remove(\'active\')">&times;</span><div id="conteudoFichaCompanheiroV82"></div></div>';document.body.appendChild(m);return m;}
window.abrirFichaCompanheiroV82_=function(instId){const c=typeof personagemAtualV66_==='function'?personagemAtualV66_():null,arr=Array.isArray(c?.companheiros)?c.companheiros:[],inst=arr.find(x=>String(x.instanciaId)===String(instId));if(!c||!inst)return;const m=companheiroModelInstV82_(inst),editable=userData?.role==='mestre'||String(c.dono)===String(currentUserUid);garantirModalFichaCompanheiroV82_();const host=document.getElementById('conteudoFichaCompanheiroV82');const badges=[m.montaria?'Montaria':'',m.combatente?'Combatente':'Não combatente',m.controlavel?'Controlável':'',m.robotico?'Robótico':''].filter(Boolean).map(x=>`<span class="cv82-badge">${x}</span>`).join('');host.innerHTML=`<div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:12px;"><div class="cv82-model-img" style="width:92px;height:92px;flex:0 0 92px;">${m.imagem?`<img src="${escV82_(m.imagem)}" alt="">`:escV82_(m.icone||'🐾')}</div><div><h3 style="margin:0 0 5px;">${escV82_(inst.nomeIndividual||m.nome)}</h3><div style="color:#9fb4cd;">${escV82_([m.nome!==inst.nomeIndividual?m.nome:'',m.especie,m.categoria].filter(Boolean).join(' · '))}</div><div style="margin-top:6px;">${badges}</div></div></div><div class="cv82-modal-grid"><label>Nome individual<input id="cv82InstNome" value="${escV82_(inst.nomeIndividual||m.nome)}" ${editable?'':'disabled'}></label><label>Estado<input id="cv82InstEstado" value="${escV82_(inst.estado||'Saudável')}" ${editable?'':'disabled'}></label>${m.pvMax>0?`<label>PV atual<input id="cv82InstPV" type="number" min="0" max="${m.pvMax}" value="${Math.max(0,numV82_(inst.pvAtual,m.pvMax))}" ${editable?'':'disabled'}></label>`:''}${m.robotico&&m.energiaMax>0?`<label>Energia atual<input id="cv82InstEnergia" type="number" min="0" max="${m.energiaMax}" value="${Math.max(0,numV82_(inst.energiaAtual,m.energiaMax))}" ${editable?'':'disabled'}></label>`:''}</div><div style="margin:10px 0;color:#c8d2df;line-height:1.5;">${m.tamanho?`<b>Tamanho:</b> ${escV82_(m.tamanho)} · `:''}${m.movimento?`<b>Movimento:</b> ${escV82_(m.movimento)} m · `:''}${m.capacidadeCargaKg?`<b>Carga:</b> ${escV82_(m.capacidadeCargaKg)} kg`:''}</div>${m.habilidadesTexto?`<div style="margin:9px 0;"><b>Capacidades</b><div style="color:#aeb6c9;margin-top:3px;white-space:pre-wrap;">${escV82_(m.habilidadesTexto)}</div></div>`:''}${m.descricao?`<div style="margin:9px 0;"><b>Descrição</b><div style="color:#aeb6c9;margin-top:3px;">${escV82_(m.descricao)}</div></div>`:''}<label style="display:block;margin-top:9px;">Observações<textarea id="cv82InstObs" rows="4" ${editable?'':'disabled'}>${escV82_(inst.observacoes||'')}</textarea></label><div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:12px;">${editable?`<button class="btn-save" onclick="salvarFichaCompanheiroV82_('${escV82_(instId)}')">💾 Salvar</button>`:''}${userData?.role==='mestre'?`<button class="btn-small" onclick="restaurarCompanheiroV82_('${escV82_(instId)}')">❤️ Restaurar</button><button class="btn-small btn-delete" onclick="desvincularCompanheiroV82_('${escV82_(instId)}')">Desvincular</button>`:''}</div>`;document.getElementById('modalFichaCompanheiroV82').classList.add('active');};
function instanciaCompanheiroAtualV82_(id){const c=typeof personagemAtualV66_==='function'?personagemAtualV66_():null,arr=Array.isArray(c?.companheiros)?c.companheiros:[];return {c,arr,ix:arr.findIndex(x=>String(x.instanciaId)===String(id))};}
window.salvarFichaCompanheiroV82_=async function(id){const {c,arr,ix}=instanciaCompanheiroAtualV82_(id);if(!c||ix<0)return;if(userData?.role!=='mestre'&&String(c.dono)!==String(currentUserUid))return;const inst={...arr[ix]},m=companheiroModelInstV82_(inst);inst.nomeIndividual=String(document.getElementById('cv82InstNome')?.value||inst.nomeIndividual||m.nome).trim();inst.estado=String(document.getElementById('cv82InstEstado')?.value||inst.estado||'Saudável').trim();if(m.pvMax>0)inst.pvAtual=Math.max(0,Math.min(m.pvMax,numV82_(document.getElementById('cv82InstPV')?.value,inst.pvAtual)));if(m.robotico&&m.energiaMax>0)inst.energiaAtual=Math.max(0,Math.min(m.energiaMax,numV82_(document.getElementById('cv82InstEnergia')?.value,inst.energiaAtual)));inst.observacoes=String(document.getElementById('cv82InstObs')?.value||'').trim();arr[ix]=inst;c.companheiros=arr;try{await setDoc(doc(db,'personagens',c.id),{companheiros:arr},{merge:true});renderizarVinculosPersonagemV82_();document.getElementById('modalFichaCompanheiroV82').classList.remove('active');notificar_('Companheiro atualizado.','info');}catch(e){console.error(e);notificar_('Não foi possível salvar o companheiro.','erro');}};
window.restaurarCompanheiroV82_=async id=>{const {c,arr,ix}=instanciaCompanheiroAtualV82_(id);if(!c||ix<0||userData?.role!=='mestre')return;const inst={...arr[ix]},m=companheiroModelInstV82_(inst);inst.pvAtual=m.pvMax;inst.energiaAtual=m.energiaMax;inst.estado='Saudável';arr[ix]=inst;c.companheiros=arr;await setDoc(doc(db,'personagens',c.id),{companheiros:arr},{merge:true});renderizarVinculosPersonagemV82_();abrirFichaCompanheiroV82_(id);};
window.desvincularCompanheiroV82_=async id=>{const {c,arr,ix}=instanciaCompanheiroAtualV82_(id);if(!c||ix<0||userData?.role!=='mestre'||!confirm('Desvincular este companheiro da ficha?'))return;arr.splice(ix,1);c.companheiros=arr;await setDoc(doc(db,'personagens',c.id),{companheiros:arr},{merge:true});document.getElementById('modalFichaCompanheiroV82').classList.remove('active');renderizarVinculosPersonagemV82_();};

function csvCompV82_(v){return escaparCSV_(v);}
window.exportarCompanheirosCSVV82_=function(){if(userData?.role!=='mestre')return;if(!companheirosDBV82_.length)return notificar_('Banco de companheiros vazio.','aviso');const linhas=[COMPANHEIROS_CSV_V82_.join(';'),...companheirosDBV82_.map(m=>COMPANHEIROS_CSV_V82_.map(k=>csvCompV82_(m[k])).join(';'))];const blob=new Blob(['\uFEFF'+linhas.join('\r\n')],{type:'text/csv;charset=utf-8'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=`banco_companheiros_${new Date().toISOString().slice(0,10)}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);};
window.baixarTemplateCompanheirosV82_=function(){const ex=defaultsCompanheirosV82_()[0],linhas=[COMPANHEIROS_CSV_V82_.join(';'),COMPANHEIROS_CSV_V82_.map(k=>csvCompV82_(ex[k])).join(';')],blob=new Blob(['\uFEFF'+linhas.join('\r\n')],{type:'text/csv;charset=utf-8'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='template_companheiros.csv';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(u);};
window.importarCompanheirosCSVV82_=function(input){if(userData?.role!=='mestre')return;const file=input?.files?.[0];if(!file)return;Papa.parse(file,{header:true,skipEmptyLines:true,delimiter:'',transformHeader:h=>String(h||'').trim(),complete:async res=>{try{let n=0;for(const bruto of res.data||[]){if(!String(bruto.nome||'').trim())continue;const id=String(bruto.id||slugV82_(bruto.nome)).trim(),ant=companheirosDBV82_.find(x=>String(x.id)===id),m=modeloCompanheiroV82_({...ant,...bruto,id});if(!String(bruto.imagem||'').trim()&&ant?.imagem)m.imagem=ant.imagem;await setDoc(doc(db,COMPANHEIROS_COL_V82_,id),m,{merge:true});n++;}await carregarCompanheirosBancoV82_();renderizarBancoCompanheirosV82_();notificar_(`${n} modelo(s) importados/atualizados.`,'info');}catch(e){console.error(e);notificar_('Falha ao importar companheiros.','erro');}finally{input.value='';}},error:e=>{console.error(e);notificar_('Não foi possível ler o CSV.','erro');input.value='';}});};

function iniciarCompanheirosV82_(){instalarEstilosCompanheirosV82_();garantirBancoCompanheirosV82_();try{if(typeof montarWorkspaceFichaV66_==='function')montarWorkspaceFichaV66_();}catch(_){}montarVinculosPersonagemV82_();}
if(typeof window.addEventListener==='function')window.addEventListener('personagem-selecionado',()=>setTimeout(()=>{montarVinculosPersonagemV82_();renderizarVinculosPersonagemV82_();},0));
if(typeof window.mostrarAba==='function'){const mostrarAbaV82Base_=window.mostrarAba;window.mostrarAba=function(){const r=mostrarAbaV82Base_.apply(this,arguments);if(arguments[0]==='ficha')setTimeout(iniciarCompanheirosV82_,0);return r;};}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciarCompanheirosV82_);else iniciarCompanheirosV82_();setTimeout(iniciarCompanheirosV82_,350);}
console.info('[Mesa Estelar] v82 entidades vinculadas / companheiros carregados');
window.__MESA_PATCH__='v82-companheiros';

// ============================================================================
// v83 · correções do Banco de Companheiros + fundação de Veículos
// ============================================================================
let companheiroCharsV83_=[];
async function carregarPersonagensV83_(){
  try{
    const snap=await getDocs(collection(db,'personagens')),arr=[];
    snap.forEach(d=>arr.push({id:d.id,...d.data()}));
    arr.sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR',{sensitivity:'base'}));
    return arr;
  }catch(e){console.warn('v83 carregar personagens',e);return [...(userCharacters||[])];}
}
function nomeDuplicadoV83_(nome,lista){
  const base=String(nome||'Cópia').replace(/\s+\(cópia(?: \d+)?\)$/i,'').trim()||'Cópia';
  let n=1,c=`${base} (cópia)`;const nomes=new Set((lista||[]).map(x=>String(x.nome||'').toLowerCase()));
  while(nomes.has(c.toLowerCase())){n++;c=`${base} (cópia ${n})`;}
  return c;
}
window.duplicarCompanheiroBancoV83_=function(id){
  const m=companheirosDBV82_.find(x=>String(x.id)===String(id));if(!m)return;
  const copia=JSON.parse(JSON.stringify(m));copia.id='';copia.nome=nomeDuplicadoV83_(m.nome,companheirosDBV82_);
  preencherModalModeloV82_(copia);campoV82_('cv82Orig','');campoV82_('cv82Id',slugV82_(copia.nome));
  document.getElementById('tituloCompanheiroBancoV82').textContent=`🐾 Duplicar — ${m.nome}`;
  document.getElementById('modalCompanheiroBancoV82').classList.add('active');
};
function instalarEventosBancoCompV83_(){
  const host=document.getElementById('listaBancoCompanheirosV82');if(!host||host.dataset.v83Events)return;host.dataset.v83Events='1';
  host.addEventListener('click',ev=>{const b=ev.target.closest('button[data-cv83-action]');if(!b)return;ev.preventDefault();ev.stopPropagation();const id=b.dataset.id||'';const a=b.dataset.cv83Action;
    if(a==='edit')window.editarCompanheiroBancoV82_(id);else if(a==='duplicate')window.duplicarCompanheiroBancoV83_(id);else if(a==='link')window.abrirVincularCompanheiroV82_(id);else if(a==='remove')window.removerCompanheiroBancoV82_(id);
  });
}
renderizarBancoCompanheirosV82_=function(){
  const host=document.getElementById('listaBancoCompanheirosV82');if(!host)return;instalarEventosBancoCompV83_();
  if(!companheirosDBV82_.length){host.innerHTML='<p style="color:#999;padding:12px 0;">Nenhum modelo cadastrado. Use “Criar modelos básicos” ou adicione um novo.</p>';return;}
  host.innerHTML=companheirosDBV82_.map(m=>`<div class="cv82-model-card ${m.disponivelCampanha===false?'off':''}">
    <div class="cv82-model-img">${m.imagem?`<img src="${escV82_(m.imagem)}" alt="">`:escV82_(m.icone||'🐾')}</div>
    <div><b>${escV82_(m.nome)}</b><div style="color:#9fb4cd;font-size:.82rem;margin-top:3px;">${escV82_([m.categoria,m.especie,m.tamanho].filter(Boolean).join(' · '))}</div><div style="margin-top:4px;">${m.montaria?'<span class="cv82-badge">Montaria</span>':''}${m.combatente?'<span class="cv82-badge">Combatente</span>':'<span class="cv82-badge">Não combatente</span>'}${m.robotico?'<span class="cv82-badge">Robótico</span>':''}${m.vendavel?`<span class="cv82-badge">Vendável · ${Math.round(m.preco||0)} rec.</span>`:''}</div></div>
    <div class="cv82-model-actions"><button type="button" class="btn-small" data-cv83-action="edit" data-id="${escV82_(m.id)}">✏️ Editar</button><button type="button" class="btn-small" data-cv83-action="duplicate" data-id="${escV82_(m.id)}">📑 Duplicar</button><button type="button" class="btn-small btn-select" data-cv83-action="link" data-id="${escV82_(m.id)}">🔗 Vincular</button><button type="button" class="btn-small btn-delete" data-cv83-action="remove" data-id="${escV82_(m.id)}">Remover</button></div></div>`).join('');
};
window.abrirVincularCompanheiroV82_=async function(id){
  if(userData?.role!=='mestre')return;const mod=companheirosDBV82_.find(x=>String(x.id)===String(id));if(!mod)return;
  garantirModalVincularCompanheiroV82_();campoV82_('cv82VincModelo',id);campoV82_('cv82VincNome',mod.nome);campoV82_('cv82VincObs','');
  const sel=document.getElementById('cv82VincChar');if(sel)sel.innerHTML='<option value="">Carregando personagens…</option>';
  companheiroCharsV83_=await carregarPersonagensV83_();const chars=companheiroCharsV83_.filter(c=>String(c.tipo||'pc').toLowerCase()!=='npc');
  if(sel)sel.innerHTML=chars.length?chars.map(c=>`<option value="${escV82_(c.id)}">${escV82_(c.nome||'Sem nome')}${c.dono===currentUserUid?' · PM':' · PJ'}</option>`).join(''):'<option value="">Nenhum personagem disponível</option>';
  document.getElementById('modalVincularCompanheiroV82').classList.add('active');
};
window.confirmarVinculoCompanheiroV82_=async function(){
  if(userData?.role!=='mestre')return;const mid=String(document.getElementById('cv82VincModelo')?.value||''),cid=String(document.getElementById('cv82VincChar')?.value||''),mod=companheirosDBV82_.find(x=>String(x.id)===mid),char=companheiroCharsV83_.find(c=>String(c.id)===cid)||(userCharacters||[]).find(c=>String(c.id)===cid);if(!mod||!char)return notificar_('Escolha um modelo e personagem válidos.','aviso');
  const inst={instanciaId:`comp_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,modeloId:mod.id,nomeIndividual:String(document.getElementById('cv82VincNome')?.value||mod.nome).trim()||mod.nome,estado:'Saudável',pvAtual:mod.pvMax,pvMax:mod.pvMax,energiaAtual:mod.energiaMax,energiaMax:mod.energiaMax,observacoes:String(document.getElementById('cv82VincObs')?.value||'').trim(),vinculadoEm:new Date().toISOString(),modelo:JSON.parse(JSON.stringify(mod))};
  const arr=Array.isArray(char.companheiros)?[...char.companheiros]:[];arr.push(inst);char.companheiros=arr;try{await setDoc(doc(db,'personagens',char.id),{companheiros:arr},{merge:true});const local=(userCharacters||[]).find(c=>String(c.id)===String(char.id));if(local)local.companheiros=arr;document.getElementById('modalVincularCompanheiroV82').classList.remove('active');renderizarVinculosPersonagemV82_();notificar_(`${inst.nomeIndividual} foi vinculado a ${char.nome||'personagem'}.`,'info',3500);}catch(e){console.error(e);notificar_('Não foi possível criar o vínculo.','erro');}
};

// ----- veículos -----
const VEICULOS_COL_V83_='veiculos',VEICULOS_POS_V83_='veiculosPossuidos';
let veiculosDBV83_=[],veiculosPossuidosV83_=[],veiculoCharsV83_=[];
const VEICULOS_CSV_V83_=['id','nome','icone','categoria','tamanho','estruturaMax','blindagem','movimento','capacidadeCargaKg','passageiros','energiaMax','combustivelMax','vendavel','preco','nivelAcesso','disponivelCampanha','descricao','imagem'];
function boolV83_(v,d=false){if(v===true||v===false)return v;if(v==null||v==='')return d;return /^(true|1|sim|yes)$/i.test(String(v).trim());}
function numV83_(v,d=0){const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:d;}
function slugV83_(s){return String(s||'veiculo').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80)||`veiculo_${Date.now()}`;}
function modeloVeiculoV83_(v={}){return {id:String(v.id||slugV83_(v.nome)),nome:String(v.nome||'Veículo'),icone:String(v.icone||'🚙'),categoria:String(v.categoria||'Terrestre'),tamanho:String(v.tamanho||'Médio'),estruturaMax:Math.max(0,numV83_(v.estruturaMax,20)),blindagem:Math.max(0,numV83_(v.blindagem,0)),movimento:Math.max(0,numV83_(v.movimento,10)),capacidadeCargaKg:Math.max(0,numV83_(v.capacidadeCargaKg,0)),passageiros:Math.max(1,Math.round(numV83_(v.passageiros,1))),energiaMax:Math.max(0,numV83_(v.energiaMax,0)),combustivelMax:Math.max(0,numV83_(v.combustivelMax,0)),vendavel:boolV83_(v.vendavel,false),preco:Math.max(0,numV83_(v.preco,0)),nivelAcesso:String(v.nivelAcesso||'Comum'),disponivelCampanha:boolV83_(v.disponivelCampanha,true),descricao:String(v.descricao||''),imagem:String(v.imagem||'')};}
function defaultsVeiculosV83_(){return [
  modeloVeiculoV83_({id:'moto_gravitica_leve',nome:'Moto gravítica leve',icone:'🏍️',categoria:'Terrestre/Gravítica',tamanho:'Médio',estruturaMax:16,blindagem:1,movimento:18,capacidadeCargaKg:35,passageiros:2,energiaMax:40,vendavel:true,preco:6800,nivelAcesso:'Comum',descricao:'Veículo pessoal rápido para deslocamentos urbanos e terrenos relativamente abertos.'}),
  modeloVeiculoV83_({id:'rover_exploracao',nome:'Rover de exploração',icone:'🚙',categoria:'Terrestre',tamanho:'Grande',estruturaMax:40,blindagem:4,movimento:12,capacidadeCargaKg:300,passageiros:6,energiaMax:80,vendavel:true,preco:18500,nivelAcesso:'Comum',descricao:'Rover fechado para viagens, exploração e transporte de uma pequena equipe.'}),
  modeloVeiculoV83_({id:'caminhao_carga_calico',nome:'Caminhão de carga de Calico',icone:'🚚',categoria:'Terrestre',tamanho:'Enorme',estruturaMax:70,blindagem:5,movimento:9,capacidadeCargaKg:2200,passageiros:3,combustivelMax:100,vendavel:true,preco:32000,nivelAcesso:'Comum',descricao:'Veículo pesado de carga, comum em caravanas e operações de mineração.'})
];}
async function carregarVeiculosV83_(){try{const s=await getDocs(collection(db,VEICULOS_COL_V83_));veiculosDBV83_=[];s.forEach(d=>veiculosDBV83_.push(modeloVeiculoV83_({id:d.id,...d.data()})));veiculosDBV83_.sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));}catch(e){console.warn('veiculos banco',e);veiculosDBV83_=[];}return veiculosDBV83_;}
async function carregarVeiculosPossuidosV83_(){try{const s=await getDocs(collection(db,VEICULOS_POS_V83_));veiculosPossuidosV83_=[];s.forEach(d=>veiculosPossuidosV83_.push({id:d.id,...d.data()}));}catch(e){console.warn('veiculos possuidos',e);veiculosPossuidosV83_=[];}renderizarVeiculosPersonagemV83_();return veiculosPossuidosV83_;}
function garantirBancoVeiculosV83_(){const banco=document.getElementById('banco');if(!banco)return;const tabs=banco.querySelector(':scope .form-section > .tabs');if(!tabs)return;if(!document.getElementById('tabBancoVeiculosV83')){const b=document.createElement('button');b.id='tabBancoVeiculosV83';b.className='tab-btn';b.textContent='Veículos';b.onclick=()=>window.mostrarBancoAba('veiculos',b);const alvo=document.getElementById('tabBancoCompanheirosV82');if(alvo)alvo.after(b);else tabs.appendChild(b);}if(!document.getElementById('banco-veiculos')){const p=document.createElement('div');p.id='banco-veiculos';p.className='tab-content';p.innerHTML=`<h4 style="color:#fff;margin-bottom:6px;">🚙 Banco de Veículos</h4><p style="color:#aaa;margin-bottom:13px;">Modelos reutilizáveis. Veículos possuídos são instâncias compartilháveis entre vários personagens e funções.</p><div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px;"><button class="btn-small btn-select" onclick="novoVeiculoV83_()">➕ Novo modelo</button><button class="btn-small" onclick="restaurarVeiculosBasicosV83_()">🌱 Criar modelos básicos</button><button class="btn-small" onclick="carregarVeiculosV83_().then(renderizarBancoVeiculosV83_)">🔄 Atualizar</button><input id="importVeiculosV83" type="file" accept=".csv,text/csv" hidden onchange="importarVeiculosCSVV83_(this)"><button class="btn-small" onclick="document.getElementById('importVeiculosV83').click()">📥 Importar/Atualizar CSV</button><button class="btn-small" onclick="exportarVeiculosCSVV83_()">📤 Exportar CSV</button></div><div id="listaBancoVeiculosV83"></div>`;const ref=document.getElementById('banco-companheiros');if(ref)ref.after(p);else banco.querySelector('.form-section')?.appendChild(p);}}
function renderizarBancoVeiculosV83_(){const h=document.getElementById('listaBancoVeiculosV83');if(!h)return;if(!veiculosDBV83_.length){h.innerHTML='<p style="color:#999">Nenhum veículo cadastrado.</p>';return;}h.innerHTML=veiculosDBV83_.map(v=>`<div class="cv82-model-card ${v.disponivelCampanha===false?'off':''}"><div class="cv82-model-img">${v.imagem?`<img src="${escV82_(v.imagem)}">`:escV82_(v.icone)}</div><div><b>${escV82_(v.nome)}</b><div style="color:#9fb4cd;font-size:.82rem">${escV82_(v.categoria)} · ${escV82_(v.tamanho)} · Estrutura ${v.estruturaMax} · Carga ${v.capacidadeCargaKg} kg</div>${v.vendavel?`<span class="cv82-badge">Vendável · ${Math.round(v.preco)} rec.</span>`:''}</div><div class="cv82-model-actions"><button class="btn-small" onclick="editarVeiculoV83_('${escV82_(v.id)}')">✏️ Editar</button><button class="btn-small" onclick="duplicarVeiculoV83_('${escV82_(v.id)}')">📑 Duplicar</button><button class="btn-small btn-select" onclick="abrirVincularVeiculoV83_('${escV82_(v.id)}')">🔗 Vincular tripulação</button><button class="btn-small btn-delete" onclick="removerVeiculoV83_('${escV82_(v.id)}')">Remover</button></div></div>`).join('');}
function garantirModalVeiculoV83_(){let m=document.getElementById('modalVeiculoV83');if(m)return m;m=document.createElement('div');m.id='modalVeiculoV83';m.className='modal-overlay';m.innerHTML=`<div class="modal-content" style="max-width:1000px;"><span class="close" onclick="document.getElementById('modalVeiculoV83').classList.remove('active')">&times;</span><h3 id="v83Titulo">🚙 Modelo de veículo</h3><input id="v83Orig" type="hidden"><div class="cv82-modal-grid"><label>ID<input id="v83Id"></label><label>Nome<input id="v83Nome"></label><label>Ícone<input id="v83Icone"></label><label>Categoria<input id="v83Categoria"></label><label>Tamanho<input id="v83Tamanho"></label><label>Estrutura máxima<input id="v83Estrutura" type="number"></label><label>Blindagem<input id="v83Blindagem" type="number"></label><label>Movimento<input id="v83Movimento" type="number" step="0.5"></label><label>Carga máxima (kg)<input id="v83Carga" type="number" step="0.5"></label><label>Passageiros<input id="v83Passageiros" type="number"></label><label>Energia máxima<input id="v83Energia" type="number"></label><label>Combustível máximo<input id="v83Combustivel" type="number"></label><label>Preço<input id="v83Preco" type="number"></label><label>Acesso<select id="v83Acesso"><option>Comum</option><option>Restrito</option><option>Militar</option><option>Proibido</option></select></label><label style="grid-column:1/-1">Descrição<textarea id="v83Descricao" rows="4"></textarea></label><label style="grid-column:1/-1">Imagem por URL<input id="v83Imagem"></label><label>Enviar imagem<input id="v83ImagemFile" type="file" accept="image/*" onchange="veiculoLerImagemV83_(event)"></label><div><img id="v83Preview" style="width:96px;height:96px;object-fit:contain;background:rgba(255,255,255,.04);border-radius:9px"></div></div><div style="display:flex;gap:12px;margin:10px 0"><label><input id="v83Vendavel" type="checkbox"> Vendável</label><label><input id="v83Disponivel" type="checkbox" checked> Disponível na campanha</label></div><button class="btn-save" onclick="salvarVeiculoV83_()">💾 Salvar modelo</button></div>`;document.body.appendChild(m);return m;}
function vf83_(id,v){const e=document.getElementById(id);if(e)e.value=v??'';}function vc83_(id,v){const e=document.getElementById(id);if(e)e.checked=!!v;}
function preencherVeiculoV83_(v=null){garantirModalVeiculoV83_();vf83_('v83Orig',v?.id||'');vf83_('v83Id',v?.id||'');vf83_('v83Nome',v?.nome||'');vf83_('v83Icone',v?.icone||'🚙');vf83_('v83Categoria',v?.categoria||'Terrestre');vf83_('v83Tamanho',v?.tamanho||'Médio');vf83_('v83Estrutura',v?.estruturaMax??20);vf83_('v83Blindagem',v?.blindagem??0);vf83_('v83Movimento',v?.movimento??10);vf83_('v83Carga',v?.capacidadeCargaKg??0);vf83_('v83Passageiros',v?.passageiros??1);vf83_('v83Energia',v?.energiaMax??0);vf83_('v83Combustivel',v?.combustivelMax??0);vf83_('v83Preco',v?.preco??0);vf83_('v83Acesso',v?.nivelAcesso||'Comum');vf83_('v83Descricao',v?.descricao||'');vf83_('v83Imagem',v?.imagem||'');vc83_('v83Vendavel',v?.vendavel);vc83_('v83Disponivel',v?.disponivelCampanha!==false);const p=document.getElementById('v83Preview');if(p)p.src=v?.imagem||'';document.getElementById('v83Titulo').textContent=v?`🚙 Editar — ${v.nome}`:'🚙 Novo modelo de veículo';}
window.novoVeiculoV83_=()=>{preencherVeiculoV83_();document.getElementById('modalVeiculoV83').classList.add('active');};
window.editarVeiculoV83_=id=>{const v=veiculosDBV83_.find(x=>x.id===id);if(v){preencherVeiculoV83_(v);document.getElementById('modalVeiculoV83').classList.add('active');}};
window.duplicarVeiculoV83_=id=>{const v=veiculosDBV83_.find(x=>x.id===id);if(!v)return;const c=JSON.parse(JSON.stringify(v));c.id='';c.nome=nomeDuplicadoV83_(v.nome,veiculosDBV83_);preencherVeiculoV83_(c);vf83_('v83Orig','');vf83_('v83Id',slugV83_(c.nome));document.getElementById('modalVeiculoV83').classList.add('active');};
window.veiculoLerImagemV83_=ev=>{const f=ev?.target?.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const max=480,sc=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*sc);c.height=Math.round(im.height*sc);c.getContext('2d').drawImage(im,0,0,c.width,c.height);const data=c.toDataURL('image/webp',.82);vf83_('v83Imagem',data);document.getElementById('v83Preview').src=data;};im.src=r.result;};r.readAsDataURL(f);};
window.salvarVeiculoV83_=async()=>{if(userData?.role!=='mestre')return;const val=id=>String(document.getElementById(id)?.value||'').trim(),orig=val('v83Orig'),id=val('v83Id')||slugV83_(val('v83Nome'));if(!id||!val('v83Nome'))return notificar_('Informe ID e nome.','aviso');const v=modeloVeiculoV83_({id,nome:val('v83Nome'),icone:val('v83Icone'),categoria:val('v83Categoria'),tamanho:val('v83Tamanho'),estruturaMax:val('v83Estrutura'),blindagem:val('v83Blindagem'),movimento:val('v83Movimento'),capacidadeCargaKg:val('v83Carga'),passageiros:val('v83Passageiros'),energiaMax:val('v83Energia'),combustivelMax:val('v83Combustivel'),preco:val('v83Preco'),nivelAcesso:val('v83Acesso'),descricao:val('v83Descricao'),imagem:val('v83Imagem'),vendavel:document.getElementById('v83Vendavel')?.checked,disponivelCampanha:document.getElementById('v83Disponivel')?.checked});try{if(orig&&orig!==id)await deleteDoc(doc(db,VEICULOS_COL_V83_,orig));await setDoc(doc(db,VEICULOS_COL_V83_,id),v);await carregarVeiculosV83_();renderizarBancoVeiculosV83_();document.getElementById('modalVeiculoV83').classList.remove('active');notificar_('Modelo de veículo salvo.','info');}catch(e){console.error(e);notificar_('Não foi possível salvar o veículo.','erro');}};
window.removerVeiculoV83_=async id=>{if(userData?.role!=='mestre'||!confirm('Remover este modelo? Veículos já possuídos continuarão existindo.'))return;await deleteDoc(doc(db,VEICULOS_COL_V83_,id));await carregarVeiculosV83_();renderizarBancoVeiculosV83_();};
window.restaurarVeiculosBasicosV83_=async()=>{if(userData?.role!=='mestre')return;for(const v of defaultsVeiculosV83_())await setDoc(doc(db,VEICULOS_COL_V83_,v.id),v,{merge:true});await carregarVeiculosV83_();renderizarBancoVeiculosV83_();notificar_('Modelos básicos de veículos criados/atualizados.','info');};
function csvV83_(v){return escaparCSV_(v);}window.exportarVeiculosCSVV83_=()=>{if(!veiculosDBV83_.length)return;const l=[VEICULOS_CSV_V83_.join(';'),...veiculosDBV83_.map(v=>VEICULOS_CSV_V83_.map(k=>csvV83_(v[k])).join(';'))],b=new Blob(['\uFEFF'+l.join('\r\n')],{type:'text/csv;charset=utf-8'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=`banco_veiculos_${new Date().toISOString().slice(0,10)}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
window.importarVeiculosCSVV83_=input=>{const f=input?.files?.[0];if(!f)return;Papa.parse(f,{header:true,skipEmptyLines:true,delimiter:'',complete:async r=>{for(const raw of r.data||[]){if(!String(raw.nome||'').trim())continue;const v=modeloVeiculoV83_(raw);await setDoc(doc(db,VEICULOS_COL_V83_,v.id),v,{merge:true});}await carregarVeiculosV83_();renderizarBancoVeiculosV83_();input.value='';notificar_('Veículos importados/atualizados.','info');}});};
function garantirModalVincVeiculoV83_(){let m=document.getElementById('modalVincVeiculoV83');if(m)return m;m=document.createElement('div');m.id='modalVincVeiculoV83';m.className='modal-overlay';m.innerHTML=`<div class="modal-content" style="max-width:800px"><span class="close" onclick="this.closest('.modal-overlay').classList.remove('active')">&times;</span><h3>🔗 Vincular veículo e tripulação</h3><input id="v83VincModelo" type="hidden"><label>Nome individual<input id="v83VincNome"></label><div id="v83Crew" style="margin:12px 0"></div><small style="color:#9fb4cd">Um mesmo veículo pode ficar associado a vários personagens em funções diferentes.</small><div style="margin-top:12px"><button class="btn-save" onclick="confirmarVinculoVeiculoV83_()">🔗 Criar veículo possuído</button></div></div>`;document.body.appendChild(m);return m;}
window.abrirVincularVeiculoV83_=async id=>{if(userData?.role!=='mestre')return;const v=veiculosDBV83_.find(x=>x.id===id);if(!v)return;garantirModalVincVeiculoV83_();vf83_('v83VincModelo',id);vf83_('v83VincNome',v.nome);veiculoCharsV83_=await carregarPersonagensV83_();const chars=veiculoCharsV83_.filter(c=>String(c.tipo||'pc').toLowerCase()!=='npc'),h=document.getElementById('v83Crew');h.innerHTML=chars.map(c=>`<div style="display:grid;grid-template-columns:auto 1fr 180px;gap:8px;align-items:center;margin:5px 0"><input type="checkbox" class="v83CrewCheck" data-id="${escV82_(c.id)}"><span>${escV82_(c.nome||'Sem nome')}</span><select class="v83CrewRole" data-id="${escV82_(c.id)}"><option>Dono</option><option>Motorista</option><option>Artilheiro</option><option>Mecânico</option><option>Tripulante</option><option>Passageiro</option></select></div>`).join('');document.getElementById('modalVincVeiculoV83').classList.add('active');};
window.confirmarVinculoVeiculoV83_=async()=>{const mid=String(document.getElementById('v83VincModelo')?.value||''),m=veiculosDBV83_.find(x=>x.id===mid);if(!m)return;const vinculos=[...document.querySelectorAll('.v83CrewCheck:checked')].map(c=>({personagemId:c.dataset.id,papel:document.querySelector(`.v83CrewRole[data-id="${CSS.escape(c.dataset.id)}"]`)?.value||'Tripulante'}));if(!vinculos.length)return notificar_('Selecione ao menos um personagem.','aviso');const id=`veh_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,inst={id,modeloId:m.id,nomeIndividual:String(document.getElementById('v83VincNome')?.value||m.nome).trim()||m.nome,modelo:JSON.parse(JSON.stringify(m)),estruturaAtual:m.estruturaMax,energiaAtual:m.energiaMax,combustivelAtual:m.combustivelMax,estado:'Operacional',vinculos,cargaItens:[],criadoEm:new Date().toISOString()};await setDoc(doc(db,VEICULOS_POS_V83_,id),inst);document.getElementById('modalVincVeiculoV83').classList.remove('active');await carregarVeiculosPossuidosV83_();notificar_(`${inst.nomeIndividual} vinculado à tripulação.`,'info');};
function montarVeiculosPersonagemV83_(){const aside=document.getElementById('charContextV66');if(!aside)return;let b=document.getElementById('charVehiclesV83');if(!b){b=document.createElement('div');b.id='charVehiclesV83';b.style.cssText='margin:0 0 10px;padding:7px 0 10px;border-bottom:1px solid rgba(255,255,255,.1)';const tabs=aside.querySelector('.char-tabs.char-tabs-v67');if(tabs)aside.insertBefore(b,tabs);else aside.appendChild(b);}renderizarVeiculosPersonagemV83_();}
function renderizarVeiculosPersonagemV83_(){const b=document.getElementById('charVehiclesV83'),c=typeof personagemAtualV66_==='function'?personagemAtualV66_():null;if(!b)return;const arr=c?veiculosPossuidosV83_.filter(v=>(v.vinculos||[]).some(x=>String(x.personagemId)===String(c.id))):[];if(!arr.length){b.style.display='none';b.innerHTML='';return;}b.style.display='block';b.innerHTML='<div class="cv82-title">Veículos</div>'+arr.map(v=>{const papel=(v.vinculos||[]).find(x=>String(x.personagemId)===String(c.id))?.papel||'Tripulante',m=modeloVeiculoV83_(v.modelo||{});return `<button class="cv82-link" onclick="abrirVeiculoPossuidoV83_('${escV82_(v.id)}')"><span class="cv82-avatar">${m.imagem?`<img src="${escV82_(m.imagem)}">`:escV82_(m.icone)}</span><span class="cv82-copy"><span class="cv82-name">${escV82_(v.nomeIndividual||m.nome)}</span><span class="cv82-meta">${escV82_(papel)} · Estrutura ${v.estruturaAtual}/${m.estruturaMax}</span></span></button>`;}).join('');}
window.abrirVeiculoPossuidoV83_=id=>{const v=veiculosPossuidosV83_.find(x=>x.id===id);if(!v)return;let m=document.getElementById('modalVeiculoPossuidoV83');if(!m){m=document.createElement('div');m.id='modalVeiculoPossuidoV83';m.className='modal-overlay';m.innerHTML='<div class="modal-content" style="max-width:850px"><span class="close" onclick="this.closest(\'.modal-overlay\').classList.remove(\'active\')">&times;</span><div id="v83OwnedBody"></div></div>';document.body.appendChild(m);}const mo=modeloVeiculoV83_(v.modelo||{}),chars=new Map(veiculoCharsV83_.map(c=>[String(c.id),c.nome]));document.getElementById('v83OwnedBody').innerHTML=`<h3>${escV82_(mo.icone)} ${escV82_(v.nomeIndividual||mo.nome)}</h3><div style="color:#9fb4cd">${escV82_(mo.categoria)} · ${escV82_(mo.tamanho)} · ${escV82_(v.estado||'Operacional')}</div><p><b>Estrutura:</b> ${v.estruturaAtual}/${mo.estruturaMax} · <b>Blindagem:</b> ${mo.blindagem} · <b>Movimento:</b> ${mo.movimento} · <b>Carga:</b> ${mo.capacidadeCargaKg} kg</p><h4>Tripulação vinculada</h4><ul>${(v.vinculos||[]).map(x=>`<li>${escV82_(chars.get(String(x.personagemId))||x.personagemId)} — ${escV82_(x.papel)}</li>`).join('')}</ul><p style="color:#9fb4cd">Inventário/carga compartilhada está reservado para a próxima camada de veículos e naves.</p>${userData?.role==='mestre'?`<button class="btn-small btn-delete" onclick="removerVeiculoPossuidoV83_('${escV82_(id)}')">Desvincular/excluir veículo possuído</button>`:''}`;m.classList.add('active');};
window.removerVeiculoPossuidoV83_=async id=>{if(userData?.role!=='mestre'||!confirm('Excluir esta instância de veículo?'))return;await deleteDoc(doc(db,VEICULOS_POS_V83_,id));document.getElementById('modalVeiculoPossuidoV83')?.classList.remove('active');await carregarVeiculosPossuidosV83_();};
const mostrarBancoAbaV83Base_=window.mostrarBancoAba;window.mostrarBancoAba=function(abaId,btn){garantirBancoVeiculosV83_();const r=mostrarBancoAbaV83Base_.apply(this,arguments);if(abaId==='veiculos')carregarVeiculosV83_().then(renderizarBancoVeiculosV83_);return r;};
function iniciarV83_(){garantirBancoVeiculosV83_();montarVeiculosPersonagemV83_();carregarVeiculosPossuidosV83_();}
if(typeof window.addEventListener==='function')window.addEventListener('personagem-selecionado',()=>setTimeout(()=>{montarVeiculosPersonagemV83_();renderizarVeiculosPersonagemV83_();},0));
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(iniciarV83_,500));else setTimeout(iniciarV83_,500);}
console.info('[Mesa Estelar] v83 companheiros corrigidos + fundação de veículos carregada');
window.__MESA_PATCH__='v83-veiculos';

// ============================================================================
// v84 · modais corrigidos + carga compartilhada de veículos
// ============================================================================
function garantirOverlaysV84_(){
  ['modalCompanheiroBancoV82','modalVincularCompanheiroV82','modalFichaCompanheiroV82','modalVeiculoV83','modalVincVeiculoV83','modalVeiculoPossuidoV83'].forEach(id=>{
    const el=document.getElementById(id);if(!el)return;
    if(el.classList.contains('modal'))el.classList.remove('modal');
    el.classList.add('modal-overlay');
  });
}

// Re-render explícito: evita manter os cartões antigos da v82 e registra eventos reais.
renderizarBancoCompanheirosV82_=function(){
  const host=document.getElementById('listaBancoCompanheirosV82');if(!host)return;
  if(!companheirosDBV82_.length){host.innerHTML='<p style="color:#999;padding:12px 0;">Nenhum modelo cadastrado. Use “Criar modelos básicos” ou adicione um novo.</p>';return;}
  host.innerHTML=companheirosDBV82_.map(m=>`<div class="cv82-model-card ${m.disponivelCampanha===false?'off':''}">
    <div class="cv82-model-img">${m.imagem?`<img src="${escV82_(m.imagem)}" alt="">`:escV82_(m.icone||'🐾')}</div>
    <div><b>${escV82_(m.nome)}</b><div style="color:#9fb4cd;font-size:.82rem;margin-top:3px;">${escV82_([m.categoria,m.especie,m.tamanho].filter(Boolean).join(' · '))}</div><div style="margin-top:4px;">${m.montaria?'<span class="cv82-badge">Montaria</span>':''}${m.combatente?'<span class="cv82-badge">Combatente</span>':'<span class="cv82-badge">Não combatente</span>'}${m.robotico?'<span class="cv82-badge">Robótico</span>':''}${m.vendavel?`<span class="cv82-badge">Vendável · ${Math.round(m.preco||0)} rec.</span>`:''}</div></div>
    <div class="cv82-model-actions"><button type="button" class="btn-small" data-cv84="edit" data-id="${escV82_(m.id)}">✏️ Editar</button><button type="button" class="btn-small" data-cv84="duplicate" data-id="${escV82_(m.id)}">📑 Duplicar</button><button type="button" class="btn-small btn-select" data-cv84="link" data-id="${escV82_(m.id)}">🔗 Vincular</button><button type="button" class="btn-small btn-delete" data-cv84="remove" data-id="${escV82_(m.id)}">Remover</button></div></div>`).join('');
  host.querySelectorAll('button[data-cv84]').forEach(btn=>btn.addEventListener('click',ev=>{
    ev.preventDefault();ev.stopPropagation();const id=btn.dataset.id||'',a=btn.dataset.cv84;
    if(a==='edit')window.editarCompanheiroBancoV82_(id);
    else if(a==='duplicate')window.duplicarCompanheiroBancoV83_(id);
    else if(a==='link')window.abrirVincularCompanheiroV82_(id);
    else if(a==='remove')window.removerCompanheiroBancoV82_(id);
    setTimeout(garantirOverlaysV84_,0);
  }));
};

function charAtualV84_(){
  try{if(typeof personagemAtualV66_==='function')return personagemAtualV66_();}catch(_){}
  try{if(typeof obterPersonagemAtual_==='function')return obterPersonagemAtual_();}catch(_){}
  return (userCharacters||[]).find(c=>String(c.id)===String(currentCharId))||null;
}
function vinculoVeiculoCharV84_(v,c){return !!(v&&c&&(v.vinculos||[]).some(x=>String(x.personagemId)===String(c.id)));}
function pesoCargoV84_(v){return (Array.isArray(v?.cargaItens)?v.cargaItens:[]).reduce((s,i)=>s+Math.max(0,Number(i?.peso||0)),0);}
function nomeItemV84_(i){try{return getNome(i);}catch(_){return String(i?.nome||i?.nome_en||i?.idBanco||'Item');}}
function imgItemV84_(i){const b=(itensDB||[]).find(x=>String(x.id)===String(i?.idBanco||i?.id));return String(i?.imagem||b?.imagem||'');}
function opcoesPessoaisVeiculoV84_(c){
  if(!c)return[];const inv=normalizarInventario_(c),out=[];
  for(const comp of ['equipado','bolso','mochila'])for(let ix=0;ix<(inv[comp]||[]).length;ix++){const item=inv[comp][ix];if(item)out.push({comp,ix,item});}
  return out;
}
function usuariosPermitidosVeiculoV84_(v,chars){
  const mapa=new Map((chars||[]).map(c=>[String(c.id),c]));
  return [...new Set((v?.vinculos||[]).map(x=>String(x.usuarioUid||mapa.get(String(x.personagemId))?.dono||'')).filter(Boolean))];
}
async function migrarPermissoesVeiculoV84_(v){
  if(userData?.role!=='mestre'||!v)return v;
  if(!veiculoCharsV83_.length)veiculoCharsV83_=await carregarPersonagensV83_();
  const uids=usuariosPermitidosVeiculoV84_(v,veiculoCharsV83_);
  const vinculos=(v.vinculos||[]).map(x=>{const c=veiculoCharsV83_.find(k=>String(k.id)===String(x.personagemId));return {...x,personagemNome:x.personagemNome||c?.nome||'',usuarioUid:x.usuarioUid||c?.dono||''};});
  const mudou=JSON.stringify(uids)!==JSON.stringify(v.usuariosPermitidos||[])||JSON.stringify(vinculos)!==JSON.stringify(v.vinculos||[]);
  if(mudou){v.usuariosPermitidos=uids;v.vinculos=vinculos;await setDoc(doc(db,VEICULOS_POS_V83_,v.id),{usuariosPermitidos:uids,vinculos},{merge:true});}
  return v;
}

// Criação de veículo possuído inclui os UIDs dos jogadores vinculados.
window.confirmarVinculoVeiculoV83_=async()=>{
  const mid=String(document.getElementById('v83VincModelo')?.value||''),m=veiculosDBV83_.find(x=>x.id===mid);if(!m)return;
  if(!veiculoCharsV83_.length)veiculoCharsV83_=await carregarPersonagensV83_();
  const charMap=new Map(veiculoCharsV83_.map(c=>[String(c.id),c]));
  const vinculos=[...document.querySelectorAll('.v83CrewCheck:checked')].map(c=>{const ch=charMap.get(String(c.dataset.id));return {personagemId:c.dataset.id,personagemNome:ch?.nome||'',usuarioUid:ch?.dono||'',papel:document.querySelector(`.v83CrewRole[data-id="${CSS.escape(c.dataset.id)}"]`)?.value||'Tripulante'};});
  if(!vinculos.length)return notificar_('Selecione ao menos um personagem.','aviso');
  const id=`veh_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,inst={id,modeloId:m.id,nomeIndividual:String(document.getElementById('v83VincNome')?.value||m.nome).trim()||m.nome,modelo:JSON.parse(JSON.stringify(m)),estruturaAtual:m.estruturaMax,energiaAtual:m.energiaMax,combustivelAtual:m.combustivelMax,estado:'Operacional',vinculos,usuariosPermitidos:[...new Set(vinculos.map(x=>x.usuarioUid).filter(Boolean))],cargaItens:[],criadoEm:new Date().toISOString(),atualizadoEm:new Date().toISOString()};
  await setDoc(doc(db,VEICULOS_POS_V83_,id),inst);document.getElementById('modalVincVeiculoV83')?.classList.remove('active');await carregarVeiculosPossuidosV83_();notificar_(`${inst.nomeIndividual} vinculado à tripulação.`,'info');
};

async function salvarTransferenciaVeiculoV84_(v,c,cargo,inv){
  const batch=writeBatch(db),agora=new Date().toISOString();
  batch.set(doc(db,VEICULOS_POS_V83_,v.id),{cargaItens:cargo,atualizadoEm:agora},{merge:true});
  batch.set(doc(db,'personagens',c.id),{inventario:inv},{merge:true});
  await batch.commit();v.cargaItens=cargo;c.inventario=inv;
  const local=(userCharacters||[]).find(x=>String(x.id)===String(c.id));if(local)local.inventario=inv;
  try{renderizarInventario(c);}catch(_){}
}
window.guardarNoVeiculoV84_=async id=>{
  const v=veiculosPossuidosV83_.find(x=>String(x.id)===String(id)),c=charAtualV84_();if(!v||!c||!vinculoVeiculoCharV84_(v,c))return notificar_('Selecione um personagem vinculado a este veículo.','aviso');
  const val=String(document.getElementById('v84ItemPessoal')?.value||''),[comp,ixs]=val.split(':'),ix=Number(ixs),inv=normalizarInventario_(c),item=inv?.[comp]?.[ix];if(!item)return notificar_('Selecione um item para guardar.','aviso');
  const cargo=[...(v.cargaItens||[])],cap=Number(v.modelo?.capacidadeCargaKg||0),novoPeso=pesoCargoV84_({...v,cargaItens:[...cargo,item]});
  if(cap>0&&novoPeso>cap+1e-9)return notificar_(`A carga excederia ${cap} kg.`,'aviso');
  inv[comp][ix]=null;cargo.push(item);
  try{await salvarTransferenciaVeiculoV84_(v,c,cargo,inv);notificar_(`${nomeItemV84_(item)} guardado no veículo.`,'info');window.abrirVeiculoPossuidoV83_(id);}catch(e){console.error(e);notificar_('Não foi possível guardar o item.','erro');}
};
window.retirarDoVeiculoV84_=async(id,index)=>{
  const v=veiculosPossuidosV83_.find(x=>String(x.id)===String(id)),c=charAtualV84_();if(!v||!c||!vinculoVeiculoCharV84_(v,c))return notificar_('Selecione um personagem vinculado a este veículo.','aviso');
  const cargo=[...(v.cargaItens||[])],item=cargo[index];if(!item)return;const inv=normalizarInventario_(c),slot=inv.mochila.findIndex(x=>!x);if(slot<0)return notificar_('A mochila está cheia.','aviso');
  cargo.splice(index,1);inv.mochila[slot]=item;
  try{await salvarTransferenciaVeiculoV84_(v,c,cargo,inv);notificar_(`${nomeItemV84_(item)} retirado para a mochila.`,'info');window.abrirVeiculoPossuidoV83_(id);}catch(e){console.error(e);notificar_('Não foi possível retirar o item.','erro');}
};

window.abrirVeiculoPossuidoV83_=async id=>{
  let v=veiculosPossuidosV83_.find(x=>String(x.id)===String(id));if(!v)return;try{v=await migrarPermissoesVeiculoV84_(v);}catch(e){console.warn('migração veículo v84',e);}
  let modal=document.getElementById('modalVeiculoPossuidoV83');if(!modal){modal=document.createElement('div');modal.id='modalVeiculoPossuidoV83';modal.className='modal-overlay';modal.innerHTML='<div class="modal-content" style="max-width:950px"><span class="close" onclick="this.closest(\'.modal-overlay\').classList.remove(\'active\')">&times;</span><div id="v83OwnedBody"></div></div>';document.body.appendChild(modal);}garantirOverlaysV84_();
  const mo=modeloVeiculoV83_(v.modelo||{}),c=charAtualV84_(),ligado=vinculoVeiculoCharV84_(v,c),chars=new Map((veiculoCharsV83_||[]).map(c=>[String(c.id),c.nome]));
  const cargo=Array.isArray(v.cargaItens)?v.cargaItens:[],peso=pesoCargoV84_(v),cap=Number(mo.capacidadeCargaKg||0),pessoais=ligado?opcoesPessoaisVeiculoV84_(c):[];
  document.getElementById('v83OwnedBody').innerHTML=`<h3>${escV82_(mo.icone)} ${escV82_(v.nomeIndividual||mo.nome)}</h3><div style="color:#9fb4cd">${escV82_(mo.categoria)} · ${escV82_(mo.tamanho)} · ${escV82_(v.estado||'Operacional')}</div><p><b>Estrutura:</b> ${v.estruturaAtual}/${mo.estruturaMax} · <b>Blindagem:</b> ${mo.blindagem} · <b>Movimento:</b> ${mo.movimento}</p><h4>Tripulação vinculada</h4><ul>${(v.vinculos||[]).map(x=>`<li>${escV82_(x.personagemNome||chars.get(String(x.personagemId))||x.personagemId)} — ${escV82_(x.papel)}</li>`).join('')}</ul>
    <section style="margin-top:16px;padding:12px;border:1px solid rgba(0,212,255,.22);border-radius:10px;background:rgba(0,212,255,.035)"><h4 style="margin:0 0 4px;color:#8feaff">📦 Carga compartilhada do veículo</h4><div style="color:#9fb4cd;margin-bottom:9px">${peso.toFixed(1)}${cap>0?` / ${cap.toFixed(1)}`:''} kg · visível para toda a tripulação vinculada</div>${cargo.length?`<div style="display:grid;gap:6px">${cargo.map((i,ix)=>`<div style="display:grid;grid-template-columns:42px minmax(0,1fr) auto;gap:8px;align-items:center;padding:7px;border-radius:8px;background:rgba(255,255,255,.04)">${imgItemV84_(i)?`<img src="${escV82_(imgItemV84_(i))}" style="width:40px;height:40px;object-fit:contain;border-radius:6px">`:'<div style="font-size:1.4rem;text-align:center">📦</div>'}<div><b>${escV82_(nomeItemV84_(i))}</b><div style="font-size:.78rem;color:#9fb4cd">${Math.max(0,Number(i.peso||0)).toFixed(1)} kg</div></div>${ligado?`<button type="button" class="btn-small" onclick="retirarDoVeiculoV84_('${escV82_(id)}',${ix})">← Mochila</button>`:''}</div>`).join('')}</div>`:'<div style="color:#8796aa">Nenhum item guardado.</div>'}${ligado?`<div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:10px"><select id="v84ItemPessoal" style="min-width:260px"><option value="">— item pessoal —</option>${pessoais.map(r=>`<option value="${r.comp}:${r.ix}">${escV82_(nomeItemV84_(r.item))} · ${r.comp}</option>`).join('')}</select><button type="button" class="btn-small btn-select" onclick="guardarNoVeiculoV84_('${escV82_(id)}')">→ Guardar no veículo</button></div>`:'<div style="color:#ffbd7a;margin-top:8px">Selecione uma ficha vinculada a este veículo para movimentar a carga.</div>'}</section>${userData?.role==='mestre'?`<button class="btn-small btn-delete" style="margin-top:14px" onclick="removerVeiculoPossuidoV83_('${escV82_(id)}')">Desvincular/excluir veículo possuído</button>`:''}`;
  modal.classList.add('active');
};

// O inventário pessoal deixa de exibir o antigo compartimento híbrido Veículo/Nave.
// Os dados antigos permanecem intactos para compatibilidade/migração futura.
function ajustarInventarioEntidadesV84_(){
  const slots=document.getElementById('inv-veiculo'),box=slots?.closest('.inventory-compartment');if(box)box.style.display='none';
  document.querySelectorAll('option[value="veiculo"]').forEach(o=>o.hidden=true);
}

// Reforça o ciclo de abertura das abas e corrige elementos antigos já criados na página.
const mostrarBancoAbaV84Base_=window.mostrarBancoAba;
window.mostrarBancoAba=function(abaId,btn){const r=mostrarBancoAbaV84Base_.apply(this,arguments);setTimeout(()=>{garantirOverlaysV84_();if(abaId==='companheiros'){renderizarBancoCompanheirosV82_();}if(abaId==='veiculos'){renderizarBancoVeiculosV83_();}},0);return r;};
function iniciarV84_(){garantirOverlaysV84_();ajustarInventarioEntidadesV84_();const h=document.getElementById('listaBancoCompanheirosV82');if(h&&companheirosDBV82_.length)renderizarBancoCompanheirosV82_();}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(iniciarV84_,200));else setTimeout(iniciarV84_,200);}
if(typeof window.addEventListener==='function')window.addEventListener('personagem-selecionado',()=>setTimeout(ajustarInventarioEntidadesV84_,0));
console.info('[Mesa Estelar] v84 modais corrigidos + carga compartilhada de veículos carregada');
window.__MESA_PATCH__='v84-veiculo-carga';

// ============================================================================
// v85 · UX de vínculos + inventário compartilhado de veículo na aba Inventário
// ============================================================================
let veiculosPossuidosUnsubV85_=null;
let veiculoInventarioSelecionadoV85_='';
const veiculoReconciliandoV85_=new Set();

function donoUidPersonagemV85_(c){
  if(!c)return'';
  const candidatos=[c.dono,c.donoUid,c.uid,c.userUid,c.usuarioUid,c.ownerUid,c.ownerId,c.criadoPor];
  const achou=candidatos.find(v=>v!==undefined&&v!==null&&String(v).trim()!=='');
  return achou==null?'':String(achou);
}
function garantirEstilosEntidadesV85_(){
  if(document.getElementById('entidadesV85Styles'))return;
  const st=document.createElement('style');st.id='entidadesV85Styles';st.textContent=`
    /* Companheiros, veículos e futuras naves usam a mesma linguagem visual lateral. */
    #charCompanionsV82 .cv82-link,#charVehiclesV83 .cv82-link,#charShipsV86 .cv82-link{width:100%;display:flex;gap:7px;align-items:flex-start;text-align:left;padding:6px;margin:3px 0;border:1px solid rgba(255,255,255,.10);border-radius:8px;background:rgba(255,255,255,.035);color:#d8e0ee;cursor:pointer;box-sizing:border-box;min-width:0;overflow:hidden}
    #charCompanionsV82 .cv82-link:hover,#charVehiclesV83 .cv82-link:hover,#charShipsV86 .cv82-link:hover{border-color:rgba(0,212,255,.45);background:rgba(0,212,255,.07)}
    #charCompanionsV82 .cv82-avatar,#charVehiclesV83 .cv82-avatar,#charShipsV86 .cv82-avatar{width:31px;height:31px;border-radius:7px;overflow:hidden;background:rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font-size:1.15rem;flex:0 0 31px}
    #charCompanionsV82 .cv82-avatar img,#charVehiclesV83 .cv82-avatar img,#charShipsV86 .cv82-avatar img{width:100%;height:100%;object-fit:cover}
    #charCompanionsV82 .cv82-copy,#charVehiclesV83 .cv82-copy,#charShipsV86 .cv82-copy{min-width:0;flex:1;display:block;overflow:hidden}
    #charCompanionsV82 .cv82-name,#charVehiclesV83 .cv82-name,#charShipsV86 .cv82-name{display:block;font-size:.78rem;font-weight:700;white-space:normal;overflow-wrap:anywhere;word-break:break-word;line-height:1.2}
    #charCompanionsV82 .cv82-meta,#charVehiclesV83 .cv82-meta,#charShipsV86 .cv82-meta{display:block;font-size:.67rem;color:#8fa2b7;white-space:normal;overflow-wrap:anywhere;word-break:break-word;line-height:1.25;margin-top:2px}
    #charVehiclesV83{margin:0 0 10px;padding:7px 0 10px;border-bottom:1px solid rgba(255,255,255,.10);min-width:0;overflow:hidden}
    #charVehiclesV83 .cv82-title,#charShipsV86 .cv82-title{color:#8feaff;font-size:.69rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px}

    /* X evidente e sempre no canto superior direito dos modais de entidades. */
    .entity-modal-v85 .modal-content{position:relative}
    .entity-modal-v85 .close{position:sticky!important;top:8px!important;float:right!important;margin:0 0 8px 12px!important;width:36px!important;height:36px!important;display:flex!important;align-items:center!important;justify-content:center!important;border-radius:7px!important;background:#dc3545!important;color:#fff!important;border:1px solid rgba(255,255,255,.28)!important;box-shadow:0 3px 12px rgba(0,0,0,.32)!important;font-size:1.45rem!important;line-height:1!important;font-weight:900!important;opacity:1!important;z-index:20!important;cursor:pointer!important}
    .entity-modal-v85 .close:hover{background:#ef4453!important;transform:translateY(-1px)}

    #inventoryVehicleSharedV85,#inventoryShipSharedV85{min-width:0}
    #inventoryVehicleSelectV85,#inventoryShipSelectV85{background:rgba(24,27,48,.92);color:#e8edf7;border:1px solid rgba(0,212,255,.30);border-radius:8px;padding:8px 10px}
    #inventoryVehicleSharedV85 .inventory-slot{position:relative}
    #inventoryVehicleSharedV85 .inventory-slot.v85-shared{border-color:rgba(0,212,255,.22)}
    #inventoryVehicleSharedV85 .inventory-slot.v85-shared.drag-over{outline:2px solid #00d4ff;outline-offset:1px}
    #inventoryVehicleSharedV85 .v85-shared-badge{position:absolute;left:3px;bottom:3px;padding:1px 4px;border-radius:6px;background:rgba(0,0,0,.78);border:1px solid rgba(0,212,255,.45);color:#bdefff;font-size:.59rem;pointer-events:none}
    @media(max-width:900px){#charVehiclesV83{grid-column:1/-1;grid-row:6;display:flex;gap:5px;overflow-x:auto;border-bottom:0;padding:4px 0}#charVehiclesV83 .cv82-title{display:none!important}#charVehiclesV83 .cv82-link{min-width:155px;max-width:210px}}
  `;document.head.appendChild(st);
}
function aplicarUXModalEntidadeV85_(){
  ['modalCompanheiroBancoV82','modalVincularCompanheiroV82','modalFichaCompanheiroV82','modalVeiculoV83','modalVincVeiculoV83','modalVeiculoPossuidoV83','modalNaveV86','modalVincNaveV86','modalNavePossuidaV86'].forEach(id=>document.getElementById(id)?.classList.add('entity-modal-v85'));
}
function veiculosDoPersonagemV85_(c){
  if(!c)return[];
  return (veiculosPossuidosV83_||[]).filter(v=>(v.vinculos||[]).some(x=>String(x.personagemId)===String(c.id)));
}
function cargoVeiculoNormalizadoV85_(v,minSlots=50){
  const src=Array.isArray(v?.cargaItens)?v.cargaItens:[];
  const tamanho=Math.max(minSlots,src.length);
  const out=Array(tamanho).fill(null);
  for(let i=0;i<src.length;i++)out[i]=src[i]||null;
  return out;
}
function veiculoInventarioAtualV85_(c){
  const arr=veiculosDoPersonagemV85_(c);if(!arr.length)return null;
  let id=String(veiculoInventarioSelecionadoV85_||'');
  try{if(c?.id&&!id)id=localStorage.getItem(`mesa:v85:veiculo:${c.id}`)||'';}catch(_){ }
  let v=arr.find(x=>String(x.id)===id)||arr[0];
  veiculoInventarioSelecionadoV85_=String(v.id);
  try{if(c?.id)localStorage.setItem(`mesa:v85:veiculo:${c.id}`,String(v.id));}catch(_){ }
  return v;
}
window.selecionarVeiculoInventarioV85_=function(id){
  veiculoInventarioSelecionadoV85_=String(id||'');
  const c=charAtualV84_();try{if(c?.id)localStorage.setItem(`mesa:v85:veiculo:${c.id}`,veiculoInventarioSelecionadoV85_);}catch(_){ }
  renderizarCargaVeiculoInventarioV85_(c);
};
function tooltipItemCompartilhadoV85_(item){
  if(!item)return '<div class="item-tooltip"><h5>Vazio</h5><p>Arraste um item para cá.</p></div>';
  const nome=escaparHtmlInventario_(nomeItemV84_(item)),desc=escaparHtmlInventario_(getDescricao(item)||''),peso=Math.max(0,Number(item.peso||0));
  return `<div class="item-tooltip"><h5>${nome}</h5><p>${desc}</p><p>Peso: ${peso}kg | PA: ${Number(item.pa||0)} | PV: ${Number(item.pv||0)}</p><p style="color:#8feaff">Carga compartilhada do veículo</p></div>`;
}
function renderizarCargaVeiculoInventarioV85_(c){
  const box=document.getElementById('inventoryVehicleSharedV85'),host=document.getElementById('inv-veiculo'),capEl=document.getElementById('capacity-veiculo-v85'),sel=document.getElementById('inventoryVehicleSelectV85');
  if(!box||!host||!sel)return;
  const arr=veiculosDoPersonagemV85_(c);
  if(!c||!arr.length){box.style.display='none';host.innerHTML='';sel.innerHTML='';return;}
  box.style.display='block';
  const atual=veiculoInventarioAtualV85_(c);if(!atual)return;
  sel.innerHTML=arr.map(v=>{const m=modeloVeiculoV83_(v.modelo||{}),papel=(v.vinculos||[]).find(x=>String(x.personagemId)===String(c.id))?.papel||'Tripulante';return `<option value="${escV82_(v.id)}" ${String(v.id)===String(atual.id)?'selected':''}>${escV82_(v.nomeIndividual||m.nome)} · ${escV82_(m.categoria||'Veículo')} · ${escV82_(papel)}</option>`;}).join('');
  const cargo=cargoVeiculoNormalizadoV85_(atual,50),m=modeloVeiculoV83_(atual.modelo||{}),peso=pesoCargoV84_({...atual,cargaItens:cargo}),lim=Number(m.capacidadeCargaKg||0),usados=cargo.filter(Boolean).length;
  if(capEl){capEl.textContent=`${peso.toFixed(1)}${lim>0?` / ${lim.toFixed(1)}`:''} kg · ${usados}/${cargo.length} espaços · compartilhado com a tripulação`;capEl.style.color=lim>0&&peso>lim?'#ff6b6b':'';}
  host.innerHTML=cargo.map((item,i)=>{
    if(item){const nome=escaparHtmlInventario_(nomeItemV84_(item)),img=imgItemV84_(item)?`<img src="${escaparHtmlInventario_(imgItemV84_(item))}" alt="${nome}"${miniAttr_(item)}>`:miniaturaOuCaixa_(item,nome);return `<div class="inventory-slot filled v85-shared" draggable="true" ondragstart="iniciarArrastoVeiculoV85_(event,'${escV82_(atual.id)}',${i})" ondragend="finalizarArrastoInventario(event)" ondragover="permitirSoltarInventario(event)" ondrop="soltarInventarioVeiculoV85_(event,'${escV82_(atual.id)}',${i})">${img}<span class="v85-shared-badge">🚙</span>${tooltipItemCompartilhadoV85_(item)}</div>`;}
    return `<div class="inventory-slot v85-shared" ondragover="permitirSoltarInventario(event)" ondrop="soltarInventarioVeiculoV85_(event,'${escV82_(atual.id)}',${i})">${tooltipItemCompartilhadoV85_(null)}</div>`;
  }).join('');
}
window.iniciarArrastoVeiculoV85_=function(event,vehicleId,index){
  event.stopPropagation();event.dataTransfer.effectAllowed='move';const payload={entityType:'vehicle',vehicleId:String(vehicleId),index:Number(index)};event.dataTransfer.setData('application/json',JSON.stringify(payload));event.dataTransfer.setData('text/plain',`vehicle:${vehicleId}:${index}`);event.currentTarget?.classList.add('drag-source');
};
function lerArrastoV85_(event){try{const bruto=event?.dataTransfer?.getData('application/json');return bruto?JSON.parse(bruto):null;}catch(_){return null;}}
function pesoArrayItensV85_(arr){return (arr||[]).reduce((s,i)=>s+(i?Math.max(0,Number(i.peso||0)):0),0);}
async function salvarCargaVeiculoV85_(v,cargo){
  const agora=new Date().toISOString();await setDoc(doc(db,VEICULOS_POS_V83_,v.id),{cargaItens:cargo,atualizadoEm:agora},{merge:true});v.cargaItens=cargo;v.atualizadoEm=agora;
}
async function salvarCargaEInventarioV85_(v,cargo,c,inv){
  const agora=new Date().toISOString(),batch=writeBatch(db);batch.set(doc(db,VEICULOS_POS_V83_,v.id),{cargaItens:cargo,atualizadoEm:agora},{merge:true});batch.set(doc(db,'personagens',c.id),{inventario:inv},{merge:true});await batch.commit();v.cargaItens=cargo;v.atualizadoEm=agora;c.inventario=inv;const loc=(userCharacters||[]).find(x=>String(x.id)===String(c.id));if(loc)loc.inventario=inv;
}
window.soltarInventarioVeiculoV85_=async function(event,vehicleId,destinoIndex){
  event.preventDefault();event.stopPropagation();event.currentTarget?.classList.remove('drag-over');
  const origem=lerArrastoV85_(event),c=charAtualV84_(),v=(veiculosPossuidosV83_||[]).find(x=>String(x.id)===String(vehicleId));if(!origem||!c||!v||!vinculoVeiculoCharV84_(v,c))return;
  if(origem.entityType!=='vehicle'&&personagemEstaEmBatalha_(c))return notificar_('Em combate, a carga do veículo fica fora do inventário imediato.','aviso',4300);
  const cargo=cargoVeiculoNormalizadoV85_(v,50),di=Number(destinoIndex),itemDestino=cargo[di]||null;
  if(origem.entityType==='vehicle'){
    if(String(origem.vehicleId)!==String(v.id))return notificar_('Troca direta entre dois veículos ainda não está habilitada.','aviso');
    const oi=Number(origem.index);if(oi===di)return;const item=cargo[oi];if(!item)return;cargo[di]=item;cargo[oi]=itemDestino;
    try{await salvarCargaVeiculoV85_(v,cargo);renderizarCargaVeiculoInventarioV85_(c);}catch(e){console.error(e);notificar_('Não foi possível reorganizar a carga.','erro');}return;
  }
  const comp=String(origem.compartment||''),oi=Number(origem.index),inv=normalizarInventario_(c);if(!['equipado','bolso','mochila'].includes(comp)||!inv?.[comp])return;const item=inv[comp][oi];if(!item)return;
  const testeCargo=[...cargo];testeCargo[di]=item;testeCargo[oi===di&&false?oi:di]=item; // cópia explícita para cálculo
  const pesoDepois=pesoArrayItensV85_(testeCargo),lim=Number(v.modelo?.capacidadeCargaKg||0);if(lim>0&&pesoDepois>lim+1e-9)return notificar_(`A carga excederia ${lim} kg.`,'aviso');
  inv[comp][oi]=itemDestino;cargo[di]=item;
  if(!validarPesoCompartimento_(c,inv,comp,true)){inv[comp][oi]=item;cargo[di]=itemDestino;return;}
  try{await salvarCargaEInventarioV85_(v,cargo,c,inv);renderizarInventario(c);notificar_(`${nomeItemV84_(item)} guardado em ${v.nomeIndividual||v.modelo?.nome||'veículo'}.`,'info');}catch(e){console.error(e);notificar_('Não foi possível mover o item para o veículo.','erro');}
};
async function soltarVeiculoEmInventarioV85_(event,destinoComp,destinoIndex,origem){
  const c=charAtualV84_(),v=(veiculosPossuidosV83_||[]).find(x=>String(x.id)===String(origem.vehicleId));if(!c||!v||!vinculoVeiculoCharV84_(v,c))return;
  if(personagemEstaEmBatalha_(c))return notificar_('Em combate, não é possível retirar equipamentos guardados no veículo.','aviso',4300);
  if(!['equipado','bolso','mochila'].includes(String(destinoComp)))return notificar_('A carga compartilhada pode ser movida para Equipado, Bolso ou Mochila.','aviso');
  const cargo=cargoVeiculoNormalizadoV85_(v,50),oi=Number(origem.index),item=cargo[oi];if(!item)return;const inv=normalizarInventario_(c),di=Number(destinoIndex),itemDestino=inv[destinoComp][di]||null;
  const cargoNovo=[...cargo];cargoNovo[oi]=itemDestino;const lim=Number(v.modelo?.capacidadeCargaKg||0),peso=pesoArrayItensV85_(cargoNovo);if(lim>0&&peso>lim+1e-9)return notificar_(`A troca excederia ${lim} kg no veículo.`,'aviso');
  inv[destinoComp][di]=item;cargo[oi]=itemDestino;
  if(!validarPesoCompartimento_(c,inv,destinoComp,true)){inv[destinoComp][di]=itemDestino;cargo[oi]=item;return;}
  try{await salvarCargaEInventarioV85_(v,cargo,c,inv);renderizarInventario(c);notificar_(`${nomeItemV84_(item)} retirado de ${v.nomeIndividual||v.modelo?.nome||'veículo'}.`,'info');}catch(e){console.error(e);notificar_('Não foi possível retirar o item do veículo.','erro');}
}

// Intercepta somente arrastos cuja origem é a carga compartilhada. O restante
// continua no sistema de inventário já estabilizado.
const soltarInventarioV85Base_=window.soltarInventario;
window.soltarInventario=async function(event,destinoComp,destinoIndex){const origem=lerArrastoV85_(event);if(origem?.entityType==='vehicle'){event.preventDefault();event.stopPropagation();return soltarVeiculoEmInventarioV85_(event,destinoComp,destinoIndex,origem);}return soltarInventarioV85Base_(event,destinoComp,destinoIndex);};

// O antigo compartimento char.inventario.veiculo deixa de ser a interface.
// O bloco Veículo reaproveita o mesmo lugar visual, mas agora representa o
// documento compartilhado do veículo selecionado.
ajustarInventarioEntidadesV84_=function(){document.querySelectorAll('option[value="veiculo"]').forEach(o=>o.hidden=true);renderizarCargaVeiculoInventarioV85_(charAtualV84_());};
const renderizarInventarioV85Base_=(typeof renderizarInventario==='function')?renderizarInventario:null;
if(renderizarInventarioV85Base_)renderizarInventario=function(char){const r=renderizarInventarioV85Base_(char);renderizarCargaVeiculoInventarioV85_(char);return r;};

// Modal de veículo fica enxuto; carga é administrada na aba Inventário.
window.abrirVeiculoPossuidoV83_=async function(id){
  let v=(veiculosPossuidosV83_||[]).find(x=>String(x.id)===String(id));if(!v)return;try{if(userData?.role==='mestre')v=await migrarPermissoesVeiculoV84_(v);}catch(e){console.warn('migração veículo v85',e);}
  let modal=document.getElementById('modalVeiculoPossuidoV83');if(!modal){modal=document.createElement('div');modal.id='modalVeiculoPossuidoV83';modal.className='modal-overlay entity-modal-v85';modal.innerHTML='<div class="modal-content" style="max-width:900px"><span class="close" onclick="this.closest(\'.modal-overlay\').classList.remove(\'active\')">&times;</span><div id="v83OwnedBody"></div></div>';document.body.appendChild(modal);}modal.classList.add('entity-modal-v85');
  const mo=modeloVeiculoV83_(v.modelo||{}),chars=new Map((veiculoCharsV83_||[]).map(c=>[String(c.id),c.nome])),peso=pesoCargoV84_(v),cap=Number(mo.capacidadeCargaKg||0);
  document.getElementById('v83OwnedBody').innerHTML=`<h3 style="margin-top:0">${escV82_(mo.icone)} ${escV82_(v.nomeIndividual||mo.nome)}</h3><div style="color:#9fb4cd">${escV82_(mo.categoria)} · ${escV82_(mo.tamanho)} · ${escV82_(v.estado||'Operacional')}</div><p><b>Estrutura:</b> ${v.estruturaAtual}/${mo.estruturaMax} · <b>Blindagem:</b> ${mo.blindagem} · <b>Movimento:</b> ${mo.movimento}</p><p><b>Carga:</b> ${peso.toFixed(1)}${cap>0?` / ${cap.toFixed(1)}`:''} kg · gerenciada na aba <b>Inventário → Veículo</b>.</p><h4>Tripulação vinculada</h4><ul>${(v.vinculos||[]).map(x=>`<li>${escV82_(x.personagemNome||chars.get(String(x.personagemId))||x.personagemId)} — ${escV82_(x.papel)}</li>`).join('')}</ul>${userData?.role==='mestre'?`<button class="btn-small btn-delete" style="margin-top:14px" onclick="removerVeiculoPossuidoV83_('${escV82_(id)}')">Desvincular/excluir veículo possuído</button>`:''}`;
  aplicarUXModalEntidadeV85_();modal.classList.add('active');
};

// Identidade do usuário vinculada fica robusta para personagens antigos e novos.
usuariosPermitidosVeiculoV84_=function(v,chars){const mapa=new Map((chars||[]).map(c=>[String(c.id),c]));return [...new Set((v?.vinculos||[]).map(x=>String(x.usuarioUid||donoUidPersonagemV85_(mapa.get(String(x.personagemId)))||'')).filter(Boolean))];};
migrarPermissoesVeiculoV84_=async function(v){
  if(userData?.role!=='mestre'||!v)return v;if(!veiculoCharsV83_.length)veiculoCharsV83_=await carregarPersonagensV83_();const mapa=new Map(veiculoCharsV83_.map(c=>[String(c.id),c]));
  const vinculos=(v.vinculos||[]).map(x=>{const c=mapa.get(String(x.personagemId));return {...x,personagemNome:x.personagemNome||c?.nome||'',usuarioUid:x.usuarioUid||donoUidPersonagemV85_(c)||''};});
  const uids=[...new Set(vinculos.map(x=>String(x.usuarioUid||'')).filter(Boolean))];const mudou=JSON.stringify(uids)!==JSON.stringify(v.usuariosPermitidos||[])||JSON.stringify(vinculos)!==JSON.stringify(v.vinculos||[]);if(mudou){v.usuariosPermitidos=uids;v.vinculos=vinculos;await setDoc(doc(db,VEICULOS_POS_V83_,v.id),{usuariosPermitidos:uids,vinculos,atualizadoEm:new Date().toISOString()},{merge:true});}return v;
};
window.confirmarVinculoVeiculoV83_=async()=>{
  const mid=String(document.getElementById('v83VincModelo')?.value||''),m=veiculosDBV83_.find(x=>x.id===mid);if(!m)return;if(!veiculoCharsV83_.length)veiculoCharsV83_=await carregarPersonagensV83_();const charMap=new Map(veiculoCharsV83_.map(c=>[String(c.id),c]));
  const vinculos=[...document.querySelectorAll('.v83CrewCheck:checked')].map(chk=>{const c=charMap.get(String(chk.dataset.id));return {personagemId:String(chk.dataset.id),personagemNome:c?.nome||'',usuarioUid:donoUidPersonagemV85_(c),papel:document.querySelector(`.v83CrewRole[data-id="${CSS.escape(chk.dataset.id)}"]`)?.value||'Tripulante'};});if(!vinculos.length)return notificar_('Selecione ao menos um personagem.','aviso');
  const id=`veh_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,inst={id,modeloId:m.id,nomeIndividual:String(document.getElementById('v83VincNome')?.value||m.nome).trim()||m.nome,modelo:JSON.parse(JSON.stringify(m)),estruturaAtual:m.estruturaMax,energiaAtual:m.energiaMax,combustivelAtual:m.combustivelMax,estado:'Operacional',vinculos,usuariosPermitidos:[...new Set(vinculos.map(x=>x.usuarioUid).filter(Boolean))],cargaItens:Array(50).fill(null),criadoEm:new Date().toISOString(),atualizadoEm:new Date().toISOString()};
  try{await setDoc(doc(db,VEICULOS_POS_V83_,id),inst);document.getElementById('modalVincVeiculoV83')?.classList.remove('active');notificar_(`${inst.nomeIndividual} vinculado à tripulação.`,'info');}catch(e){console.error(e);notificar_('Não foi possível criar o veículo possuído.','erro');}
};

async function reconciliarVeiculosV85_(){
  if(userData?.role!=='mestre')return;if(!veiculoCharsV83_.length){try{veiculoCharsV83_=await carregarPersonagensV83_();}catch(_){return;}}
  for(const v of veiculosPossuidosV83_||[]){if(veiculoReconciliandoV85_.has(v.id))continue;veiculoReconciliandoV85_.add(v.id);try{await migrarPermissoesVeiculoV84_(v);}catch(e){console.warn('reconciliação veículo',v.id,e);}finally{veiculoReconciliandoV85_.delete(v.id);}}
}
function iniciarVeiculosAoVivoV85_(){
  if(veiculosPossuidosUnsubV85_){try{veiculosPossuidosUnsubV85_();}catch(_){ }veiculosPossuidosUnsubV85_=null;}if(!currentUserUid)return;
  try{veiculosPossuidosUnsubV85_=onSnapshot(collection(db,VEICULOS_POS_V83_),snap=>{veiculosPossuidosV83_=[];snap.forEach(d=>veiculosPossuidosV83_.push({id:d.id,...d.data()}));renderizarVeiculosPersonagemV83_();const c=charAtualV84_();if(c)renderizarCargaVeiculoInventarioV85_(c);if(userData?.role==='mestre')setTimeout(reconciliarVeiculosV85_,0);},err=>console.warn('veículos ao vivo v85',err));}catch(e){console.warn('não foi possível iniciar veículos ao vivo',e);}
}

// Cada renderização lateral reaplica o acabamento, inclusive em snapshots ao vivo.
const renderizarVeiculosPersonagemV85Base_=renderizarVeiculosPersonagemV83_;
renderizarVeiculosPersonagemV83_=function(){const r=renderizarVeiculosPersonagemV85Base_();garantirEstilosEntidadesV85_();return r;};
const renderizarVinculosPersonagemV85Base_=renderizarVinculosPersonagemV82_;
renderizarVinculosPersonagemV82_=function(){const r=renderizarVinculosPersonagemV85Base_();garantirEstilosEntidadesV85_();return r;};

function iniciarV85_(){garantirEstilosEntidadesV85_();aplicarUXModalEntidadeV85_();ajustarInventarioEntidadesV84_();if(currentUserUid)iniciarVeiculosAoVivoV85_();}
if(typeof onAuthStateChanged==='function'&&typeof auth!=='undefined')onAuthStateChanged(auth,user=>{if(user)setTimeout(()=>{iniciarV85_();},700);else if(veiculosPossuidosUnsubV85_){try{veiculosPossuidosUnsubV85_();}catch(_){ }veiculosPossuidosUnsubV85_=null;}});
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(iniciarV85_,300));else setTimeout(iniciarV85_,300);}
if(typeof window.addEventListener==='function')window.addEventListener('personagem-selecionado',()=>setTimeout(()=>{garantirEstilosEntidadesV85_();renderizarCargaVeiculoInventarioV85_(charAtualV84_());},0));
console.info('[Mesa Estelar] v85 vínculos responsivos + veículo ao vivo + inventário compartilhado carregado');
window.__MESA_PATCH__='v85-veiculo-inventario-compartilhado';
// v85.1 · qualquer modal criado depois do carregamento recebe o mesmo X evidente.
const garantirOverlaysV85Base_=garantirOverlaysV84_;
garantirOverlaysV84_=function(){const r=garantirOverlaysV85Base_.apply(this,arguments);garantirEstilosEntidadesV85_();aplicarUXModalEntidadeV85_();return r;};


// ============================================================================
// v86 · NAVES COMPARTILHADAS / BANCO DE NAVES / PORÃO DE CARGA
// A nave é uma entidade persistente independente da ficha: vários personagens
// podem ocupar funções diferentes e todos os vinculados compartilham o mesmo
// porão. O combate espacial permanece deliberadamente fora desta camada.
// ============================================================================
const NAVES_COL_V86_='naves',NAVES_POS_V86_='navesPossuidas';
let navesDBV86_=[],navesPossuidasV86_=[],naveCharsV86_=[],navesPossuidasUnsubV86_=null,naveInventarioSelecionadaV86_='';
const NAVES_CSV_V86_=['id','nome','icone','tipo','classe','porte','cascoMax','blindagem','escudoMax','energiaMax','combustivelMax','movimento','manobra','sensores','capacidadeCargaKg','tripulacaoMin','tripulacaoMax','passageiros','slotsArmas','vendavel','preco','nivelAcesso','disponivelCampanha','descricao','imagem'];
function boolV86_(v,d=false){if(v===true||v===false)return v;if(v==null||v==='')return d;return /^(true|1|sim|yes)$/i.test(String(v).trim());}
function numV86_(v,d=0){const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:d;}
function slugV86_(s){return String(s||'nave').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80)||`nave_${Date.now()}`;}
function modeloNaveV86_(v={}){return {
  id:String(v.id||slugV86_(v.nome)),nome:String(v.nome||'Nave'),icone:String(v.icone||'🚀'),tipo:String(v.tipo||'Exploração'),classe:String(v.classe||'Nave leve'),porte:String(v.porte||'Pequena'),
  cascoMax:Math.max(0,numV86_(v.cascoMax,40)),blindagem:Math.max(0,numV86_(v.blindagem,0)),escudoMax:Math.max(0,numV86_(v.escudoMax,0)),energiaMax:Math.max(0,numV86_(v.energiaMax,0)),combustivelMax:Math.max(0,numV86_(v.combustivelMax,0)),
  movimento:Math.max(0,numV86_(v.movimento,10)),manobra:Math.max(0,numV86_(v.manobra,0)),sensores:Math.max(0,numV86_(v.sensores,0)),capacidadeCargaKg:Math.max(0,numV86_(v.capacidadeCargaKg,0)),
  tripulacaoMin:Math.max(1,Math.round(numV86_(v.tripulacaoMin,1))),tripulacaoMax:Math.max(1,Math.round(numV86_(v.tripulacaoMax,4))),passageiros:Math.max(0,Math.round(numV86_(v.passageiros,0))),slotsArmas:Math.max(0,Math.round(numV86_(v.slotsArmas,0))),
  vendavel:boolV86_(v.vendavel,false),preco:Math.max(0,numV86_(v.preco,0)),nivelAcesso:String(v.nivelAcesso||'Restrito'),disponivelCampanha:boolV86_(v.disponivelCampanha,true),descricao:String(v.descricao||''),imagem:String(v.imagem||'')
};}
function defaultsNavesV86_(){return [
  modeloNaveV86_({id:'lancadeira_orbital',nome:'Lançadeira orbital',icone:'🛸',tipo:'Transporte/Exploração',classe:'Lançadeira',porte:'Pequena',cascoMax:38,blindagem:2,escudoMax:10,energiaMax:60,combustivelMax:100,movimento:14,manobra:4,sensores:3,capacidadeCargaKg:1200,tripulacaoMin:1,tripulacaoMax:3,passageiros:8,slotsArmas:1,vendavel:true,preco:145000,nivelAcesso:'Restrito',descricao:'Nave pequena para órbita, pouso planetário e viagens curtas. Pode ser operada por uma tripulação mínima.'}),
  modeloNaveV86_({id:'cargueiro_modular',nome:'Cargueiro modular',icone:'🚀',tipo:'Carga/Comercial',classe:'Cargueiro',porte:'Média',cascoMax:85,blindagem:5,escudoMax:22,energiaMax:140,combustivelMax:180,movimento:9,manobra:1,sensores:4,capacidadeCargaKg:18000,tripulacaoMin:2,tripulacaoMax:8,passageiros:12,slotsArmas:2,vendavel:true,preco:480000,nivelAcesso:'Restrito',descricao:'Cargueiro de longo curso com grande porão e módulos intercambiáveis.'}),
  modeloNaveV86_({id:'corveta_patrulha',nome:'Corveta de patrulha',icone:'🛰️',tipo:'Militar/Patrulha',classe:'Corveta',porte:'Média',cascoMax:120,blindagem:10,escudoMax:45,energiaMax:220,combustivelMax:220,movimento:12,manobra:3,sensores:7,capacidadeCargaKg:6500,tripulacaoMin:5,tripulacaoMax:18,passageiros:10,slotsArmas:6,vendavel:false,preco:0,nivelAcesso:'Militar',descricao:'Corveta armada para patrulha, escolta e combate. Normalmente indisponível no comércio civil.'})
];}
async function carregarNavesV86_(){try{const s=await getDocs(collection(db,NAVES_COL_V86_));navesDBV86_=[];s.forEach(d=>navesDBV86_.push(modeloNaveV86_({id:d.id,...d.data()})));navesDBV86_.sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));}catch(e){console.warn('naves banco',e);navesDBV86_=[];}return navesDBV86_;}
function nomeDuplicadoNaveV86_(nome){const base=`${nome||'Nave'} - cópia`;let n=base,i=2;const usados=new Set(navesDBV86_.map(x=>String(x.nome).toLowerCase()));while(usados.has(n.toLowerCase()))n=`${base} ${i++}`;return n;}
function garantirBancoNavesV86_(){
  const banco=document.getElementById('banco');if(!banco)return;const tabs=banco.querySelector(':scope .form-section > .tabs');if(!tabs)return;
  if(!document.getElementById('tabBancoNavesV86')){const b=document.createElement('button');b.id='tabBancoNavesV86';b.className='tab-btn';b.textContent='Naves';b.onclick=()=>window.mostrarBancoAba('naves',b);const alvo=document.getElementById('tabBancoVeiculosV83');if(alvo)alvo.after(b);else tabs.appendChild(b);}
  if(!document.getElementById('banco-naves')){const p=document.createElement('div');p.id='banco-naves';p.className='tab-content';p.innerHTML=`<h4 style="color:#fff;margin-bottom:6px;">🚀 Banco de Naves</h4><p style="color:#aaa;margin-bottom:13px;">Modelos reutilizáveis. Uma nave possuída pode ser compartilhada por vários personagens em postos diferentes, com porão comum.</p><div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px;"><button class="btn-small btn-select" onclick="novoNaveV86_()">➕ Novo modelo</button><button class="btn-small" onclick="restaurarNavesBasicasV86_()">🌱 Criar modelos básicos</button><button class="btn-small" onclick="carregarNavesV86_().then(renderizarBancoNavesV86_)">🔄 Atualizar</button><input id="importNavesV86" type="file" accept=".csv,text/csv" hidden onchange="importarNavesCSVV86_(this)"><button class="btn-small" onclick="document.getElementById('importNavesV86').click()">📥 Importar/Atualizar CSV</button><button class="btn-small" onclick="exportarNavesCSVV86_()">📤 Exportar CSV</button></div><div id="listaBancoNavesV86"></div>`;const ref=document.getElementById('banco-veiculos');if(ref)ref.after(p);else banco.querySelector('.form-section')?.appendChild(p);}
}
function renderizarBancoNavesV86_(){const h=document.getElementById('listaBancoNavesV86');if(!h)return;if(!navesDBV86_.length){h.innerHTML='<p style="color:#999">Nenhuma nave cadastrada.</p>';return;}h.innerHTML=navesDBV86_.map(v=>`<div class="cv82-model-card ${v.disponivelCampanha===false?'off':''}"><div class="cv82-model-img">${v.imagem?`<img src="${escV82_(v.imagem)}">`:escV82_(v.icone)}</div><div><b>${escV82_(v.nome)}</b><div style="color:#9fb4cd;font-size:.82rem">${escV82_(v.tipo)} · ${escV82_(v.classe)} · ${escV82_(v.porte)} · Casco ${v.cascoMax} · Carga ${v.capacidadeCargaKg} kg</div>${v.vendavel?`<span class="cv82-badge">Vendável · ${Math.round(v.preco)} rec.</span>`:''}</div><div class="cv82-model-actions"><button class="btn-small" onclick="editarNaveV86_('${escV82_(v.id)}')">✏️ Editar</button><button class="btn-small" onclick="duplicarNaveV86_('${escV82_(v.id)}')">📑 Duplicar</button><button class="btn-small btn-select" onclick="abrirVincularNaveV86_('${escV82_(v.id)}')">🔗 Vincular tripulação</button><button class="btn-small btn-delete" onclick="removerNaveV86_('${escV82_(v.id)}')">Remover</button></div></div>`).join('');}
function garantirModalNaveV86_(){let m=document.getElementById('modalNaveV86');if(m)return m;m=document.createElement('div');m.id='modalNaveV86';m.className='modal-overlay entity-modal-v85';m.innerHTML=`<div class="modal-content" style="max-width:1050px;"><span class="close" onclick="this.closest('.modal-overlay').classList.remove('active')">&times;</span><h3 id="v86Titulo">🚀 Modelo de nave</h3><input id="v86Orig" type="hidden"><div class="cv82-modal-grid"><label>ID<input id="v86Id"></label><label>Nome<input id="v86Nome"></label><label>Ícone<input id="v86Icone"></label><label>Tipo / finalidade<input id="v86Tipo" placeholder="Exploração, carga, militar..."></label><label>Classe<input id="v86Classe" placeholder="Lançadeira, cargueiro, corveta..."></label><label>Porte<input id="v86Porte" placeholder="Pequena, média, grande..."></label><label>Casco máximo<input id="v86Casco" type="number"></label><label>Blindagem<input id="v86Blindagem" type="number"></label><label>Escudo máximo<input id="v86Escudo" type="number"></label><label>Energia máxima<input id="v86Energia" type="number"></label><label>Combustível máximo<input id="v86Combustivel" type="number"></label><label>Movimento<input id="v86Movimento" type="number" step="0.5"></label><label>Manobra<input id="v86Manobra" type="number"></label><label>Sensores<input id="v86Sensores" type="number"></label><label>Carga máxima (kg)<input id="v86Carga" type="number" step="0.5"></label><label>Tripulação mínima<input id="v86TripMin" type="number"></label><label>Tripulação máxima<input id="v86TripMax" type="number"></label><label>Passageiros<input id="v86Passageiros" type="number"></label><label>Slots de armas<input id="v86Armas" type="number"></label><label>Preço<input id="v86Preco" type="number"></label><label>Acesso<select id="v86Acesso"><option>Comum</option><option>Restrito</option><option>Militar</option><option>Proibido</option></select></label><label style="grid-column:1/-1">Descrição<textarea id="v86Descricao" rows="4"></textarea></label><label style="grid-column:1/-1">Imagem por URL<input id="v86Imagem"></label><label>Enviar imagem<input id="v86ImagemFile" type="file" accept="image/*" onchange="naveLerImagemV86_(event)"></label><div><img id="v86Preview" style="width:110px;height:110px;object-fit:contain;background:rgba(255,255,255,.04);border-radius:9px"></div></div><div style="display:flex;gap:12px;margin:10px 0"><label><input id="v86Vendavel" type="checkbox"> Vendável</label><label><input id="v86Disponivel" type="checkbox" checked> Disponível na campanha</label></div><button class="btn-save" onclick="salvarNaveV86_()">💾 Salvar modelo</button></div>`;document.body.appendChild(m);return m;}
function setV86_(id,v){const e=document.getElementById(id);if(e)e.value=v??'';}function chkV86_(id,v){const e=document.getElementById(id);if(e)e.checked=!!v;}
function preencherNaveV86_(v=null){garantirModalNaveV86_();setV86_('v86Orig',v?.id||'');setV86_('v86Id',v?.id||'');setV86_('v86Nome',v?.nome||'');setV86_('v86Icone',v?.icone||'🚀');setV86_('v86Tipo',v?.tipo||'Exploração');setV86_('v86Classe',v?.classe||'Nave leve');setV86_('v86Porte',v?.porte||'Pequena');setV86_('v86Casco',v?.cascoMax??40);setV86_('v86Blindagem',v?.blindagem??0);setV86_('v86Escudo',v?.escudoMax??0);setV86_('v86Energia',v?.energiaMax??0);setV86_('v86Combustivel',v?.combustivelMax??0);setV86_('v86Movimento',v?.movimento??10);setV86_('v86Manobra',v?.manobra??0);setV86_('v86Sensores',v?.sensores??0);setV86_('v86Carga',v?.capacidadeCargaKg??0);setV86_('v86TripMin',v?.tripulacaoMin??1);setV86_('v86TripMax',v?.tripulacaoMax??4);setV86_('v86Passageiros',v?.passageiros??0);setV86_('v86Armas',v?.slotsArmas??0);setV86_('v86Preco',v?.preco??0);setV86_('v86Acesso',v?.nivelAcesso||'Restrito');setV86_('v86Descricao',v?.descricao||'');setV86_('v86Imagem',v?.imagem||'');chkV86_('v86Vendavel',v?.vendavel);chkV86_('v86Disponivel',v?.disponivelCampanha!==false);const p=document.getElementById('v86Preview');if(p)p.src=v?.imagem||'';document.getElementById('v86Titulo').textContent=v?`🚀 Editar — ${v.nome}`:'🚀 Novo modelo de nave';}
window.novoNaveV86_=()=>{preencherNaveV86_();document.getElementById('modalNaveV86').classList.add('active');};
window.editarNaveV86_=id=>{const v=navesDBV86_.find(x=>x.id===id);if(v){preencherNaveV86_(v);document.getElementById('modalNaveV86').classList.add('active');}};
window.duplicarNaveV86_=id=>{const v=navesDBV86_.find(x=>x.id===id);if(!v)return;const c=JSON.parse(JSON.stringify(v));c.id='';c.nome=nomeDuplicadoNaveV86_(v.nome);preencherNaveV86_(c);setV86_('v86Orig','');setV86_('v86Id',slugV86_(c.nome));document.getElementById('v86Titulo').textContent=`🚀 Duplicar — ${v.nome}`;document.getElementById('modalNaveV86').classList.add('active');};
window.naveLerImagemV86_=ev=>{const f=ev?.target?.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const max=640,sc=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*sc));c.height=Math.max(1,Math.round(im.height*sc));c.getContext('2d').drawImage(im,0,0,c.width,c.height);const data=c.toDataURL('image/webp',.84);setV86_('v86Imagem',data);document.getElementById('v86Preview').src=data;};im.src=r.result;};r.readAsDataURL(f);};
window.salvarNaveV86_=async()=>{if(userData?.role!=='mestre')return;const val=id=>String(document.getElementById(id)?.value||'').trim(),orig=val('v86Orig'),id=val('v86Id')||slugV86_(val('v86Nome'));if(!id||!val('v86Nome'))return notificar_('Informe ID e nome.','aviso');const v=modeloNaveV86_({id,nome:val('v86Nome'),icone:val('v86Icone'),tipo:val('v86Tipo'),classe:val('v86Classe'),porte:val('v86Porte'),cascoMax:val('v86Casco'),blindagem:val('v86Blindagem'),escudoMax:val('v86Escudo'),energiaMax:val('v86Energia'),combustivelMax:val('v86Combustivel'),movimento:val('v86Movimento'),manobra:val('v86Manobra'),sensores:val('v86Sensores'),capacidadeCargaKg:val('v86Carga'),tripulacaoMin:val('v86TripMin'),tripulacaoMax:val('v86TripMax'),passageiros:val('v86Passageiros'),slotsArmas:val('v86Armas'),preco:val('v86Preco'),nivelAcesso:val('v86Acesso'),descricao:val('v86Descricao'),imagem:val('v86Imagem'),vendavel:document.getElementById('v86Vendavel')?.checked,disponivelCampanha:document.getElementById('v86Disponivel')?.checked});try{if(orig&&orig!==id)await deleteDoc(doc(db,NAVES_COL_V86_,orig));await setDoc(doc(db,NAVES_COL_V86_,id),v);await carregarNavesV86_();renderizarBancoNavesV86_();document.getElementById('modalNaveV86').classList.remove('active');notificar_('Modelo de nave salvo.','info');}catch(e){console.error(e);notificar_('Não foi possível salvar a nave.','erro');}};
window.removerNaveV86_=async id=>{if(userData?.role!=='mestre'||!confirm('Remover este modelo? Naves já possuídas continuarão existindo.'))return;await deleteDoc(doc(db,NAVES_COL_V86_,id));await carregarNavesV86_();renderizarBancoNavesV86_();};
window.restaurarNavesBasicasV86_=async()=>{if(userData?.role!=='mestre')return;for(const v of defaultsNavesV86_())await setDoc(doc(db,NAVES_COL_V86_,v.id),v,{merge:true});await carregarNavesV86_();renderizarBancoNavesV86_();notificar_('Modelos básicos de naves criados/atualizados.','info');};
window.exportarNavesCSVV86_=()=>{if(!navesDBV86_.length)return;const l=[NAVES_CSV_V86_.join(';'),...navesDBV86_.map(v=>NAVES_CSV_V86_.map(k=>escaparCSV_(v[k])).join(';'))],b=new Blob(['\uFEFF'+l.join('\r\n')],{type:'text/csv;charset=utf-8'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=`banco_naves_${new Date().toISOString().slice(0,10)}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
window.importarNavesCSVV86_=input=>{const f=input?.files?.[0];if(!f)return;Papa.parse(f,{header:true,skipEmptyLines:true,delimiter:'',complete:async r=>{for(const raw of r.data||[]){if(!String(raw.nome||'').trim())continue;const v=modeloNaveV86_(raw);await setDoc(doc(db,NAVES_COL_V86_,v.id),v,{merge:true});}await carregarNavesV86_();renderizarBancoNavesV86_();input.value='';notificar_('Naves importadas/atualizadas.','info');}});};
function garantirModalVincNaveV86_(){let m=document.getElementById('modalVincNaveV86');if(m)return m;m=document.createElement('div');m.id='modalVincNaveV86';m.className='modal-overlay entity-modal-v85';m.innerHTML=`<div class="modal-content" style="max-width:900px"><span class="close" onclick="this.closest('.modal-overlay').classList.remove('active')">&times;</span><h3>🔗 Vincular nave e tripulação</h3><input id="v86VincModelo" type="hidden"><label>Nome individual<input id="v86VincNome"></label><div id="v86Crew" style="margin:12px 0"></div><small style="color:#9fb4cd">Cada personagem recebe uma função principal nesta nave. A carga pertence à nave e é compartilhada por toda a tripulação vinculada.</small><div style="margin-top:12px"><button class="btn-save" onclick="confirmarVinculoNaveV86_()">🔗 Criar nave possuída</button></div></div>`;document.body.appendChild(m);return m;}
window.abrirVincularNaveV86_=async id=>{if(userData?.role!=='mestre')return;const v=navesDBV86_.find(x=>x.id===id);if(!v)return;garantirModalVincNaveV86_();setV86_('v86VincModelo',id);setV86_('v86VincNome',v.nome);naveCharsV86_=await carregarPersonagensV83_();const chars=naveCharsV86_.filter(c=>String(c.tipo||'pc').toLowerCase()!=='npc'),h=document.getElementById('v86Crew');h.innerHTML=chars.map(c=>`<div style="display:grid;grid-template-columns:auto 1fr minmax(150px,190px);gap:8px;align-items:center;margin:5px 0"><input type="checkbox" class="v86CrewCheck" data-id="${escV82_(c.id)}"><span>${escV82_(c.nome||'Sem nome')}</span><select class="v86CrewRole" data-id="${escV82_(c.id)}"><option>Dono</option><option>Capitão</option><option>Piloto</option><option>Navegador</option><option>Artilheiro</option><option>Engenheiro</option><option>Sensorista</option><option>Tripulante</option><option>Passageiro</option></select></div>`).join('');document.getElementById('modalVincNaveV86').classList.add('active');};
window.confirmarVinculoNaveV86_=async()=>{if(userData?.role!=='mestre')return;const mid=String(document.getElementById('v86VincModelo')?.value||''),m=navesDBV86_.find(x=>x.id===mid);if(!m)return;if(!naveCharsV86_.length)naveCharsV86_=await carregarPersonagensV83_();const charMap=new Map(naveCharsV86_.map(c=>[String(c.id),c]));const vinculos=[...document.querySelectorAll('.v86CrewCheck:checked')].map(chk=>{const c=charMap.get(String(chk.dataset.id));return {personagemId:String(chk.dataset.id),personagemNome:c?.nome||'',usuarioUid:donoUidPersonagemV85_(c)||'',papel:document.querySelector(`.v86CrewRole[data-id="${CSS.escape(chk.dataset.id)}"]`)?.value||'Tripulante'};});if(!vinculos.length)return notificar_('Selecione ao menos um personagem.','aviso');const id=`ship_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,inst={id,modeloId:m.id,nomeIndividual:String(document.getElementById('v86VincNome')?.value||m.nome).trim()||m.nome,modelo:JSON.parse(JSON.stringify(m)),cascoAtual:m.cascoMax,escudoAtual:m.escudoMax,energiaAtual:m.energiaMax,combustivelAtual:m.combustivelMax,estado:'Operacional',vinculos,usuariosPermitidos:[...new Set(vinculos.map(x=>x.usuarioUid).filter(Boolean))],cargaItens:Array(100).fill(null),criadoEm:new Date().toISOString(),atualizadoEm:new Date().toISOString()};try{await setDoc(doc(db,NAVES_POS_V86_,id),inst);document.getElementById('modalVincNaveV86')?.classList.remove('active');notificar_(`${inst.nomeIndividual} vinculada à tripulação.`,'info');}catch(e){console.error(e);notificar_('Não foi possível criar a nave possuída.','erro');}};
function navesDoPersonagemV86_(c){if(!c)return[];return (navesPossuidasV86_||[]).filter(v=>(v.vinculos||[]).some(x=>String(x.personagemId)===String(c.id)));}
function vinculoNaveCharV86_(v,c){return !!(v&&c&&(v.vinculos||[]).some(x=>String(x.personagemId)===String(c.id)));}
function montarNavesPersonagemV86_(){const aside=document.getElementById('charContextV66');if(!aside)return;let b=document.getElementById('charShipsV86');if(!b){b=document.createElement('div');b.id='charShipsV86';const tabs=aside.querySelector('.char-tabs.char-tabs-v67');const vehicles=document.getElementById('charVehiclesV83');if(vehicles&&vehicles.parentElement===aside)vehicles.after(b);else if(tabs)aside.insertBefore(b,tabs);else aside.appendChild(b);}renderizarNavesPersonagemV86_();}
function renderizarNavesPersonagemV86_(){const b=document.getElementById('charShipsV86'),c=charAtualV84_();if(!b)return;const arr=navesDoPersonagemV86_(c);if(!arr.length){b.style.display='none';b.innerHTML='';return;}b.style.display='block';b.innerHTML='<div class="cv82-title">Naves</div>'+arr.map(v=>{const papel=(v.vinculos||[]).find(x=>String(x.personagemId)===String(c.id))?.papel||'Tripulante',m=modeloNaveV86_(v.modelo||{});return `<button class="cv82-link" onclick="abrirNavePossuidaV86_('${escV82_(v.id)}')"><span class="cv82-avatar">${m.imagem?`<img src="${escV82_(m.imagem)}">`:escV82_(m.icone)}</span><span class="cv82-copy"><span class="cv82-name">${escV82_(v.nomeIndividual||m.nome)}</span><span class="cv82-meta">${escV82_(papel)} · ${escV82_(m.classe)} · Casco ${v.cascoAtual}/${m.cascoMax}</span></span></button>`;}).join('');}
function pesoCargoNaveV86_(v){return pesoArrayItensV85_(Array.isArray(v?.cargaItens)?v.cargaItens:[]);}
window.abrirNavePossuidaV86_=function(id){const v=navesPossuidasV86_.find(x=>String(x.id)===String(id));if(!v)return;let modal=document.getElementById('modalNavePossuidaV86');if(!modal){modal=document.createElement('div');modal.id='modalNavePossuidaV86';modal.className='modal-overlay entity-modal-v85';modal.innerHTML='<div class="modal-content" style="max-width:920px"><span class="close" onclick="this.closest(\'.modal-overlay\').classList.remove(\'active\')">&times;</span><div id="v86OwnedBody"></div></div>';document.body.appendChild(modal);}const mo=modeloNaveV86_(v.modelo||{}),peso=pesoCargoNaveV86_(v),cap=Number(mo.capacidadeCargaKg||0);document.getElementById('v86OwnedBody').innerHTML=`<h3 style="margin-top:0">${escV82_(mo.icone)} ${escV82_(v.nomeIndividual||mo.nome)}</h3><div style="color:#9fb4cd">${escV82_(mo.tipo)} · ${escV82_(mo.classe)} · ${escV82_(mo.porte)} · ${escV82_(v.estado||'Operacional')}</div><p><b>Casco:</b> ${v.cascoAtual}/${mo.cascoMax} · <b>Escudo:</b> ${v.escudoAtual}/${mo.escudoMax} · <b>Blindagem:</b> ${mo.blindagem} · <b>Energia:</b> ${v.energiaAtual}/${mo.energiaMax}</p><p><b>Movimento:</b> ${mo.movimento} · <b>Manobra:</b> ${mo.manobra} · <b>Sensores:</b> ${mo.sensores} · <b>Slots de armas:</b> ${mo.slotsArmas}</p><p><b>Porão:</b> ${peso.toFixed(1)}${cap>0?` / ${cap.toFixed(1)}`:''} kg · gerenciado na aba <b>Inventário → Nave</b>.</p><h4>Tripulação vinculada</h4><ul>${(v.vinculos||[]).map(x=>`<li>${escV82_(x.personagemNome||x.personagemId)} — ${escV82_(x.papel)}</li>`).join('')}</ul>${userData?.role==='mestre'?`<button class="btn-small btn-delete" style="margin-top:14px" onclick="removerNavePossuidaV86_('${escV82_(id)}')">Desvincular/excluir nave possuída</button>`:''}`;modal.classList.add('active');};
window.removerNavePossuidaV86_=async id=>{if(userData?.role!=='mestre'||!confirm('Excluir esta instância de nave?'))return;await deleteDoc(doc(db,NAVES_POS_V86_,id));document.getElementById('modalNavePossuidaV86')?.classList.remove('active');};
function cargoNaveNormalizadoV86_(v,minSlots=100){const src=Array.isArray(v?.cargaItens)?v.cargaItens:[],tamanho=Math.max(minSlots,src.length),out=Array(tamanho).fill(null);for(let i=0;i<src.length;i++)out[i]=src[i]||null;return out;}
function naveInventarioAtualV86_(c){const arr=navesDoPersonagemV86_(c);if(!arr.length)return null;let id=String(naveInventarioSelecionadaV86_||'');try{if(c?.id&&!id)id=localStorage.getItem(`mesa:v86:nave:${c.id}`)||'';}catch(_){ }let v=arr.find(x=>String(x.id)===id)||arr[0];naveInventarioSelecionadaV86_=String(v.id);try{if(c?.id)localStorage.setItem(`mesa:v86:nave:${c.id}`,String(v.id));}catch(_){ }return v;}
window.selecionarNaveInventarioV86_=function(id){naveInventarioSelecionadaV86_=String(id||'');const c=charAtualV84_();try{if(c?.id)localStorage.setItem(`mesa:v86:nave:${c.id}`,naveInventarioSelecionadaV86_);}catch(_){ }renderizarCargaNaveInventarioV86_(c);};
function tooltipItemNaveV86_(item){if(!item)return '<div class="item-tooltip"><h5>Vazio</h5><p>Arraste um item para cá.</p></div>';const nome=escaparHtmlInventario_(nomeItemV84_(item)),desc=escaparHtmlInventario_(getDescricao(item)||''),peso=Math.max(0,Number(item.peso||0));return `<div class="item-tooltip"><h5>${nome}</h5><p>${desc}</p><p>Peso: ${peso}kg | PA: ${Number(item.pa||0)} | PV: ${Number(item.pv||0)}</p><p style="color:#8feaff">Porão compartilhado da nave</p></div>`;}
function renderizarCargaNaveInventarioV86_(c){const box=document.getElementById('inventoryShipSharedV85'),host=document.getElementById('inv-nave'),capEl=document.getElementById('capacity-nave-v85'),sel=document.getElementById('inventoryShipSelectV85');if(!box||!host||!sel)return;const arr=navesDoPersonagemV86_(c);if(!c||!arr.length){box.style.display='none';host.innerHTML='';sel.innerHTML='';return;}box.style.display='block';const atual=naveInventarioAtualV86_(c);if(!atual)return;sel.onchange=()=>window.selecionarNaveInventarioV86_(sel.value);sel.innerHTML=arr.map(v=>{const m=modeloNaveV86_(v.modelo||{}),papel=(v.vinculos||[]).find(x=>String(x.personagemId)===String(c.id))?.papel||'Tripulante';return `<option value="${escV82_(v.id)}" ${String(v.id)===String(atual.id)?'selected':''}>${escV82_(v.nomeIndividual||m.nome)} · ${escV82_(m.classe)} · ${escV82_(papel)}</option>`;}).join('');const cargo=cargoNaveNormalizadoV86_(atual,100),m=modeloNaveV86_(atual.modelo||{}),peso=pesoArrayItensV85_(cargo),lim=Number(m.capacidadeCargaKg||0),usados=cargo.filter(Boolean).length;if(capEl){capEl.textContent=`${peso.toFixed(1)}${lim>0?` / ${lim.toFixed(1)}`:''} kg · ${usados}/${cargo.length} espaços · compartilhado com a tripulação`;capEl.style.color=lim>0&&peso>lim?'#ff6b6b':'';}host.innerHTML=cargo.map((item,i)=>{if(item){const nome=escaparHtmlInventario_(nomeItemV84_(item)),img=imgItemV84_(item)?`<img src="${escaparHtmlInventario_(imgItemV84_(item))}" alt="${nome}"${miniAttr_(item)}>`:miniaturaOuCaixa_(item,nome);return `<div class="inventory-slot filled v85-shared" draggable="true" ondragstart="iniciarArrastoNaveV86_(event,'${escV82_(atual.id)}',${i})" ondragend="finalizarArrastoInventario(event)" ondragover="permitirSoltarInventario(event)" ondrop="soltarInventarioNaveV86_(event,'${escV82_(atual.id)}',${i})">${img}<span class="v85-shared-badge">🚀</span>${tooltipItemNaveV86_(item)}</div>`;}return `<div class="inventory-slot v85-shared" ondragover="permitirSoltarInventario(event)" ondrop="soltarInventarioNaveV86_(event,'${escV82_(atual.id)}',${i})">${tooltipItemNaveV86_(null)}</div>`;}).join('');}
window.iniciarArrastoNaveV86_=function(event,shipId,index){event.stopPropagation();event.dataTransfer.effectAllowed='move';const payload={entityType:'ship',shipId:String(shipId),index:Number(index)};event.dataTransfer.setData('application/json',JSON.stringify(payload));event.dataTransfer.setData('text/plain',`ship:${shipId}:${index}`);event.currentTarget?.classList.add('drag-source');};
async function salvarCargaNaveV86_(v,cargo){const agora=new Date().toISOString();await setDoc(doc(db,NAVES_POS_V86_,v.id),{cargaItens:cargo,atualizadoEm:agora},{merge:true});v.cargaItens=cargo;v.atualizadoEm=agora;}
async function salvarCargaNaveEInventarioV86_(v,cargo,c,inv){const agora=new Date().toISOString(),batch=writeBatch(db);batch.set(doc(db,NAVES_POS_V86_,v.id),{cargaItens:cargo,atualizadoEm:agora},{merge:true});batch.set(doc(db,'personagens',c.id),{inventario:inv},{merge:true});await batch.commit();v.cargaItens=cargo;v.atualizadoEm=agora;c.inventario=inv;const loc=(userCharacters||[]).find(x=>String(x.id)===String(c.id));if(loc)loc.inventario=inv;}
window.soltarInventarioNaveV86_=async function(event,shipId,destinoIndex){event.preventDefault();event.stopPropagation();event.currentTarget?.classList.remove('drag-over');const origem=lerArrastoV85_(event),c=charAtualV84_(),v=(navesPossuidasV86_||[]).find(x=>String(x.id)===String(shipId));if(!origem||!c||!v||!vinculoNaveCharV86_(v,c))return;if(origem.entityType!=='ship'&&personagemEstaEmBatalha_(c))return notificar_('Em combate, o porão da nave fica fora do inventário imediato.','aviso',4300);const cargo=cargoNaveNormalizadoV86_(v,100),di=Number(destinoIndex),itemDestino=cargo[di]||null;if(origem.entityType==='ship'){if(String(origem.shipId)!==String(v.id))return notificar_('Troca direta entre duas naves ainda não está habilitada.','aviso');const oi=Number(origem.index);if(oi===di)return;const item=cargo[oi];if(!item)return;cargo[di]=item;cargo[oi]=itemDestino;try{await salvarCargaNaveV86_(v,cargo);renderizarCargaNaveInventarioV86_(c);}catch(e){console.error(e);notificar_('Não foi possível reorganizar o porão.','erro');}return;}const comp=String(origem.compartment||''),oi=Number(origem.index),inv=normalizarInventario_(c);if(!['equipado','bolso','mochila'].includes(comp)||!inv?.[comp])return;const item=inv[comp][oi];if(!item)return;const teste=[...cargo];teste[di]=item;const pesoDepois=pesoArrayItensV85_(teste),lim=Number(v.modelo?.capacidadeCargaKg||0);if(lim>0&&pesoDepois>lim+1e-9)return notificar_(`O porão excederia ${lim} kg.`,'aviso');inv[comp][oi]=itemDestino;cargo[di]=item;if(!validarPesoCompartimento_(c,inv,comp,true)){inv[comp][oi]=item;cargo[di]=itemDestino;return;}try{await salvarCargaNaveEInventarioV86_(v,cargo,c,inv);renderizarInventario(c);notificar_(`${nomeItemV84_(item)} guardado em ${v.nomeIndividual||v.modelo?.nome||'nave'}.`,'info');}catch(e){console.error(e);notificar_('Não foi possível mover o item para a nave.','erro');}};
async function soltarNaveEmInventarioV86_(event,destinoComp,destinoIndex,origem){const c=charAtualV84_(),v=(navesPossuidasV86_||[]).find(x=>String(x.id)===String(origem.shipId));if(!c||!v||!vinculoNaveCharV86_(v,c))return;if(personagemEstaEmBatalha_(c))return notificar_('Em combate, não é possível retirar equipamentos do porão.','aviso',4300);if(!['equipado','bolso','mochila'].includes(String(destinoComp)))return notificar_('O porão compartilhado pode ser movido para Equipado, Bolso ou Mochila.','aviso');const cargo=cargoNaveNormalizadoV86_(v,100),oi=Number(origem.index),item=cargo[oi];if(!item)return;const inv=normalizarInventario_(c),di=Number(destinoIndex),itemDestino=inv[destinoComp][di]||null,cargoNovo=[...cargo];cargoNovo[oi]=itemDestino;const lim=Number(v.modelo?.capacidadeCargaKg||0),peso=pesoArrayItensV85_(cargoNovo);if(lim>0&&peso>lim+1e-9)return notificar_(`A troca excederia ${lim} kg no porão.`,'aviso');inv[destinoComp][di]=item;cargo[oi]=itemDestino;if(!validarPesoCompartimento_(c,inv,destinoComp,true)){inv[destinoComp][di]=itemDestino;cargo[oi]=item;return;}try{await salvarCargaNaveEInventarioV86_(v,cargo,c,inv);renderizarInventario(c);notificar_(`${nomeItemV84_(item)} retirado de ${v.nomeIndividual||v.modelo?.nome||'nave'}.`,'info');}catch(e){console.error(e);notificar_('Não foi possível retirar o item da nave.','erro');}}
const soltarInventarioV86Base_=window.soltarInventario;window.soltarInventario=async function(event,destinoComp,destinoIndex){const origem=lerArrastoV85_(event);if(origem?.entityType==='ship'){event.preventDefault();event.stopPropagation();return soltarNaveEmInventarioV86_(event,destinoComp,destinoIndex,origem);}return soltarInventarioV86Base_(event,destinoComp,destinoIndex);};
function usuariosPermitidosNaveV86_(v,chars){const mapa=new Map((chars||[]).map(c=>[String(c.id),c]));return [...new Set((v?.vinculos||[]).map(x=>String(x.usuarioUid||donoUidPersonagemV85_(mapa.get(String(x.personagemId)))||'')).filter(Boolean))];}
async function migrarPermissoesNaveV86_(v){if(userData?.role!=='mestre'||!v)return v;if(!naveCharsV86_.length)naveCharsV86_=await carregarPersonagensV83_();const mapa=new Map(naveCharsV86_.map(c=>[String(c.id),c]));const vinculos=(v.vinculos||[]).map(x=>{const c=mapa.get(String(x.personagemId));return {...x,personagemNome:x.personagemNome||c?.nome||'',usuarioUid:x.usuarioUid||donoUidPersonagemV85_(c)||''};});const uids=[...new Set(vinculos.map(x=>String(x.usuarioUid||'')).filter(Boolean))];const mudou=JSON.stringify(uids)!==JSON.stringify(v.usuariosPermitidos||[])||JSON.stringify(vinculos)!==JSON.stringify(v.vinculos||[]);if(mudou){v.usuariosPermitidos=uids;v.vinculos=vinculos;await setDoc(doc(db,NAVES_POS_V86_,v.id),{usuariosPermitidos:uids,vinculos,atualizadoEm:new Date().toISOString()},{merge:true});}return v;}
function iniciarNavesAoVivoV86_(){if(navesPossuidasUnsubV86_){try{navesPossuidasUnsubV86_();}catch(_){ }navesPossuidasUnsubV86_=null;}if(!currentUserUid)return;try{const fonteNaves=userData?.role==='mestre'?collection(db,NAVES_POS_V86_):query(collection(db,NAVES_POS_V86_),where('usuariosPermitidos','array-contains',currentUserUid));navesPossuidasUnsubV86_=onSnapshot(fonteNaves,snap=>{navesPossuidasV86_=[];snap.forEach(d=>navesPossuidasV86_.push({id:d.id,...d.data()}));montarNavesPersonagemV86_();renderizarNavesPersonagemV86_();const c=charAtualV84_();if(c)renderizarCargaNaveInventarioV86_(c);if(userData?.role==='mestre')setTimeout(async()=>{for(const n of navesPossuidasV86_)try{await migrarPermissoesNaveV86_(n);}catch(e){console.warn('migração nave',n.id,e);}},0);},err=>console.warn('naves ao vivo v86',err));}catch(e){console.warn('não foi possível iniciar naves ao vivo',e);}}
function instalarEstilosNavesV86_(){if(document.getElementById('navesV86Styles'))return;const st=document.createElement('style');st.id='navesV86Styles';st.textContent=`#charShipsV86{margin:0 0 10px;padding:7px 0 10px;border-bottom:1px solid rgba(255,255,255,.10);min-width:0;overflow:hidden}#charShipsV86 .cv82-title{color:#8feaff;font-size:.69rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px}@media(max-width:900px){#charShipsV86{grid-column:1/-1;grid-row:7;display:flex;gap:5px;overflow-x:auto;border-bottom:0;padding:4px 0}#charShipsV86 .cv82-title{display:none!important}#charShipsV86 .cv82-link{min-width:155px;max-width:220px}}`;document.head.appendChild(st);}
const mostrarBancoAbaV86Base_=window.mostrarBancoAba;window.mostrarBancoAba=function(abaId,btn){garantirBancoNavesV86_();const r=mostrarBancoAbaV86Base_.apply(this,arguments);if(abaId==='naves')carregarNavesV86_().then(renderizarBancoNavesV86_);return r;};
const renderizarInventarioV86Base_=(typeof renderizarInventario==='function')?renderizarInventario:null;if(renderizarInventarioV86Base_)renderizarInventario=function(char){const r=renderizarInventarioV86Base_(char);renderizarCargaNaveInventarioV86_(char);return r;};
function iniciarV86_(){instalarEstilosNavesV86_();garantirBancoNavesV86_();montarNavesPersonagemV86_();iniciarNavesAoVivoV86_();renderizarCargaNaveInventarioV86_(charAtualV84_());aplicarUXModalEntidadeV85_();}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(iniciarV86_,500));else setTimeout(iniciarV86_,500);}if(typeof onAuthStateChanged==='function'&&typeof auth!=='undefined')onAuthStateChanged(auth,user=>{if(user)setTimeout(iniciarV86_,900);else if(navesPossuidasUnsubV86_){try{navesPossuidasUnsubV86_();}catch(_){ }navesPossuidasUnsubV86_=null;}});if(typeof window.addEventListener==='function')window.addEventListener('personagem-selecionado',()=>setTimeout(()=>{montarNavesPersonagemV86_();renderizarCargaNaveInventarioV86_(charAtualV84_());},0));
console.info('[Mesa Estelar] v86 banco de naves + tripulação + porão compartilhado carregados');
window.__MESA_PATCH__='v86-naves-compartilhadas';

// ============================================================================
// v87 · ACABAMENTO DA FICHA + NAVE EDITÁVEL / POSTOS / EQUIPAMENTOS INSTALADOS
// Mantém o combate normal, Psi e o motor de inventário estabilizados. Esta
// camada normaliza a navegação da ficha e torna a nave possuída uma entidade
// realmente administrável antes do futuro motor de combate espacial.
// ============================================================================
(function(){
  const ROLES_V87_=['Dono','Capitão','Piloto','Navegador','Artilheiro','Engenheiro','Sensorista','Tripulante','Passageiro'];

  function instalarEstilosV87_(){
    if(document.getElementById('mesaV87Styles'))return;
    const st=document.createElement('style');st.id='mesaV87Styles';st.textContent=`
      /* A coluna do personagem acompanha a rolagem natural da página. Um
         sticky mais alto que a janela prendia justamente as abas inferiores. */
      @media(min-width:901px){
        #charContextV66{position:relative!important;top:auto!important;align-self:start!important;max-height:none!important;overflow:visible!important}
        #appScreen{font-size:16px}
      }
      /* Criação/edição: os seis dados básicos deixam de desperdiçar seis linhas. */
      .char-core-grid-v87{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:0 0 12px}
      .char-core-grid-v87>.form-group{margin:0!important;min-width:0}
      .char-core-grid-v87 label{display:block;margin-bottom:5px}
      .char-core-grid-v87 input,.char-core-grid-v87 select{width:100%;min-width:0}
      @media(max-width:900px){.char-core-grid-v87{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:560px){.char-core-grid-v87{grid-template-columns:1fr}}

      /* Ficha de nave possuída. */
      .ship-owned-v87{display:grid;grid-template-columns:150px minmax(0,1fr);gap:18px;align-items:start}
      .ship-owned-v87 .ship-portrait{width:150px;height:150px;border-radius:14px;display:grid;place-items:center;overflow:hidden;background:rgba(255,255,255,.05);border:1px solid rgba(0,212,255,.28);font-size:4rem}
      .ship-owned-v87 .ship-portrait img{width:100%;height:100%;object-fit:cover}
      .ship-owned-v87 .ship-stats{display:grid;grid-template-columns:repeat(4,minmax(100px,1fr));gap:8px;margin:12px 0}
      .ship-owned-v87 .ship-stat{padding:9px;border-radius:9px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08)}
      .ship-owned-v87 .ship-stat small{display:block;color:#9fb4cd;margin-bottom:2px}.ship-owned-v87 .ship-stat b{color:#fff}
      .ship-slots-v87{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:8px 0 14px}
      .ship-slot-v87{padding:9px 10px;border-radius:9px;border:1px solid rgba(0,212,255,.16);background:rgba(0,0,0,.14);min-width:0;overflow-wrap:anywhere}
      .ship-slot-v87 small{display:block;color:#8da6bd;margin-bottom:3px}.ship-slot-v87 b{color:#d9f7ff}
      .ship-editor-grid-v87{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
      .ship-editor-grid-v87 label{min-width:0}.ship-editor-grid-v87 input,.ship-editor-grid-v87 select,.ship-editor-grid-v87 textarea{width:100%;min-width:0}
      .ship-editor-span2-v87{grid-column:span 2}.ship-editor-full-v87{grid-column:1/-1}
      .ship-crew-row-v87{display:grid;grid-template-columns:auto minmax(150px,1fr) minmax(150px,210px);gap:9px;align-items:center;padding:6px 8px;border-radius:8px;background:rgba(255,255,255,.035);margin:5px 0}
      .ship-equipment-edit-v87{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .ship-equip-row-v87{padding:9px;border:1px solid rgba(255,255,255,.09);border-radius:9px;background:rgba(0,0,0,.13)}
      .ship-equip-row-v87 input,.ship-equip-row-v87 textarea{width:100%;margin-top:5px}
      @media(max-width:760px){
        .ship-owned-v87{grid-template-columns:1fr}.ship-owned-v87 .ship-portrait{width:110px;height:110px}
        .ship-owned-v87 .ship-stats{grid-template-columns:repeat(2,minmax(0,1fr))}
        .ship-editor-grid-v87{grid-template-columns:repeat(2,minmax(0,1fr))}.ship-editor-span2-v87{grid-column:1/-1}
        .ship-equipment-edit-v87{grid-template-columns:1fr}.ship-crew-row-v87{grid-template-columns:auto 1fr}.ship-crew-row-v87 select{grid-column:2}
      }
    `;document.head.appendChild(st);
  }

  function compactarFormularioPersonagemV87_(){
    const name=document.getElementById('creationNameGroup');
    if(!name||document.getElementById('charIdentityGridV87'))return;
    const race=document.getElementById('editRace')?.closest('.form-group');
    const sex=document.getElementById('editSex')?.closest('.form-group');
    const origin=document.getElementById('creationOriginGroup');
    const career=document.getElementById('creationCareerGroup');
    const body=document.getElementById('editBodyType')?.closest('.form-group');
    if(!race||!sex||!origin||!career||!body)return;
    const g1=document.createElement('div');g1.id='charIdentityGridV87';g1.className='char-core-grid-v87';
    name.parentNode.insertBefore(g1,name);[name,race,sex].forEach(x=>g1.appendChild(x));
    const g2=document.createElement('div');g2.id='charBackgroundGridV87';g2.className='char-core-grid-v87';
    origin.parentNode.insertBefore(g2,origin);[origin,career,body].forEach(x=>g2.appendChild(x));
  }

  // Amplia o modelo sem quebrar naves v86 já existentes.
  const modeloNaveV87Base_=modeloNaveV86_;
  modeloNaveV86_=function(v={}){
    const m=modeloNaveV87Base_(v);
    m.slotsModulos=Math.max(0,Math.round(numV86_(v.slotsModulos,2)));
    m.caracteristicas=String(v.caracteristicas||'');
    return m;
  };
  if(!NAVES_CSV_V86_.includes('slotsModulos'))NAVES_CSV_V86_.splice(NAVES_CSV_V86_.indexOf('slotsArmas')+1,0,'slotsModulos');
  if(!NAVES_CSV_V86_.includes('caracteristicas'))NAVES_CSV_V86_.splice(NAVES_CSV_V86_.indexOf('descricao'),0,'caracteristicas');

  const defaultsNavesV87Base_=defaultsNavesV86_;
  defaultsNavesV86_=function(){return defaultsNavesV87Base_().map(v=>{
    const extra=v.id==='lancadeira_orbital'?{slotsModulos:2,caracteristicas:'Atmosférica; pouso planetário; operação por tripulação reduzida.'}:
      v.id==='cargueiro_modular'?{slotsModulos:6,caracteristicas:'Arquitetura modular; grande porão; autonomia de longo curso.'}:
      {slotsModulos:5,caracteristicas:'Sensores militares; compartimentação reforçada; múltiplos postos de combate.'};
    return modeloNaveV86_({...v,...extra});
  });};

  const garantirModalNaveV87Base_=garantirModalNaveV86_;
  garantirModalNaveV86_=function(){
    const m=garantirModalNaveV87Base_();
    const grid=m?.querySelector('.cv82-modal-grid');
    if(grid&&!document.getElementById('v87SlotsModulos')){
      const slots=document.createElement('label');slots.innerHTML='Slots de módulos<input id="v87SlotsModulos" type="number" min="0">';
      const armas=document.getElementById('v86Armas')?.closest('label');if(armas)armas.after(slots);else grid.appendChild(slots);
      const car=document.createElement('label');car.style.gridColumn='1/-1';car.innerHTML='Características especiais<textarea id="v87Caracteristicas" rows="3" placeholder="Atmosférica; laboratório; hangar; furtividade..."></textarea>';
      const desc=document.getElementById('v86Descricao')?.closest('label');if(desc)desc.before(car);else grid.appendChild(car);
    }
    return m;
  };
  const preencherNaveV87Base_=preencherNaveV86_;
  preencherNaveV86_=function(v=null){const r=preencherNaveV87Base_(v);setV86_('v87SlotsModulos',v?.slotsModulos??2);setV86_('v87Caracteristicas',v?.caracteristicas||'');return r;};

  window.salvarNaveV86_=async()=>{
    if(userData?.role!=='mestre')return;
    const val=id=>String(document.getElementById(id)?.value||'').trim(),orig=val('v86Orig'),id=val('v86Id')||slugV86_(val('v86Nome'));
    if(!id||!val('v86Nome'))return notificar_('Informe ID e nome.','aviso');
    const v=modeloNaveV86_({id,nome:val('v86Nome'),icone:val('v86Icone'),tipo:val('v86Tipo'),classe:val('v86Classe'),porte:val('v86Porte'),cascoMax:val('v86Casco'),blindagem:val('v86Blindagem'),escudoMax:val('v86Escudo'),energiaMax:val('v86Energia'),combustivelMax:val('v86Combustivel'),movimento:val('v86Movimento'),manobra:val('v86Manobra'),sensores:val('v86Sensores'),capacidadeCargaKg:val('v86Carga'),tripulacaoMin:val('v86TripMin'),tripulacaoMax:val('v86TripMax'),passageiros:val('v86Passageiros'),slotsArmas:val('v86Armas'),slotsModulos:val('v87SlotsModulos'),preco:val('v86Preco'),nivelAcesso:val('v86Acesso'),caracteristicas:val('v87Caracteristicas'),descricao:val('v86Descricao'),imagem:val('v86Imagem'),vendavel:document.getElementById('v86Vendavel')?.checked,disponivelCampanha:document.getElementById('v86Disponivel')?.checked});
    try{if(orig&&orig!==id)await deleteDoc(doc(db,NAVES_COL_V86_,orig));await setDoc(doc(db,NAVES_COL_V86_,id),v);await carregarNavesV86_();renderizarBancoNavesV86_();document.getElementById('modalNaveV86').classList.remove('active');notificar_('Modelo de nave salvo.','info');}catch(e){console.error(e);notificar_('Não foi possível salvar a nave.','erro');}
  };

  // Novas naves possuídas já nascem com slots instaláveis separados do porão.
  window.confirmarVinculoNaveV86_=async()=>{
    if(userData?.role!=='mestre')return;
    const mid=String(document.getElementById('v86VincModelo')?.value||''),m=navesDBV86_.find(x=>x.id===mid);if(!m)return;
    if(!naveCharsV86_.length)naveCharsV86_=await carregarPersonagensV83_();const charMap=new Map(naveCharsV86_.map(c=>[String(c.id),c]));
    const vinculos=[...document.querySelectorAll('.v86CrewCheck:checked')].map(chk=>{const c=charMap.get(String(chk.dataset.id));return {personagemId:String(chk.dataset.id),personagemNome:c?.nome||'',usuarioUid:donoUidPersonagemV85_(c)||'',papel:document.querySelector(`.v86CrewRole[data-id="${CSS.escape(chk.dataset.id)}"]`)?.value||'Tripulante'};});
    if(!vinculos.length)return notificar_('Selecione ao menos um personagem.','aviso');
    const id=`ship_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,inst={id,modeloId:m.id,nomeIndividual:String(document.getElementById('v86VincNome')?.value||m.nome).trim()||m.nome,imagemIndividual:'',modelo:JSON.parse(JSON.stringify(m)),cascoAtual:m.cascoMax,escudoAtual:m.escudoMax,energiaAtual:m.energiaMax,combustivelAtual:m.combustivelMax,estado:'Operacional',vinculos,usuariosPermitidos:[...new Set(vinculos.map(x=>x.usuarioUid).filter(Boolean))],armasInstaladas:Array(Math.max(0,Number(m.slotsArmas||0))).fill(null),modulosInstalados:Array(Math.max(0,Number(m.slotsModulos||0))).fill(null),cargaItens:Array(100).fill(null),criadoEm:new Date().toISOString(),atualizadoEm:new Date().toISOString()};
    try{await setDoc(doc(db,NAVES_POS_V86_,id),inst);document.getElementById('modalVincNaveV86_')?.classList.remove('active');document.getElementById('modalVincNaveV86')?.classList.remove('active');notificar_(`${inst.nomeIndividual} vinculada à tripulação.`,'info');}catch(e){console.error(e);notificar_('Não foi possível criar a nave possuída.','erro');}
  };

  function normalizarSlotsNaveV87_(arr,total){const n=Math.max(0,Number(total||0)),src=Array.isArray(arr)?arr:[],out=Array(n).fill(null);for(let i=0;i<Math.min(src.length,n);i++)out[i]=src[i]&&typeof src[i]==='object'?{nome:String(src[i].nome||''),descricao:String(src[i].descricao||'')}:src[i]?{nome:String(src[i]),descricao:''}:null;return out;}
  function imagemNaveV87_(v,m){return String(v?.imagemIndividual||m?.imagem||'');}

  function renderSlotsResumoV87_(titulo,icone,arr){if(!arr.length)return'';return `<h4 style="margin:13px 0 7px">${icone} ${titulo}</h4><div class="ship-slots-v87">${arr.map((x,i)=>`<div class="ship-slot-v87"><small>Slot ${i+1}</small>${x?.nome?`<b>${escV82_(x.nome)}</b>${x.descricao?`<div style="color:#9fb4cd;font-size:.78rem;margin-top:3px">${escV82_(x.descricao)}</div>`:''}`:'<span style="color:#77879b">Vazio</span>'}</div>`).join('')}</div>`;}

  function renderizarNavePossuidaV87_(v){
    const m=modeloNaveV86_(v.modelo||{}),peso=pesoCargoNaveV86_(v),cap=Number(m.capacidadeCargaKg||0),img=imagemNaveV87_(v,m);
    const armas=normalizarSlotsNaveV87_(v.armasInstaladas,m.slotsArmas),mods=normalizarSlotsNaveV87_(v.modulosInstalados,m.slotsModulos);
    return `<div class="ship-owned-v87"><div class="ship-portrait">${img?`<img src="${escV82_(img)}">`:escV82_(m.icone)}</div><div><h3 style="margin:0 0 3px">${escV82_(v.nomeIndividual||m.nome)}</h3><div style="color:#9fb4cd">${escV82_(m.tipo)} · ${escV82_(m.classe)} · ${escV82_(m.porte)} · ${escV82_(v.estado||'Operacional')}</div><div class="ship-stats"><div class="ship-stat"><small>Casco</small><b>${Number(v.cascoAtual??m.cascoMax)}/${m.cascoMax}</b></div><div class="ship-stat"><small>Escudos</small><b>${Number(v.escudoAtual??m.escudoMax)}/${m.escudoMax}</b></div><div class="ship-stat"><small>Energia</small><b>${Number(v.energiaAtual??m.energiaMax)}/${m.energiaMax}</b></div><div class="ship-stat"><small>Combustível</small><b>${Number(v.combustivelAtual??m.combustivelMax)}/${m.combustivelMax}</b></div><div class="ship-stat"><small>Blindagem</small><b>${m.blindagem}</b></div><div class="ship-stat"><small>Movimento</small><b>${m.movimento}</b></div><div class="ship-stat"><small>Manobra</small><b>${m.manobra}</b></div><div class="ship-stat"><small>Sensores</small><b>${m.sensores}</b></div></div>${m.caracteristicas?`<p><b>Características:</b> ${escV82_(m.caracteristicas)}</p>`:''}<p><b>Porão:</b> ${peso.toFixed(1)}${cap>0?` / ${cap.toFixed(1)}`:''} kg · gerenciado em <b>Inventário → Nave</b>.</p><h4>Tripulação vinculada</h4><ul>${(v.vinculos||[]).map(x=>`<li>${escV82_(x.personagemNome||x.personagemId)} — <b>${escV82_(x.papel)}</b></li>`).join('')||'<li>Nenhuma</li>'}</ul>${renderSlotsResumoV87_('Armas instaladas','🎯',armas)}${renderSlotsResumoV87_('Módulos instalados','🧩',mods)}${userData?.role==='mestre'?`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><button class="btn-small btn-select" onclick="abrirEditarNavePossuidaV87_('${escV82_(v.id)}')">⚙️ Editar nave / tripulação</button><button class="btn-small btn-delete" onclick="removerNavePossuidaV86_('${escV82_(v.id)}')">Desvincular/excluir nave possuída</button></div>`:''}</div></div>`;
  }

  window.abrirNavePossuidaV86_=function(id){const v=navesPossuidasV86_.find(x=>String(x.id)===String(id));if(!v)return;let modal=document.getElementById('modalNavePossuidaV86');if(!modal){modal=document.createElement('div');modal.id='modalNavePossuidaV86';modal.className='modal-overlay entity-modal-v85';modal.innerHTML='<div class="modal-content" style="max-width:1050px"><span class="close" onclick="this.closest(\'.modal-overlay\').classList.remove(\'active\')">&times;</span><div id="v86OwnedBody"></div></div>';document.body.appendChild(modal);}document.getElementById('v86OwnedBody').innerHTML=renderizarNavePossuidaV87_(v);aplicarUXModalEntidadeV85_();modal.classList.add('active');};

  function garantirModalEditarPossuidaV87_(){
    let modal=document.getElementById('modalEditarNavePossuidaV87');if(modal)return modal;
    modal=document.createElement('div');modal.id='modalEditarNavePossuidaV87';modal.className='modal-overlay entity-modal-v85';modal.innerHTML=`<div class="modal-content" style="max-width:1120px"><span class="close" onclick="this.closest('.modal-overlay').classList.remove('active')">&times;</span><h3>⚙️ Nave possuída</h3><input id="v87OwnedId" type="hidden"><div class="ship-editor-grid-v87"><label class="ship-editor-span2-v87">Nome individual<input id="v87OwnedName"></label><label>Estado<input id="v87OwnedState"></label><label>Imagem individual por URL<input id="v87OwnedImage"></label><label>Casco atual<input id="v87OwnedHull" type="number" min="0"></label><label>Escudo atual<input id="v87OwnedShield" type="number" min="0"></label><label>Energia atual<input id="v87OwnedEnergy" type="number" min="0"></label><label>Combustível atual<input id="v87OwnedFuel" type="number" min="0"></label><label class="ship-editor-full-v87">Enviar imagem individual<input id="v87OwnedImageFile" type="file" accept="image/*" onchange="navePossuidaLerImagemV87_(event)"></label></div><h4>Tripulação e postos</h4><div id="v87OwnedCrew"></div><h4>🎯 Armas instaladas</h4><div id="v87OwnedWeapons" class="ship-equipment-edit-v87"></div><h4>🧩 Módulos instalados</h4><div id="v87OwnedModules" class="ship-equipment-edit-v87"></div><button class="btn-save" style="margin-top:14px" onclick="salvarNavePossuidaV87_()">💾 Salvar nave e tripulação</button></div>`;document.body.appendChild(modal);aplicarUXModalEntidadeV85_();return modal;
  }

  window.navePossuidaLerImagemV87_=ev=>{const f=ev?.target?.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const max=640,sc=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*sc));c.height=Math.max(1,Math.round(im.height*sc));c.getContext('2d').drawImage(im,0,0,c.width,c.height);document.getElementById('v87OwnedImage').value=c.toDataURL('image/webp',.84);};im.src=r.result;};r.readAsDataURL(f);};

  window.abrirEditarNavePossuidaV87_=async id=>{
    if(userData?.role!=='mestre')return;const v=navesPossuidasV86_.find(x=>String(x.id)===String(id));if(!v)return;
    const modal=garantirModalEditarPossuidaV87_(),m=modeloNaveV86_(v.modelo||{});
    document.getElementById('v87OwnedId').value=v.id;document.getElementById('v87OwnedName').value=v.nomeIndividual||m.nome;document.getElementById('v87OwnedState').value=v.estado||'Operacional';document.getElementById('v87OwnedImage').value=v.imagemIndividual||'';document.getElementById('v87OwnedHull').value=Number(v.cascoAtual??m.cascoMax);document.getElementById('v87OwnedShield').value=Number(v.escudoAtual??m.escudoMax);document.getElementById('v87OwnedEnergy').value=Number(v.energiaAtual??m.energiaMax);document.getElementById('v87OwnedFuel').value=Number(v.combustivelAtual??m.combustivelMax);
    naveCharsV86_=await carregarPersonagensV83_();const atuais=new Map((v.vinculos||[]).map(x=>[String(x.personagemId),x]));const chars=naveCharsV86_.filter(c=>String(c.tipo||'pc').toLowerCase()!=='npc');
    document.getElementById('v87OwnedCrew').innerHTML=chars.map(c=>{const a=atuais.get(String(c.id));return `<div class="ship-crew-row-v87"><input type="checkbox" class="v87OwnedCrewCheck" data-id="${escV82_(c.id)}" ${a?'checked':''}><span>${escV82_(c.nome||'Sem nome')}</span><select class="v87OwnedCrewRole" data-id="${escV82_(c.id)}">${ROLES_V87_.map(r=>`<option ${String(a?.papel||'Tripulante')===r?'selected':''}>${r}</option>`).join('')}</select></div>`;}).join('');
    const armas=normalizarSlotsNaveV87_(v.armasInstaladas,m.slotsArmas),mods=normalizarSlotsNaveV87_(v.modulosInstalados,m.slotsModulos);
    document.getElementById('v87OwnedWeapons').innerHTML=armas.map((x,i)=>`<div class="ship-equip-row-v87"><b>Slot de arma ${i+1}</b><input class="v87WeaponName" data-i="${i}" placeholder="Nome da arma" value="${escV82_(x?.nome||'')}"><textarea class="v87WeaponDesc" data-i="${i}" rows="2" placeholder="Características / observações">${escV82_(x?.descricao||'')}</textarea></div>`).join('')||'<p style="color:#8292a8">Este modelo não possui slots de armas.</p>';
    document.getElementById('v87OwnedModules').innerHTML=mods.map((x,i)=>`<div class="ship-equip-row-v87"><b>Slot de módulo ${i+1}</b><input class="v87ModuleName" data-i="${i}" placeholder="Nome do módulo" value="${escV82_(x?.nome||'')}"><textarea class="v87ModuleDesc" data-i="${i}" rows="2" placeholder="Efeito / observações">${escV82_(x?.descricao||'')}</textarea></div>`).join('')||'<p style="color:#8292a8">Este modelo não possui slots de módulos.</p>';
    modal.classList.add('active');
  };

  function lerEquipamentosModalV87_(prefix,total){const out=Array(Math.max(0,Number(total||0))).fill(null);for(let i=0;i<out.length;i++){const n=String(document.querySelector(`.${prefix}Name[data-i="${i}"]`)?.value||'').trim(),d=String(document.querySelector(`.${prefix}Desc[data-i="${i}"]`)?.value||'').trim();if(n||d)out[i]={nome:n||`Slot ${i+1}`,descricao:d};}return out;}

  window.salvarNavePossuidaV87_=async()=>{
    if(userData?.role!=='mestre')return;const id=String(document.getElementById('v87OwnedId')?.value||''),v=navesPossuidasV86_.find(x=>String(x.id)===id);if(!v)return;
    const m=modeloNaveV86_(v.modelo||{});if(!naveCharsV86_.length)naveCharsV86_=await carregarPersonagensV83_();const cmap=new Map(naveCharsV86_.map(c=>[String(c.id),c]));
    const vinculos=[...document.querySelectorAll('.v87OwnedCrewCheck:checked')].map(chk=>{const cid=String(chk.dataset.id),c=cmap.get(cid);return {personagemId:cid,personagemNome:c?.nome||'',usuarioUid:donoUidPersonagemV85_(c)||'',papel:document.querySelector(`.v87OwnedCrewRole[data-id="${CSS.escape(cid)}"]`)?.value||'Tripulante'};});
    if(!vinculos.length)return notificar_('A nave deve permanecer vinculada a pelo menos um personagem.','aviso');
    const patch={nomeIndividual:String(document.getElementById('v87OwnedName')?.value||m.nome).trim()||m.nome,estado:String(document.getElementById('v87OwnedState')?.value||'Operacional').trim()||'Operacional',imagemIndividual:String(document.getElementById('v87OwnedImage')?.value||'').trim(),cascoAtual:Math.max(0,Math.min(m.cascoMax,numV86_(document.getElementById('v87OwnedHull')?.value,m.cascoMax))),escudoAtual:Math.max(0,Math.min(m.escudoMax,numV86_(document.getElementById('v87OwnedShield')?.value,m.escudoMax))),energiaAtual:Math.max(0,Math.min(m.energiaMax,numV86_(document.getElementById('v87OwnedEnergy')?.value,m.energiaMax))),combustivelAtual:Math.max(0,Math.min(m.combustivelMax,numV86_(document.getElementById('v87OwnedFuel')?.value,m.combustivelMax))),vinculos,usuariosPermitidos:[...new Set(vinculos.map(x=>x.usuarioUid).filter(Boolean))],armasInstaladas:lerEquipamentosModalV87_('v87Weapon',m.slotsArmas),modulosInstalados:lerEquipamentosModalV87_('v87Module',m.slotsModulos),atualizadoEm:new Date().toISOString()};
    try{await setDoc(doc(db,NAVES_POS_V86_,id),patch,{merge:true});Object.assign(v,patch);document.getElementById('modalEditarNavePossuidaV87')?.classList.remove('active');document.getElementById('modalNavePossuidaV86')?.classList.remove('active');renderizarNavesPersonagemV86_();renderizarCargaNaveInventarioV86_(charAtualV84_());notificar_('Nave, equipamentos e tripulação atualizados.','info');}catch(e){console.error(e);notificar_('Não foi possível atualizar a nave possuída.','erro');}
  };

  // A lateral passa a mostrar a imagem individual da nave, quando houver.
  renderizarNavesPersonagemV86_=function(){const b=document.getElementById('charShipsV86'),c=charAtualV84_();if(!b)return;const arr=navesDoPersonagemV86_(c);if(!arr.length){b.style.display='none';b.innerHTML='';return;}b.style.display='block';b.innerHTML='<div class="cv82-title">Naves</div>'+arr.map(v=>{const papel=(v.vinculos||[]).find(x=>String(x.personagemId)===String(c.id))?.papel||'Tripulante',m=modeloNaveV86_(v.modelo||{}),img=imagemNaveV87_(v,m);return `<button class="cv82-link" onclick="abrirNavePossuidaV86_('${escV82_(v.id)}')"><span class="cv82-avatar">${img?`<img src="${escV82_(img)}">`:escV82_(m.icone)}</span><span class="cv82-copy"><span class="cv82-name">${escV82_(v.nomeIndividual||m.nome)}</span><span class="cv82-meta">${escV82_(papel)} · ${escV82_(m.classe)} · Casco ${Number(v.cascoAtual??m.cascoMax)}/${m.cascoMax}</span></span></button>`;}).join('');};

  function iniciarV87_(){instalarEstilosV87_();compactarFormularioPersonagemV87_();garantirModalNaveV86_();aplicarUXModalEntidadeV85_();renderizarNavesPersonagemV86_();}
  if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(iniciarV87_,650));else setTimeout(iniciarV87_,650);}
  if(typeof window.addEventListener==='function')window.addEventListener('personagem-selecionado',()=>setTimeout(()=>{compactarFormularioPersonagemV87_();renderizarNavesPersonagemV86_();},0));
  console.info('[Mesa Estelar] v87 acabamento da ficha + edição completa de nave carregados');
  window.__MESA_PATCH__='v87-interface-e-naves';
})();

// ============================================================================
// v88 · correção robusta de vínculos laterais e naves visíveis ao jogador
// Problemas corrigidos:
// 1) cartões dinâmicos de Veículos/Naves eram removidos quando a lateral da
//    ficha era reconstruída e algumas rotas chamavam apenas "render", não
//    remontavam os contêineres;
// 2) naves possuídas no jogador dependiam de usuariosPermitidos para a própria
//    leitura. Instâncias antigas/incompletas podiam então ficar invisíveis antes
//    que o mestre conseguisse reconciliar a permissão. A leitura volta a ser da
//    coleção autenticada (como Veículos), filtrando por personagem no cliente;
//    alterações de carga continuam protegidas pelas regras e usuariosPermitidos.
// ============================================================================
let entidadesLateraisReflowV88_=false;
function remontarEntidadesLateraisV88_(){
  if(entidadesLateraisReflowV88_)return;
  entidadesLateraisReflowV88_=true;
  try{
    if(typeof montarVinculosPersonagemV82_==='function')montarVinculosPersonagemV82_();
    if(typeof montarVeiculosPersonagemV83_==='function')montarVeiculosPersonagemV83_();
    if(typeof montarNavesPersonagemV86_==='function')montarNavesPersonagemV86_();
    const c=typeof charAtualV84_==='function'?charAtualV84_():null;
    if(c&&typeof renderizarCargaVeiculoInventarioV85_==='function')renderizarCargaVeiculoInventarioV85_(c);
    if(c&&typeof renderizarCargaNaveInventarioV86_==='function')renderizarCargaNaveInventarioV86_(c);
  }catch(e){console.warn('v88 remontar entidades laterais',e);}
  finally{entidadesLateraisReflowV88_=false;}
}

// Sempre que a identidade/contexto da ficha for atualizado, garante novamente
// os blocos dinâmicos. Isso cobre troca de personagem, re-render da ficha e
// mudanças de aba que recriem a coluna lateral.
if(typeof atualizarContextoPersonagemV66_==='function'){
  const atualizarContextoPersonagemV88Base_=atualizarContextoPersonagemV66_;
  atualizarContextoPersonagemV66_=function(){
    const r=atualizarContextoPersonagemV88Base_.apply(this,arguments);
    queueMicrotask(()=>remontarEntidadesLateraisV88_());
    return r;
  };
}

// Snapshot de naves: leitura autenticada da coleção completa, tal como veículos.
// A interface continua mostrando apenas as naves cujo vinculo.personagemId
// corresponde ao personagem selecionado.
iniciarNavesAoVivoV86_=function(){
  if(navesPossuidasUnsubV86_){try{navesPossuidasUnsubV86_();}catch(_){ }navesPossuidasUnsubV86_=null;}
  if(!currentUserUid)return;
  try{
    const fonteNaves=collection(db,NAVES_POS_V86_);
    navesPossuidasUnsubV86_=onSnapshot(fonteNaves,snap=>{
      navesPossuidasV86_=[];
      snap.forEach(d=>navesPossuidasV86_.push({id:d.id,...d.data()}));
      remontarEntidadesLateraisV88_();
      if(userData?.role==='mestre')setTimeout(async()=>{
        for(const n of navesPossuidasV86_)try{await migrarPermissoesNaveV86_(n);}catch(e){console.warn('migração nave v88',n.id,e);}
      },0);
    },err=>console.warn('naves ao vivo v88',err));
  }catch(e){console.warn('não foi possível iniciar naves ao vivo v88',e);}
};

// Reforça o mesmo princípio nos snapshots de veículos: além de atualizar o
// inventário, remonta o cartão lateral caso a lateral tenha sido reconstruída.
function reiniciarVeiculosAoVivoV88_(){
  if(veiculosPossuidosUnsubV85_){try{veiculosPossuidosUnsubV85_();}catch(_){ }veiculosPossuidosUnsubV85_=null;}
  if(!currentUserUid)return;
  try{
    veiculosPossuidosUnsubV85_=onSnapshot(collection(db,VEICULOS_POS_V83_),snap=>{
      veiculosPossuidosV83_=[];
      snap.forEach(d=>veiculosPossuidosV83_.push({id:d.id,...d.data()}));
      remontarEntidadesLateraisV88_();
      if(userData?.role==='mestre')setTimeout(reconciliarVeiculosV85_,0);
    },err=>console.warn('veículos ao vivo v88',err));
  }catch(e){console.warn('não foi possível iniciar veículos ao vivo v88',e);}
}

function iniciarV88_(){
  remontarEntidadesLateraisV88_();
  reiniciarVeiculosAoVivoV88_();
  iniciarNavesAoVivoV86_();

  const aside=document.getElementById('charContextV66');
  if(aside&&typeof MutationObserver==='function'&&!aside.dataset.entidadesObsV88){
    aside.dataset.entidadesObsV88='1';
    let agendado=false;
    new MutationObserver(()=>{
      if(agendado)return;
      if(document.getElementById('charVehiclesV83')&&document.getElementById('charShipsV86'))return;
      agendado=true;
      setTimeout(()=>{agendado=false;remontarEntidadesLateraisV88_();},0);
    }).observe(aside,{childList:true,subtree:false});
  }
}

if(typeof window.addEventListener==='function')window.addEventListener('personagem-selecionado',()=>setTimeout(remontarEntidadesLateraisV88_,0));
if(typeof onAuthStateChanged==='function'&&typeof auth!=='undefined')onAuthStateChanged(auth,user=>{if(user)setTimeout(iniciarV88_,1100);});
if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(iniciarV88_,900));
  else setTimeout(iniciarV88_,900);
}
console.info('[Mesa Estelar] v88 vínculos de veículos/naves reparados e remontagem lateral carregada');
window.__MESA_PATCH__='v88-vinculos-veiculos-naves';

// ============================================================================
// v89 · Interações de cenário com múltiplas perícias, limite diário e Sorte
// + polimento visual dos inventários compartilhados de veículo/nave.
// ============================================================================
(function(){
  function instalarEstilosV89_(){
    if(document.getElementById('mesaV89Styles'))return;
    const st=document.createElement('style');st.id='mesaV89Styles';st.textContent=`
      /* Itens compartilhados ficam contidos no slot; o ícone da entidade vira badge sobreposto. */
      #inventoryVehicleSharedV85 .inventory-slot.v85-shared,
      #inventoryShipSharedV85 .inventory-slot.v85-shared{position:relative!important;overflow:hidden!important;isolation:isolate}
      #inventoryVehicleSharedV85 .inventory-slot.v85-shared>img,
      #inventoryShipSharedV85 .inventory-slot.v85-shared>img{display:block!important;width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important;margin:0!important;position:relative!important;inset:auto!important;transform:none!important}
      #inventoryVehicleSharedV85 .v85-shared-badge,
      #inventoryShipSharedV85 .v85-shared-badge{position:absolute!important;right:3px!important;top:3px!important;left:auto!important;bottom:auto!important;z-index:6!important;display:flex!important;align-items:center!important;justify-content:center!important;min-width:20px!important;height:20px!important;padding:0 3px!important;border-radius:6px!important;background:rgba(8,12,28,.88)!important;border:1px solid rgba(0,212,255,.55)!important;color:#dff9ff!important;font-size:.72rem!important;line-height:1!important;pointer-events:none!important;box-shadow:0 2px 5px rgba(0,0,0,.35)!important}

      .cenario-v89-skillrow{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:8px}
      .cenario-v89-skillrow select{min-width:190px;flex:1 1 210px}
      .cenario-v89-attempt{margin-top:7px;padding:7px 8px;border-radius:7px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08);color:#aebbd0;font-size:.82rem;line-height:1.35}
      .cenario-v89-attempt.success{background:rgba(86,240,138,.055);border-color:rgba(86,240,138,.16);color:#cce9d6}
      .cenario-v89-attempt.fail{background:rgba(255,107,107,.055);border-color:rgba(255,107,107,.16);color:#ffc4c4}
      .cenario-v89-luck{background:linear-gradient(180deg,#b89214,#806508)!important;color:#fff!important;border-color:#e3c34c!important}
      #cenarioInteracoesBuilderV77 select[multiple]{min-height:150px;padding:6px}
    `;document.head.appendChild(st);
  }

  function tokensPericiasInteracaoV89_(acao){
    const raw=Array.isArray(acao?.pericias)?acao.pericias.join(';'):String(acao?.pericias||acao?.pericia||'');
    return raw.split(';').map(x=>x.trim()).filter(x=>x&&x!=='—'&&x!=='-').filter((x,i,a)=>a.indexOf(x)===i);
  }
  function periciasResolvidasInteracaoV89_(acao){
    return tokensPericiasInteracaoV89_(acao).map(token=>({token,p:acharPericiaInteracaoV76_(token)})).filter(x=>x.p);
  }
  function idCenarioAtualV89_(){const c=typeof obterPersonagemAtual_==='function'?obterPersonagemAtual_():null;const local=(userData?.role!=='mestre'&&c)?String(c.localizacaoCenarioId||''):'';return String(local||campanhaPublica_?.cenarioId||estadoCampanhaMestre?.cenarioId||'cenario');}
  function diaAtualV89_(){return typeof diaCampanhaV77_==='function'?String(diaCampanhaV77_()):String(Math.max(1,Number(campanhaPublica_?.diaCampanha||1)));}
  function chavePericiaV89_(p){return String(p?.id||normalizarTextoCombate_(getNome(p)||'pericia')).trim();}
  function estadoDiarioInteracaoV89_(char,acaoId,criar=false){
    if(!char)return null;const dia=diaAtualV89_(),cid=idCenarioAtualV89_();
    if(criar){
      char.cenarioInteracoesDiariasV89={...(char.cenarioInteracoesDiariasV89||{})};
      char.cenarioInteracoesDiariasV89[dia]={...(char.cenarioInteracoesDiariasV89[dia]||{})};
      char.cenarioInteracoesDiariasV89[dia][cid]={...(char.cenarioInteracoesDiariasV89[dia][cid]||{})};
      char.cenarioInteracoesDiariasV89[dia][cid][String(acaoId)]={...(char.cenarioInteracoesDiariasV89[dia][cid][String(acaoId)]||{}),usadas:{...(char.cenarioInteracoesDiariasV89[dia][cid][String(acaoId)]?.usadas||{})}};
    }
    return char.cenarioInteracoesDiariasV89?.[dia]?.[cid]?.[String(acaoId)]||null;
  }
  function descobertaSkillV89_(char,acaoId,pid){return char?.cenarioDescobertasV89?.[idCenarioAtualV89_()]?.[String(acaoId)]?.[String(pid)]||null;}
  async function persistirInteracaoV89_(char,acao,p,registro,descobertaTexto=''){
    const st=estadoDiarioInteracaoV89_(char,acao.id,true),pid=chavePericiaV89_(p);st.usadas[pid]=registro;
    const patch={cenarioInteracoesDiariasV89:char.cenarioInteracoesDiariasV89||{}};
    if(descobertaTexto){
      char.cenarioDescobertasV89={...(char.cenarioDescobertasV89||{})};const cid=idCenarioAtualV89_();
      char.cenarioDescobertasV89[cid]={...(char.cenarioDescobertasV89[cid]||{})};
      char.cenarioDescobertasV89[cid][String(acao.id)]={...(char.cenarioDescobertasV89[cid][String(acao.id)]||{})};
      char.cenarioDescobertasV89[cid][String(acao.id)][pid]={titulo:acao.titulo,texto:descobertaTexto,grau:registro.grau,rolagem:registro.rolagem,valor:registro.valor,periciaId:pid,em:registro.em,rerrolagemSorte:!!registro.rerrolagemSorte};
      patch.cenarioDescobertasV89=char.cenarioDescobertasV89;
    }
    await setDoc(doc(db,'personagens',char.id),patch,{merge:true});
  }
  function resultadoTextoInteracaoV89_(acao,r){
    const grau=String(r?.grau||'');
    if(grau==='Crítico')return acao.critico||acao.sucesso||acao.evidente||'Você percebe algo importante.';
    if(r?.sucesso)return acao.sucesso||acao.evidente||'A ação é bem-sucedida.';
    return acao.falha||'Você não descobre nada além do que já era evidente.';
  }
  async function gastarSorteInteracaoV89_(char){
    const atual=pontosSorteAtuais_(char);if(atual<=0)return false;const novo=atual-1;
    char.pontosSorte=novo;char.pontosSorteDerivadoV15=true;
    await setDoc(doc(db,'personagens',char.id),{pontosSorte:novo,pontosSorteDerivadoV15:true},{merge:true});
    try{atualizarPontosSorteEMagia_(char);atualizarResumoPersonagemV72_();}catch(_){ }
    return novo;
  }
  async function registrarHistoricoInteracaoV89_(char,acao,p,registro,texto){
    // O histórico geral já replica o registro para o histórico do mestre.
    try{
      await registrarHistoricoGeral_('Teste',`${acao.titulo} · ${getNome(p)}: ${registro.rolagem}/${registro.valor} → ${registro.grau}${registro.rerrolagemSorte?' · rerrolagem por Sorte':''} · ${texto}`,{
        subtipo:'interacao_cenario',cenarioId:idCenarioAtualV89_(),acaoId:acao.id,acaoTitulo:acao.titulo,periciaId:p.id,rolagem:registro.rolagem,valorEfetivo:registro.valor,grau:registro.grau,rerrolagemSorte:!!registro.rerrolagemSorte
      });
    }catch(e){console.warn('histórico interação v89',e);}
  }

  window.executarInteracaoCenarioV89_=async function(id,usarSorte=false){
    const ac=(campanhaPublica_?.interacoes?.acoes||[]).find(x=>String(x.id)===String(id)),char=obterPersonagemAtual_();
    if(!ac)return notificar_('Interação indisponível.','aviso');if(!char)return notificar_('Selecione um personagem na aba Ficha.','aviso');
    const skills=periciasResolvidasInteracaoV89_(ac);
    if(!skills.length){
      const texto=ac.sucesso||ac.evidente||'Você conclui a interação.';
      notificar_(`${ac.icone||'🧭'} ${ac.titulo}: ${texto}`,'info',6000);return;
    }
    const sel=document.getElementById(`cenarioSkillV89_${CSS.escape(String(ac.id))}`),token=String(sel?.value||skills[0].p.id),escolha=skills.find(x=>String(x.p.id)===token||String(x.token)===token)||skills[0],p=escolha.p,pid=chavePericiaV89_(p);
    const st=estadoDiarioInteracaoV89_(char,ac.id,true),anterior=st.usadas?.[pid]||null;
    if(anterior&&!usarSorte)return notificar_('Esta perícia já foi testada nesta interação hoje. Você pode gastar 1 ponto de Sorte para rerrolar.','aviso',5200);
    if(usarSorte){
      if(!anterior)return notificar_('Faça primeiro a tentativa normal com esta perícia.','aviso');
      if(pontosSorteAtuais_(char)<=0)return notificar_('Este personagem não possui Pontos de Sorte disponíveis.','aviso');
      try{await gastarSorteInteracaoV89_(char);}catch(e){console.error(e);return notificar_('Não foi possível gastar o Ponto de Sorte.','erro');}
    }
    const bruto=obterValorRegistroPericia_(char,p.id,false),arm=valorPericiaComArmadura_(char,p,bruto),aj=aplicarDificuldadeEFadiga_(char,arm.valor,dificuldadeIdV76_(ac.dificuldade),0);
    if(aj.bloqueado)return notificar_('O estado atual do personagem impede este teste.','aviso');
    const valor=Number(aj.valor||0),roll=Math.floor(Math.random()*100)+1,r=classificarD100_(valor,roll),texto=resultadoTextoInteracaoV89_(ac,r),registro={em:new Date().toISOString(),rolagem:roll,valor,grau:String(r.grau||''),sucesso:!!r.sucesso,rerrolagemSorte:!!usarSorte,rerrolagens:Number(anterior?.rerrolagens||0)+(usarSorte?1:0)};
    // A rerrolagem substitui o resultado diário anterior, mesmo se vier pior.
    try{await persistirInteracaoV89_(char,ac,p,registro,r.sucesso?texto:'');}catch(e){console.warn('persistir interação v89',e);}
    try{await registrarHistoricoInteracaoV89_(char,ac,p,registro,texto);}catch(_){ }
    try{somDado_();}catch(_){ }
    notificar_(`${ac.icone||'🧭'} ${ac.titulo} · ${getNome(p)} ${roll}/${valor} (${r.grau})${usarSorte?' · ⭐ Sorte':''}: ${texto}`,'info',7500);
    renderizarCenarioAtualPublico_();
  };

  // Mantém compatibilidade com chamadas antigas de uma única perícia.
  window.executarInteracaoCenarioV76_=function(id){return window.executarInteracaoCenarioV89_(id,false);};

  function cardAcaoCenarioV89_(a,char){
    const skills=periciasResolvidasInteracaoV89_(a),idEsc=String(a.id).replace(/'/g,"\\'");
    if(!skills.length){
      const d=char?descobertaInteracaoV76_(char,a):null;
      return `<div class="cenario-v76-card"><div class="acao-topo"><div class="cenario-v76-icon">${escaparHtmlInventario_(a.icone||'🧭')}</div><div style="min-width:0;flex:1"><b>${escaparHtmlInventario_(a.titulo)}</b></div></div>${a.evidente?`<div class="cenario-v76-desc">${escaparHtmlInventario_(a.evidente)}</div>`:''}${d?`<div class="cenario-v76-result">✓ ${escaparHtmlInventario_(d.texto||'Concluído')}</div>`:`<button class="btn-small btn-select" style="margin-top:7px" ${char?'':'disabled'} onclick="executarInteracaoCenarioV89_('${idEsc}',false)">▶ Interagir</button>`}</div>`;
    }
    const st=char?estadoDiarioInteracaoV89_(char,a.id,false):null;
    const options=skills.map(({p})=>{const pid=chavePericiaV89_(p),used=st?.usadas?.[pid],label=`${getNome(p)}${used?' · usada hoje':''}`;return `<option value="${escaparHtmlInventario_(p.id)}">${escaparHtmlInventario_(label)}</option>`;}).join('');
    const statuses=char?skills.map(({p})=>{const pid=chavePericiaV89_(p),r=st?.usadas?.[pid],d=descobertaSkillV89_(char,a.id,pid);if(!r&&!d)return'';const cls=(r?.sucesso||d)?'success':'fail',txt=d?.texto||(r?`${getNome(p)}: ${r.rolagem}/${r.valor} → ${r.grau}`:'');return `<div class="cenario-v89-attempt ${cls}"><b>${escaparHtmlInventario_(getNome(p))}</b>${r?` · ${r.rolagem}/${r.valor} → ${escaparHtmlInventario_(r.grau)}${r.rerrolagemSorte?' · ⭐ rerrolado':''}`:''}${d?`<br>✓ ${escaparHtmlInventario_(d.texto)}`:''}</div>`;}).join(''):'';
    return `<div class="cenario-v76-card"><div class="acao-topo"><div class="cenario-v76-icon">${escaparHtmlInventario_(a.icone||'🧭')}</div><div style="min-width:0;flex:1"><b>${escaparHtmlInventario_(a.titulo)}</b><br><small style="color:#8fa8bc">${escaparHtmlInventario_(a.dificuldade||'Padrão')} · ${skills.length} perícia${skills.length>1?'s':''} permitida${skills.length>1?'s':''}</small></div></div>${a.evidente?`<div class="cenario-v76-desc">${escaparHtmlInventario_(a.evidente)}</div>`:''}<div class="cenario-v89-skillrow"><select id="cenarioSkillV89_${escaparHtmlInventario_(a.id)}" ${char?'':'disabled'}>${options}</select><button class="btn-small btn-select" ${char?'':'disabled'} onclick="executarInteracaoCenarioV89_('${idEsc}',false)">🎲 Testar</button><button class="btn-small cenario-v89-luck" ${char&&pontosSorteAtuais_(char)>0?'':'disabled'} onclick="executarInteracaoCenarioV89_('${idEsc}',true)">⭐ Rerrolar (${char?pontosSorteAtuais_(char):0})</button></div><small style="display:block;color:#8ea7c8;margin-top:6px">Limite: 1 tentativa por perícia por dia. Sorte permite rerrolar e substitui o resultado anterior.</small>${statuses}</div>`;
  }

  // Substitui somente a renderização das ações; comércio/serviços continuam iguais.
  anexarInteracoesCenarioV73_=function(){
    const ctx=(typeof window!=='undefined'&&typeof window.obterInteracoesContextuaisV91_==='function')?window.obterInteracoesContextuaisV91_():(campanhaPublica_?.interacoes||{});const merchants=ctx?.comerciantes||[],acoes=ctx?.acoes||[],char=obterPersonagemAtual_();
    const alvos=['globalCurrentScenarioPublic','charCurrentScenarioPublic'].map(id=>document.getElementById(id)).filter(Boolean);
    alvos.forEach(el=>{el.querySelector('#cenarioInteracoesV73')?.remove();const box=document.createElement('div');box.id='cenarioInteracoesV73';box.style.marginTop='16px';
      const ahtml=acoes.length?`<h4 style="color:#8feaff;margin:12px 0 8px">Ações e descobertas</h4><div class="cenario-v76-grid">${acoes.map(a=>cardAcaoCenarioV89_(a,char)).join('')}</div>`:'';
      const mhtml=merchants.length?`<h4 style="color:#ffd166;margin:14px 0 8px">Comércio e serviços</h4><div class="cenario-v76-grid">${merchants.map(m=>{const rot=m.comerciante&&m.prestadorServicos?'🛒 Comércio / Serviços':m.comerciante?'🛒 Comércio':'🧰 Serviços';return `<div class="cenario-v76-card" style="display:flex;align-items:center;gap:9px">${m.imagem?`<img src="${escaparHtmlInventario_(m.imagem)}" style="width:54px;height:54px;border-radius:10px;object-fit:cover">`:'<div class="cenario-v76-icon">🧭</div>'}<div style="min-width:0;flex:1"><b>${escaparHtmlInventario_(m.nome)}</b><br><small style="color:#aaa">${escaparHtmlInventario_(m.comercioNome||'Interação')}</small><br><button class="btn-small btn-select" style="margin-top:6px" onclick="abrirComercioCenarioV73_('${String(m.id).replace(/'/g,"\\'")}')">${rot}</button></div></div>`;}).join('')}</div>`:'';
      box.innerHTML=`<div style="padding:14px;border-radius:11px;background:rgba(0,212,255,.045);border:1px solid rgba(0,212,255,.18)"><h3 style="margin:0 0 5px;color:#8feaff">🧭 Interações do cenário</h3><div style="color:#999;margin-bottom:8px">Ações disponíveis neste local sem depender do mapa.</div>${ahtml}${mhtml}${!acoes.length&&!merchants.length?'<div style="color:#777">Nenhuma interação especial publicada neste cenário.</div>':''}</div>`;el.appendChild(box);});
  };

  // Editor guiado: o campo de perícia passa a aceitar múltiplas opções reais do banco.
  function atualizarSeletorMultipericiaV89_(){
    const old=document.getElementById('v77AcaoPericia');if(!old||old.multiple)return;
    const sel=document.createElement('select');sel.id='v77AcaoPericia';sel.multiple=true;sel.size=6;sel.title='Selecione uma ou mais perícias permitidas. Deixe vazio para uma interação sem teste.';
    sel.innerHTML=(periciasDB||[]).slice().sort((a,b)=>getNome(a).localeCompare(getNome(b),'pt-BR')).map(p=>`<option value="${escaparHtmlInventario_(p.id)}">${escaparHtmlInventario_(getNome(p))}</option>`).join('');
    old.replaceWith(sel);const label=sel.closest('label');if(label)label.firstChild.textContent='Perícias (0 ou mais)';
  }
  const adicionarInteracaoGuiadaV89Base_=window.adicionarInteracaoGuiadaV77_;
  window.adicionarInteracaoGuiadaV77_=function(){
    const sel=document.getElementById('v77AcaoPericia');
    if(!sel?.multiple)return adicionarInteracaoGuiadaV89Base_?.apply(this,arguments);
    const ta=document.getElementById('dbScenarioInteracoesV76'),titulo=limparCampoInteracaoV77_(document.getElementById('v77AcaoTitulo')?.value);if(!ta||!titulo){notificar_('Dê um título à interação.','aviso');return;}
    const pericias=[...sel.selectedOptions].map(o=>o.value).filter(Boolean).join(';')||'—';
    const vals=[titulo,limparCampoInteracaoV77_(document.getElementById('v77AcaoIcone')?.value)||'🧭',pericias,limparCampoInteracaoV77_(document.getElementById('v77AcaoDificuldade')?.value)||'Padrão',limparCampoInteracaoV77_(document.getElementById('v77AcaoEvidente')?.value),limparCampoInteracaoV77_(document.getElementById('v77AcaoSucesso')?.value),limparCampoInteracaoV77_(document.getElementById('v77AcaoCritico')?.value),limparCampoInteracaoV77_(document.getElementById('v77AcaoFalha')?.value)];
    ta.value=(ta.value.trim()?ta.value.trim()+'\n':'')+vals.join('|');
    ['v77AcaoTitulo','v77AcaoEvidente','v77AcaoSucesso','v77AcaoCritico','v77AcaoFalha'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});[...sel.options].forEach(o=>o.selected=false);notificar_('Interação adicionada com as perícias selecionadas. Salve o cenário para publicar.','sucesso',3200);
  };

  // Parse/publicação preservam a string de múltiplas perícias no campo existente.
  const parseInteracoesCenarioV89Base_=parseInteracoesCenarioV76_;
  parseInteracoesCenarioV76_=function(v){return parseInteracoesCenarioV89Base_(v).map(a=>({...a,pericias:tokensPericiasInteracaoV89_(a)}));};
  const interacoesPublicasCenarioV89Base_=interacoesPublicasCenarioV76_;
  interacoesPublicasCenarioV76_=function(){return interacoesPublicasCenarioV89Base_().map(a=>({...a,pericias:tokensPericiasInteracaoV89_(a)}));};

  function iniciarV89_(){instalarEstilosV89_();setTimeout(atualizarSeletorMultipericiaV89_,0);try{anexarInteracoesCenarioV73_();}catch(_){ }}
  if(typeof preencherModalCenarioBanco_==='function'){
    const preencherModalCenarioBancoV89Base_=preencherModalCenarioBanco_;
    preencherModalCenarioBanco_=function(){const r=preencherModalCenarioBancoV89Base_.apply(this,arguments);setTimeout(atualizarSeletorMultipericiaV89_,0);return r;};
  }
  if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(iniciarV89_,950));else setTimeout(iniciarV89_,950);}
  if(typeof window.addEventListener==='function')window.addEventListener('personagem-selecionado',()=>setTimeout(()=>{try{anexarInteracoesCenarioV73_();}catch(_){}},0));
  // v109: ponte para as interações no mapa (mesa-interacoes.js). Mesmas regras do Cenário Atual.
  try{window.mesaInteracoesMapaV109_={
    contexto:()=>{try{return (typeof window.obterInteracoesContextuaisV91_==='function'?window.obterInteracoesContextuaisV91_():campanhaPublica_?.interacoes)||{};}catch(_){return campanhaPublica_?.interacoes||{};}},
    parse:txt=>{try{return parseInteracoesCenarioV76_(txt).map(a=>({...a,pericias:tokensPericiasInteracaoV89_(a)}));}catch(_){return [];}},
    personagemId:()=>{try{return String(obterPersonagemAtual_()?.id||'');}catch(_){return '';}},
    pericias:acao=>{
      const char=obterPersonagemAtual_(),st=char?estadoDiarioInteracaoV89_(char,acao.id,false):null;
      return periciasResolvidasInteracaoV89_(acao).map(({p})=>{const pid=chavePericiaV89_(p),r=st?.usadas?.[pid]||null,d=char?descobertaSkillV89_(char,acao.id,pid):null;let valor=null;try{if(char)valor=Number(obterValorRegistroPericia_(char,p.id,false))||0;}catch(_){}
        return {id:String(p.id),nome:getNome(p),valor,usada:!!r,texto:d?.texto||'',resultado:r?{rolagem:r.rolagem,valor:r.valor,grau:r.grau,sucesso:!!r.sucesso}:null};});
    },
    executar:async(acaoId,pid,usarSorte=false)=>{
      const ac=(campanhaPublica_?.interacoes?.acoes||[]).find(x=>String(x.id)===String(acaoId));
      const sid=`cenarioSkillV89_${CSS.escape(String(acaoId))}`;let sel=document.getElementById(sid),temp=null,antigo='';
      if(pid){if(!sel){temp=document.createElement('select');temp.id=sid;temp.hidden=true;document.body.appendChild(temp);sel=temp;}
        antigo=sel.value;if(![...sel.options].some(o=>o.value===String(pid))){const o=document.createElement('option');o.value=String(pid);sel.appendChild(o);}sel.value=String(pid);}
      try{await window.executarInteracaoCenarioV89_(acaoId,!!usarSorte);}finally{if(temp)temp.remove();else if(sel&&pid){try{sel.value=antigo;}catch(_){}}}
      if(!ac)return null;const char=obterPersonagemAtual_(),skills=periciasResolvidasInteracaoV89_(ac);if(!skills.length)return {sucesso:null,grau:'Feito'};
      const p=(skills.find(x=>String(x.p.id)===String(pid))||skills[0]).p,r=char?estadoDiarioInteracaoV89_(char,ac.id,false)?.usadas?.[chavePericiaV89_(p)]:null;
      return r?{sucesso:!!r.sucesso,grau:String(r.grau||'')}:null;
    },
    comercio:id=>window.abrirComercioCenarioV73_?.(id),
    comerciante:id=>{try{return comerciantePublicoPorIdV73_(id);}catch(_){return null;}}, // v152
    adicionarAcao:async(cenarioId,linha)=>{
      if(userData?.role!=='mestre')return null;const c=(cenariosDB||[]).find(x=>String(x.id)===String(cenarioId));if(!c)return null;
      const txt=[String(c.interacoesTexto||'').trim(),String(linha||'').trim()].filter(Boolean).join('\n');
      await setDoc(doc(db,'cenarios',String(c.id)),{interacoesTexto:txt},{merge:true});c.interacoesTexto=txt;
      if(String(estadoCampanhaMestre?.cenarioId||'')===String(c.id)&&typeof publicarCampanhaAtual_==='function'){try{await publicarCampanhaAtual_();}catch(e){console.warn('v109 publicar',e);}}
      return window.mesaInteracoesMapaV109_.parse(txt).at(-1)||null;
    }
  };}catch(e){console.warn('v109 ponte interações',e);}
  console.info('[Mesa Estelar] v89 interações multi-perícia, limite diário, Sorte e slots compartilhados carregados');
  window.__MESA_PATCH__='v89-interacoes-sorte-economia-base';
})();

