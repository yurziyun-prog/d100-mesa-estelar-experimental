# Pessoa (jogador/NPC) VISTA DE CIMA em camadas pintáveis, feita no Blender.
# Rodar:  blender.exe -b -P pessoa_cima.py -- <pasta de saída> [--teste]
# Saída: <pasta>/<camada>/<acao>_lado/q_NN.png. Cada camada sai em cinza neutro, com sombreado, para o jogo pintar com a cor escolhida pelo jogador (multiplicar).
# Camadas (de baixo para cima): capa, roupa, detalhe (ombreiras/cinto), pele, cabelo_curto, cabelo_longo.
# O modelo olha para a ESQUERDA da imagem. A capa se move sozinha: segue o ritmo do andar, abre no ataque e cai no chão ao morrer.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bl_lib import *
import bl_lib

SAIDA = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else os.path.join(os.getcwd(), 'pessoa')
TESTE = '--teste' in sys.argv
limpa(); bl_lib.ELEV = 82
CAMADAS = ['capa', 'cp_borda', 'cp_lista', 'cp_emblema', 'roupa', 'detalhe', 'pele', 'cabelo_curto', 'cabelo_longo', 'cabelo_rabo', 'cabelo_coque', 'cabelo_moicano', 'cabelo_volumoso',
           'orelha_pontuda', 'orelha_grande', 'orelha_felina', 'rosto', 'ac_mochila', 'ac_ombreiras', 'ac_chifres', 'ac_chapeu', 'ac_coroa', 'ac_faixa']
OBJ = {c: [] for c in CAMADAS}
cinza = material('cinza', (.78, .78, .78), .8)
cinza2 = material('cinza2', (.78, .78, .78), .8)
tecido = material('tecido', (.82, .82, .82), .92, 1, 70.0, (.66, .66, .66))
cabelo_m = listras('cabelo_m', (.6, .6, .6), (.97, .97, .97), 16.0)
pele_m = material('pele_m', (.86, .86, .86), .75, 1, 40.0, (.78, .78, .78))

def na(camada, o):
    OBJ[camada].append(o); return o

raiz = pivo('raiz', (0, 0, 0))
# Proporções de um adulto de ~1,75 m: ombros ~46 cm, cabeça ~17 cm, braços e pernas finos, tronco com cintura (nada de ombreiras gigantes).
# ---------------- tronco
tor = na('roupa', esfera('tor', (0, 0, 1.17), (.19, .115, .27), tecido)); prender(tor, raiz)           # peito
abd = na('roupa', esfera('abd', (0, 0, .96), (.165, .1, .2), tecido)); prender(abd, raiz)               # cintura
pelve = na('roupa', esfera('pelve', (0, 0, .83), (.185, .115, .13), tecido)); prender(pelve, raiz)
omb = na('roupa', esfera('omb', (0, 0, 1.37), (.22, .092, .07), tecido)); prender(omb, raiz)           # linha dos ombros
cinto = na('detalhe', esfera('cinto', (0, 0, .9), (.175, .108, .035), cinza)); prender(cinto, raiz)
gola = na('detalhe', esfera('gola', (0, .005, 1.46), (.115, .08, .045), cinza)); prender(gola, raiz)
for l in (-1, 1):
    na('detalhe', esfera('ombro%d' % l, (l * .225, 0, 1.37), (.06, .075, .06), cinza)).parent = raiz  # só um arredondado de costura no ombro
# ---------------- cabeça e pescoço
cab = pivo('cab', (0, 0, 1.5), raiz)
pesc = na('pele', esfera('pesc', (0, .005, 1.5), (.052, .052, .075), pele_m)); prender(pesc, cab)
crn = na('pele', esfera('crn', (0, .015, 1.65), (.088, .108, .115), pele_m)); prender(crn, cab)
nariz = na('pele', esfera('nariz', (0, .11, 1.64), (.02, .03, .03), pele_m)); prender(nariz, cab)
for l in (-1, 1): na('pele', esfera('orelha%d' % l, (l * .088, 0, 1.65), (.012, .025, .035), cinza)).parent = cab
def fios(camada, n, base_z, raio_x, raio_y, cy=-.03, esp=.011):
    # fios finos que descem do alto da cabeça (redemoinho) até a borda: dão a textura de cabelo penteado, sem "tijolinhos"
    for k in range(n):
        a = k * math.pi * 2 / n + .2
        t = tubo('fio', [(math.cos(a) * .012, cy + math.sin(a) * .012, base_z + .09), (math.cos(a) * raio_x * .62, cy + math.sin(a) * raio_y * .62, base_z + .075), (math.cos(a) * raio_x, cy + math.sin(a) * raio_y, base_z + .012)], [esp, esp * 1.1, esp * .8], cabelo_m)
        na(camada, t); prender(t, cab)
