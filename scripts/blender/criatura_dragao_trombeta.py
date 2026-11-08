# Dragão-trombeta CORREDOR (selvagem) — modelado e animado por script (Blender). Rodar:
#   blender.exe -b -P criatura_dragao_trombeta.py -- <pasta de quadros> [--teste]
# Mantém a identidade do desenho original: corpo oliva com listras, boca em TROMBETA com anel de olhos, espinhos, rabo longo que termina em ponta.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bl_lib import *
import bl_lib

SAIDA = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else os.path.join(os.getcwd(), 'quadros')
limpa()
CIMA = '--cima' in sys.argv
ABRE = 1.75 if CIMA else 1.0  # visto de cima as pernas abrem para os lados
pele = listras('pele', (.33, .42, .2), (.22, .3, .12), 5.0)
barriga = material('barriga', (.78, .66, .3), .8)
escuro = material('escuro', (.2, .16, .08), .6)
dourado = material('dourado', (.85, .62, .2), .55)
boca = material('boca', (.5, .08, .08), .5)
osso = material('osso', (.95, .9, .75), .5)
olho = material('olho', (1, .85, .15), .25)

# ---------------- tronco (olha para +Y)
corpo = esfera('corpo', (0, 0, 1.25), (.5, .9, .52), pele)
peito = esfera('peito', (0, .5, 1.42), (.4, .5, .45), pele); prender(peito, corpo)
pelve = esfera('pelve', (0, -.5, 1.2), (.44, .5, .46), pele); prender(pelve, corpo)
bar = esfera('barriga', (0, .0, 1.02), (.36, .78, .3), barriga); prender(bar, corpo)

# ---------------- pescoço em S e cabeça-trombeta
pesc_piv = pivo('pesc_piv', (0, .78, 1.52), corpo)
pesc = tubo('pescoco', [(0, .78, 1.52), (0, 1.05, 1.95), (0, 1.12, 2.35), (0, 1.3, 2.6)], [.25, .2, .16, .14], pele); prender(pesc, pesc_piv)
cab_piv = pivo('cab_piv', (0, 1.32, 2.62), pesc_piv)
cranio = esfera('cranio', (0, 1.3, 2.64), (.22, .27, .21), pele); prender(cranio, cab_piv)
bpy.context.view_layer.update(); bl_lib._REPOUSO['boca'] = cab_piv.matrix_world.copy()
membr = material('membr', (.46, .42, .22), .7)
for lado in (-1, 1):  # olhos nas laterais do crânio
    o = esfera('olho%d' % lado, (lado * .16, 1.34, 2.74), (.055, .055, .055), olho); prender(o, cab_piv)
# ---------------- rabo longo e afilado (termina em PONTA curva)
rabo_piv = pivo('rabo_piv', (0, -.9, 1.25), corpo)
rabo = tubo('rabo', [(0, -.9, 1.25), (0, -1.6, 1.05), (0, -2.3, 1.15), (0, -3.0, 1.5), (0, -3.5, 2.0)], [.36, .27, .18, .09, .008], pele, resolucao=16, seg=14); prender(rabo, rabo_piv)
for i, (y, z, r) in enumerate([(.55, 1.95, .09), (.2, 1.9, .11), (-.15, 1.86, .12), (-.5, 1.83, .11), (-.85, 1.72, .09)]):
    c = cone('esp%d' % i, (0, y, z), r, 0, .3, escuro, rot=(-.15, 0, 0)); prender(c, corpo)
for i, (y, z, r) in enumerate([(-1.3, 1.22, .08), (-1.75, 1.12, .07), (-2.25, 1.28, .06), (-2.75, 1.56, .05)]):
    c = cone('espr%d' % i, (0, y, z + .1), r, 0, .2, escuro, rot=(-.3, 0, 0)); prender(c, rabo_piv)

# ---------------- pernas (digitígradas): coxa → canela → pé, juntas em esferas
def perna(lado):
    x = lado * .42 * ABRE
    H = (lado * .42, -.42, 1.22); K = (x, .12, .86); A = (x * 1.15, -.3, .36); P = (x * 1.2, .22, .06)
    quad = pivo('quad%d' % lado, H, corpo)
    c1 = seg('coxa%d' % lado, H, K, .24, .15, pele); prender(c1, quad)
    j1 = esfera('j1%d' % lado, K, (.16, .16, .16), pele); prender(j1, quad)
    jo = pivo('jo%d' % lado, K, quad)
    c2 = seg('canela%d' % lado, K, A, .14, .075, pele); prender(c2, jo)
    j2 = esfera('j2%d' % lado, A, (.1, .1, .1), pele); prender(j2, jo)
    to = pivo('to%d' % lado, A, jo)
    p = seg('pe%d' % lado, A, P, .09, .06, escuro); prender(p, to)
    for j in (-1, 0, 1):
        g = seg('garra%d_%d' % (lado, j), (x + j * .07, .14, .06), (x + j * .09, .42, .03), .045, 0.002, osso, 8); prender(g, to)
    return quad, jo, to
