# Experimento: como as armas do pacote (Sword_Slash, Gun_Shoot…) seguram o objeto. Prende lâminas de teste à mão direita em 3 direções e renderiza poses.
# Rodar: blender.exe -b -P arma_teste.py -- <pasta de saída>
import sys, os, math
from mathutils import Vector, Matrix
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bl_lib import *
import bl_lib
SAIDA = sys.argv[sys.argv.index('--') + 1]
limpa(); bl_lib.ELEV = 82
GLB = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'arte-fonte', 'pessoa-base', 'Adventurer.glb')
bpy.ops.import_scene.gltf(filepath=os.path.abspath(GLB))
arm = bpy.data.objects['CharacterArmature']
for o in list(bpy.data.objects):
    if o.name == 'Icosphere' or (o.type == 'EMPTY' and o.name.endswith('_end')): bpy.data.objects.remove(o, do_unlink=True)
raiz = bpy.data.objects['RootNode']; raiz.rotation_mode = 'XYZ'; raiz.rotation_euler = (0, 0, math.pi)
ACAO = {a.name.split('|')[-1]: a for a in bpy.data.actions}; arm.animation_data_create()
arm.data.pose_position = 'POSE'; arm.animation_data.action = ACAO['Idle_Neutral']; bpy.context.scene.frame_set(0); bpy.context.view_layer.update()
malhas = [o for o in bpy.data.objects if o.type == 'MESH']
def centro_grupo(nome):
    dg = bpy.context.evaluated_depsgraph_get(); soma = Vector(); n = 0
    for o in malhas:
        if nome not in o.vertex_groups: continue
        gi = o.vertex_groups[nome].index; ev = o.evaluated_get(dg); me = ev.to_mesh(); orig = o.data
        for v in orig.vertices:
            for g in v.groups:
                if g.group == gi and g.weight > .5: soma += ev.matrix_world @ me.vertices[v.index].co; n += 1
        ev.to_mesh_clear()
    return soma / max(1, n)
for g in ('Wrist.R', 'Wrist.L', 'Index1.R', 'Index3.R', 'Thumb1.R', 'Middle2.R', 'Index1.L'): print('GRUPO', g, tuple(round(v, 3) for v in centro_grupo(g)))
mao = centro_grupo('Middle2.R'); dedos = (centro_grupo('Middle3.R') - centro_grupo('Wrist.R')).normalized(); print('MAO', tuple(round(v, 3) for v in mao), 'DEDOS', tuple(round(v, 3) for v in dedos))
def delta_osso(nome):
    pb = arm.pose.bones[nome]; b = arm.data.bones[nome]
    m0 = arm.matrix_world
    return m0 @ (pb.matrix @ b.matrix_local.inverted()) @ m0.inverted()
cores = {'frente': (1, .1, .1), 'cima': (.1, 1, .1), 'baixo': (.1, .3, 1)}
SEG = []
for nome, d in (('frente', Vector((0, 1, 0))), ('cima', Vector((0, 0, 1))), ('baixo', Vector((0, 0, -1)))):
    m = bpy.data.materials.new(nome); m.use_nodes = True; m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*cores[nome], 1)
    bpy.ops.mesh.primitive_cube_add(location=(0, 0, 0)); o = bpy.context.object; o.scale = (.025, .025, .45); bpy.ops.object.transform_apply(scale=True); o.data.materials.append(m)
    q = Vector((0, 0, 1)).rotation_difference(d); o.rotation_euler = q.to_euler(); o.location = mao + d * .4
    bpy.context.view_layer.update(); SEG.append((o, delta_osso('Wrist.R').inverted() @ o.matrix_world.copy()))
cam = luz_e_camera(256, 12, 2.4); sc = bpy.context.scene
os.makedirs(SAIDA, exist_ok=True)
for anim, fr in (('Sword_Slash', 0), ('Sword_Slash', 8), ('Sword_Slash', 16), ('Idle_Sword', 5), ('Gun_Shoot', 4), ('Idle_Gun_Pointing', 5)):
    arm.animation_data.action = ACAO[anim]; sc.frame_set(fr); bpy.context.view_layer.update()
    for o, W in SEG: o.matrix_world = delta_osso('Wrist.R') @ W
    for nome, elev, dirv in (('f', 10, 'frente'), ('p', 10, 'lado'), ('c', 82, 'lado')):
        cam.data.ortho_scale = 2.3 if elev < 50 else 2.4; posiciona_camera(cam, dirv, elev=elev, centro=(0, 0, .95 if elev < 50 else 0))
        sc.render.filepath = os.path.join(SAIDA, '%s_%02d_%s.png' % (anim, fr, nome)); bpy.ops.render.render(write_still=True)
print('fim')