# cabelo curto: uma calota lisa que cobre todo o alto e os lados (só a testa fica de fora) + fios penteados
na('cabelo_curto', esfera('cb1', (0, -.025, 1.71), (.106, .126, .104), cabelo_m, seg=28)).parent = cab
fios('cabelo_curto', 18, 1.69, .092, .11)
# cabelo longo: calota + cortina de cabelo caindo atrás da cabeça (sem rabo nem bolinha)
na('cabelo_longo', esfera('cb2', (0, -.025, 1.71), (.106, .126, .104), cabelo_m, seg=28)).parent = cab
na('cabelo_longo', esfera('cb2b', (0, -.1, 1.6), (.098, .13, .1), cabelo_m, seg=24)).parent = cab
fios('cabelo_longo', 18, 1.69, .092, .11)
# rabo de cavalo: calota + mecha afinando para trás
na('cabelo_rabo', esfera('cb3', (0, -.025, 1.71), (.106, .126, .104), cabelo_m, seg=28)).parent = cab
fios('cabelo_rabo', 18, 1.69, .092, .11)
t = na('cabelo_rabo', tubo('rabo', [(0, -.09, 1.68), (0, -.16, 1.62), (0, -.23, 1.5), (0, -.25, 1.34)], [.04, .05, .042, .014], cabelo_m)); prender(t, cab)
# coque: calota + coque no alto, atrás
na('cabelo_coque', esfera('cb4', (0, -.025, 1.71), (.106, .126, .104), cabelo_m, seg=28)).parent = cab
fios('cabelo_coque', 18, 1.69, .092, .11)
na('cabelo_coque', esfera('coque', (0, -.065, 1.775), (.052, .052, .045), cabelo_m)).parent = cab
# moicano: só uma crista no meio
na('cabelo_moicano', esfera('crista', (0, -.012, 1.71), (.032, .115, .06), cabelo_m, seg=24)).parent = cab
# volumoso (cacheado/black power)
na('cabelo_volumoso', esfera('cb5', (0, -.03, 1.675), (.13, .14, .115), cabelo_m, seg=28)).parent = cab
# ---------------- orelhas (pele), rosto e acessórios (cor própria)
for l in (-1, 1):
    na('orelha_pontuda', cone('op%d' % l, (l * .13, -.03, 1.675), .032, .004, .13, pele_m, rot=(.25, l * 1.25, l * .15))).parent = cab
    na('orelha_grande', esfera('og%d' % l, (l * .105, -.01, 1.66), (.022, .055, .07), pele_m)).parent = cab
    na('orelha_felina', cone('of%d' % l, (l * .07, -.02, 1.775), .05, .004, .12, pele_m, rot=(0, l * .3, 0))).parent = cab
    na('rosto', esfera('olho%d' % l, (l * .038, .118, 1.66), (.012, .008, .01), cinza)).parent = cab
    na('rosto', esfera('sobr%d' % l, (l * .04, .12, 1.686), (.022, .006, .005), cinza)).parent = cab
    na('ac_chifres', tubo('chifre%d' % l, [(l * .055, .0, 1.74), (l * .13, .02, 1.82), (l * .12, .09, 1.92)], [.028, .02, .004], cinza)).parent = cab
    na('ac_ombreiras', esfera('ombr%d' % l, (l * .232, 0, 1.4), (.085, .1, .05), cinza)).parent = raiz
na('rosto', esfera('boca', (0, .108, 1.59), (.025, .008, .005), cinza)).parent = cab
na('ac_chapeu', esfera('chap1', (0, -.01, 1.765), (.1, .115, .065), cinza, seg=24)).parent = cab
na('ac_chapeu', esfera('chap2', (0, -.01, 1.725), (.205, .215, .016), cinza, seg=28)).parent = cab
bpy.ops.mesh.primitive_torus_add(major_radius=.098, minor_radius=.014, location=(0, -.012, 1.745)); o = bpy.context.object; o.scale = (1, 1.15, 1); bpy.ops.object.transform_apply(scale=True); o.data.materials.append(cinza); na('ac_faixa', o).parent = cab
bpy.ops.mesh.primitive_torus_add(major_radius=.092, minor_radius=.013, location=(0, -.012, 1.75)); o = bpy.context.object; o.scale = (1, 1.15, 1); bpy.ops.object.transform_apply(scale=True); o.data.materials.append(cinza); na('ac_coroa', o).parent = cab
for k in range(9):
    a = k * math.pi * 2 / 9; na('ac_coroa', cone('pt', (math.cos(a) * .092, -.012 + math.sin(a) * .106, 1.79), .016, 0, .075, cinza)).parent = cab
