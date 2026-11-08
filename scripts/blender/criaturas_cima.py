# Criaturas do D100 VISTAS DE CIMA (padrão escolhido pelo Yuri), modeladas e animadas por script no Blender.
# Rodar:  blender.exe -b -P criaturas_cima.py -- <pasta de saída> <receitas.json> [id1,id2,...] [--teste]
# Cada criatura sai em <pasta>/<id>/<acao>_lado/q_00.png… (parado, andar, atacar, golpe, morrer). O modelo olha para a ESQUERDA da imagem.
# Estilo: orgânico e vivo (músculo, pele, membros articulados, respiração), nada de formas quadradas.
import sys, os, math, json, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bl_lib import *
import bl_lib

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
SAIDA = ARGS[0]; RECEITAS = json.load(open(ARGS[1], encoding='utf-8')); SO = [a for a in ARGS[2:] if not a.startswith('--') and a][:1]
SO = (open(SO[0], encoding='utf-8').read().strip() if SO[0].endswith('.txt') else SO[0]).split(',') if SO else list(RECEITAS.keys())
TESTE = '--teste' in ARGS
MINIMO_ORTHO = 1.0 if '--ortho-pequeno' in ARGS else 3.2
bl_lib.ELEV = 82

def lin(c):
    c = c / 255.0
    return c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4
def cor(h, k=1.0):
    h = h.lstrip('#'); return tuple(min(1, lin(int(h[i:i + 2], 16)) * k) for i in (0, 2, 4))

def com_relevo(m, escala, forca, dist=.01):
    """relevo fino (poros, escamas, carapaça) por ruído em coordenada de OBJETO: estável de quadro para quadro (não pisca)"""
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    n = nt.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value = escala; n.inputs['Detail'].default_value = 10; n.inputs['Roughness'].default_value = .6
    bm = nt.nodes.new('ShaderNodeBump'); bm.inputs['Strength'].default_value = forca; bm.inputs['Distance'].default_value = dist
    tc = nt.nodes.new('ShaderNodeTexCoord'); nt.links.new(tc.outputs['Object'], n.inputs['Vector']); nt.links.new(n.outputs['Fac'], bm.inputs['Height']); nt.links.new(bm.outputs['Normal'], b.inputs['Normal'])
    return m
def pele_mat(nome, c1, c2, padrao):
    if padrao == 'listras': return com_relevo(listras(nome, cor(c1), cor(c2), 6.0), 34.0, .35)
    if padrao in ('manchas', 'escamas'): return com_relevo(material(nome, cor(c1), .7, 1, 9.0 if padrao == 'manchas' else 22.0, cor(c2, .8)), 60.0 if padrao == 'escamas' else 28.0, .6 if padrao == 'escamas' else .3)
    if padrao == 'placas': return com_relevo(material(nome, cor(c1), .45, 1, 5.0, cor(c2, .7)), 18.0, .8, .02)
    return com_relevo(material(nome, cor(c1), .78), 30.0, .3)

class Rig:
    def __init__(s): s.pernas = []; s.corpos = []; s.cabeca = None; s.rabo = None; s.extras = []; s.f = None
RIG = None

def pernas_quad(raiz, mat, pata_mat, x, ys, comp=.9, esp=.11, garras=True, osso_m=None):
    L = []
    for lado in (-1, 1):
        for y in ys:
            quad = pivo('q', (lado * x, y, .75), raiz)
            m = (lado * x * 1.55, y + .08, .55); f = (lado * x * 2.0, y - .05, .05)
            a = seg('c', (lado * x, y, .75), m, esp * 1.5, esp, mat); prender(a, quad)
            b = esfera('j', m, (esp * 1.1,) * 3, mat); prender(b, quad)
            piv2 = pivo('j2', m, quad)
            c = seg('p', m, f, esp, esp * .6, pata_mat); prender(c, piv2)
            if garras:  # pata de verdade: almofada, dedos e garras (mais longas e finas nos répteis)
                k = esp / .12; n = 4 if garras == 'rep' else 3
                pad = esfera('pad', (f[0], f[1] + .02, f[2] + .02), (.1 * k, .13 * k, .05), pata_mat); prender(pad, piv2)
                for gi in range(n):
                    dx = (gi - (n - 1) / 2) * .075 * k
                    dedo = esfera('dedo', (f[0] + dx, f[1] + .13 * k, f[2] + .02), (.035 * k, .06 * k, .032), pata_mat); prender(dedo, piv2)
                    if osso_m: cl = cone('garra', (f[0] + dx, f[1] + .2 * k + .05, f[2] + .02), .02 * k, 0, .1 * k * (1.7 if garras == 'rep' else 1), osso_m, rot=(-math.pi / 2, 0, 0)); prender(cl, piv2)
            L.append((quad, piv2, lado, 1 if (y > 0) == (lado > 0) else -1))
    return L

