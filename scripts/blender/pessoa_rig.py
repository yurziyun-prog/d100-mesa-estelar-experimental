# Pessoa (jogador/NPC) com ESQUELETO e animações reais — base "Adventurer" (Quaternius, Ultimate Modular Men Pack, CC0), em camadas pintáveis.
# Rodar:  blender.exe -b -P pessoa_rig.py -- <pasta de saída> [--ident] [--teste] [--acoes a,b] [--vistas cima,frente,costas,perfil]
# Fonte editável: arte-fonte/pessoa-base/Adventurer.glb (esqueleto de 62 ossos, pesos e 24 animações do pacote).
# Cada camada sai em cinza neutro com sombreado (o jogo multiplica pela cor escolhida). Camadas BASE (roupa, calça, detalhe, pele, rosto) se ocultam entre si
# por holdout; camadas OPCIONAIS (cabelos, orelhas, acessórios, capa) só são recortadas pelas bases (o que está atrás do rosto/corpo some), sem recortar as outras opcionais:
# assim trocar ou tirar um chapéu/cabelo nunca deixa buraco.
# Vistas: cima (jogo: '<acao>_lado', o modelo olha para a ESQUERDA), e para o editor frente/costas/perfil ('<acao>_frente' …).
import sys, os, math, json
from mathutils import Vector, Matrix, Euler
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bl_lib import *
import bl_lib

ARGV = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
SAIDA = ARGV[0] if ARGV else os.path.join(os.getcwd(), 'pessoa_rig')
IDENT = '--ident' in ARGV; TESTE = '--teste' in ARGV
def opc(nome, padrao=None):
    return ARGV[ARGV.index(nome) + 1] if nome in ARGV else padrao
SO_ACOES = opc('--acoes'); SO_VISTAS = opc('--vistas'); SO_CAMADAS = opc('--camadas')   # --camadas a,b: renderiza só essas camadas (para acrescentar uma peça nova sem refazer tudo)
GLB = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'arte-fonte', 'pessoa-base', 'Adventurer.glb')

limpa(); bl_lib.ELEV = 82
bpy.ops.import_scene.gltf(filepath=os.path.abspath(GLB))
arm = bpy.data.objects['CharacterArmature']
for o in list(bpy.data.objects):
    if o.name == 'Icosphere' or (o.type == 'EMPTY' and o.name.endswith('_end')): bpy.data.objects.remove(o, do_unlink=True)
bpy.data.objects['RootNode'].rotation_mode = 'XYZ'; bpy.data.objects['RootNode'].rotation_euler = (0, 0, math.pi)  # o pacote olha para -Y; o jogo espera +Y (esquerda da imagem de cima)
ACAO = {a.name.split('|')[-1]: a for a in bpy.data.actions}
arm.animation_data_create()

# ---------------------------------------------------------------- camadas
BASE = ['roupa', 'calca', 'detalhe', 'pele', 'rosto']
OPCIONAIS = ['capa', 'cp_borda', 'cp_lista', 'cp_emblema', 'ac_mochila', 'ac_ombreiras', 'orelha_pontuda', 'orelha_grande', 'orelha_felina',
             'cabelo_curto', 'cabelo_longo', 'cabelo_rabo', 'cabelo_coque', 'cabelo_moicano', 'cabelo_volumoso', 'ac_chifres', 'ac_capacete', 'ac_chapeu', 'ac_coroa', 'ac_faixa', 'ac_espada', 'ac_pistola', 'ac_fuzil']
CAMADAS = OPCIONAIS[:5] + BASE + OPCIONAIS[5:]
OBJ = {c: [] for c in CAMADAS}
SEGUE = []            # (objeto, osso, matriz de repouso): peças extras que acompanham um osso
MAT_CAMADA = {'Green': 'roupa', 'LightGreen': 'detalhe', 'Brown': 'calca', 'Brown2': 'calca', 'Black': 'detalhe', 'Grey': 'detalhe', 'Gold': 'ac_mochila',
              'Skin': 'pele', 'Eyebrows': 'rosto', 'Eye': 'rosto', 'Hair': 'cabelo_curto'}

def separa_por_material(o):
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.separate(type='MATERIAL'); bpy.ops.object.mode_set(mode='OBJECT')