na('ac_mochila', esfera('mochila', (0, -.16, 1.2), (.14, .075, .21), cinza)).parent = raiz
na('ac_mochila', esfera('mochila2', (0, -.2, 1.0), (.1, .06, .1), cinza)).parent = raiz
# tudo que é filho da cabeça precisa da matriz inversa (senão a peça sobe 1,5 m e, com a câmera inclinada, aparece deslocada: era a "careca" e o "cocoruto")
bpy.context.view_layer.update()
for lst in OBJ.values():
    for o in lst:
        if o.parent == cab: o.matrix_parent_inverse = cab.matrix_world.inverted()
# ---------------- pernas (balançam para frente e para trás; de cima só aparecem as botas e o movimento)
pernas = []
for l in (-1, 1):
    q = pivo('q%d' % l, (l * .1, 0, .85), raiz)
    c1 = na('roupa', seg('coxa', (l * .1, 0, .85), (l * .1, .02, .46), .1, .07, tecido)); prender(c1, q)
    jo = pivo('jo%d' % l, (l * .1, .02, .46), q)
    c2 = na('roupa', seg('canela', (l * .1, .02, .46), (l * .1, 0, .1), .07, .05, tecido)); prender(c2, jo)
    pe = na('roupa', esfera('bota', (l * .1, .07, .055), (.055, .13, .05), cinza)); prender(pe, jo)
    pernas.append((q, jo, l))
# ---------------- braços (finos, caem ao lado do corpo com o cotovelo levemente dobrado)
bracos = []
for l in (-1, 1):
    delt = na('roupa', esfera('deltoide%d' % l, (l * .2, 0, 1.36), (.075, .08, .072), tecido)); prender(delt, raiz)  # ombro arredondado: liga o braço ao tronco
    om = pivo('om%d' % l, (l * .2, 0, 1.36), raiz)
    ob = na('roupa', esfera('ombro_j%d' % l, (l * .2, 0, 1.36), (.066, .066, .066), tecido)); prender(ob, om)  # junta que gira junto com o braço
    a1 = na('roupa', seg('braco', (l * .2, 0, 1.36), (l * .255, .012, 1.09), .066, .054, tecido)); prender(a1, om)
    cv = pivo('cv%d' % l, (l * .255, .012, 1.09), om)
    cj = na('roupa', esfera('cotovelo%d' % l, (l * .255, .012, 1.09), (.052, .052, .052), tecido)); prender(cj, cv)
    a2 = na('roupa', seg('anteb', (l * .255, .012, 1.09), (l * .25, .125, .9), .052, .04, tecido)); prender(a2, cv)
    pun = na('detalhe', esfera('punho', (l * .249, .12, .915), (.045, .045, .03), cinza)); prender(pun, cv)
    px, py, pz = l * .246, .155, .87
    palma = na('pele', esfera('palma', (px, py + .01, pz), (.036, .05, .02), pele_m)); prender(palma, cv)
    for d in (-1.5, -.5, .5, 1.5):
        dedo = na('pele', seg('dedo', (px + d * .0165, py + .045, pz), (px + d * .019, py + .045 + .06 - abs(d) * .006, pz - .016), .0105, .0075, pele_m, 8)); prender(dedo, cv)
    pol = na('pele', seg('polegar', (px - l * .03, py - .005, pz), (px - l * .055, py + .04, pz - .008), .012, .009, pele_m, 8)); prender(pol, cv)
    bracos.append((om, cv, l))
for o in list(bpy.context.scene.objects):
    if o.type == 'MESH': contorno(o, .005)