def build_quad(s):
    r = Rig(); T = s.get('tracos', {}); c1 = s.get('cor', '#6b5a48'); c2 = s.get('cor2', '#c9a27a')
    pele = pele_mat('pele', c1, c2, s.get('padrao', 'nenhum')); barr = material('barr', cor(c2), .8); esc = material('esc', cor(c1, .45), .6); osso = material('osso', cor('#e8dcc0'), .5)
    olho = material('olho', cor(s.get('corOlhos', '#222222')), .3)
    raiz = pivo('raiz', (0, 0, 0)); r.raiz = raiz
    ct = s.get('cabecaCriatura', 'canina')
    VARS = {
        'canina':   dict(bw=.44, bl=.72, bz=.44, lx=.36, esp=.12, cauda=(.85, .2, 'fofo'), foc=(.15, .4), orelha=('cone', .12, .34), cab=(.27, .3, .25), pesc=.3),
        'felina':   dict(bw=.36, bl=.9, bz=.38, lx=.3, esp=.1, cauda=(1.9, .13, 'curva'), foc=(.14, .18), orelha=('cone', .12, .22), cab=(.3, .3, .24), pesc=.3),
        'reptil':   dict(bw=.62, bl=.8, bz=.3, lx=.55, esp=.16, cauda=(1.7, .32, 'onda'), foc=(.19, .5), orelha=None, cab=(.2, .3, .14), pesc=.25, placas=True),
        'serpente': dict(bw=.5, bl=.8, bz=.46, lx=.4, esp=.13, cauda=(1.2, .2, 'curva'), foc=(.12, .34), orelha=('cone', .08, .26), cab=(.2, .24, .2), pesc=1.0, gola=True),
        'rato':     dict(bw=.3, bl=.58, bz=.3, lx=.26, esp=.08, cauda=(1.5, .07, 'curva'), foc=(.09, .34), orelha=('disco', .16, .02), cab=(.19, .24, .17), pesc=.2, fino=True),
        'pterodatil': dict(bw=.34, bl=.66, bz=.32, lx=.26, esp=.09, cauda=(.8, .1, 'curva'), foc=(.075, .85), orelha=None, cab=(.17, .26, .16), pesc=.55, crista_cab=True),
        # corpo de DRAGÃO visto de cima (rabo longo e esticado, espinhos pelo dorso, pescoço e rabo); só a cabeça (boca de tentáculos de trombeta) foge do padrão
        'trombeta': dict(bw=.5, bl=.92, bz=.44, lx=.44, esp=.14, cauda=(2.9, .3, 'onda'), foc=(.13, .32), orelha=None, cab=(.2, .24, .19), pesc=.5, dorso=True),
    }
    chave = 'rato' if (ct == 'canina' and s.get('porte', 1) < .8) else ct
    V = VARS.get(chave, VARS['canina'])
    if s.get('padrao') == 'placas' or T.get('mandibulas'): V = dict(V, placas=True)
    if T.get('pescocoLongo') and chave not in ('serpente',): V = dict(V, pesc=max(V['pesc'], .9))
    if s.get('magro'): V = dict(V, bw=V['bw'] * .8, lx=V['lx'] * .88, esp=V['esp'] * .85)
    if s.get('largo'): V = dict(V, bw=V['bw'] * 1.2, lx=V['lx'] * 1.1, esp=V['esp'] * 1.15)
    if s.get('juba'): V = dict(V, gola=True)
    if s.get('crista'): V = dict(V, dorso=True)
    if s.get('orelhasGrandes') and V.get('orelha'): V = dict(V, orelha=('cone', V['orelha'][1] * 1.5, V['orelha'][2] * 1.9))
    if s.get('cauda'): V = dict(V, cauda=tuple(s['cauda']))
    bw, bl, bz = V['bw'], V['bl'], V['bz']
    corpo = esfera('corpo', (0, 0, .9), (bw, bl, bz), pele); prender(corpo, raiz)
    peito = esfera('peito', (0, bl * .62, .96), (bw * .78, bl * .6, bz * .9), pele); prender(peito, raiz)
    pelve = esfera('pelve', (0, -bl * .62, .92), (bw * .8, bl * .56, bz * .88), pele); prender(pelve, raiz)
    bar = esfera('bar', (0, 0, .72), (bw * .6, bl * .9, bz * .55), barr); prender(bar, raiz)
    r.pernas = pernas_quad(raiz, pele, esc, V['lx'], (bl * .62, -bl * .62), esp=V['esp'], garras=('rep' if V.get('placas') else True), osso_m=osso)
    if s.get('garrasGrandes'):  # escavador: patas da frente enormes (escavam)
        for idx, (q, j, lado, ph) in enumerate(r.pernas):
            if idx % 2 == 0: q.scale = (1.35, 1.35, 1.35)
    # pescoço + cabeça
    comp = V['pesc']; y0 = bl * .98
    pesc_piv = pivo('pesc', (0, y0, 1.0), raiz); r.pescoco = pesc_piv
    pesc = tubo('pesc', [(0, y0, 1.0), (0, y0 + comp * .4, 1.05), (0, y0 + comp * .8, 1.02), (0, y0 + comp, .98)], [bw * .44, bw * .36, bw * .3, bw * .28], pele); prender(pesc, pesc_piv)
    hy = y0 + comp + .18; cab = pivo('cab', (0, hy, .98), pesc_piv); r.cabeca = cab
    crn = esfera('crn', (0, hy, .98), V['cab'], pele); prender(crn, cab)
    foc = V['foc']
    if V.get('crista_cab'):  # pterodátilo: crista óssea para trás do crânio e bico longo e fino
        prender(tubo('crista_cab', [(0, hy - .05, 1.04), (0, hy - .28, 1.1), (0, hy - .5, 1.06)], [.06, .045, .008], osso), cab)
    if s.get('chifres'):
        for lado in (-1, 1): prender(tubo('chifre', [(lado * .1, hy + .04, 1.06), (lado * .2, hy - .02, 1.26), (lado * .15, hy + .12, 1.44)], [.05, .035, .006], osso), cab)
    foc_m = esfera('foc', (0, hy + .3, .94), (foc[0], foc[1], .12 if not V.get('placas') else .09), pele); prender(foc_m, cab)
    if V.get('dorso'):  # emendas orgânicas: pescoço → crânio → focinho e pescoço → peito, sem degraus entre as peças
        prender(esfera('nuca', (0, hy - .12, .99), (bw * .34, .2, .16), pele), cab)
        prender(esfera('maxila', (0, hy + .2, .96), (foc[0] * 1.25, .24, .13), pele), cab)
        prender(esfera('base_pesc', (0, y0 - .02, 1.0), (bw * .62, .26, bz * .78), pele), raiz)
    nar = esfera('nar', (0, hy + .3 + foc[1] * .8, .96), (.05, .04, .04), esc); prender(nar, cab)
    for lado in (-1, 1):
        o = esfera('o', (lado * .12, hy + .1, 1.06), (.05, .05, .05), olho); prender(o, cab)
        if V['orelha']:
            if V['orelha'][0] == 'cone':
                o2 = cone('orelha', (lado * .14, hy - .05, 1.2), V['orelha'][1], .005, V['orelha'][2], pele, rot=(-.2, lado * .35, 0))
            else:
                o2 = esfera('orelha', (lado * .2, hy - .02, 1.08), (V['orelha'][1], V['orelha'][1], V['orelha'][2]), barr)
            prender(o2, cab)
    if T.get('mandibulas') or ct in ('reptil', 'serpente'):
        for lado in (-1, 1):
            dd = seg('pres', (lado * .07, hy + .45, .9), (lado * .05, hy + .72, .88), .025, .003, osso, 8); prender(dd, cab)
    if V.get('gola'):  # besta ululante: gola de cristas em volta do pescoço
        for k in range(9):
            a = math.pi * .15 + k / 8 * math.pi * 1.7
            cr = cone('gola', (math.cos(a) * .36, hy - .12 + math.sin(a) * .1, 1.0), .06, 0, .38, esc, rot=(-.4, math.cos(a) * .6, a)); prender(cr, cab)
    # rabo
    if T.get('cauda', True):
        L, rb = V['cauda'][:2]; est = V['cauda'][2] if len(V['cauda']) > 2 else ''; rp = pivo('rabo', (0, -bl - .05, .95), raiz); r.rabo = rp
        fim = [rb, rb * .85, rb * .75, rb * .3] if V.get('fino') else ([rb, rb, rb * .9, rb * .55] if est == 'fofo' else [rb, rb * .72, rb * .42, rb * .06])
        curv = {'curva': .55, 'onda': .3}.get(est, 0)
        pts = [(curv * L * math.sin(k * 1.3) * (k / 3.0), -bl - .05 - L * k / 3, .95 - .05 * k + (.35 * k / 3 if est == 'fofo' else 0)) for k in range(4)]
        rb_o = tubo('rabo', pts, fim, pele, resolucao=12, seg=10); prender(rb_o, rp)
        if s.get('caudaClava'):  # clava óssea com espetos na ponta do rabo
            prender(esfera('clava', (pts[3][0], pts[3][1] - .12, pts[3][2]), (.26, .32, .2), esc), rp)
            for ka in range(6): ang = ka * math.pi / 3; prender(cone('espeto', (pts[3][0] + math.cos(ang) * .26, pts[3][1] - .12 + math.sin(ang) * .3, pts[3][2]), .05, 0, .2, osso, rot=(math.sin(ang) * 1.2, -math.cos(ang) * 1.2, 0)), rp)
        if V.get('dorso'):  # a raiz do rabo funde com a garupa
            prender(esfera('base_rabo', (0, -bl - .08, .95), (rb * 1.08, .3, rb * .95), pele), rp); prender(esfera('base_rabo2', (0, -bl - .3, .95), (rb * .85, .3, rb * .8), pele), rp)
        if V.get('dorso'):  # espinhos descendo pelo rabo, cada vez menores
            for k in range(10):
                u = (k + .6) / 10 * 3.0; i0 = min(2, int(u)); fr = u - i0; a0, a1 = pts[i0], pts[i0 + 1]
                pos = tuple(a0[m] + (a1[m] - a0[m]) * fr for m in range(3)); tam = .42 * (1 - k / 11) + .08
                prender(cone('esp', (pos[0], pos[1] - tam * .4, pos[2] + fim[0] * (1 - k / 10) * .6), .1 * (1 - k / 14) + .02, 0, tam, osso, rot=(1.05, 0, 0)), rp)  # espinhos deitados para trás: aparecem de cima
    if V.get('placas'):  # couraça: fileiras de placas pelo dorso
        for k in range(7):
            y = bl * .8 - k * bl * .27
            for l in (-1, 1):
                pl = esfera('placa', (l * bw * .5, y, .9 + bz * .75), (bw * .34, .15, .06), esc, rot=(0, l * .5, 0)); prender(pl, raiz)
    if V.get('dorso'):  # fileira de espinhos do pescoço à garupa
        for k in range(8):
            y = bl * .85 - k * bl * .25; tam = .55 - .05 * abs(k - 2)
            prender(cone('esp', (0, y - tam * .4, .9 + bz * .8), .13, 0, tam + .06, osso, rot=(1.05, 0, 0)), raiz)
        for k in range(4):
            prender(cone('esp', (0, y0 + comp * (k + .5) / 4.4 - .1, 1.0 + bw * .22), .1, 0, .4, osso, rot=(1.05, 0, 0)), pesc_piv)
    if T.get('espinhos'):
        for k, y in enumerate((.55, .25, -.05, -.35, -.65)):
            e = cone('esp', (0, y * bl / .78, 1.3 - abs(y) * .1), .07, 0, .3, esc, rot=(-.1, 0, 0)); prender(e, raiz)
    if s.get('corpo') == 'alado':
        for lado in (-1, 1):
            am = material('asa%d' % lado, cor(c2, .95), .5, 1, 9.0, cor(c1, 1.15)); vein = material('veia', cor(c1, .5), .6); ap = pivo('asa', (lado * .4, .3, 1.15), raiz)
            # asa de MORCEGO-RAPOSA (referência do Yuri): braço longo e fino, asa varrida para trás, poucos dedos longos, membrana fina com bordas côncavas
            S = (lado * .4, .3, 1.15); cot = (lado * 1.3, .45, 1.28); pun = (lado * 2.3, .1, 1.22)
            pts_d = [(lado * 3.45, -1.5, 1.05), (lado * 2.7, -2.1, 1.02), (lado * 1.85, -2.15, 1.02), (lado * 1.05, -1.75, 1.05)]
            osso_a = tubo('oa', [S, cot, pun, pts_d[0]], [.07, .055, .04, .012], pele); prender(osso_a, ap)
            for fp in pts_d[1:]:
                dedo = tubo('dd', [pun, ((pun[0] + fp[0]) / 2, (pun[1] + fp[1]) / 2, 1.12), fp], [.03, .024, .008], pele); prender(dedo, ap)
            seq = pts_d + [(lado * .5, -1.35, 1.08)]
            leque = [pun, pts_d[0]]
            for k in range(len(seq) - 1):
                p, q = seq[k], seq[k + 1]; mx, my = (p[0] + q[0]) / 2, (p[1] + q[1]) / 2
                leque.append((mx + (pun[0] - mx) * .27, my + (pun[1] - my) * .27, 1.07)); leque.append(q)
            leque = [S, cot] + leque
            vs = [(p[0], p[1], 1.08) for p in leque]
            me = bpy.data.meshes.new('mem'); me.from_pydata(vs, [], [tuple(range(len(vs)))]); me.update(); mo = bpy.data.objects.new('mem', me); bpy.context.collection.objects.link(mo)
            for p in me.polygons: p.use_smooth = True
            mo.data.materials.append(am); mo.modifiers.new('esp', 'SOLIDIFY').thickness = .025; prender(mo, ap)
            for fp in pts_d[1:]:  # nervuras finas entre os dedos
                nv = tubo('nerv', [pun, ((pun[0] + fp[0] * .5) / 1.5, (pun[1] + fp[1] * .5) / 1.5 - .15, 1.1), ((pun[0] + fp[0]) / 2 + lado * .2, (pun[1] + fp[1]) / 2 - .1, 1.1)], [.012, .01, .005], vein); prender(nv, ap)
            r.extras.append((ap, lado))
    if ct == 'trombeta':
        r.boca = True; r.hy = hy; r.membr = material('membr', cor(c1, 1.15), .7); bpy.context.view_layer.update(); bl_lib._REPOUSO['boca'] = cab.matrix_world.copy()
    r.mats = (pele, esc)
    return r

