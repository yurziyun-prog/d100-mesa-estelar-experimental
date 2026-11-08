# Vegetação do pântano/lagoa (v211): tronco quebrado semi-enterrado, raiz assimétrica e touceiras de folhas sobrepostas, vistos de cima.
# Diferença das peças reprovadas (esferas empilhadas): aqui cada elemento é UMA malha contínua — tronco/raiz = tubo ao longo de um eixo curvo, com
# afunilamento, sulcos de casca irregulares e ponta quebrada em lascas; folha = fita curva com dobra central, curvatura e ponta fina.
# Rodar:  blender.exe -b -P vegetacao_pantano.py -- <pasta de saída> [id1,id2,...|composicao]
# Depois: node scripts/blender/montar-moveis.cjs <pasta> sl retrofuturista
import sys, os, math, json, random
import bmesh
from mathutils import Vector
_aqui = os.path.dirname(os.path.abspath(__file__))
_src = open(os.path.join(_aqui, 'moveis_cima.py'), encoding='utf-8').read()
exec(compile(_src.split('# ---------------------------------------------------------------- peças')[0], 'moveis_cima(base)', 'exec'))

def mats_veg():
    mats()
    M['casca'] = material('casca', cor('#5b4630'), .92, 1, 30.0, cor('#3a2a1c'))
    M['casca_s'] = material('casca_s', cor('#6f5a40'), .9, 1, 22.0, cor('#4c3a27'))      # parte seca/clara do tronco
    M['miolo'] = material('miolo', cor('#c9a672'), .85, 1, 40.0, cor('#a88555'))
    M['lama'] = material('lama', cor('#2d2a1c'), .96, 1, 14.0, cor('#1f2014'))
    M['lama_m'] = material('lama_m', cor('#3b3a24'), .9, 1, 18.0, cor('#2a2a18'))
    M['musgo'] = material('musgo', cor('#5d8a34'), .95, 1, 36.0, cor('#44702a'))
    M['raiz'] = material('raiz', cor('#53402b'), .92, 1, 26.0, cor('#352716'))
    M['folha_a'] = material('folha_a', cor('#4e8a36'), .6, 1, 12.0, cor('#3a7030'))
    M['folha_b'] = material('folha_b', cor('#7aa53e'), .6, 1, 12.0, cor('#5d8a30'))
    M['nervura'] = material('nervura', cor('#a8c46a'), .6)
    M['alien_a'] = material('alien_a', cor('#2f8a7c'), .5, 1, 10.0, cor('#237066'))
    M['alien_b'] = material('alien_b', cor('#4fb09a'), .5, 1, 10.0, cor('#3a9684'))
    M['alien_c'] = material('alien_c', cor('#7a4a8a'), .55)     # miolo roxo da planta alienígena
    M['alien_n'] = material('alien_n', cor('#b6e0cf'), .55)

def objeto_de_bmesh(bm, nome, mat_lista):
    me = bpy.data.meshes.new(nome); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(nome, me); bpy.context.collection.objects.link(o)
    for m in mat_lista: me.materials.append(m if not isinstance(m, str) else M[m])
    for p in me.polygons: p.use_smooth = True
    return o

def curva(pts, t):
    """interpola (Catmull-Rom) uma lista de pontos 3D; t em [0,1]"""
    n = len(pts) - 1; u = min(max(t, 0), 1) * n; i = min(int(u), n - 1); f = u - i
    p0 = pts[max(i - 1, 0)]; p1 = pts[i]; p2 = pts[i + 1]; p3 = pts[min(i + 2, n)]
    return Vector([.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * f + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * f * f + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * f ** 3) for k in range(3)])