# o pacote guarda a malha fora do lugar do esqueleto: sempre se trabalha com a pose de REFERÊNCIA (Idle_Neutral, quadro 0), que põe o corpo em pé de 0 a 1,85 m
arm.data.pose_position = 'POSE'; arm.animation_data.action = ACAO['Idle_Neutral']; bpy.context.scene.frame_set(0); bpy.context.view_layer.update()
originais = [o for o in bpy.data.objects if o.type == 'MESH']
for o in originais: separa_por_material(o)
CORES_IDENT = {}
for o in [x for x in bpy.data.objects if x.type == 'MESH']:
    idx = o.data.polygons[0].material_index if len(o.data.polygons) else 0
    nome = o.material_slots[idx].material.name.split('.')[0]
    camada = ('ac_mochila' if o.name.startswith('Backpack') else MAT_CAMADA.get(nome, 'detalhe'))
    o['mat_original'] = nome; OBJ[camada].append(o)

def cinza_mat(nome, base=.78, rugo=.75, brilho=.2):
    m = bpy.data.materials.new(nome); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (base, base, base, 1); b.inputs['Roughness'].default_value = rugo
    try: b.inputs['Specular IOR Level'].default_value = brilho
    except Exception: pass
    return m
M_CAMADA = {'roupa': cinza_mat('c_roupa', .8, .92, .1), 'calca': cinza_mat('c_calca', .74, .9, .1), 'detalhe': cinza_mat('c_detalhe', .66, .45, .4), 'pele': cinza_mat('c_pele', .86, .65, .25), 'rosto': cinza_mat('c_rosto', .5, .4, .3)}
cinza = cinza_mat('cinza', .78, .8, .2); tecido = cinza_mat('tecido', .82, .92, .1)
cabelo_m = listras('cabelo_m', (.6, .6, .6), (.97, .97, .97), 16.0); pele_m = M_CAMADA['pele']
for c, lst in OBJ.items():
    for o in lst:
        for s in o.material_slots: s.material = M_CAMADA.get(c, cinza)

if IDENT:
    cores = {'Green': (1, 0, 0), 'LightGreen': (0, 0, 1), 'Brown': (1, 1, 0), 'Brown2': (1, .5, 0), 'Black': (0, 0, 0), 'Grey': (.5, .5, .5), 'Skin': (1, .7, .6), 'Eyebrows': (0, 1, 0), 'Eye': (0, 1, 1), 'Hair': (.6, 0, .6), 'Gold': (1, 1, 1)}
    for c, lst in OBJ.items():
        for o in lst:
            for s in o.material_slots:
                m = bpy.data.materials.new('i'); m.use_nodes = True; m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*cores.get(o.get('mat_original', 'Gold'), (1, 1, 1)), 1); s.material = m
    print('IDENT camadas:', {c: [o.get('mat_original') for o in l] for c, l in OBJ.items() if l})

# ---------------------------------------------------------------- cabeça: medidas do modelo para encaixar cabelos, orelhas e acessórios
def caixa(objs):
    dg = bpy.context.evaluated_depsgraph_get(); mn = Vector((1e9,) * 3); mx = Vector((-1e9,) * 3)
    for o in objs:
        ev = o.evaluated_get(dg); me = ev.to_mesh()
        for v in me.vertices:
            w = ev.matrix_world @ v.co
            for i in range(3): mn[i] = min(mn[i], w[i]); mx[i] = max(mx[i], w[i])
        ev.to_mesh_clear()
    return mn, mx
bpy.context.view_layer.update()
cab_skin = [o for o in OBJ['pele'] if o.name.startswith('Adventurer_Head')]
hmn, hmx = caixa(cab_skin or OBJ['pele']); HC = (hmn + hmx) / 2; HR = (hmx - hmn) / 2
print('CABECA centro', tuple(round(v, 3) for v in HC), 'raios', tuple(round(v, 3) for v in HR))
OLDC = Vector((0, .015, 1.65)); OLDR = Vector((.088, .108, .115))   # cabeça do modelo antigo (em que cabelos/acessórios foram desenhados)
KH = Vector(((HR[0] / OLDR[0] + HR[1] / OLDR[1]) / 2,) * 3)
HMAP = Matrix.Translation(HC) @ Matrix.Diagonal((KH[0], KH[1], KH[2], 1)) @ Matrix.Translation(-OLDC)
# v205: o cabelo vira uma calota MAIOR e mais alta: vista de cima a cabeça do modelo novo (mais alta que a antiga) aparecia como um disco de pele e a pessoa parecia careca com rabo de cavalo; agora o cabelo cobre o alto da cabeça (só o rosto/nariz aparece na frente)
HMAP_CABELO = HMAP @ Matrix.Translation(OLDC + Vector((0, 0, .02))) @ Matrix.Diagonal((1.2, 1.2, 1.5, 1)) @ Matrix.Translation(-OLDC)
tmn, tmx = caixa(OBJ['roupa'] + OBJ['calca']); print('CORPO caixa', tuple(round(v, 3) for v in tmn), tuple(round(v, 3) for v in tmx))