def poe_quad(r, P):
    r.raiz.location = (0, P.get('dy', 0), P.get('dz', 0)); r.raiz.rotation_euler = (P.get('rx', 0), P.get('ry', 0), P.get('rz', 0))
    T = P.get('T', 0)
    for idx, (q, j, lado, ph) in enumerate(r.pernas):
        gr = P.get('garra', 0) * lado * (math.sin(T * 2) * .7 + .35) if idx % 2 == 0 else 0  # as patas da frente arranham (abrem e fecham)
        q.rotation_euler = (0, 0, P.get('leg', 0) * math.sin(T) * ph * .8 + gr); j.rotation_euler = (0, 0, P.get('leg', 0) * .5 * math.cos(T) * ph + gr * .5)
    if r.rabo: r.rabo.rotation_euler = (0, 0, P.get('rabo', .2) * math.sin(T * (1.0 + P.get('chicote', 0)) + 1.2))
    r.pescoco.rotation_euler = (0, 0, P.get('pesc', 0) * math.sin(T + .6)); r.cabeca.rotation_euler = (P.get('cab_x', 0), 0, P.get('cab', 0))
    for asa, lado in r.extras:  # as asas abrem e fecham: f=1 aberta, f pequeno recolhida junto ao corpo
        f = P.get('asaf', .5); asa.scale = (f, 1, 1); asa.rotation_euler = (0, 0, lado * (1 - f) * .8)
    bpy.context.view_layer.update()
    if getattr(r, 'boca', False):
        boca_tentaculos(r.cabeca, (0, r.hy + .2, .95), (0, 1, -.1), P.get('ab', .1), r.mats[0], r.membr, n=8, comp=1.0, r0=.17, ro=.75, fase=2 * T, nome='boca', raio_t=.06)