CAPA = [None]; DET = []
def monta_capa(P):
    # capa de pano: presa nos ombros, cai pelas costas e, quando a pessoa anda, é puxada para trás (balança e ondula); parada, pende junto do corpo
    if CAPA[0] is not None: bpy.data.objects.remove(CAPA[0], do_unlink=True); OBJ['capa'].clear(); CAPA[0] = None
    for camn, d in DET:
        OBJ[camn].remove(d); bpy.data.objects.remove(d, do_unlink=True)
    DET.clear()
    if P.get('sem_capa'): return
    T = P.get('T', 0); L = P.get('capa_l', .7); fl = P.get('flare', 0); sw = P.get('sway', .15); dz = P.get('dz', 0); alt = P.get('alt', 0)
    R, C = 16, 12; vs = []; fs = []
    for j in range(R + 1):
        t = j / R; w = .19 + .15 * t * (1 + fl * .8) + .03 * math.sin(t * 3.1)
        xc = sw * math.sin(T - t * 3.0) * t * t + .02 * math.sin(T * 2 + j * .9) * t
        y = -.1 - L * (t ** 1.15) + P.get('dy', 0)
        zc = max(.07, 1.4 - t * (1.3 - alt * .75) + dz)
        for k in range(C + 1):
            u = k / C * 2 - 1
            dobra = .035 * math.sin(u * 5.5 + T + j * .35) * t * (1 + fl)
            vs.append((xc + u * w, y + dobra * .6 - .03 * u * u * t, max(.05, zc + dobra - .06 * u * u * (1 - .4 * fl) * min(1, t * 2))))
    for j in range(R):
        for k in range(C): a = j * (C + 1) + k; fs.append((a, a + 1, a + C + 2, a + C + 1))
    me = bpy.data.meshes.new('capa'); me.from_pydata(vs, [], fs); me.update(); o = bpy.data.objects.new('capa', me); bpy.context.collection.objects.link(o)
    def centro(fc):
        a = fc[0]; j = a // (C + 1); k = a % (C + 1); return ((k + .5) / C * 2 - 1, (j + .5) / R)
    sel = {'cp_borda': [fc for fc in fs if (fc[0] % (C + 1) in (0, C - 1)) or fc[0] >= R * (C + 1) - (C + 1)],  # debrum nas bordas
           'cp_lista': [fc for fc in fs if fc[0] % (C + 1) in (C // 2 - 1, C // 2) and fc[0] > 2 * (C + 1)],  # faixa no meio
           'cp_emblema': [fc for fc in fs if abs(centro(fc)[0]) / .5 + abs(centro(fc)[1] - .34) / .2 < 1]}  # losango nas costas
    for camn, ts in sel.items():
        tm = bpy.data.meshes.new(camn); tm.from_pydata([(x, y, z + .004) for (x, y, z) in vs], [], ts); tm.update(); to = bpy.data.objects.new(camn, tm); bpy.context.collection.objects.link(to)
        for p in tm.polygons: p.use_smooth = True
        to.data.materials.append(cinza); contorno(to, .004); OBJ[camn].append(to); DET.append((camn, to))
    for p in me.polygons: p.use_smooth = True
    o.data.materials.append(cinza); m = o.modifiers.new('esp', 'SOLIDIFY'); m.thickness = .018
    contorno(o, .006); CAPA[0] = o; OBJ['capa'].append(o)

def poe(P):
    T = P.get('T', 0)
    raiz.location = (0, P.get('dy', 0), P.get('dz', 0)); raiz.rotation_euler = (P.get('rx', 0), 0, P.get('rz', 0))
    for q, jo, l in pernas:
        s = math.sin(T) * (1 if l > 0 else -1) * P.get('leg', 0)
        q.rotation_euler = (s * .7 + P.get('sent_q', 0), 0, 0); jo.rotation_euler = (max(0, -s) * .5 * (1 if True else 0) + P.get('sent_j', 0), 0, 0)
    for om, cv, l in bracos:
        s = -math.sin(T) * (1 if l > 0 else -1) * P.get('arm', 0) + P.get('braco_x', 0) * (1 if l > 0 else .0)  # braço oposto à perna que vai à frente
        sw = s * .85 + P.get('sent_b', 0)
        if sw < 0: sw *= .55  # o braço humano vai bem menos para trás do que para a frente
        om.rotation_euler = (sw, 0, -l * P.get('abre', 0)); cv.rotation_euler = (min(1.5, max(0, sw) * .95 + .22 + abs(s) * .06), 0, 0)  # cotovelo sempre levemente dobrado; dobra mais quando o braço vai à frente
    cab.rotation_euler = (0, 0, P.get('cab', 0) * math.sin(T * .8))
    bpy.context.view_layer.update(); monta_capa(P)

def anim(acao, i, n):
    t = i / n; T = 2 * math.pi * t; s = math.sin(T)
    if acao == 'deitado':  # de costas, cabeça para o lado +Y (esquerda da imagem), respirando; a capa fica caída
        return dict(T=T, rx=math.pi / 2, rz=math.pi, dz=.12 + .008 * s, dy=-1.2, arm=.0, braco_x=.0, abre=.12 + .03 * s, sem_capa=True, cab=.05)
    if acao == 'sentado':  # sentado, pernas à frente, mãos nas coxas
        return dict(T=T, dz=-.42 + .008 * s, dy=-.06, sent_q=1.35, sent_j=-.9, sent_b=.55, abre=.1, capa_l=.3, sway=.02, alt=-.7, cab=.08 * s)
    if acao == 'parado': return dict(T=T, dz=.012 * s, arm=.12, capa_l=.36, sway=.015, cab=.1, abre=.03 * s, alt=-.25)
    if acao == 'andar': return dict(T=T, dz=.035 * abs(s), leg=1.0, arm=.9, capa_l=.72, sway=.24, rz=.07 * s, cab=.08, alt=.25, flare=.1)
    if acao == 'atacar':
        p = math.sin(math.pi * t); inv = math.sin(math.pi * min(1, max(0, (t - .25) / .55))) if t >= .25 else 0
        return dict(T=T, dy=-.12 * math.sin(min(1, t * 2.4) * math.pi) * (t < .4) + .42 * inv, braco_x=1.15 * inv, arm=.2, leg=.5 * p, rz=-.2 * inv, capa_l=.95, flare=.7 * inv + .2, sway=.3, alt=.5 * inv, cab=.2)
    if acao == 'golpe':
        p = math.sin(math.pi * t); return dict(T=T * .5, dy=-.32 * p, rz=.22 * p, arm=.3, leg=.2, capa_l=1.0 - .4 * p, flare=.7 * p, sway=.2, abre=.5 * p, cab=.4 * p, alt=.2)
    if acao == 'morrer':
        u = min(1, t * 1.15); e = u * u * (3 - 2 * u)
        return dict(T=T * .2, dz=-.78 * e, rz=.5 * e, leg=.5 * e, arm=.3, capa_l=.45 + .3 * e, flare=.7 * e, sway=.1, abre=1.0 * e, alt=1.3 * e, dy=-.1 * e, cab=.3 * e)
    return {}

cam = luz_e_camera(288, 82, 2.2)
poe(anim('parado', 0, 6))
plano = [('parado', 6), ('andar', 8), ('atacar', 8), ('golpe', 6), ('morrer', 6), ('deitado', 6), ('sentado', 6)]
if '--poses' in sys.argv: plano = [('deitado', 6), ('sentado', 6)]
if '--acoes' in sys.argv: plano = [p for p in plano if p[0] in sys.argv[sys.argv.index('--acoes') + 1].split(',')]
if TESTE: plano = [('andar', 4), ('atacar', 4), ('morrer', 3)]
posiciona_camera(cam, 'lado', centro=(0, -.42, 1.0))
sc = bpy.context.scene
for acao, n in plano:
    for i in range(n):
        poe(anim(acao, i, n))
        for cam_n in CAMADAS:
            for c2, lst in OBJ.items():
                for o in lst: o.hide_render = (c2 != cam_n)
            for o in bpy.context.scene.objects:
                if o.type == 'MESH' and not any(o in lst for lst in OBJ.values()): o.hide_render = True
            pasta = os.path.join(SAIDA, cam_n, '%s_lado' % acao); os.makedirs(pasta, exist_ok=True)
            sc.render.filepath = os.path.join(pasta, 'q_%02d.png' % i); bpy.ops.render.render(write_still=True)
    print('feito', acao, flush=True)

# vista de FRENTE (uma só imagem parada) para o editor de personagem
if ('--acoes' not in sys.argv) and (not TESTE or '--frente' in sys.argv):
    poe(anim('parado', 0, 6)); posiciona_camera(cam, 'frente', elev=14, centro=(0, 0, .95))
    for cam_n in CAMADAS:
        # de frente cada camada é renderizada com as outras como 'buraco' (holdout): o que está atrás do rosto não aparece
        for c2, lst in OBJ.items():
            for o in lst: o.hide_render = False; o.is_holdout = (c2 != cam_n)
        for o in bpy.context.scene.objects:
            if o.type == 'MESH' and not any(o in lst for lst in OBJ.values()): o.hide_render = True
        pasta = os.path.join(SAIDA, cam_n, 'parado_frente'); os.makedirs(pasta, exist_ok=True)
        sc.render.filepath = os.path.join(pasta, 'q_00.png'); bpy.ops.render.render(write_still=True)
    print('feito frente', flush=True)