RAIZ = bpy.data.objects['RootNode']
def delta_osso(nome):
    # variação de pose do osso no mundo de REFERÊNCIA (sem o deslocamento da raiz), mais o deslocamento da raiz: assim peças extras e capa acompanham o corpo
    off = Matrix.Translation(RAIZ.location)
    m0 = off.inverted() @ arm.matrix_world
    pb = arm.pose.bones[nome]; b = arm.data.bones[nome]
    return off @ m0 @ (pb.matrix @ b.matrix_local.inverted()) @ m0.inverted()
def extra(camada, o, osso='Head', mapa=HMAP):
    if camada.startswith('cabelo_') and camada != 'cabelo_moicano' and mapa is HMAP: mapa = HMAP_CABELO
    """peça criada no sistema de coordenadas do modelo antigo (cabeça em (0,.015,1.65)), encaixada na cabeça nova e presa ao osso"""
    o.parent = None; bpy.context.view_layer.update()
    SEGUE.append((o, osso, delta_osso(osso).inverted() @ mapa @ o.matrix_world.copy())); OBJ[camada].append(o); return o

for l in (-1, 1):
    extra('orelha_pontuda', cone('op%d' % l, (l * .13, -.03, 1.675), .032, .004, .13, pele_m, rot=(.25, l * 1.25, l * .15)))
    extra('orelha_grande', esfera('og%d' % l, (l * .105, -.01, 1.66), (.022, .055, .07), pele_m))
    extra('orelha_felina', cone('of%d' % l, (l * .07, -.02, 1.775), .05, .004, .12, pele_m, rot=(0, l * .3, 0)))
    extra('ac_chifres', tubo('chifre%d' % l, [(l * .055, .0, 1.74), (l * .13, .02, 1.82), (l * .12, .09, 1.92)], [.028, .02, .004], cinza))
def fios(camada, n, base_z, raio_x, raio_y, cy=-.03, esp=.011):
    for k in range(n):
        a = k * math.pi * 2 / n + .2
        extra(camada, tubo('fio', [(math.cos(a) * .012, cy + math.sin(a) * .012, base_z + .09), (math.cos(a) * raio_x * .62, cy + math.sin(a) * raio_y * .62, base_z + .075), (math.cos(a) * raio_x, cy + math.sin(a) * raio_y, base_z + .012)], [esp, esp * 1.1, esp * .8], cabelo_m))