def build_serp(s):
    """cobra / rastejador: corpo em UM tubo contínuo que serpenteia (refeito a cada quadro); cabeça triangular com olhos"""
    r = Rig(); c1 = s.get('cor', '#4a3f5a'); c2 = s.get('cor2', '#9a8ac9')
    r.mat = pele_mat('pele', c1, c2, 'listras'); olho = material('olho', cor(s.get('corOlhos', '#ffd84a')), .3)
    r.cabeca = esfera('cab', (0, 0, .3), (.2, .34, .14), r.mat)
    r.olhos = [esfera('o%d' % l, (0, 0, .4), (.045,) * 3, olho) for l in (-1, 1)]
    r.corpo = None; r.lingua = None; r.N = 12; r.serp = True; return r

def poe_serp(r, P):
    T = P.get('T', 0); amp = P.get('amp', .3) * 1.5; lev = P.get('lev', 0); dy = P.get('dy', 0)
    for o in (r.corpo, r.lingua):
        if o is not None: bpy.data.objects.remove(o, do_unlink=True)
    pts = []; raios = []
    for i in range(r.N):
        x = amp * math.sin(T - i * .6) * (.3 + i / r.N * .7); y = dy - i * .42
        pts.append((x, y, .3 + (lev * 1.1 * max(0, 1 - i * .3)))); raios.append((.12 + .3 * min(1, i / 2.2)) * (1 - (i / r.N) ** 1.6) + .05)
    r.corpo = tubo('corpo', pts, raios, r.mat, resolucao=10, seg=14); contorno(r.corpo, .026)
    x0, y0, z0 = pts[0]; hd = math.atan2(-(pts[0][0] - pts[1][0]), pts[0][1] - pts[1][1])
    r.cabeca.location = (x0, y0 + .24, z0 + .02); r.cabeca.rotation_euler = (-lev * .5, 0, hd)
    ca = Vector((-math.sin(hd), math.cos(hd), 0)); la = Vector((math.cos(hd), math.sin(hd), 0))
    for l, o in zip((-1, 1), r.olhos): o.location = Vector((x0, y0 + .24, z0 + .12)) + ca * .13 + la * l * .12
    f = P.get('ab', 0)
    r.lingua = tubo('lg', [tuple(Vector((x0, y0 + .22, z0)) + ca * (.4 + k * (.35 + f * .2))) for k in range(3)], [.02, .015, .005], material('lg', (.7, .05, .1), .5), seg=6); contorno(r.lingua, .01)
    bpy.context.view_layer.update()

def build_inseto(s, aracn=False):
    r = Rig(); T = s.get('tracos', {}); c1 = s.get('cor', '#5a5550'); c2 = s.get('cor2', '#9a948a')
    pele = pele_mat('pele', c1, c2, s.get('padrao', 'placas')); esc = material('esc', cor(c1, .5), .45); olho = material('olho', cor(s.get('corOlhos', '#ff3b3b')), .25)
    raiz = pivo('raiz', (0, 0, 0)); r.raiz = raiz
    if aracn:
        ab = esfera('abd', (0, -.65, .55), (.52, .62, .42), pele); prender(ab, raiz)
        tor = esfera('tor', (0, .2, .5), (.34, .42, .3), esc); prender(tor, raiz)
        cab = esfera('cab', (0, .72, .48), (.2, .2, .18), pele); prender(cab, raiz)
        nl = 4; r.cabeca = cab
    else:
        ab = esfera('abd', (0, -.68, .5), (.3, .62, .28), pele); prender(ab, raiz)
        tor = esfera('tor', (0, .05, .55), (.3, .38, .3), esc); prender(tor, raiz)
        cab = esfera('cab', (0, .62, .55), (.22, .24, .2), pele); prender(cab, raiz); r.cabeca = cab
        nl = 3
    for l in (-1, 1):
        o = esfera('o', (l * .13, .72 if not aracn else .85, .6), (.07, .07, .07), olho); prender(o, raiz)
        if T.get('mandibulas') or not aracn:
            m = seg('md', (l * .08, .8, .5), (l * .03, 1.05, .48), .045, .005, esc, 8); prender(m, raiz)
        if T.get('antenas'):
            an = tubo('an', [(l * .06, .78, .65), (l * .25, 1.1, .75), (l * .5, 1.5, .7)], [.015, .012, .006], esc); prender(an, raiz)
    if T.get('ferrao'):
        f = cone('fer', (0, -1.45, .45), .08, .002, .5, esc, rot=(math.pi / 2, 0, 0)); prender(f, raiz)
    r.pernas = []
    for k in range(nl):
        yb = (.35 - k * .3) if not aracn else (.45 - k * .27)
        for l in (-1, 1):
            hip = (l * .28, yb, .5); mid = (l * (.85 if aracn else .7), yb + (.28 if k == 0 else -.1 * k) + (.12 if aracn else 0), .75 if aracn else .5); fo = (l * (1.25 if aracn else 1.0), yb + (.5 if k == 0 else -.25 * k), .04)
            q = pivo('q', hip, raiz)
            a = seg('c', hip, mid, .07, .05, esc); prender(a, q)
            j = esfera('j', mid, (.065,) * 3, esc); prender(j, q)
            p2 = pivo('j2', mid, q); b = seg('t', mid, fo, .05, .015, pele); prender(b, p2)
            r.pernas.append((q, p2, l, 1 if (k % 2 == 0) == (l > 0) else -1))
    if T.get('asas'):
        r.asas = []
        for l in (-1, 1):
            w = esfera('asa', (l * .55, -.1, .95), (.55, .32, .02), material('aw', cor(c2, .95), .15), rot=(0, 0, l * .45)); prender(w, raiz); r.asas.append((w, l))
    if s.get('raptoras'):  # pernas da frente de louva-a-deus: maiores
        for idx, (q, j, lado, ph) in enumerate(r.pernas):
            if idx < 2: q.scale = (1.45, 1.45, 1.45)
    r.ab = ab; return r

def poe_inseto(r, P):
    r.raiz.location = (0, P.get('dy', 0), P.get('dz', 0)); r.raiz.rotation_euler = (P.get('rx', 0), P.get('ry', 0), P.get('rz', 0))
    T = P.get('T', 0)
    for idx, (q, j, lado, ph) in enumerate(r.pernas):
        gr = P.get('garra', 0) * lado * (.8 + math.sin(T * 2) * .4) if idx < 2 else 0
        q.rotation_euler = (0, 0, P.get('leg', 0) * math.sin(T * 2) * ph * .6 + gr); j.rotation_euler = (0, 0, P.get('leg', 0) * .4 * math.cos(T * 2) * ph + gr * .6)
    r.cabeca.rotation_euler = (0, 0, P.get('cab', 0) * math.sin(T))
    for w, l in getattr(r, 'asas', []): w.rotation_euler = (0, l * P.get('asa', .15) * math.sin(T * 6), l * .45)
    bpy.context.view_layer.update()