def tubo_organico(nome, pts, r0, r1, mat, lados=18, passos=28, rugas=.16, semente=1, fim_quebrado=False, tampa_fim=True, base_larga=0.0, mat_tampa='miolo', achatar=1.0):
    """tubo ao longo do eixo `pts`: raio vai de r0 a r1, sulcos longitudinais irregulares (casca); fim_quebrado = ponta em lascas"""
    rr = random.Random(semente); bm = bmesh.new(); aneis = []
    fase = [rr.uniform(0, 6.28) for _ in range(4)]; pesos = [rr.uniform(.4, 1.0) for _ in range(4)]
    for s in range(passos + 1):
        t = s / passos; c = curva(pts, t); c2 = curva(pts, min(t + .01, 1)); c1 = curva(pts, max(t - .01, 0))
        tang = (c2 - c1).normalized(); lado = tang.cross(Vector((0, 0, 1)))
        lado = lado.normalized() if lado.length > .01 else Vector((1, 0, 0)); cima = lado.cross(tang).normalized()
        r = r0 + (r1 - r0) * (t ** .9); r *= 1 + base_larga * max(0, 1 - t * 4) ** 2
        anel = []
        for k in range(lados):
            a = k / lados * 2 * math.pi
            ond = sum(pesos[j] * math.sin(a * (3 + j * 2) + fase[j] + t * (1.5 + j)) for j in range(4)) / 2.2   # sulcos que correm ao longo e derivam devagar
            rr_k = r * (1 + rugas * ond)
            if fim_quebrado and t > .86:      # lascas: cada vértice avança/recua um tanto, com mais recuo no lado "rasgado"
                q = (t - .86) / .14; rr_k *= 1 - .22 * q * (.5 + .5 * math.sin(a * 2 + fase[0]))
            p = c + lado * math.cos(a) * rr_k + cima * math.sin(a) * rr_k * achatar
            if fim_quebrado and t > .9:
                p += tang * rr.uniform(-.1, .22) * r * (t - .9) * 10 * (.4 + .6 * max(0, math.sin(a + fase[1])))
            anel.append(bm.verts.new(p))
        aneis.append(anel)
    for s in range(passos):
        for k in range(lados):
            bm.faces.new((aneis[s][k], aneis[s][(k + 1) % lados], aneis[s + 1][(k + 1) % lados], aneis[s + 1][k]))
    # tampas
    bm.faces.new(list(reversed(aneis[0])))
    if tampa_fim: bm.faces.new(aneis[-1])
    o = objeto_de_bmesh(bm, nome, [mat, mat_tampa])
    if tampa_fim:   # tampa final com o miolo claro da madeira
        n = len(o.data.polygons)
        o.data.polygons[n - 1].material_index = 1
    return o

def lama(nome, pts, larg, semente=3, mat='lama', z=.012):
    """mancha de lama escura que ACOMPANHA o eixo (largura irregular, sem oval): faixa com lobos"""
    rr = random.Random(semente); bm = bmesh.new(); n = 40; esq = []; dir_ = []
    ph = rr.uniform(0, 6.28)
    for s in range(n + 1):
        t = s / n; c = curva(pts, t); c2 = curva(pts, min(t + .02, 1)); c1 = curva(pts, max(t - .02, 0))
        tang = (c2 - c1); tang.z = 0; tang = tang.normalized() if tang.length > .001 else Vector((1, 0, 0)); lado = Vector((-tang.y, tang.x, 0))
        env = math.sin(math.pi * min(max(t, 0), 1)) ** .5 * .75 + .25
        w1 = larg * env * (.8 + .35 * math.sin(t * 7 + ph) + .12 * math.sin(t * 17 + ph)); w2 = larg * env * (.8 + .35 * math.sin(t * 6 + ph * 2) + .12 * math.sin(t * 13 + ph))
        c.z = z; esq.append(bm.verts.new(c + lado * max(w1, .06))); dir_.append(bm.verts.new(c - lado * max(w2, .06)))
    for s in range(n): bm.faces.new((esq[s], esq[s + 1], dir_[s + 1], dir_[s]))
    return objeto_de_bmesh(bm, nome, [mat])

def mancha(nome, cx, cy, r, semente=1, mat='lama', z=.01, lobos=5, achat=1.0):
    rr = random.Random(semente); bm = bmesh.new(); n = 28; ph = [rr.uniform(0, 6.28) for _ in range(3)]
    c = bm.verts.new((cx, cy, z)); ring = []
    for k in range(n):
        a = k / n * 2 * math.pi; rad = r * (1 + .28 * math.sin(a * lobos + ph[0]) + .16 * math.sin(a * 3 + ph[1]) + .08 * math.sin(a * 9 + ph[2]))
        ring.append(bm.verts.new((cx + math.cos(a) * rad, cy + math.sin(a) * rad * achat, z)))
    for k in range(n): bm.faces.new((c, ring[k], ring[(k + 1) % n]))
    return objeto_de_bmesh(bm, nome, [mat])

