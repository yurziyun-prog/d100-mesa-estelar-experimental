// Mesa Estelar v46.83.1
// Primeira extração funcional da Oficina 2.
// Este módulo NÃO acessa Firebase, labEstado_, objetosMapaDB ou o Mapa da Mesa.

export const gmOficinaV2Cfg_ = {
  ativo: false,
  ferramenta: 'traco',
  cor: '#ffcf4d',
  tamanho: 7,
  opacidade: 1,
  pincel: 'redondo',
  texturaTraco: 'solida'
};

export const gm580_ = {
  mode: 'select',
  selection: new Set(),
  borderColor: '#111111',
  borderWidth: 0,
  borderOpacity: 1
};

export function gmOficinaV2CorRgb_(hex) {
  const h = String(hex || '#ffcf4d').replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(h)) return '255/207/77';
  return `${parseInt(h.slice(0,2),16)}/${parseInt(h.slice(2,4),16)}/${parseInt(h.slice(4,6),16)}`;
}

export function gmOficinaV2Hex_(r,g,b) {
  const q = n => Math.max(0, Math.min(255, Number(n) || 0)).toString(16).padStart(2, '0');
  return `#${q(r)}${q(g)}${q(b)}`;
}

export function gm580Key_(t,id) {
  return `${t}§${id}`;
}