def build_amorfo(s):
    r = Rig(); c1 = s.get('cor', '#7a8a3a'); r.cad = []
    m = material('gel', cor(c1), .12)
    try: m.surface_render_method = 'BLENDED'
    except Exception: pass
    try: m.node_tree.nodes['Principled BSDF'].inputs['Alpha'].default_value = .78
    except Exception: pass
    m2 = material('nuc', cor(c1, .45), .3)
    r.corpo = esfera('gel', (0, 0, .45), (.85, .85, .45), m, seg=32)
    r.nucleo = esfera('nuc', (0, .05, .55), (.3, .3, .22), m2)
    r.bolhas = [esfera('b%d' % i, (math.cos(i * 2.1) * .35, math.sin(i * 2.1) * .35, .5), (.08, .08, .08), m2) for i in range(5)]
    r.pseudo = [esfera('ps%d' % i, (0, 0, .3), (.28, .28, .2), m) for i in range(5)]
    olho = material('olho', cor(s.get('corOlhos', '#d6ff6b')), .3)
    r.olhos = [esfera('oo%d' % l, (l * .16, .55, .75), (.06, .06, .06), olho) for l in (-1, 1)]
    r.amorfo = True; return r

def poe_amorfo(r, P):
    T = P.get('T', 0); p = 1 + .07 * math.sin(T) + P.get('sq', 0)
    r.corpo.scale = (p, 1 / p ** .5 * (1 + P.get('al', 0)), .9 / p ** .3); r.corpo.location = (0, P.get('dy', 0), .45)
    r.nucleo.location = (.05 * math.sin(T), P.get('dy', 0) + .05 * math.cos(T), .55)
    for i, b in enumerate(r.bolhas): b.location = (math.cos(i * 2.1 + T * .5) * .35, P.get('dy', 0) + math.sin(i * 2.1 + T * .5) * .35, .5 + .12 * math.sin(T + i))
    for i, pp in enumerate(r.pseudo):
        a = i * 1.26 + T * .15; ext = .75 + .25 * math.sin(T * 1.3 + i * 1.7) + P.get('ext', 0)
        pp.location = (math.cos(a) * ext, P.get('dy', 0) + math.sin(a) * ext, .3); pp.scale = (1 - .3 * math.sin(T + i) * .3, 1, 1)
    for l, o in zip((-1, 1), r.olhos): o.location = (l * .16, P.get('dy', 0) + .55, .75)
    bpy.context.view_layer.update()

def build_larva(s):
    r = Rig(); c1 = s.get('cor', '#c9b8e6'); c2 = s.get('cor2', '#6f5aa6')
    pele = material('pele', cor(c1), .6); mac = pele_mat('mac', c1, c2, 'manchas')
    r.cad = [(esfera('s%d' % i, (0, -i * .36, .45), (.5 - i * .03, .42, .42 - i * .025), mac if i % 2 else pele), .4 - i * .018) for i in range(6)]
    r.cabeca = esfera('cab', (0, .4, .45), (.36, .4, .33), pele)
    olho = material('olho', cor(s.get('corOlhos', '#222222')), .2)
    r.olhos = [esfera('o%d' % l, (l * .17, .6, .66), (.07,) * 3, olho) for l in (-1, 1)]
    r.larva = True; return r

def poe_larva(r, P):
    T = P.get('T', 0)
    for i, (o, rad) in enumerate(r.cad):
        ond = math.sin(T - i * .8); o.location = (.1 * math.sin(T - i * .5) * P.get('amp', 1), -i * .36 * (1 - .12 * ond * P.get('cont', 1)) + P.get('dy', 0), .4 + .04 * ond)
        o.scale = (1, 1 + .1 * ond * P.get('cont', 1), 1)
    r.cabeca.location = (.08 * math.sin(T) * P.get('amp', 1), .35 + P.get('dy', 0) + .06 * math.sin(T), .4)
    for l, o in zip((-1, 1), r.olhos): o.location = (l * .17 + .08 * math.sin(T) * P.get('amp', 1), .6 + P.get('dy', 0), .66)
    bpy.context.view_layer.update()

def build_enxame(s):
    r = Rig(); c1 = s.get('cor', '#5a4a40'); n = min(int(s.get('quantidade', 20)), 16)
    random.seed(7); pele = material('pele', cor(c1), .8); cauda = material('cd', cor('#b89a8a'), .8); r.rat = []
    for i in range(n):
        a = random.random() * 6.28; d = random.random() * 1.5 + .2; ox, oy = math.cos(a) * d, math.sin(a) * d; ang = random.random() * 6.28
        c = esfera('rc', (0, 0, .2), (.15, .26, .13), pele); h = esfera('rh', (0, 0, .2), (.1, .13, .09), pele)
        t = tubo('rt', [(0, -.3, .2), (0, -.55, .18), (0, -.8, .2)], [.025, .018, .006], cauda); r.rat.append((c, h, t, ox, oy, ang, random.random() * 6.28))
    r.enx = True; return r

def poe_enxame(r, P):
    T = P.get('T', 0)
    for c, h, t, ox, oy, ang, ph in r.rat:
        a = ang + P.get('giro', 1) * T * .4 * math.sin(ph); x = ox + .18 * math.cos(T + ph); y = oy + P.get('dy', 0) + .18 * math.sin(T + ph)
        for o, dy in ((c, 0), (h, .3)):
            o.location = (x - math.sin(a) * dy, y + math.cos(a) * dy, .2); o.rotation_euler = (0, 0, a)
        t.location = (x, y, 0); t.rotation_euler = (0, 0, a)
    bpy.context.view_layer.update()

def build_sessil(s):
    r = Rig(); c1 = s.get('cor', '#a35a5a'); c2 = s.get('cor2', '#e3a0a0')
    pele = pele_mat('pele', c1, c2, 'manchas'); olho = material('olho', cor('#ffe9a0'), .3); boca = material('bc', (.4, .03, .05), .5)
    r.base = esfera('base', (0, 0, .35), (.8, .8, .35), pele, seg=32)
    r.n = int(s.get('pescocos', 6)); r.mat = pele; r.olho = olho; r.boca = boca; r.cab = []; r.pesc = []
    for i in range(r.n):
        r.cab.append((esfera('h%d' % i, (0, 0, .5), (.22, .26, .2), pele), [esfera('e%d' % l, (0, 0, .5), (.05,) * 3, olho) for l in (-1, 1)], esfera('m%d' % i, (0, 0, .5), (.1, .08, .05), boca)))
    r.sessil = True; return r