def folha(nome, base, yaw, comp, larg, subida, queda, dobra, mat, mat_nerv=None, forma=1.0, passos=14, torcao=0.0, semente=1):
    """folha como fita: afunila na ponta, dobra no centro (V), sobe e depois cai (arco)"""
    bm = bmesh.new(); cols = 7; linhas = []; rr = random.Random(semente)
    dx, dy = math.cos(yaw), math.sin(yaw); lx, ly = -dy, dx
    for s in range(passos + 1):
        t = s / passos
        w = larg * (math.sin(math.pi * min(t * .98 + .02, 1) ** (.75 * forma))) ** .8 if forma else larg * (1 - t * .9)
        if t < .08: w = max(w, larg * .12 * (t / .08) + .01)
        alt = subida * math.sin(t * math.pi * .55) - queda * t * t
        along = comp * t; tw = torcao * t
        lin = []
        for c in range(cols):
            u = (c / (cols - 1)) * 2 - 1
            lateral = u * w; z = base[2] + alt + dobra * w * abs(u) * (1 - .5 * t) + math.sin(tw) * u * w * .3
            lin.append(bm.verts.new((base[0] + dx * along + lx * lateral, base[1] + dy * along + ly * lateral, z)))
        linhas.append(lin)
    for s in range(passos):
        for c in range(cols - 1):
            f = bm.faces.new((linhas[s][c], linhas[s][c + 1], linhas[s + 1][c + 1], linhas[s + 1][c]))
            if mat_nerv and c in (cols // 2 - 1, cols // 2): f.material_index = 1
    return objeto_de_bmesh(bm, nome, [mat, mat_nerv or mat])

# ---------------------------------------------------------------- peças
def tronco_quebrado():
    """tronco que cai para dentro da lama: a ponta de baixo SOME na lama (z negativo), a de cima termina quebrada em lascas; um único ramo cortado e assimétrico"""
    eixo = [(-1.45, -.18, -.16), (-.85, -.1, .05), (-.1, .06, .24), (.7, .0, .31), (1.35, .16, .27)]
    t1 = tubo_organico('tronco', eixo, .34, .21, 'casca', lados=20, passos=34, rugas=.17, semente=5, fim_quebrado=True, base_larga=.0, achatar=.92)
    # lascas compridas de madeira clara que saem da quebra, de tamanhos e direções diferentes (a quebra não é um corte limpo)
    for i, (dy, dz, L, r) in enumerate(((.12, .16, .5, .075), (-.06, .2, .32, .06), (-.2, .1, .22, .05), (.25, .05, .16, .045), (.02, .02, .1, .04))):
        tubo_organico('lasca%d' % i, [(1.2, .16 + dy, .27 + dz - .1), (1.2 + L * .5, .16 + dy * 1.3, .27 + dz), (1.2 + L, .16 + dy * 1.6, .27 + dz * .6)], r, .008, 'miolo', lados=6, passos=6, rugas=.35, semente=60 + i, tampa_fim=False)
    # metade seca, mais clara, sobre o dorso (casca solta mostrando madeira): fita fina encostada ao tronco
    ramo = tubo_organico('ramo', [(.15, .2, .3), (.45, .52, .36), (.62, .72, .4)], .085, .05, 'casca', lados=10, passos=8, rugas=.12, semente=9, tampa_fim=True)
    # lama escura: acompanha o tronco, mais larga onde ele afunda, com lóbulos
    lama('lama_t', [(-1.7, -.2, 0), (-.9, -.12, 0), (0, .06, 0), (.8, .02, 0)], .55, 4)
    mancha('lama_t2', -1.35, -.3, .36, 6, 'lama_m', .014, 6)
    mancha('lama_t3', .35, -.33, .17, 7, 'lama', .014, 4, .7)
    # musgo em placas no dorso, onde a água escorre: sobre a face de cima, perto da parte baixa
    rr = random.Random(12)
    for i, (x, y, r) in enumerate(((-.78, -.02, .26), (-.5, .1, .16), (.05, .12, .14), (-1.05, -.1, .2), (.55, -.08, .1))):
        z = curva([Vector(p) for p in eixo], (x + 1.45) / 2.8).z + .27 * (1 - abs(y) * .6)
        mancha('musgo%d' % i, x, y, r, 20 + i, 'musgo', z, 6, .55)
    # destroços: casca solta, gravetos e lascas caídas junto à quebra
    for i, (x, y, a, L) in enumerate(((1.45, -.34, .5, .42), (1.62, .08, -.3, .3), (1.25, .46, 1.2, .24), (.95, -.5, .1, .5))):
        tubo_organico('graveto%d' % i, [(x, y, .03), (x + math.cos(a) * L * .5, y + math.sin(a) * L * .5, .045), (x + math.cos(a) * L, y + math.sin(a) * L, .03)], .03 - i * .003, .015, 'casca_s', lados=7, passos=5, rugas=.1, semente=30 + i)
    return 3.7, 1.7

def raiz_assimetrica():
    """raiz exposta: uma raiz mestra grossa em arco, duas outras bem diferentes (curta/inclinada e longa/fina) e uma radícula; sem ângulos regulares"""
    # cada raiz: (pontos, raio base, raio ponta, semente)
    raizes = [
        ([(0, 0, .0), (.35, .05, .26), (.85, .18, .3), (1.35, .1, .12), (1.8, -.12, -.1)], .24, .08, 2),     # mestra: arco alto, mergulha na lama
        ([(-.05, -.02, .02), (-.1, -.38, .2), (-.32, -.72, .15), (-.62, -.98, -.1)], .17, .06, 3),           # curta, vira para baixo
        ([(-.1, .05, .0), (-.55, .22, .15), (-1.05, .5, .1), (-1.6, .46, -.08)], .13, .045, 4),               # longa e mais fina para o outro lado
    ]
    for pts, r0, r1, sem in raizes: tubo_organico('raiz%d' % sem, pts, r0, r1, 'raiz', lados=14, passos=22, rugas=.2, semente=sem, tampa_fim=True)
    tubo_organico('radicula', [(1.05, .22, .28), (1.25, .52, .2), (1.42, .8, -.05)], .09, .04, 'raiz', lados=8, passos=8, rugas=.15, semente=8)
    # nó da base meio enterrado + lama que segue as raízes
    tubo_organico('no', [(-.18, 0, -.05), (.05, .02, .12), (.25, .06, .12)], .26, .2, 'casca', lados=18, passos=8, rugas=.2, semente=11, tampa_fim=False)
    lama('lama_r1', [(-.4, 0, 0), (.3, .06, 0), (1.0, .16, 0), (1.9, -.1, 0)], .38, 14)
    lama('lama_r2', [(-.12, -.1, 0), (-.2, -.5, 0), (-.6, -1.0, 0)], .28, 15)
    mancha('lama_r3', -1.0, .35, .3, 16, 'lama_m', .014, 5, .6)
    for i, (x, y, r) in enumerate(((.55, .2, .1), (-.15, -.3, .08), (1.1, .12, .07))):
        z = .27 if i == 0 else .2
        mancha('musgo_r%d' % i, x, y, r, 40 + i, 'musgo', z, 5, .6)
    return 4.3, 3.1

def touceira_junco(semente=3):
    """touceira de lâminas estreitas: ângulos irregulares (nem leque perfeito), alturas e quedas diferentes, algumas dobradas por cima das vizinhas; espigas finas"""
    rr = random.Random(semente); n = 24
    for i in range(n):
        yaw = (i / n) * 2 * math.pi + rr.uniform(-.28, .28) + (.5 if i % 5 == 0 else 0)
        L = rr.uniform(.55, 1.05) if i % 4 else rr.uniform(.9, 1.35)
        raio0 = rr.uniform(.0, .1)
        base = (math.cos(yaw) * raio0, math.sin(yaw) * raio0, .0 + (i % 5) * .012)
        folha('junco%d' % i, base, yaw + rr.uniform(-.1, .1), L, rr.uniform(.05, .085), rr.uniform(.2, .5) * L, rr.uniform(.05, .45) * L, .35, 'folha_a' if i % 3 else 'folha_b', 'nervura', 1.2, 12, rr.uniform(-.6, .6), 50 + i)
    for i in range(3):   # espigas marrons mais altas
        yaw = rr.uniform(0, 6.28); d = rr.uniform(.12, .32)
        tubo_organico('espiga%d' % i, [(math.cos(yaw) * .06, math.sin(yaw) * .06, .02), (math.cos(yaw) * d * .8, math.sin(yaw) * d * .8, .35), (math.cos(yaw) * d, math.sin(yaw) * d, .6)], .011, .006, 'casca_s', lados=6, passos=6, rugas=0, semente=70 + i, tampa_fim=False)
        esf((math.cos(yaw) * d, math.sin(yaw) * d, .62), (.022, .022, .07), 'casca', 8)
    mancha('lama_j', .02, -.02, .26, semente, 'lama', .008, 5)
    return 2.5, 2.5

def planta_larga(semente=2):
    """roseta alienígena: folhas largas e côncavas de verde-azulado em camadas (as de fora caídas, as de dentro mais eretas), miolo roxo que se enrola"""
    rr = random.Random(semente)
    camadas = [(6, .95, .46, .1, .35, .3), (5, .75, .38, .22, .4, .45), (4, .52, .3, .3, .35, .62)]   # n, comp, larg, subida, queda, "altura base"
    k = 0
    for (n, L, W, sub, qd, zb) in camadas:
        off = rr.uniform(0, 6.28)
        for i in range(n):
            yaw = off + i / n * 2 * math.pi + rr.uniform(-.22, .22); Li = L * rr.uniform(.82, 1.08)
            folha('larga%d' % k, (math.cos(yaw) * .05, math.sin(yaw) * .05, .03 + zb * .1), yaw, Li, W * rr.uniform(.85, 1.1), sub * Li, qd * Li, .55 + zb * .3, 'alien_a' if k % 2 else 'alien_b', None, .9, 14, rr.uniform(-.5, .5), 90 + k)
            k += 1
    # broto central enrolado
    tubo_organico('broto', [(0, 0, .05), (.03, .02, .3), (.09, .0, .52)], .09, .015, 'alien_c', lados=10, passos=10, rugas=.1, semente=3, tampa_fim=False)
    mancha('lama_p', 0, 0, .34, semente + 40, 'lama', .008, 6)
    return 2.5, 2.5

def _lasca(x, y, z, dy=.1):
    for i, (d, dz, L, r) in enumerate(((dy, .1, .38, .06), (-dy * .6, .14, .24, .05), (dy * 1.8, .04, .14, .04))):
        tubo_organico('lasca%d' % i, [(x, y + d, z + dz - .08), (x + L * .5, y + d * 1.3, z + dz), (x + L, y + d * 1.6, z + dz * .5)], r, .008, 'miolo', lados=6, passos=6, rugas=.35, semente=80 + i, tampa_fim=False)

def tronco_curvo():
    """tronco que faz um arco: pé afundado na lama, curva para o outro lado e termina quebrado; musgo no lado de dentro da curva"""
    eixo = [(-1.3, -.55, -.16), (-.85, -.08, .1), (-.15, .3, .25), (.65, .42, .29), (1.3, .22, .2)]
    tubo_organico('tronco', eixo, .3, .19, 'casca', lados=20, passos=36, rugas=.18, semente=21, fim_quebrado=True, achatar=.9)
    _lasca(1.25, .24, .22)
    lama('lama_c', [(-1.6, -.65, 0), (-.9, -.1, 0), (-.1, .32, 0)], .5, 24)
    mancha('lama_c2', -1.2, -.85, .3, 25, 'lama_m', .014, 5, .7)
    for i, (x, y, r) in enumerate(((-.75, -.12, .2), (-.3, .2, .15), (.2, .38, .12))): mancha('musgo_c%d' % i, x, y, r, 90 + i, 'musgo', .5 - abs(x) * .12, 6, .55)
    tubo_organico('graveto', [(.9, -.2, .03), (1.1, -.42, .045), (1.2, -.62, .03)], .03, .014, 'casca_s', lados=7, passos=5, rugas=.1, semente=95)
    return 3.2, 1.5

def tronco_bifurcado():
    """tronco que se divide em dois galhos grossos de espessuras diferentes: um quebrado, o outro mais fino e inteiro; pé na lama"""
    tubo_organico('base', [(-1.2, .05, -.12), (-.55, .08, .16), (.1, 0, .3)], .34, .27, 'casca', lados=20, passos=16, rugas=.17, semente=31, tampa_fim=False)
    tubo_organico('galho_a', [(.1, 0, .3), (.65, .28, .31), (1.2, .68, .24)], .25, .13, 'casca', lados=16, passos=18, rugas=.17, semente=32, fim_quebrado=True)
    tubo_organico('galho_b', [(.05, -.02, .3), (.75, -.22, .27), (1.15, -.7, .14)], .19, .07, 'casca', lados=14, passos=16, rugas=.16, semente=33)
    _lasca(1.18, .7, .24, .08)
    lama('lama_b', [(-1.6, .08, 0), (-.8, .1, 0), (0, .02, 0)], .5, 34)
    mancha('lama_b2', .3, -.45, .22, 35, 'lama_m', .014, 5, .7)
    for i, (x, y, r) in enumerate(((-.7, .1, .2), (.05, .0, .14), (.6, .22, .09))): mancha('musgo_b%d' % i, x, y, r, 100 + i, 'musgo', .5, 6, .55)
    return 3.0, 2.3

def tronco_oco():
    """tronco apodrecido e aberto ao longo do topo: calha escura de madeira podre com borda clara irregular, sem tampa limpa"""
    eixo = [(-1.2, .1, -.1), (-.5, .04, .18), (.4, -.04, .27), (1.1, -.08, .22)]
    tubo_organico('tronco', eixo, .36, .28, 'casca', lados=22, passos=32, rugas=.2, semente=41, fim_quebrado=True, tampa_fim=False)
    lama('borda_oca', [(-.85, .1, 0), (-.3, .05, 0), (.5, -.03, 0), (1.0, -.08, 0)], .2, 42, 'miolo', .66)   # calha aberta no topo: borda clara de madeira podre e interior escuro
    lama('vazio', [(-.8, .1, 0), (-.3, .05, 0), (.5, -.03, 0), (.95, -.08, 0)], .12, 44, 'preto', .672)
    lama('lama_o', [(-1.6, .12, 0), (-.8, .08, 0), (.2, -.02, 0), (1.0, -.08, 0)], .45, 46)
    mancha('musgo_o', .8, .12, .16, 47, 'musgo', .52, 6, .55); mancha('musgo_o2', -.95, .14, .15, 48, 'musgo', .33, 6, .55)
    return 3.0, 1.5

def raiz_arco():
    """raiz de outro desenho: um grande arco que sai da lama e volta a ela, um toco curto torto e uma raiz fina e comprida em outra direção"""
    for pts, r0, r1, sem in [
        ([(0, 0, -.05), (.3, .45, .3), (.95, .8, .36), (1.55, .5, .2), (1.85, -.15, -.12)], .2, .1, 61),
        ([(-.05, 0, .02), (-.5, .12, .16), (-.85, -.25, .1)], .2, .09, 62),
        ([(.0, -.05, .02), (.35, -.45, .14), (1.0, -.78, .1), (1.7, -.7, -.06)], .12, .04, 63)]:
        tubo_organico('raiz%d' % sem, pts, r0, r1, 'raiz', lados=14, passos=22, rugas=.2, semente=sem, tampa_fim=True)
    tubo_organico('no', [(-.2, 0, -.05), (.05, .02, .14), (.2, .0, .13)], .27, .2, 'casca', lados=18, passos=8, rugas=.2, semente=64, tampa_fim=False)
    lama('lama_a1', [(-.6, .1, 0), (.3, .3, 0), (1.0, .6, 0), (1.9, -.1, 0)], .4, 65)
    lama('lama_a2', [(.1, -.2, 0), (.9, -.7, 0), (1.8, -.7, 0)], .26, 66)
    mancha('musgo_a', .75, .75, .1, 67, 'musgo', .35, 5, .6); mancha('musgo_a2', -.35, .1, .09, 68, 'musgo', .22, 5, .6)
    return 3.8, 2.6

PECAS_VEG = {
    'tronco_curvo': (tronco_curvo, 'Tronco curvo (pântano)', 'cenario', False, 'Madeira', 0, 0),
    'tronco_bifurcado': (tronco_bifurcado, 'Tronco bifurcado (pântano)', 'cenario', False, 'Madeira', 0, 0),
    'tronco_oco': (tronco_oco, 'Tronco oco (pântano)', 'cenario', False, 'Madeira', 0, 0),
    'raiz_arco': (raiz_arco, 'Raiz em arco (pântano)', 'cenario', False, 'Madeira', 0, 0),
    'tronco_quebrado': (tronco_quebrado, 'Tronco quebrado (pântano)', 'cenario', False, 'Madeira', 0, 0),
    'raiz_assimetrica': (raiz_assimetrica, 'Raiz exposta (pântano)', 'cenario', False, 'Madeira', 0, 0),
    'touceira_junco': (touceira_junco, 'Touceira de junco', 'cenario', False, 'Planta', 0, 0),
    'planta_alien': (planta_larga, 'Planta de folhas largas', 'cenario', False, 'Planta', 0, 0),
}
ESCALA_MAPA = {'tronco_curvo': .72, 'tronco_bifurcado': .72, 'tronco_oco': .72, 'raiz_arco': .68, 'tronco_quebrado': .72, 'raiz_assimetrica': .68, 'touceira_junco': .8, 'planta_alien': .72}
SO = [a for a in ARGS[1:] if a][0].split(',') if len(ARGS) > 1 else []

def luz_suave():
    bpy.data.objects['sol'].rotation_euler = (math.radians(24), math.radians(6), math.radians(-35)); bpy.data.lights['sol'].energy = 3.0
    bpy.data.lights['sol'].angle = math.radians(14)

def renderiza(pid, w, h, ppm=160):
    rx = int(math.ceil((w + .16) * ppm)); ry = int(math.ceil((h + .16) * ppm))
    sc = bpy.context.scene; sc.render.resolution_x = rx; sc.render.resolution_y = ry
    cam = sc.camera; cam.data.ortho_scale = max(rx, ry) / ppm; cam.location = (0, 0, 40); cam.rotation_euler = (0, 0, 0)
    sc.render.filepath = os.path.join(SAIDA, pid + '.png'); bpy.ops.render.render(write_still=True)

def centraliza_e_contorno():
    """contorno fino (só a silhueta de cada malha) e câmera no centro da caixa de todos os objetos de malha"""
    ms = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    xs = [(o.matrix_world @ Vector(c)).x for o in ms for c in o.bound_box]; ys = [(o.matrix_world @ Vector(c)).y for o in ms for c in o.bound_box]
    for o in ms:
        if len(o.data.vertices) > 8 and not o.name.startswith(('lama', 'musgo')): contorno(o, .008)
    return (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, max(xs) - min(xs), max(ys) - min(ys)

medidas = {}
if not SO or 'composicao' in SO:
    limpa(); mats_veg(); luz_e_camera(256, 90, 6); luz_suave()
    def em(fn, dx, dy, rot):   # põe a peça numa posição/rotação da composição
        antes = set(bpy.context.scene.objects); fn()
        for o in [o for o in bpy.context.scene.objects if o not in antes]:
            c, s = math.cos(rot), math.sin(rot); x, y = o.location.x, o.location.y
            if o.type == 'MESH' and o.location.length < 1e-6:     # malhas já estão em coordenadas do mundo: aplica a rotação nos vértices
                for v in o.data.vertices: v.co = Vector((v.co.x * c - v.co.y * s + dx, v.co.x * s + v.co.y * c + dy, v.co.z))
            else: o.location = (x * c - y * s + dx, x * s + y * c + dy, o.location.z)
    em(tronco_quebrado, 0, 0, math.radians(-12)); em(raiz_assimetrica, 3.9, -.2, math.radians(160))
    em(touceira_junco, -2.7, 1.9, 0); em(planta_larga, 2.3, 2.1, math.radians(30))
    cx, cy, w, h = centraliza_e_contorno()
    for o in bpy.context.scene.objects:
        if o.type == 'MESH' and o.location.length < 1e-6:
            for v in o.data.vertices: v.co.x -= cx; v.co.y -= cy
        elif o.type == 'MESH': o.location.x -= cx; o.location.y -= cy
    renderiza('composicao', w + .2, h + .2, 130); print('composição pronta', flush=True)
if not SO or any(s != 'composicao' for s in SO):
    for pid, (fn, nome, cat, bloq, mat, pv, dur) in PECAS_VEG.items():
        if SO and pid not in SO: continue
        limpa(); mats_veg(); luz_e_camera(256, 90, 6); luz_suave()
        fn(); cx, cy, w, h = centraliza_e_contorno()
        for o in bpy.context.scene.objects:
            if o.type == 'MESH':
                if o.location.length < 1e-6:
                    for v in o.data.vertices: v.co.x -= cx; v.co.y -= cy
                else: o.location.x -= cx; o.location.y -= cy
        renderiza(pid, w, h)
        e = ESCALA_MAPA.get(pid, 1.0)   # tamanho real no mapa: a imagem é desenhada menor que o modelo (um tronco de 2,8 m, não 3,9)
        medidas[pid] = {'nome': nome, 'larguraM': round((w + .16) * e, 3), 'alturaM': round((h + .16) * e, 3), 'cat': cat, 'bloq': bloq, 'material': mat, 'pvMax': pv, 'dureza': dur, 'camada': 3}
        print('feito', pid, round(w, 2), round(h, 2), flush=True)
    json.dump(medidas, open(os.path.join(SAIDA, '_medidas.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
