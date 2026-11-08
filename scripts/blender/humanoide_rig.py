# Criaturas HUMANOIDES do mapa de testes (zumbi, cadáver de chefe, vampiro) com o ESQUELETO e as animações reais do Adventurer (Quaternius, CC0),
# vistas de cima. Cada variante muda pele, roupa, proporção e postura (zumbi: braços à frente e tronco curvado; vampiro: capa).
# Rodar:  blender.exe -b -P humanoide_rig.py -- <pasta de saída> <variante> [--teste]      (variantes: zumbi_1, cadaver_de_chefe, vampiro_generico)
# Saída: <pasta>/<variante>/<acao>_lado/q_NN.png (o modelo olha para a ESQUERDA). Depois: node scripts/blender/montar-cima.cjs <pasta>
import sys, os, math
from mathutils import Vector, Matrix, Euler
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bl_lib import *
import bl_lib

ARGV = sys.argv[sys.argv.index('--') + 1:]
SAIDA, VAR = ARGV[0], ARGV[1]
TESTE = '--teste' in ARGV
GLB = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'arte-fonte', 'pessoa-base', 'Adventurer.glb')
# cores (sRGB) por material do pacote + escala + postura de cada variante
V = {
 'zumbi_1': dict(esc=1.0, pele='#8a9a74', Green='#5b4a3a', LightGreen='#4a3d33', Brown='#3b342a', Brown2='#2e2a22', Black='#1d1b19', Grey='#2a2825', Hair='#2a2420', Eyebrows='#201c18', Eye='#d8d49a', bracos=82, curva=16, fala=1.0),
 'cadaver_de_chefe': dict(esc=1.2, pele='#6f7e66', Green='#3a3d44', LightGreen='#5c2a2a', Brown='#2b2d33', Brown2='#222428', Black='#151618', Grey='#2a2c30', Hair='#1a1a1a', Eyebrows='#151515', Eye='#e6e0a0', bracos=78, curva=12, ombreiras=True, fala=.9),
 # macaco de cálico: grande, de braços longos e postura curvada (anda apoiado nos punhos)
 'criatura_de_calico_1': dict(esc=1.12, pele='#7a5a3c', Green='#6a4a30', LightGreen='#7d5c3a', Brown='#5a3e28', Brown2='#4a3322', Black='#2a1c12', Grey='#3a281a', Hair='#4a3322', Eyebrows='#2a1c12', Eye='#e8d890', bracos=18, curva=30, longos=1.22, cotovelo=8, sem_roupa=True, fala=1.0),
 # insetoide predador: carapaça verde, braços de louva-a-deus dobrados à frente, corpo agachado, sem cabelo
 'insetoide_predador': dict(esc=1.05, pele='#4a6a38', Green='#3a5a2c', LightGreen='#6a8a3a', Brown='#34502a', Brown2='#2a4222', Black='#1e301a', Grey='#26381f', Hair='#3a5a2c', Eyebrows='#1e301a', Eye='#e03a2a', bracos=58, curva=24, cotovelo=62, sem_cabelo=True, crista=True, fala=1.0),
 'vampiro_generico': dict(esc=1.02, pele='#dcd5d2', Green='#18181d', LightGreen='#6a1420', Brown='#14141a', Brown2='#101015', Black='#0e0e10', Grey='#1c1c20', Hair='#0f0f12', Eyebrows='#0a0a0c', Eye='#e03030', bracos=0, curva=0, capa=True, fala=1.0),
}[VAR]
limpa(); bl_lib.ELEV = 82
bpy.ops.import_scene.gltf(filepath=os.path.abspath(GLB))
arm = bpy.data.objects['CharacterArmature']
for o in list(bpy.data.objects):
    if o.name == 'Icosphere' or (o.type == 'EMPTY' and o.name.endswith('_end')) or o.name.startswith('Backpack'): bpy.data.objects.remove(o, do_unlink=True)
raiz = bpy.data.objects['RootNode']; raiz.rotation_mode = 'XYZ'; raiz.rotation_euler = (0, 0, math.pi); raiz.scale = (V['esc'],) * 3
ACAO = {a.name.split('|')[-1]: a for a in bpy.data.actions}; arm.animation_data_create()
arm.data.pose_position = 'POSE'; arm.animation_data.action = ACAO['Idle_Neutral']; bpy.context.scene.frame_set(0); bpy.context.view_layer.update()