def poe_sessil(r, P):
    T = P.get('T', 0)
    for o in r.pesc:
        bpy.data.objects.remove(o, do_unlink=True)
    r.pesc = []
    for i in range(r.n):
        a = i * 2 * math.pi / r.n + .3; ext = 1.05 + .5 * P.get('ext', 0) + .22 * math.sin(T + i * 1.3); ang = a + .35 * math.sin(T * .7 + i)
        p0 = (math.cos(a) * .55, math.sin(a) * .55, .4); p3 = (math.cos(ang) * ext + math.cos(a) * .4, math.sin(ang) * ext + math.sin(a) * .4, .55)
        p1 = (p0[0] + (p3[0] - p0[0]) * .35 + math.sin(T + i) * .2, p0[1] + (p3[1] - p0[1]) * .35, .7); p2 = (p0[0] + (p3[0] - p0[0]) * .7, p0[1] + (p3[1] - p0[1]) * .7 + math.cos(T + i) * .2, .65)
        tb = tubo('nk', [p0, p1, p2, p3], [.17, .13, .11, .1], r.mat); contorno(tb, .02); r.pesc.append(tb)
        h, olhos, bc = r.cab[i]; dire = Vector((p3[0] - p2[0], p3[1] - p2[1], 0)); dire = dire.normalized() if dire.length else Vector((0, 1, 0)); rz = math.atan2(-dire.x, dire.y)
        h.location = p3; h.rotation_euler = (0, 0, rz); bc.location = (p3[0] + dire.x * .2, p3[1] + dire.y * .2, p3[2] - .02); bc.rotation_euler = (0, 0, rz); bc.scale = (1 + P.get('ab', 0) * 2.5, 1 + P.get('ab', 0) * 1.5, 1 + P.get('ab', 0) * 2)
        for l, o in zip((-1, 1), olhos): o.location = (p3[0] - dire.y * l * .13 + dire.x * .05, p3[1] + dire.x * l * .13 + dire.y * .05, p3[2] + .12)
    r.base.scale = (1 + .04 * math.sin(T), 1 + .04 * math.sin(T), 1); r.base.location = (0, P.get('dy', 0), .35)
    bpy.context.view_layer.update()

def caixa(pos, dim, mat, bisel=.02, rot=0, nome='cx'):
    bpy.ops.mesh.primitive_cube_add(location=pos); o = bpy.context.object; o.name = nome; o.scale = (dim[0] / 2, dim[1] / 2, dim[2] / 2)
    bpy.ops.object.transform_apply(scale=True)
    if bisel > 0:
        b = o.modifiers.new('bis', 'BEVEL'); b.width = min(bisel, min(dim) * .4); b.segments = 2
    for q in o.data.polygons: q.use_smooth = True
    o.rotation_euler = (0, 0, rot); o.data.materials.append(mat); return o
def cil(pos, r, h, mat, seg=28, bisel=.012, rot=(0, 0, 0), nome='cl'):
    bpy.ops.mesh.primitive_cylinder_add(vertices=seg, radius=r, depth=h, location=pos, rotation=rot); o = bpy.context.object; o.name = nome
    for q in o.data.polygons: q.use_smooth = True
    o.data.materials.append(mat); return o
def esf(pos, esc, mat, seg=20, nome='es'): return esfera(nome, pos, esc, mat, seg=seg)
def brilho(nome, hexa, forca):
    m = bpy.data.materials.new(nome); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    e = nt.nodes.new('ShaderNodeEmission'); e.inputs['Color'].default_value = (*cor(hexa), 1); e.inputs['Strength'].default_value = forca
    o = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(e.outputs['Emission'], o.inputs['Surface']); return m

def build_robo(s):
    r = Rig(); ar = s.get('corArmadura', '#9a8a5a'); led_c = s.get('corOlhos', '#ff3b3b')
    metal = material('metal', cor(ar), .35, 1, 26.0, cor(ar, .72)); aco = material('aco', cor('#5a6068'), .3, 1, 30.0, cor('#3e434a')); esc = material('escr', cor('#23262b'), .5); led = brilho('led', led_c, 3.0)
    raiz = pivo('raiz', (0, 0, 0)); r.raiz = raiz
    def cx(pos, dim, mat, b=.05, par=raiz): o = caixa(pos, dim, mat, b); prender(o, par); return o
    cx((0, 0, 1.18), (.66, .4, .64), metal, .07); cx((0, .2, 1.22), (.42, .02, .3), aco, .01); cx((0, .21, 1.3), (.3, .02, .06), led, 0)
    cx((0, 0, .82), (.5, .32, .22), aco, .05)
    for dx in (-.14, 0, .14): cx((dx, -.21, 1.2), (.08, .03, .4), esc, .01)  # grade de ventilação nas costas
    cab = pivo('cab', (0, .02, 1.62), raiz); r.cabeca = cab
    cx((0, .02, 1.72), (.3, .28, .26), metal, .07, cab); cx((0, .16, 1.74), (.26, .03, .07), led, 0, cab)
    a = cil((.1, -.04, 1.98), .012, .34, 'metal2' if False else aco, 8, 0); prender(a, cab); b = esf((.1, -.04, 2.16), (.03, .03, .03), led, 8); prender(b, cab)
    r.pernas = []; r.bracos = []
    for l in (-1, 1):
        q = pivo('q', (l * .16, 0, .78), raiz)
        cx((l * .16, 0, .6), (.17, .17, .42), metal, .04, q); jo = pivo('j', (l * .16, .01, .38), q)
        ca = cil((l * .16, .01, .38), .09, .2, aco, 14, .01, (0, math.pi / 2, 0)); prender(ca, jo)
        cx((l * .16, 0, .2), (.15, .15, .36), aco, .04, jo); cx((l * .16, .09, .05), (.2, .36, .1), metal, .04, jo)
        r.pernas.append((q, jo, l, 1 if l > 0 else -1))
        om = pivo('om', (l * .42, 0, 1.36), raiz); ov = cil((l * .42, 0, 1.36), .14, .18, aco, 16, .01, (0, math.pi / 2, 0)); prender(ov, om)
        cx((l * .42, 0, 1.12), (.14, .14, .4), metal, .04, om); cv = pivo('cv', (l * .42, .0, .92), om)
        cj = esf((l * .42, 0, .92), (.1, .1, .1), aco, 12); prender(cj, cv)
        cx((l * .42, .11, .88), (.12, .3, .12), metal, .035, cv)
        for d in (-1, 0, 1): cx((l * .42 + d * .045, .3, .86), (.03, .13, .04), aco, .008, cv)  # garra de 3 dedos mecânicos
        if l > 0 and s.get('maoD') == 'rifle':
            cx((l * .42, .45, .88), (.1, .7, .12), esc, .03, cv); cil((l * .42, .85, .88), .035, .3, aco, 10, 0, (-math.pi / 2, 0, 0)); prender(bpy.context.object, cv)
        r.bracos.append((om, cv, l, 1 if l > 0 else -1))
    return r