export function gm580Esc_(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

export function gm580Hex_(v, fb='#111111') {
  let x = String(v || '').trim();
  if (!x) return fb;
  if (!x.startsWith('#')) x = '#' + x;
  if (/^#[0-9a-f]{3}$/i.test(x)) x = '#' + x[1]+x[1]+x[2]+x[2]+x[3]+x[3];
  return /^#[0-9a-f]{6}$/i.test(x) ? x.toUpperCase() : fb;
}

export function gm580Rgb_(h) {
  h = gm580Hex_(h).slice(1);
  return [
    parseInt(h.slice(0,2),16),
    parseInt(h.slice(2,4),16),
    parseInt(h.slice(4,6),16)
  ];
}

export function gm580RgbHex_(v) {
  const m = String(v || '').match(/(\d{1,3})\D+(\d{1,3})\D+(\d{1,3})/);
  if (!m) return null;
  return '#' + [m[1],m[2],m[3]]
    .map(n => Math.max(0,Math.min(255,Number(n)||0)).toString(16).padStart(2,'0'))
    .join('').toUpperCase();
}

export function gm580BBox_(it) {
  const r = it.ref;
  if (it.type === 'object') {
    const w = Math.max(.05, Number(r.larguraM || 1));
    const h = Math.max(.05, Number(r.alturaM || 1));
    return {x:Number(r.x||0)-w/2, y:Number(r.y||0)-h/2, w, h};
  }
  if (it.type === 'shape') {
    if (String(r.tipo || '').startsWith('linha')) {
      const x1=Number(r.x||0), y1=Number(r.y||0);
      const x2=Number(r.x2??x1), y2=Number(r.y2??y1);
      return {
        x:Math.min(x1,x2), y:Math.min(y1,y2),
        w:Math.max(.05,Math.abs(x2-x1)),
        h:Math.max(.05,Math.abs(y2-y1))
      };
    }
    return {
      x:Number(r.x||0), y:Number(r.y||0),
      w:Math.max(.05,Math.abs(Number(r.w||.05))),
      h:Math.max(.05,Math.abs(Number(r.h||.05)))
    };
  }
  const pts = r.pts || [];
  if (!pts.length) return {x:0,y:0,w:0,h:0};
  const xs=pts.map(p=>p.x), ys=pts.map(p=>p.y);
  return {
    x:Math.min(...xs), y:Math.min(...ys),
    w:Math.max(.05,Math.max(...xs)-Math.min(...xs)),
    h:Math.max(.05,Math.max(...ys)-Math.min(...ys))
  };
}

export function gm580Intersects_(a,b) {
  return a.x<=b.x+b.w && a.x+a.w>=b.x && a.y<=b.y+b.h && a.y+a.h>=b.y;
}


// Interface consolidada da Oficina 2
export function gm580ToolbarHtml_(){
  const colors=['#FFFFFF','#111111','#FF5252','#FFCF4D','#56F08A','#45B7FF','#B56CFF'];
  const tools=[
    ['select','Selecionar'],
    ['redondo','Pincel'],
    ['quadrado','Pincel de ladrilhos'],
    ['espelhado','Pincel espelhado'],
    ['caligrafico','Caligrafia'],
    ['caneta','Caneta'],
    ['lapis','Lápis'],
    ['serpentina','Serpentina'],
    ['seta','Seta'],
    ['curso','Curva livre'],
    ['giz_cera','Giz de cera'],
    ['spray','Tinta spray'],
    ['carimbo','Carimbo'],
    ['pele','Pele / pelos'],
    ['esboco','Esboço'],
    ['espirografo','Espirógrafo'],
    ['teia','Teia'],
    ['irregular','Irregular'],
    ['pontilhada','Pontilhado'],
    ['giz','Giz'],
    ['ranhura','Ranhura'],
    ['areia','Areia'],
    ['cascalho','Cascalho'],
    ['grama','Grama'],
    ['folhas','Folhas'],
    ['neve','Neve'],
    ['fumaca','Fumaça'],
    ['borracha','Borracha']
  ];
  const other=[
    ['hexagono','Hexágono'],['pentagono','Pentágono'],['losango','Losango'],
    ['estrela','Estrela'],['pentagrama','Pentagrama'],['hexagrama','Hexagrama'],
    ['heptagrama','Heptagrama'],['u','U'],['coracao','Coração'],
    ['meialua','Meia-lua'],['semicirculo','Semicírculo']
  ];
  return `<div id="gm580Toolbar" style="display:flex;flex-direction:column;gap:9px;margin:8px 0 10px;padding:10px;border:1px solid rgba(126,231,255,.20);border-radius:11px;background:rgba(0,0,0,.13)">
    <div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap">
      <label><small>Tamanho</small><select id="gm580Size" onchange="gmOficinaV2Tamanho_(this.value)">
        <option value="10x10">10 × 10 m</option><option value="20x12">20 × 12 m</option><option value="28x14">28 × 14 m</option><option value="36x20">36 × 20 m</option><option value="50x30">50 × 30 m</option><option value="50x40">50 × 40 m</option>
      </select></label>
      <label><small>Escala</small><select id="gm580Scale" onchange="gmOficinaV2Escala_(this.value)">${[18,24,32,40,48,60,72].map(x=>`<option value="${x}">${x} px/m</option>`).join('')}</select></label>
      <label><small>Fundo</small><input id="gm580Bg" type="color" onchange="gmOficinaV2Fundo_(this.value)"></label>
      <label><small>Grade</small><input id="gm580GridColor" type="color" onchange="gmOficinaV2GradeCor_(this.value)"></label>
      <label style="display:flex;align-items:center;gap:5px"><input id="gm580Grid" type="checkbox" onchange="gmOficinaV2GradeVis_(this.checked)"> Mostrar grade</label>
      <label><small>Textura do terreno</small><select id="gm580Terrain" onchange="gmOficinaV2Terreno_(this.value)" style="width:180px">
        <option value="nenhuma">Nenhuma</option><option value="concreto">Concreto</option><option value="areia">Areia</option><option value="terra">Terra</option><option value="grama">Grama</option><option value="floresta">Floresta</option><option value="rochas">Rochas</option><option value="neve">Neve</option><option value="agua">Água</option><option value="vulcanico">Vulcânico</option><option value="metal">Metal / nave</option><option value="ruinas">Ruínas</option><option value="alien">Biomassa alienígena</option><option value="nevoa">Névoa</option>
      </select></label>
      <button class="btn-small" onclick="gmOficinaV2Undo_()">↶</button>
      <button class="btn-small" onclick="gmOficinaV2Redo_()">↷</button>
    </div>

    <div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap;padding-top:6px;border-top:1px solid rgba(255,255,255,.08)">
      <label><small>Ferramenta</small><select id="gm580Tool" onchange="gm580Tool_(this.value)" style="min-width:220px">${tools.map((x,i)=>`<option value="${x[0]}" ${i===0?'selected':''}>${x[1]}</option>`).join('')}</select></label>
      <label><small>Prévia</small><canvas id="gm580Preview" width="150" height="38" style="width:150px;height:38px;border:1px solid rgba(255,255,255,.18);border-radius:7px;background:rgba(255,255,255,.06)"></canvas></label>
    </div>

    <div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap">
      <strong style="align-self:center;color:#cfeeff">Preenchimento / traço</strong>
      <label><small>Cor</small><input id="gm580Color" type="color" value="#111111" onchange="gm580Color_(this.value)"></label>
      <label><small>RGB</small><input id="gm580Rgb" type="text" value="17/17/17" onchange="gm580RgbInput_(this.value)" style="width:100px"></label>
      <label><small>HEX</small><input id="gm580Hex" type="text" value="#111111" maxlength="7" onchange="gm580Color_(this.value)" style="width:86px"></label>
      <span style="display:flex;gap:3px;padding-bottom:7px">${colors.map(c=>`<button onclick="gm580Color_('${c}')" style="width:21px;height:21px;min-width:21px;padding:0;border-radius:50%;background:${c}"></button>`).join('')}</span>
      <label><small>Tamanho</small><input id="gm580SizeBrush" type="range" min="1" max="100" value="7" oninput="gm580BrushSize_(this.value)" style="width:110px"><span id="gm580SizeVal">7</span></label>
      <label><small>Opacidade</small><input id="gm580Opacity" type="range" min="0" max="100" step="5" value="100" oninput="gm580Opacity_(this.value)" style="width:100px"><span id="gm580OpacityVal">100%</span></label>
    </div>

    <div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap">
      <strong style="align-self:center;color:#ffd54a">Borda</strong>
      <label><small>Cor</small><input id="gm580BorderColor" type="color" value="#111111" onchange="gm580BorderColor_(this.value)"></label>
      <label><small>RGB</small><input id="gm580BorderRgb" type="text" value="17/17/17" onchange="gm580BorderRgb_(this.value)" style="width:100px"></label>
      <label><small>HEX</small><input id="gm580BorderHex" type="text" value="#111111" maxlength="7" onchange="gm580BorderColor_(this.value)" style="width:86px"></label>
      <label><small>Grossura</small><input id="gm580BorderWidth" type="range" min="0" max="20" step="1" value="0" oninput="gm580BorderWidth_(this.value)" style="width:100px"><span id="gm580BorderWidthVal">0</span></label>
      <label><small>Opacidade</small><input id="gm580BorderOpacity" type="range" min="0" max="100" step="5" value="100" oninput="gm580BorderOpacity_(this.value)" style="width:100px"><span id="gm580BorderOpacityVal">100%</span></label>
    </div>

    <div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap;padding-top:6px;border-top:1px solid rgba(255,255,255,.08)">
      <strong style="align-self:center;color:#cfeeff">Linhas</strong>
      <select id="gm580Line" onchange="gm580Line_(this.value)" style="min-width:190px">
        <option value="">— escolher —</option>
        <option value="linha">Linha reta</option>
        <option value="linha_sinuosa">Linha sinuosa</option>
        <option value="linha_pontilhada">Linha pontilhada</option>
        <option value="linha_curva">Linha com ponto de curva</option>
      </select>
    </div>

    <div style="display:flex;gap:7px;align-items:end;flex-wrap:wrap">
      <strong style="align-self:center;color:#cfeeff">Formas</strong>
      <button class="btn-small" onclick="gm580Shape_('retangulo')">▭ Retângulo</button>
      <button class="btn-small" onclick="gm580Shape_('arredondado')">▢ Retângulo arredondado</button>
      <button class="btn-small" onclick="gm580Shape_('quadrado')">□ Quadrado</button>
      <button class="btn-small" onclick="gm580Shape_('triangulo')">△ Triângulo</button>
      <button class="btn-small" onclick="gm580Shape_('circulo')">○ Círculo</button>
      <button class="btn-small" onclick="gm580Shape_('elipse')">⬭ Elipse</button>
      <label><small>Outras formas</small><select id="gm580Other" onchange="if(this.value){gm580Shape_(this.value);this.value=''}">
        <option value="">— escolher —</option>${other.map(x=>`<option value="${x[0]}">${x[1]}</option>`).join('')}
      </select></label>
    </div>

    <div style="padding-top:6px;border-top:1px solid rgba(255,255,255,.08)">
      <div style="display:flex;justify-content:space-between;align-items:center;max-width:680px">
        <strong style="color:#cfeeff">Objetos do banco</strong>
        <label style="font-size:.82em"><input type="checkbox" onchange="gm580CheckAllObjects_(this.checked)"> Selecionar todos</label>
      </div>
      <div id="gm580ObjectBank" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:4px;max-width:680px;max-height:150px;overflow:auto;padding:5px;border:1px solid rgba(255,255,255,.1);border-radius:7px"></div>
      <button class="btn-small" style="margin-top:6px" onclick="gm580AddObjects_()">＋ Adicionar marcados</button>
    </div>

    <div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap;padding-top:6px;border-top:1px solid rgba(255,255,255,.08)">
      <button id="gm580EditBtn" class="btn-small" onclick="gm580ToggleEdit_()">✥ Editar forma</button>
      <button class="btn-small" onclick="gm580Front_()">⬆ Frente</button>
      <button class="btn-small" onclick="gm580Back_()">⬇ Trás</button>
      <button class="btn-small" onclick="gm580Duplicate_()">⧉ Duplicar</button>
      <button class="btn-small btn-danger" onclick="gm580Delete_()">🗑 Excluir</button>
      <span style="font-size:.82em;color:#9fb4c8">Selecionar é o padrão. Caixa de seleção em área vazia. Ctrl+clique soma. Ctrl+arrastar move. Ctrl+C / Ctrl+V copia e cola.</span>
    </div>
    <div id="gm580Inspector"></div>
  </div>`;
}


export function gmOficinaV2EstiloAtual550_(){
    const tex=String(gmOficinaV2Cfg_.texturaTraco||'solida');
    if(tex!=='solida')return tex;
    return String(gmOficinaV2Cfg_.pincel||'redondo');
}


export function gmOficinaV2SnapshotEstado_(estado) {
  return JSON.parse(JSON.stringify({
    desenhos: estado?.desenhos || [],
    objetos: estado?.objetos || []
  }));
}

export function gmOficinaV2BackgroundEstado_(estado) {
  const c=estado?.corGrade||'#777777';
  const grid=estado?.gradeVisivel!==false
    ? `linear-gradient(to right,${c} 1px,transparent 1px),linear-gradient(to bottom,${c} 1px,transparent 1px)`:'';
  const tex={
    nenhuma:'',
    concreto:'radial-gradient(circle at 20% 30%,rgba(255,255,255,.08) 0 1px,transparent 2px),radial-gradient(circle at 70% 65%,rgba(0,0,0,.10) 0 1px,transparent 2px)',
    areia:'radial-gradient(circle,rgba(255,248,205,.22) 0 1px,transparent 1.6px)',
    terra:'radial-gradient(circle at 30% 20%,rgba(65,30,10,.22) 0 2px,transparent 3px)',
    grama:'repeating-linear-gradient(78deg,rgba(30,90,35,.18) 0 2px,transparent 2px 8px)',
    floresta:'radial-gradient(circle at 15% 25%,rgba(18,85,35,.34) 0 7px,transparent 8px),radial-gradient(circle at 75% 70%,rgba(32,105,43,.30) 0 9px,transparent 10px)',
    rochas:'radial-gradient(ellipse at 20% 30%,rgba(70,70,75,.28) 0 7px,transparent 8px),radial-gradient(ellipse at 70% 65%,rgba(35,35,40,.20) 0 10px,transparent 11px)',
    neve:'radial-gradient(circle,rgba(255,255,255,.55) 0 2px,transparent 2.6px)',
    agua:'repeating-radial-gradient(ellipse at 50% 50%,rgba(255,255,255,.10) 0 2px,transparent 3px 11px)',
    vulcanico:'radial-gradient(circle at 25% 35%,rgba(255,95,0,.24) 0 2px,transparent 3px)',
    metal:'repeating-linear-gradient(135deg,rgba(255,255,255,.045) 0 3px,rgba(0,0,0,.05) 3px 6px)',
    ruinas:'repeating-linear-gradient(22deg,rgba(70,55,45,.16) 0 5px,transparent 5px 13px)',
    alien:'radial-gradient(circle at 25% 35%,rgba(100,255,150,.14) 0 8px,transparent 9px),radial-gradient(circle at 72% 65%,rgba(150,70,220,.14) 0 10px,transparent 11px)',
    nevoa:'radial-gradient(ellipse at 20% 35%,rgba(255,255,255,.18),transparent 35%)'
  }[estado?.textura||'nenhuma']||'';
  return [grid,tex].filter(Boolean).join(',');
}