CAP = ((0, -.025, 1.71), (.106, .126, .104))
extra('cabelo_longo', esfera('cb2', CAP[0], CAP[1], cabelo_m, seg=28)); extra('cabelo_longo', esfera('cb2b', (0, -.1, 1.6), (.098, .13, .1), cabelo_m, seg=24)); fios('cabelo_longo', 18, 1.69, .092, .11)
extra('cabelo_rabo', esfera('cb3', CAP[0], CAP[1], cabelo_m, seg=28)); fios('cabelo_rabo', 18, 1.69, .092, .11)
extra('cabelo_rabo', tubo('rabo', [(0, -.09, 1.68), (0, -.16, 1.62), (0, -.23, 1.5), (0, -.25, 1.34)], [.04, .05, .042, .014], cabelo_m))
extra('cabelo_coque', esfera('cb4', CAP[0], CAP[1], cabelo_m, seg=28)); fios('cabelo_coque', 18, 1.69, .092, .11); extra('cabelo_coque', esfera('coque', (0, -.065, 1.775), (.052, .052, .045), cabelo_m))
extra('cabelo_moicano', esfera('crista', (0, -.012, 1.71), (.032, .115, .06), cabelo_m, seg=24))
extra('cabelo_volumoso', esfera('cb5', (0, -.03, 1.675), (.13, .14, .115), cabelo_m, seg=28))
# capacete: cúpula que cobre o cabelo, aba baixa e uma crista de frente para trás
extra('ac_capacete', esfera('capac1', (0, -.012, 1.705), (.118, .136, .118), cinza, seg=28)); extra('ac_capacete', esfera('capac2', (0, -.012, 1.64), (.124, .142, .03), cinza, seg=28))
extra('ac_capacete', tubo('crista_cap', [(0, .115, 1.72), (0, 0, 1.835), (0, -.13, 1.73)], [.016, .02, .016], cinza))
extra('ac_chapeu', esfera('chap1', (0, -.01, 1.765), (.1, .115, .065), cinza, seg=24)); extra('ac_chapeu', esfera('chap2', (0, -.01, 1.725), (.205, .215, .016), cinza, seg=28))
for nome, camada, raio, z in (('faixa', 'ac_faixa', .098, 1.745), ('coroa_a', 'ac_coroa', .092, 1.75)):
    bpy.ops.mesh.primitive_torus_add(major_radius=raio, minor_radius=.014, location=(0, -.012, z)); t = bpy.context.object; t.scale = (1, 1.15, 1)
    bpy.ops.object.transform_apply(scale=True); t.data.materials.append(cinza); extra(camada, t)
for k in range(9):
    a = k * math.pi * 2 / 9; extra('ac_coroa', cone('pt', (math.cos(a) * .092, -.012 + math.sin(a) * .106, 1.79), .016, 0, .075, cinza))
# ombreiras: presas aos ossos do braço (mapa identidade: coordenadas já em metros do modelo novo)
for l, osso in ((-1, 'UpperArm.L'), (1, 'UpperArm.R')):
    extra('ac_ombreiras', esfera('ombr%d' % l, (l * .225, 0, 1.45), (.1, .11, .06), cinza), osso, Matrix.Identity(4))

# ---------------- armas na mão direita (osso Wrist.R); posição da mão medida nos vértices do osso, na pose de referência
def centro_grupo(nome):
    dg = bpy.context.evaluated_depsgraph_get(); soma = Vector(); n = 0
    for o in [x for x in bpy.data.objects if x.type == 'MESH']:
        if nome not in o.vertex_groups: continue
        gi = o.vertex_groups[nome].index; ev = o.evaluated_get(dg); me = ev.to_mesh()
        for v in o.data.vertices:
            for g in v.groups:
                if g.group == gi and g.weight > .5: soma += ev.matrix_world @ me.vertices[v.index].co; n += 1
        ev.to_mesh_clear()
    return soma / max(1, n)
MAO = centro_grupo('Middle2.R')
def cx(nome, c, dim, mat=None):
    bpy.ops.mesh.primitive_cube_add(location=c); o = bpy.context.object; o.name = nome; o.scale = (dim[0] / 2, dim[1] / 2, dim[2] / 2); bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new('b', 'BEVEL'); bev.width = min(dim) * .3; bev.segments = 2
    for p in o.data.polygons: p.use_smooth = True
    o.data.materials.append(mat or cinza); return o
def arma(camada, partes):
    for nome, c, d in partes: extra(camada, cx(nome, MAO + Vector(c), d), 'Wrist.R', Matrix.Identity(4))
# espada: punho, guarda e lâmina plana (vista de cima mostra a largura)
arma('ac_espada', [('punho', (0, .0, 0), (.04, .13, .04)), ('guarda', (0, .08, 0), (.16, .025, .03)), ('lamina', (0, .52, 0), (.06, .82, .012)), ('ponta', (0, .96, 0), (.03, .08, .012)), ('pomo', (0, -.07, 0), (.05, .04, .05))])
# pistola: cano/corrediça à frente, empunhadura na palma
arma('ac_pistola', [('corredica', (0, .14, .035), (.045, .27, .055)), ('cano', (0, .31, .035), (.025, .09, .03)), ('cabo', (0, -.01, -.03), (.04, .05, .12)), ('mira', (0, .24, .075), (.02, .03, .02))])
# fuzil: coronha no ombro, corpo longo, cano e luneta
arma('ac_fuzil', [('coronha', (0, -.2, .0), (.05, .24, .1)), ('corpo', (0, .3, .02), (.06, .7, .08)), ('cano', (0, .82, .02), (.03, .36, .03)), ('luneta', (0, .28, .1), (.04, .22, .04)), ('cabo', (0, -.02, -.07), (.04, .06, .1)), ('carregador', (0, .24, -.08), (.04, .08, .12))])
# o original não tem a mochila em OBJ['ac_mochila'] se o nome mudou: garante
for o in [x for x in bpy.data.objects if x.type == 'MESH' and x.name.startswith('Backpack') and not any(x in l for l in OBJ.values())]: OBJ['ac_mochila'].append(o)