def poe_robo(r, P):
    r.raiz.location = (0, P.get('dy', 0), P.get('dz', 0)); r.raiz.rotation_euler = (P.get('rx', 0), P.get('ry', 0), P.get('rz', 0))
    T = P.get('T', 0); rig = lambda v, n=3: round(v * n) / n  # movimento em passos (mecânico)
    for q, j, l, ph in r.pernas:
        sw = rig(math.sin(T)) * P.get('leg', 0) * ph * .55
        q.rotation_euler = (sw, 0, 0); j.rotation_euler = (max(0, -sw) * .9, 0, 0)
    for om, cv, l, ph in r.bracos:
        sw = -rig(math.sin(T)) * P.get('arm', 0) * ph * .5 + (-P.get('braco_x', 0) * 1.2 if l > 0 else -P.get('braco_x', 0) * .5)
        om.rotation_euler = (sw, 0, -l * P.get('abre', 0)); cv.rotation_euler = (.35 + max(0, sw) * .6, 0, 0)
    r.cabeca.rotation_euler = (0, 0, rig(math.sin(T * .8), 2) * P.get('cab', 0))
    bpy.context.view_layer.update()

def build_humanoide(s):
    r = Rig(); T = s.get('tracos', {}); pelem = s.get('pele', '#a8b39a'); rou = s.get('roupa', '#6a5e4a'); rou2 = s.get('roupa2', '#3a2e22')
    pele = material('pele', cor(pelem), .7); roupa = material('roupa', cor(rou), .85); roupa2 = material('roupa2', cor(rou2), .85); olho = material('olho', cor(s.get('corOlhos', '#d6ff6b')), .2)
    raiz = pivo('raiz', (0, 0, 0)); r.raiz = raiz; P = s.get('porte', 1); r0z = s.get('pose') == 'zumbi'
    tor = esfera('tor', (0, 0, 1.0), (.46, .32, .6), roupa); prender(tor, raiz)
    ombros = esfera('omb', (0, .02, 1.28), (.56, .32, .3), roupa); prender(ombros, raiz)
    cab = esfera('cab', (0, .14, 1.6), (.19, .22, .2), pele); r.cabeca = cab; prender(cab, raiz)
    if s.get('cabelo', 'careca') in ('longo',):
        cb = esfera('cb', (0, -.04, 1.6), (.27, .3, .27), material('cabelo', cor(s.get('corCabelo', '#1b1b1b')), .7)); prender(cb, raiz)
    if s.get('capa'):
        cp = esfera('capa', (0, -.38, 1.0), (.66, .36, .62), material('capa', cor(s['capa']), .8)); prender(cp, raiz)
    for l in (-1, 1):
        o = esfera('o', (l * .08, .31, 1.66), (.04,) * 3, olho); prender(o, raiz)
    r.pernas = []
    for l in (-1, 1):
        q = pivo('q', (l * .22, 0, .85), raiz)
        a = seg('c', (l * .22, 0, .85), (l * .4, .1, .45), .17, .12, roupa2); prender(a, q)
        k = pivo('k', (l * .4, .1, .45), q); b = seg('p', (l * .4, .1, .45), (l * .5, .3, .06), .12, .08, roupa2); prender(b, k)
        pe = esfera('pe', (l * .5, .45, .05), (.12, .26, .07), material('pe', cor('#2a2420'), .8)); prender(pe, k)
        r.pernas.append((q, k, l, 1 if l > 0 else -1))
    r.bracos = []
    nb = 2 if not T.get('quatroBracos') else 4
    for l in (-1, 1):
        for n in range(nb // 2):
            # par 0: braços de cima (ombro alto). par 1 (quatro braços): braços inferiores, mais baixos, mais para trás e abertos para fora — vistos de cima não se sobrepõem
            sup = n == 0
            ombro = (l * .6, .02, 1.28) if sup else (l * .52, -.38, .98)
            cot = (l * (.66 if r0z else .78), .45, 1.2) if sup else (l * 1.0, .02, .92)
            mao = (l * .5, 1.0 if r0z else .62, 1.15) if sup else (l * .86, .42, .86)
            q = pivo('br', ombro, raiz)
            a = seg('a', ombro, cot, .15 if sup else .12, .11 if sup else .09, roupa); prender(a, q)
            cv = pivo('cv', cot, q); b = seg('b', cot, mao, .11 if sup else .09, .08 if sup else .065, pele); prender(b, cv)
            hx, hy, hz = mao
            palma = esfera('palma', (hx, hy + .03, hz), (.09, .12, .045), pele); prender(palma, cv)
            for d in (-1.5, -.5, .5, 1.5):
                dd = seg('dedo', (hx + d * .038, hy + .1, hz), (hx + d * .042, hy + .1 + .15 - abs(d) * .015, hz - .03), .024, .017, pele, 8); prender(dd, cv)
            pol = seg('polegar', (hx - l * .07, hy, hz), (hx - l * .12, hy + .1, hz - .02), .028, .02, pele, 8); prender(pol, cv)
            r.bracos.append((q, cv, l, 1 if l > 0 else -1))
    if T.get('antenas'):
        for l in (-1, 1):
            an = tubo('an', [(l * .08, .2, 1.8), (l * .2, .4, 2.05), (l * .35, .65, 2.1)], [.015, .012, .006], pele); prender(an, raiz)
    if T.get('mandibulas'):
        for l in (-1, 1):
            md = seg('md', (l * .08, .32, 1.5), (l * .03, .58, 1.5), .04, .005, pele, 8); prender(md, raiz)
    if T.get('carapaca') or T.get('espinhos'):
        for y in (.0, -.15, -.3):
            e = cone('e', (0, y, 1.55), .08, 0, .28, pele, rot=(-.15, 0, 0)); prender(e, raiz)
    if T.get('tentaculos'):
        for l in (-1, 0, 1):
            tt = tubo('tt', [(l * .2, .15, 1.0), (l * .35, .4, .75), (l * .5, .6, .45)], [.07, .05, .02], pele); prender(tt, raiz)
    r.zumbi = s.get('pose') == 'zumbi'; r.humano = True; return r

def poe_humano(r, P):
    r.raiz.location = (0, P.get('dy', 0), P.get('dz', 0)); r.raiz.rotation_euler = (P.get('rx', 0), P.get('ry', 0), P.get('rz', 0))
    T = P.get('T', 0)
    for q, k, l, ph in r.pernas: q.rotation_euler = (0, 0, P.get('leg', 0) * math.sin(T) * ph * .55); k.rotation_euler = (0, 0, P.get('leg', 0) * .3 * math.cos(T) * ph)
    for q, cv, l, ph in r.bracos:
        base = .5 if r.zumbi else 0
        q.rotation_euler = (0, 0, l * (-.1 + .15 * math.sin(T + ph) * P.get('arm', 1)) + (-l) * P.get('braco', 0)); cv.rotation_euler = (0, 0, l * (.1 + .12 * math.sin(T * 1.0 + ph)) * P.get('arm', 1))
    r.cabeca.rotation_euler = (0, 0, P.get('cab', 0) * math.sin(T * .9))
    bpy.context.view_layer.update()

# ---------------- ações (comuns a todas as criaturas)
def anim(acao, i, n, tipo):
    t = i / n; T = 2 * math.pi * t; s = math.sin(T); c = math.cos(T)
    if acao == 'parado': return dict(T=T, asaf=.5 + .06 * s, dz=.015 * s, rabo=.12, pesc=.06, cab=.12, leg=0, amp=.08, ext=0, arm=.4, asa=.1, sq=.0, cont=.4, giro=.4)
    if acao == 'andar': return dict(T=T, asaf=.68 + .32 * math.sin(2 * T), dz=.04 * abs(s), leg=1.0, rabo=.3, pesc=.12, cab=.1, amp=.45, ext=.05, arm=1.0, asa=.25, cont=1, giro=1, rz=.03 * s)
    if acao == 'atacar':
        p = math.sin(math.pi * t); inv = math.sin(math.pi * min(1, max(0, (t - .3) / .5))) if t >= .3 else 0
        rec = -.22 * math.sin(min(1, t * 2.2) * math.pi) if t < .45 else 0
        return dict(T=T, asaf=.6 + .4 * inv, dy=rec + .55 * inv, dz=.02, leg=.5 * p, rabo=.35 + .55 * inv, chicote=1.4, garra=1.0 * inv, rz=.14 * math.sin(T * 3) * p, pesc=.15, cab=.3, cab_x=.0, ab=min(1, inv * 1.2), amp=.5, ext=.6 * inv, arm=1.4, braco=.5 * inv, sq=.12 * inv, al=.3 * inv, cont=1.4, giro=2, lev=.6 * inv, asa=.35)
    if acao == 'golpe':
        p = math.sin(math.pi * t)
        return dict(T=T * .5, asaf=.9 - .5 * p, dy=-.35 * p, dz=0, rz=.18 * p, leg=.3 * p, rabo=.5, ab=.5 * p, amp=.3, ext=-.2 * p, braco=-.4 * p, sq=-.1 * p, cont=.5, cab=.4 * p, lev=0)
    if acao == 'morrer':
        u = min(1, t * 1.15); e = u * u * (3 - 2 * u)
        return dict(T=T * .2, asaf=.7 - .45 * e, dz=-.1 * e, ry=1.45 * e if tipo in ('quad', 'humano', 'inseto') else 0, leg=1.0 * e, rabo=.3, ab=.6 * e, amp=.1 * (1 - e), cab=.4 * e, sq=.25 * e, ext=-.5 * e, braco=.8 * e, cont=.2, giro=0, lev=0, asa=.1)
    return {}

BUILD = {'quad': (build_quad, poe_quad), 'serp': (build_serp, poe_serp), 'inseto': (build_inseto, poe_inseto), 'aracn': (lambda s: build_inseto(s, True), poe_inseto),
         'amorfo': (build_amorfo, poe_amorfo), 'larva': (build_larva, poe_larva), 'enxame': (build_enxame, poe_enxame), 'sessil': (build_sessil, poe_sessil), 'humano': (build_humanoide, poe_humano), 'robo': (build_robo, poe_robo)}
def arquetipo(s):
    c = s.get('corpo')
    return {'quadrupede': 'quad', 'alado': 'quad', 'bipede': 'quad', 'serpente': 'serp', 'inseto': 'inseto', 'aracnideo': 'aracn', 'amorfo': 'amorfo', 'larva': 'larva', 'enxame': 'enxame', 'sessil': 'sessil', 'humanoide': 'humano', 'robo': 'robo', 'primata': 'humano', 'ave': 'quad'}.get(c, 'quad')

def limites():
    mn = [1e9, 1e9]; mx = [-1e9, -1e9]
    for o in bpy.context.scene.objects:
        if o.type != 'MESH' or o.name.startswith(('contorno',)): continue
        for v in o.bound_box:
            w = o.matrix_world @ Vector(v); mn[0] = min(mn[0], w.x); mx[0] = max(mx[0], w.x); mn[1] = min(mn[1], w.y); mx[1] = max(mx[1], w.y)
    return mn, mx

def medidas():
    # extensões físicas (metros) do corpo na pose parado: altura (z), comprimento e largura no chão
    mn = [1e9] * 3; mx = [-1e9] * 3
    for o in bpy.context.scene.objects:
        if o.type != 'MESH' or o.name.startswith(('contorno',)): continue
        for v in o.bound_box:
            w = o.matrix_world @ Vector(v)
            for k in range(3): mn[k] = min(mn[k], w[k]); mx[k] = max(mx[k], w[k])
    return mx[2] - mn[2], mx[0] - mn[0], mx[1] - mn[1]

MEDIR = '--medir' in ARGS
for cid in SO:
    if cid not in RECEITAS: print('sem receita', cid); continue
    s = dict(RECEITAS[cid]); tipo = arquetipo(s)
    limpa(); bl_lib._BOCAS.clear(); bl_lib._REPOUSO.clear(); bl_lib.ELEV = 82
    if s.get('corpo') == 'primata': s.update(pele=s.get('cor', '#7a5a3a'), roupa=s.get('cor', '#7a5a3a'), roupa2=s.get('cor2', '#c9a27a'), pose='zumbi')
    if s.get('corpo') == 'ave': s['tracos'] = {'cauda': True}
    cam = luz_e_camera(256, 82, 6)
    r = BUILD[tipo][0](s); pose = BUILD[tipo][1]
    for o in list(bpy.context.scene.objects):
        if o.type == 'MESH': contorno(o, .026)
    pose(r, anim('parado', 0, 8, tipo))
    mn, mx = limites(); w = max(mx[0] - mn[0], mx[1] - mn[1]); cam.data.ortho_scale = max(MINIMO_ORTHO, w * (1.7 if tipo in ('amorfo', 'sessil', 'enxame') else 1.25) + .4)
    if MEDIR:
        al, cp, lg = medidas(); print('MEDIDA', json.dumps(dict(id=cid, altura=round(al, 2), comp=round(cp, 2), larg=round(lg, 2), ortho=round(cam.data.ortho_scale, 2))), flush=True); continue
    os.makedirs(os.path.join(SAIDA, cid), exist_ok=True); json.dump(dict(metros=round(cam.data.ortho_scale, 3), quadro=256), open(os.path.join(SAIDA, cid, 'meta.json'), 'w'))
    centro = ((mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, 1.0)
    plano = [('parado', 6), ('andar', 8), ('atacar', 8), ('golpe', 6), ('morrer', 6)]
    if TESTE: plano = [('andar', 4), ('atacar', 4)]
    for acao, n in plano:
        render_quadros(cam, os.path.join(SAIDA, cid, '%s_lado' % acao), 'q', 'lado', n, lambda i, nn, a=acao, tp=tipo, ps=pose, rr=r: ps(rr, anim(a, i, nn, tp)), centro=centro)
    print('feito', cid, flush=True)