def lin(c): c = c / 255.0; return c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4
def cor(h): h = h.lstrip('#'); return tuple(lin(int(h[i:i + 2], 16)) for i in (0, 2, 4))
def mat(nome, hexa, rugo=.8, relevo=.35, escala=60.0):
    m = bpy.data.materials.new(nome); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*cor(hexa), 1); b.inputs['Roughness'].default_value = rugo
    try: b.inputs['Specular IOR Level'].default_value = .15
    except Exception: pass
    if relevo:   # relevo fino do tecido/pele (bump procedural estável: coordenada de objeto)
        n = nt.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value = escala; n.inputs['Detail'].default_value = 8
        bm = nt.nodes.new('ShaderNodeBump'); bm.inputs['Strength'].default_value = relevo; bm.inputs['Distance'].default_value = .004
        tc = nt.nodes.new('ShaderNodeTexCoord'); nt.links.new(tc.outputs['Object'], n.inputs['Vector']); nt.links.new(n.outputs['Fac'], bm.inputs['Height']); nt.links.new(bm.outputs['Normal'], b.inputs['Normal'])
    return m
def separa(o):
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.separate(type='MATERIAL'); bpy.ops.object.mode_set(mode='OBJECT')
for o in [x for x in bpy.data.objects if x.type == 'MESH']: separa(o)
CORPO = []
for o in [x for x in bpy.data.objects if x.type == 'MESH']:
    nome = o.material_slots[o.data.polygons[0].material_index].material.name.split('.')[0] if len(o.data.polygons) else 'Skin'
    hexa = V['pele'] if nome == 'Skin' else V.get(nome, '#555555')
    if nome == 'Hair' and V.get('sem_cabelo'): bpy.data.objects.remove(o, do_unlink=True); continue
    m = mat('m_' + nome, hexa, rugo=.65 if nome == 'Skin' else .9, relevo=.5 if nome == 'Skin' else .35)
    for s in o.material_slots: s.material = m
    CORPO.append(o)
bpy.context.view_layer.update()

def delta_osso(nome):
    off = Matrix.Translation(raiz.location); m0 = off.inverted() @ arm.matrix_world
    pb = arm.pose.bones[nome]; b = arm.data.bones[nome]
    return off @ m0 @ (pb.matrix @ b.matrix_local.inverted()) @ m0.inverted()
SEGUE = []
def extra(o, osso):
    bpy.context.view_layer.update(); SEGUE.append((o, osso, delta_osso(osso).inverted() @ o.matrix_world.copy())); return o
cinza = mat('metal', '#6b7078', .4, .15)
if V.get('ombreiras'):
    for l, osso in ((-1, 'UpperArm.L'), (1, 'UpperArm.R')):
        extra(esfera('ombr%d' % l, (l * .225 * V['esc'], 0, 1.46 * V['esc']), (.1, .11, .065), cinza), osso)
        for k in range(3): extra(cone('espeto%d%d' % (l, k), (l * (.18 + k * .05) * V['esc'], 0, 1.53 * V['esc']), .022, 0, .12, cinza), osso)
CAPA = []; CHEST0 = arm.matrix_world @ arm.pose.bones['Chest'].head
def monta_capa(T, L, sway, alt, fl):
    for o in CAPA: bpy.data.objects.remove(o, do_unlink=True)
    CAPA.clear()
    d = (arm.matrix_world @ arm.pose.bones['Chest'].head) - CHEST0; R, C = 16, 12; vs = []; fs = []; esc = V['esc']
    for j in range(R + 1):
        t = j / R; w = (.17 + .09 * t * (1 + fl * .6) + .02 * math.sin(t * 3.1)) * esc
        xc = sway * math.sin(T - t * 3.0) * t * t
        y = -.17 * esc - L * (t ** 1.15); zc = max(.07, 1.46 * esc - t * (1.36 * esc - alt * .75))
        for k in range(C + 1):
            u = k / C * 2 - 1; dob = .035 * math.sin(u * 5.5 + T + j * .35) * t * (1 + fl)
            vs.append((xc + u * w + d.x, y + dob * .6 - .03 * u * u * t + d.y, max(.05, zc + dob - .06 * u * u * min(1, t * 2) + d.z)))
    for j in range(R):
        for k in range(C): a = j * (C + 1) + k; fs.append((a, a + 1, a + C + 2, a + C + 1))
    me = bpy.data.meshes.new('capa'); me.from_pydata(vs, [], fs); me.update(); o = bpy.data.objects.new('capa', me); bpy.context.collection.objects.link(o)
    for p in me.polygons: p.use_smooth = True
    o.data.materials.append(mat('capa', '#5a1220', .85, .3)); m = o.modifiers.new('esp', 'SOLIDIFY'); m.thickness = .018; CAPA.append(o)