# ---------------------------------------------------------------- pose, extras e capa
CHEST0 = arm.matrix_world @ arm.pose.bones['Chest'].head   # posição de referência do peito
CAPA = []
def monta_capa(P, dpos):
    for o in CAPA: bpy.data.objects.remove(o, do_unlink=True)
    CAPA.clear()
    for c in ('capa', 'cp_borda', 'cp_lista', 'cp_emblema'): OBJ[c].clear()
    if P.get('sem_capa'): return
    T = P.get('T', 0); L = P.get('capa_l', .7); fl = P.get('flare', 0); sw = P.get('sway', .15); alt = P.get('alt', 0)
    R, C = 16, 12; vs = []; fs = []
    ybase = tmn[1] - .03   # costas do casaco
    for j in range(R + 1):
        t = j / R; w = .17 + .09 * t * (1 + fl * .6) + .02 * math.sin(t * 3.1)   # capa estreita: não domina a imagem de cima
        xc = sw * math.sin(T - t * 3.0) * t * t + .02 * math.sin(T * 2 + j * .9) * t
        y = ybase - L * (t ** 1.15)
        zc = max(.07, 1.46 - t * (1.36 - alt * .75))
        for k in range(C + 1):
            u = k / C * 2 - 1
            dobra = .035 * math.sin(u * 5.5 + T + j * .35) * t * (1 + fl)
            vs.append((xc + u * w + dpos[0], y + dobra * .6 - .03 * u * u * t + dpos[1], max(.05, zc + dobra - .06 * u * u * (1 - .4 * fl) * min(1, t * 2) + dpos[2])))
    for j in range(R):
        for k in range(C): a = j * (C + 1) + k; fs.append((a, a + 1, a + C + 2, a + C + 1))
    def malha(nome, faces, dz=0):
        me = bpy.data.meshes.new(nome); me.from_pydata([(x, y, z + dz) for (x, y, z) in vs], [], faces); me.update(); o = bpy.data.objects.new(nome, me); bpy.context.collection.objects.link(o)
        for p in me.polygons: p.use_smooth = True
        o.data.materials.append(cinza); CAPA.append(o); return o
    def centro(fc):
        a = fc[0]; j = a // (C + 1); k = a % (C + 1); return ((k + .5) / C * 2 - 1, (j + .5) / R)
    o = malha('capa', fs); m = o.modifiers.new('esp', 'SOLIDIFY'); m.thickness = .018; OBJ['capa'].append(o)
    sel = {'cp_borda': [fc for fc in fs if (fc[0] % (C + 1) in (0, C - 1)) or fc[0] >= R * (C + 1) - (C + 1)],
           'cp_lista': [fc for fc in fs if fc[0] % (C + 1) in (C // 2 - 1, C // 2) and fc[0] > 2 * (C + 1)],
           'cp_emblema': [fc for fc in fs if abs(centro(fc)[0]) / .5 + abs(centro(fc)[1] - .34) / .2 < 1]}
    for camn, faces in sel.items(): OBJ[camn].append(malha(camn, faces, .006))

def aplica_pose(acao, frame, P, desloca=(0, 0, 0)):
    RAIZ.location = desloca; bpy.context.view_layer.update()
    arm.animation_data.action = ACAO[acao]; bpy.context.scene.frame_set(int(math.floor(frame)), subframe=frame - math.floor(frame))
    bpy.context.view_layer.update()
    for o, osso, W in SEGUE: o.matrix_world = delta_osso(osso) @ W
    # a capa acompanha o peito (só a posição; ela balança sozinha)
    d = (arm.matrix_world @ arm.pose.bones['Chest'].head) - CHEST0
    monta_capa(P, (d.x, d.y, d.z))
    bpy.context.view_layer.update()

# ---------------------------------------------------------------- ações do jogo → animações do pacote
# ciclo=True: amostra i/N (sem repetir o primeiro quadro no fim); ciclo=False: i/(N-1) e inclui a pose final (morte para nela).
def capa_p(acao, t, vista='cima'):
    T = 2 * math.pi * t; p = math.sin(math.pi * t)
    if acao.startswith('atacar_'): acao = 'atacar'
    # a MESMA capa em todas as vistas (a vista só muda a câmera, nunca o desenho)
    if acao == 'parado': return dict(T=T, capa_l=.3, sway=.015, alt=-.3)
    if acao == 'andar': return dict(T=T, capa_l=.5, sway=.16, alt=.1, flare=.05)
    if acao == 'atacar': return dict(T=T, capa_l=.6, flare=.15 + .3 * p, sway=.22, alt=.3 * p)
    if acao == 'golpe': return dict(T=T, capa_l=1.0 - .4 * p, flare=.7 * p, sway=.2, alt=.2)
    if acao == 'morrer' and t > .55: return dict(sem_capa=True)  # o corpo deitado cobre a capa
    if acao == 'morrer': e = min(1, t * 1.15); e = e * e * (3 - 2 * e); return dict(T=T * .2, capa_l=.45 + .3 * e, flare=.7 * e, sway=.1, alt=1.3 * e)
    if acao == 'sentado': return dict(T=T, capa_l=.3, sway=.02, alt=-.7)
    return dict(sem_capa=True)
PLANO = [  # (nome no jogo, animação do pacote, quadro inicial, quadro final, nº de quadros, ciclo, só-vistas-do-editor?)
    ('parado', 'Idle_Neutral', 0, 40, 8, True),
    ('andar', 'Walk', 0, 32, 12, True),
    ('atacar', 'Punch_Right', 0, 20, 10, False),
    ('golpe', 'HitRecieve', 0, 13, 6, False),
    ('atacar_espada', 'Sword_Slash', 0, 24, 12, False),
    ('atacar_tiro', 'Gun_Shoot', 0, 14, 8, False),
    ('morrer', 'Death', 0, 25, 10, False),
    ('deitado', 'Death', 25, 25, 1, True),
    ('sentado', 'Idle_Neutral', 0, 40, 4, True)]
if TESTE: PLANO = [('andar', 'Walk', 0, 32, 4, True), ('atacar', 'Punch_Right', 0, 20, 4, False), ('morrer', 'Death', 0, 25, 3, False)]
if SO_ACOES: PLANO = [p for p in PLANO if p[0] in SO_ACOES.split(',')]

def frames(p):
    nome, anim, f0, f1, n, ciclo = p
    out = []
    for i in range(n):
        t = i / n if ciclo else (i / (n - 1) if n > 1 else 1.0)
        out.append((f0 + (f1 - f0) * t if f1 > f0 else float(f0), t))
    return out

# sentado: a pose "parado" com as pernas dobradas à frente e o quadril mais baixo (ajuste por ossos)
def gira_osso(nome, graus, eixo_mundo=(1, 0, 0)):
    """gira o osso (e o que depende dele) em torno da sua articulação, num eixo do MUNDO: não depende da orientação interna dos ossos do pacote"""
    pb = arm.pose.bones[nome]; m = pb.matrix.copy(); j = m.translation.copy()
    ax = (arm.matrix_world.inverted().to_3x3() @ Vector(eixo_mundo)).normalized()
    pb.matrix = Matrix.Translation(j) @ Matrix.Rotation(math.radians(graus), 4, ax) @ Matrix.Translation(-j) @ m
    bpy.context.view_layer.update()
def pose_sentado(P):
    guarda = {b.name: (b.rotation_quaternion.copy(), b.location.copy()) for b in arm.pose.bones}
    arm.animation_data.action = None
    for n, (q, l) in guarda.items(): arm.pose.bones[n].rotation_quaternion = q; arm.pose.bones[n].location = l
    bpy.context.view_layer.update()
    pb = arm.pose.bones['Body']; m = pb.matrix.copy(); m.translation = m.translation + arm.matrix_world.inverted().to_3x3() @ Vector((0, 0, -.40)); pb.matrix = m; bpy.context.view_layer.update()
    for l in ('L', 'R'):
        gira_osso('UpperLeg.' + l, 88); gira_osso('LowerLeg.' + l, -88)
    for o, osso, W in SEGUE: o.matrix_world = delta_osso(osso) @ W
    d = (arm.matrix_world @ arm.pose.bones['Chest'].head) - CHEST0; monta_capa(P, (d.x, d.y, d.z)); bpy.context.view_layer.update()

# ---------------------------------------------------------------- câmeras
VISTAS = {'cima': dict(elev=82, ortho=2.2, centro=(0, -.1, 0), dir='lado', sufixo='lado'),
          'frente': dict(elev=8, ortho=2.3, centro=(0, 0, .95), dir='frente', sufixo='frente'),
          'costas': dict(elev=8, ortho=2.3, centro=(0, 0, .95), dir='costas', sufixo='costas'),
          'perfil': dict(elev=8, ortho=2.3, centro=(0, 0, .95), dir='lado', sufixo='perfil')}
cam = luz_e_camera(256, 82, 2.0); sc = bpy.context.scene
try: sc.eevee.use_gtao = True
except Exception: pass

def renderiza(vista, acao, i, pasta_base):
    cfg = VISTAS[vista]; cam.data.ortho_scale = cfg['ortho']; posiciona_camera(cam, cfg['dir'], elev=cfg['elev'], centro=cfg['centro'])
    todos = [o for o in bpy.data.objects if o.type == 'MESH']
    for c in CAMADAS:
        if not OBJ[c] or (SO_CAMADAS and c not in SO_CAMADAS.split(',')): continue
        alvo = set(OBJ[c]); base = c in BASE
        for o in todos:
            em_base = any(o in OBJ[b] for b in BASE)
            if o in alvo: o.hide_render = False; o.is_holdout = False
            elif em_base: o.hide_render = False; o.is_holdout = True      # as bases recortam tudo
            else: o.hide_render = True; o.is_holdout = False              # as opcionais não se recortam entre si
        pasta = os.path.join(pasta_base, c, '%s_%s' % (acao, cfg['sufixo'])); os.makedirs(pasta, exist_ok=True)
        sc.render.filepath = os.path.join(pasta, 'q_%02d.png' % i); bpy.ops.render.render(write_still=True)

vistas = SO_VISTAS.split(',') if SO_VISTAS else (['cima'] if TESTE else ['cima', 'frente', 'costas', 'perfil'])
if IDENT:
    arm.data.pose_position = 'POSE'; aplica_pose('Idle_Neutral', 0, dict(sem_capa=True))
    for o in bpy.data.objects:
        if o.type == 'MESH': o.hide_render = False; o.is_holdout = False
    for v in ('cima', 'frente', 'costas'):
        cfg = VISTAS[v]; cam.data.ortho_scale = cfg['ortho']; posiciona_camera(cam, cfg['dir'], elev=cfg['elev'], centro=cfg['centro'])
        os.makedirs(SAIDA, exist_ok=True); sc.render.filepath = os.path.join(SAIDA, 'ident_%s.png' % v); bpy.ops.render.render(write_still=True)
    sys.exit(0)
arm.data.pose_position = 'POSE'
for vista in vistas:
    for p in PLANO:
        nome, anim = p[0], p[1]
        if vista != 'cima' and nome not in ('parado', 'andar'): continue
        for i, (fr, t) in enumerate(frames(p)):
            e = t * t * (3 - 2 * t) if nome == 'morrer' else (1.0 if nome == 'deitado' else 0.0)
            aplica_pose(anim, fr, capa_p(nome, t, vista), (0, .67 * e, 0))   # o corpo que cai deita centrado no lugar onde estava (senão a imagem o corta)
            if nome == 'sentado': pose_sentado(capa_p(nome, t))
            if '--dbg' in ARGV: print('DBG', nome, i, [tuple(round(v, 2) for v in x) for x in caixa(OBJ['roupa'])], tuple(round(v, 2) for v in cam.location))
            renderiza(vista, nome, i, SAIDA)
        print('feito', vista, nome, flush=True)
print('fim', flush=True)
