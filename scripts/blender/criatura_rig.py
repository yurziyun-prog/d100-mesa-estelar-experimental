# Criatura com ESQUELETO e animações reais (pacotes Quaternius CC0: Animated Animal Pack / Dinosaur Bundle), vista de cima para o mapa.
# Rodar:  blender.exe -b -P criatura_rig.py -- <pasta de saída> <arquivo.glb> <id> [--teste] [--cor1 #hex --cor2 #hex]
# Saída: <pasta>/<id>/<acao>_lado/q_NN.png  (o modelo olha para a ESQUERDA da imagem). Depois: node scripts/blender/montar-cima.cjs <pasta>
# As ações do jogo (parado, andar, atacar, golpe, morrer) vêm das animações do pacote, com o ciclo de marcha original: patas apoiam e passam,
# a coluna e o rabo acompanham. O enquadramento é medido em TODAS as ações (ataque, queda…) e congelado.
import sys, os, math
from mathutils import Vector, Matrix
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bl_lib import *
import bl_lib

ARGV = sys.argv[sys.argv.index('--') + 1:]
SAIDA, GLB, CID = ARGV[0], ARGV[1], ARGV[2]
TESTE = '--teste' in ARGV
def opc(n, p=None): return ARGV[ARGV.index(n) + 1] if n in ARGV else p
MAPA = {'Wolf': dict(parado='Idle', andar='Walk', atacar='Attack', golpe='Idle_HitReact_Left', morrer='Death'),
        'Velociraptor': dict(parado='Velociraptor_Idle', andar='Velociraptor_Walk', atacar='Velociraptor_Attack', golpe='Velociraptor_Idle', morrer='Velociraptor_Death')}
FAM = os.path.splitext(os.path.basename(GLB))[0]
ACOES = MAPA.get(FAM, MAPA['Wolf'])

limpa(); bl_lib.ELEV = 82
bpy.ops.import_scene.gltf(filepath=os.path.abspath(GLB))
arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
for o in list(bpy.data.objects):
    if o.name == 'Icosphere': bpy.data.objects.remove(o, do_unlink=True)
giro = bpy.data.objects.new('giro', None); bpy.context.collection.objects.link(giro)
topo = arm
while topo.parent: topo = topo.parent
topo.parent = giro; giro.rotation_euler = (0, 0, math.pi)   # o pacote olha para -Y; o jogo espera +Y (esquerda da imagem de cima)
ACAO = {}
for a in bpy.data.actions: ACAO.setdefault(a.name.split('|')[-1], a)
arm.animation_data_create()
malhas = [o for o in bpy.data.objects if o.type == 'MESH']
for m in malhas:   # cores opcionais: substitui a cor de base do material principal e do secundário
    pass

def pose(nome, frame):
    arm.animation_data.action = ACAO[nome]; bpy.context.scene.frame_set(int(math.floor(frame)), subframe=frame - math.floor(frame)); bpy.context.view_layer.update()
def caixa():
    dg = bpy.context.evaluated_depsgraph_get(); mn = Vector((1e9,) * 3); mx = Vector((-1e9,) * 3)
    for o in malhas:
        ev = o.evaluated_get(dg); me = ev.to_mesh()
        for v in me.vertices:
            w = ev.matrix_world @ v.co
            for i in range(3): mn[i] = min(mn[i], w[i]); mx[i] = max(mx[i], w[i])
        ev.to_mesh_clear()
    return mn, mx

def intervalo(a): return a.frame_range
PLANO = [('parado', 8, True), ('andar', 12, True), ('atacar', 10, False), ('golpe', 6, False), ('morrer', 10, False)]
if TESTE: PLANO = [('andar', 4, True), ('atacar', 4, False)]
def quadros(acao, n, ciclo):
    f0, f1 = intervalo(ACAO[ACOES[acao]]); return [f0 + (f1 - f0) * ((i / n) if ciclo else (i / (n - 1))) for i in range(n)]

# enquadramento: centro da pose parada; extensão máxima sobre todas as ações
pose(ACOES['parado'], 0); mn0, mx0 = caixa(); centro = (mn0 + mx0) / 2; ext = 0; chao = mn0[2]
for acao, n, ciclo in PLANO:
    for fr in quadros(acao, min(n, 6), ciclo):
        pose(ACOES[acao], fr); mn, mx = caixa()
        ext = max(ext, abs(mn[0] - centro[0]), abs(mx[0] - centro[0]), abs(mn[1] - centro[1]), abs(mx[1] - centro[1]))
print('ENQUADRAMENTO centro', tuple(round(v, 2) for v in centro), 'extensão', round(ext, 2), 'altura', round(mx0[2] - mn0[2], 2), flush=True)
ortho = max(3.2, ext * 2 * 1.08 + .2)
cam = luz_e_camera(256, 82, ortho); sc = bpy.context.scene
try: sc.eevee.use_gtao = True
except Exception: pass
posiciona_camera(cam, 'lado', elev=82, centro=(centro[0], centro[1], 0))
for acao, n, ciclo in PLANO:
    pasta = os.path.join(SAIDA, CID, acao + '_lado'); os.makedirs(pasta, exist_ok=True)
    for i, fr in enumerate(quadros(acao, n, ciclo)):
        pose(ACOES[acao], fr); sc.render.filepath = os.path.join(pasta, 'q_%02d.png' % i); bpy.ops.render.render(write_still=True)
    print('feito', acao, flush=True)
print('fim', flush=True)