def gira_osso(nome, graus, eixo=(1, 0, 0)):
    pb = arm.pose.bones[nome]; m = pb.matrix.copy(); j = m.translation.copy()
    ax = (arm.matrix_world.inverted().to_3x3() @ Vector(eixo)).normalized()
    pb.matrix = Matrix.Translation(j) @ Matrix.Rotation(math.radians(graus), 4, ax) @ Matrix.Translation(-j) @ m; bpy.context.view_layer.update()
def posa(animacao, frame, desloca=(0, 0, 0), postura=False, capa=None):
    raiz.location = desloca; arm.animation_data.action = ACAO[animacao]
    bpy.context.scene.frame_set(int(math.floor(frame)), subframe=frame - math.floor(frame)); bpy.context.view_layer.update()
    if (postura and (V['bracos'] or V['curva'])) or V.get('longos'):   # zumbi/cadáver: tronco curvado e braços à frente; macaco/insetoide: braços longos (sobre a animação)
        guarda = {b.name: (b.rotation_quaternion.copy(), b.location.copy()) for b in arm.pose.bones}; arm.animation_data.action = None
        for n, (q, l) in guarda.items(): arm.pose.bones[n].rotation_quaternion = q; arm.pose.bones[n].location = l
        bpy.context.view_layer.update()
        if V.get('longos'):
            for l in 'LR':
                arm.pose.bones['UpperArm.' + l].scale = (1, V['longos'], 1)   # o antebraço herda a escala do braço
            bpy.context.view_layer.update()
        if postura:
            if V['curva']: gira_osso('Abdomen', V['curva'] * .6); gira_osso('Torso', V['curva'] * .6)
            for l in 'LR':
                if V['bracos']: gira_osso('UpperArm.' + l, V['bracos']); gira_osso('LowerArm.' + l, V.get('cotovelo', 14))
            if V['curva']: gira_osso('Head', -V['curva'] * .5)
    for o, osso, W in SEGUE: o.matrix_world = delta_osso(osso) @ W
    if V.get('capa') and capa: monta_capa(*capa)
    bpy.context.view_layer.update()

# ações do jogo → animações do pacote (a postura do zumbi vale para parado/andar/atacar; golpe e morte usam a animação pura)
PLANO = [('parado', 'Idle_Neutral', 0, 40, 8, True, True), ('andar', 'Walk', 0, 32, 12, True, True), ('atacar', 'Punch_Right', 0, 20, 10, False, True), ('golpe', 'HitRecieve', 0, 13, 6, False, False), ('morrer', 'Death', 0, 25, 10, False, False)]
if TESTE: PLANO = [('andar', 'Walk', 0, 32, 4, True, True), ('morrer', 'Death', 0, 25, 3, False, False)]
if V.get('capa'): CAPA_P = {'parado': (.3, .015, -.3, 0), 'andar': (.5, .16, .1, .05), 'atacar': (.62, .22, .3, .35), 'golpe': (.55, .15, .15, .3), 'morrer': (.4, .1, .5, .4)}
cam = luz_e_camera(256, 82, 2.2); sc = bpy.context.scene
try: sc.eevee.use_gtao = True
except Exception: pass
posiciona_camera(cam, 'lado', elev=82, centro=(0, -.1, 0))
for acao, anim, f0, f1, n, ciclo, postura in PLANO:
    pasta = os.path.join(SAIDA, VAR, acao + '_lado'); os.makedirs(pasta, exist_ok=True)
    for i in range(n):
        t = i / n if ciclo else (i / (n - 1) if n > 1 else 1.0); fr = f0 + (f1 - f0) * t; e = t * t * (3 - 2 * t) if acao == 'morrer' else 0.0
        cp = None
        if V.get('capa') and not (acao == 'morrer' and t > .55): c = CAPA_P[acao]; cp = (2 * math.pi * t, c[0], c[1], c[2], c[3])
        elif CAPA: [bpy.data.objects.remove(o, do_unlink=True) for o in CAPA]; CAPA.clear()
        posa(anim, fr, (0, .67 * e * V['esc'], 0), postura, cp)
        sc.render.filepath = os.path.join(pasta, 'q_%02d.png' % i); bpy.ops.render.render(write_still=True)
    print('feito', acao, flush=True)
print('fim', flush=True)