pe_ = perna(-1); pd_ = perna(1)
def braco(lado):
    x = lado * .44 * (1.5 if CIMA else 1.0)
    om = pivo('ombro%d' % lado, (x, .6, 1.3), corpo)
    b = seg('braco%d' % lado, (x, .6, 1.3), (x, .8, 1.0), .09, .05, pele); prender(b, om)
    for j in (-1, 0, 1):
        g = seg('gb%d_%d' % (lado, j), (x + j * .04, .8, 1.0), (x + j * .05, .98, .86), .03, 0.002, osso, 8); prender(g, om)
    return om
oe = braco(-1); od = braco(1)

for o in list(bpy.context.scene.objects):
    if o.type == 'MESH': contorno(o, .026)

cam = luz_e_camera(192, 26, 7.4 if '--cima' in sys.argv else 5.6)

def poe(P):
    corpo.location = (0, P.get('dy', 0), P.get('dz', 0)); corpo.rotation_euler = (P.get('rx', 0), P.get('ry', 0), P.get('rz', 0))
    rabo_piv.rotation_euler = (P.get('rabo_x', 0), 0, P.get('rabo_z', 0))
    pesc_piv.rotation_euler = (P.get('pesc_x', 0), 0, 0); cab_piv.rotation_euler = (P.get('cab_x', 0), 0, 0)
    for (q, j, t), k in ((pe_, 'e'), (pd_, 'd')):
        q.rotation_euler = (P.get('q' + k, 0), 0, 0); j.rotation_euler = (P.get('j' + k, 0), 0, 0); t.rotation_euler = (P.get('t' + k, 0), 0, 0)
    for o in (oe, od): o.rotation_euler = (P.get('braco', 0), 0, 0)
    bpy.context.view_layer.update()
    boca_tentaculos(cab_piv, (0, 1.5, 2.56), (0, 1, -.22), P.get('ab', .1), pele, membr, n=8, comp=1.15, raio_t=.065, r0=.2, ro=.85, fase=P.get('fase', 0), nome='boca')

def anim(acao, i, n):
    t = i / n; T = 2 * math.pi * t; s = math.sin(T); c = math.cos(T)
    if acao == 'parado':
        return dict(ab=.12 + .1 * s, fase=T, dz=.02 * s, rabo_z=.1 * s, pesc_x=.04 * math.sin(T + 1), cab_x=.05 * s, braco=.1 * s)
    if acao == 'andar':
        return dict(ab=.08, fase=2 * T, dz=.07 * abs(s), rx=.04 * math.sin(2 * T), qe=.7 * s, qd=-.7 * s, je=max(0, -1.0 * c) + .15, jd=max(0, 1.0 * c) + .15, te=-.45 * s, td=.45 * s,
                    rabo_z=.28 * s, rabo_x=.06 * math.sin(2 * T), pesc_x=.07 * math.sin(2 * T), cab_x=-.06 * math.sin(2 * T), braco=.5 * s)
    if acao == 'atacar':
        p = math.sin(math.pi * t); inv = math.sin(math.pi * min(1, max(0, (t - .3) / .5))) if t >= .3 else 0
        rec = -.28 * math.sin(min(1, t * 2.2) * math.pi) if t < .45 else 0
        return dict(ab=min(1, .1 + 1.2 * inv), fase=3 * T, dy=rec + .6 * inv, dz=.04 * p, rx=-.1 * p, pesc_x=(.55 * inv if inv else -.3 * (1 - min(1, t * 3))), cab_x=.5 * inv, rabo_x=.22 * p, rabo_z=.18 * s,
                    qe=.4 * p, qd=-.25 * p, je=.3 * p, jd=.3 * p, braco=-.6 * p)
    if acao == 'golpe':
        p = math.sin(math.pi * t)
        return dict(ab=.55 * p, fase=2 * T, dy=-.38 * p, dz=.05 * p, rx=.14 * p, pesc_x=-.4 * p, cab_x=-.3 * p, rabo_z=.3 * p, qe=-.25 * p, qd=.25 * p)
    if acao == 'morrer':
        u = min(1, t * 1.15); e = u * u * (3 - 2 * u)
        return dict(ab=.6 * e, fase=T, dz=-.55 * e, ry=1.4 * e, rx=-.1 * e, pesc_x=.5 * e, cab_x=.5 * e, rabo_z=.4 * e, qe=.9 * e, qd=.7 * e, je=-1.0 * e, jd=-.9 * e, braco=.8 * e)
    return {}

import bl_lib
if CIMA: bl_lib.ELEV = 82
PLANO = [('parado', ['lado'], 8), ('andar', ['lado', 'costas', 'frente'], 8), ('atacar', ['lado', 'costas', 'frente'], 8), ('golpe', ['lado'], 8), ('morrer', ['lado'], 8)]
if CIMA: PLANO = [(a, ['lado'], n) for a, _, n in PLANO]
if '--teste' in sys.argv: PLANO = [('andar', ['lado', 'frente'], 4), ('atacar', ['lado'], 4)]
for acao, dirs, n in PLANO:
    for d in dirs:
        render_quadros(cam, os.path.join(SAIDA, '%s_%s' % (acao, d)), 'q', d, n, lambda i, nn, a=acao: poe(anim(a, i, nn)), centro=(0, 0, 1.0) if CIMA else (0, -.55, 1.0))
        print('feito', acao, d, flush=True)
