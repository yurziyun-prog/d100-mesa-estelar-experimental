# Biblioteca do Blender (v201) para modelar criaturas do D100 por script e renderizar folhas de quadros nas direções do jogo.
# Uso (dentro de um script de criatura): from bl_lib import *  — rodar: blender.exe -b -P criatura.py -- <pasta de saída>
import bpy, math, sys, os, bmesh
from mathutils import Vector, Euler

def limpa():
    global _CONTORNO
    _CONTORNO = None
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)

def material(nome, cor, rugo=.7, ruido=0.0, escala=18.0, cor2=None):
    m = bpy.data.materials.new(nome); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Roughness'].default_value = rugo
    try: b.inputs['Specular IOR Level'].default_value = .2
    except Exception: pass
    if ruido > 0 and cor2:
        n = nt.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value = escala; n.inputs['Detail'].default_value = 6
        r = nt.nodes.new('ShaderNodeValToRGB'); r.color_ramp.elements[0].color = (*cor, 1); r.color_ramp.elements[1].color = (*cor2, 1)
        r.color_ramp.elements[0].position = .35; r.color_ramp.elements[1].position = .65
        nt.links.new(n.outputs['Fac'], r.inputs['Fac']); nt.links.new(r.outputs['Color'], b.inputs['Base Color'])
    else:
        b.inputs['Base Color'].default_value = (*cor, 1)
    return m

def contorno_material():
    m = bpy.data.materials.new('contorno'); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    e = nt.nodes.new('ShaderNodeEmission'); e.inputs['Color'].default_value = (.05, .04, .035, 1)
    o = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(e.outputs['Emission'], o.inputs['Surface'])
    m.use_backface_culling = True
    return m

_CONTORNO = None
def contorno(obj, espessura=.035):
    """casca invertida: o contorno escuro do estilo do jogo"""
    global _CONTORNO
    if _CONTORNO is None or _CONTORNO.name not in bpy.data.materials: _CONTORNO = contorno_material()
    if obj.type != 'MESH': return
    obj.data.materials.append(_CONTORNO)
    idx = len(obj.data.materials) - 1
    mod = obj.modifiers.new('contorno', 'SOLIDIFY'); mod.thickness = -espessura; mod.offset = 1
    mod.use_flip_normals = True; mod.material_offset = idx; mod.use_rim = False

def suave(obj, niveis=2):
    for p in obj.data.polygons: p.use_smooth = True
    m = obj.modifiers.new('sub', 'SUBSURF'); m.levels = niveis; m.render_levels = niveis

def esfera(nome, pos, esc, mat, rot=(0, 0, 0), sub=True, seg=24):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, location=pos)
    o = bpy.context.object; o.name = nome; o.scale = esc; o.rotation_euler = rot
    bpy.ops.object.transform_apply(scale=True)
    for p in o.data.polygons: p.use_smooth = True
    o.data.materials.append(mat); return o

def cone(nome, pos, r1, r2, prof, mat, rot=(0, 0, 0), seg=14):
    bpy.ops.mesh.primitive_cone_add(vertices=seg, radius1=r1, radius2=r2, depth=prof, location=pos, rotation=rot)
    o = bpy.context.object; o.name = nome
    for p in o.data.polygons: p.use_smooth = True
    o.data.materials.append(mat); return o

def tubo(nome, pontos, raios, mat, resolucao=10, seg=12):
    """tubo suave que segue os pontos (curva de Bezier) com raio variando (rabo afilado, pescoço…)"""
    cu = bpy.data.curves.new(nome, 'CURVE'); cu.dimensions = '3D'; cu.resolution_u = resolucao
    sp = cu.splines.new('BEZIER'); sp.bezier_points.add(len(pontos) - 1)
    for i, (p, r) in enumerate(zip(pontos, raios)):
        bp = sp.bezier_points[i]; bp.co = p; bp.radius = r; bp.handle_left_type = bp.handle_right_type = 'AUTO'
    cu.bevel_depth = 1.0; cu.bevel_resolution = 4; cu.use_fill_caps = True
    o = bpy.data.objects.new(nome, cu); bpy.context.collection.objects.link(o)
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    bpy.ops.object.convert(target='MESH')
    o = bpy.context.object
    for p in o.data.polygons: p.use_smooth = True
    o.data.materials.append(mat); return o

def pivo(nome, pos, pai=None):
    e = bpy.data.objects.new(nome, None); e.empty_display_size = .1; bpy.context.collection.objects.link(e)
    e.location = pos
    if pai: e.parent = pai; e.matrix_parent_inverse = pai.matrix_world.inverted()
    return e

def prender(obj, pai):
    obj.parent = pai; obj.matrix_parent_inverse = pai.matrix_world.inverted()

def luz_e_camera(tam=192, elev=26, escala=4.2):
    sc = bpy.context.scene
    cam = bpy.data.cameras.new('cam'); cam.type = 'ORTHO'; cam.ortho_scale = escala
    co = bpy.data.objects.new('cam', cam); bpy.context.collection.objects.link(co); sc.camera = co
    sol = bpy.data.lights.new('sol', 'SUN'); sol.energy = 3.2; sol.color = (1, .93, .8)
    so = bpy.data.objects.new('sol', sol); bpy.context.collection.objects.link(so); so.rotation_euler = (math.radians(50), math.radians(10), math.radians(-35))
    pre = bpy.data.lights.new('pre', 'SUN'); pre.energy = 1.1; pre.color = (.6, .7, 1)
    po = bpy.data.objects.new('pre', pre); bpy.context.collection.objects.link(po); po.rotation_euler = (math.radians(60), 0, math.radians(150))
    sc.render.resolution_x = tam; sc.render.resolution_y = tam; sc.render.film_transparent = True
    sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
    try: sc.render.engine = 'BLENDER_EEVEE'
    except Exception: sc.render.engine = 'BLENDER_EEVEE_NEXT'
    try: sc.eevee.taa_render_samples = 24
    except Exception: pass
    sc.view_settings.view_transform = 'Standard'
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs['Color'].default_value = (.55, .5, .45, 1); w.node_tree.nodes['Background'].inputs['Strength'].default_value = .6
    return co

ELEV = 26
def posiciona_camera(cam, direcao, elev=None, centro=(0, 0, .8), dist=12):
    # direcao: 'lado' (modelo olha para -X na tela esquerda), 'frente' (vem na direção da câmera), 'costas'
    elev = ELEV if elev is None else elev
    ang = {'lado': 0, 'frente': -math.pi / 2, 'costas': math.pi / 2}[direcao]
    e = math.radians(elev)
    cam.location = (centro[0] + dist * math.cos(e) * math.cos(ang + math.pi), centro[1] + dist * math.cos(e) * math.sin(ang + math.pi), centro[2] + dist * math.sin(e))
    d = Vector(centro) - Vector(cam.location); cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()

def render_quadros(cam, pasta, prefixo, direcao, quadros, aplicar, centro=(0, -.55, 1.0)):
    """renderiza `quadros` quadros; aplicar(i, n) posiciona a criatura (animação por funções)"""
    os.makedirs(pasta, exist_ok=True)
    posiciona_camera(cam, direcao, centro=centro)
    for i in range(quadros):
        aplicar(i, quadros)
        bpy.context.scene.render.filepath = os.path.join(pasta, f'{prefixo}_{i:02d}.png')
        bpy.ops.render.render(write_still=True)

def seg(nome, p0, p1, r0, r1, mat, seg_n=14):
    """segmento cônico entre dois pontos (membros, pescoço rígido): r0 na base p0, r1 na ponta p1"""
    a = Vector(p0); b = Vector(p1); d = b - a; L = d.length
    bpy.ops.mesh.primitive_cone_add(vertices=seg_n, radius1=r0, radius2=r1, depth=L, location=(a + b) / 2)
    o = bpy.context.object; o.name = nome
    o.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    for p in o.data.polygons: p.use_smooth = True
    o.data.materials.append(mat); return o

def listras(nome, base, faixa, escala=7.0, forca=.6):
    """material com listras suaves (padrão do bicho)"""
    m = bpy.data.materials.new(nome); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']; b.inputs['Roughness'].default_value = .75
    w = nt.nodes.new('ShaderNodeTexWave'); w.inputs['Scale'].default_value = escala; w.inputs['Distortion'].default_value = 3; w.inputs['Detail'].default_value = 3
    mp = nt.nodes.new('ShaderNodeMapping'); tc = nt.nodes.new('ShaderNodeTexCoord'); nt.links.new(tc.outputs['Object'], mp.inputs['Vector']); nt.links.new(mp.outputs['Vector'], w.inputs['Vector'])
    r = nt.nodes.new('ShaderNodeValToRGB'); r.color_ramp.elements[0].position = .45; r.color_ramp.elements[1].position = .6
    r.color_ramp.elements[0].color = (*base, 1); r.color_ramp.elements[1].color = (*faixa, 1)
    nt.links.new(w.outputs['Color'], r.inputs['Fac']); nt.links.new(r.outputs['Color'], b.inputs['Base Color'])
    return m

_BOCAS = {}
_REPOUSO = {}
def boca_tentaculos(pai, base, eixo, ab, mat_t, mat_m, n=8, comp=.95, r0=.2, ro=.55, fase=0.0, nome='boca', raio_t=.05, quando=0.0):
    """boca de tentáculos ligados por uma pele (fechada parece um feixe de tentáculos, aberta vira uma trombeta).
    ab: 0 fechada … 1 aberta; fase: balanço dos tentáculos (radianos); reconstrói a cada pose e some a anterior."""
    for o in _BOCAS.pop(nome, []):
        bpy.data.objects.remove(o, do_unlink=True)
    if nome not in _REPOUSO: _REPOUSO[nome] = pai.matrix_world.copy()
    M = pai.matrix_world @ _REPOUSO[nome].inverted()
    base = M @ Vector(base); eixo = M.to_3x3() @ Vector(eixo)
    a = Vector(eixo).normalized(); u = M.to_3x3() @ Vector((1, 0, 0)); v = a.cross(u).normalized(); u = v.cross(a).normalized()
    b0 = Vector(base); T = 8
    def ponto(k, t):
        th = 2 * math.pi * k / n + .15 * math.sin(fase * 1.3 + k)
        rad = (r0 * (1 - .78 * t)) * (1 - ab) + ab * (r0 + (ro - r0) * t ** 1.15 + .08 * t ** 3)
        bal = (.05 + .11 * ab) * math.sin(fase + k * 1.9) * t
        d = (math.cos(th) * u + math.sin(th) * v)
        return b0 + a * (comp * t * (1 - .18 * ab * t)) + d * rad + v * bal * .6 + u * bal * .4
    novos = []
    for k in range(n):
        pts = [ponto(k, t) for t in (0, .35, .7, 1.0)]
        o = tubo('%s_t%d' % (nome, k), [tuple(p) for p in pts], [raio_t, raio_t * .8, raio_t * .55, raio_t * .2], mat_t, resolucao=8, seg=8)
        novos.append(o)
    vs = []; fs = []; top = .78
    for k in range(n):
        k2 = (k + 1) % n
        for j in range(T + 1):
            t = top * j / T
            p1 = ponto(k, t); p2 = ponto(k2, t); m = (p1 + p2) / 2
            ctr = b0 + a * (comp * t * (1 - .18 * ab * t))
            m = m + (ctr - m) * (.12 * ab * math.sin(math.pi * t) + .0)
            vs.append(tuple(p1)); vs.append(tuple(m)); vs.append(tuple(p2))
        for j in range(T):
            i0 = (k * (T + 1) + j) * 3
            i1 = i0 + 3
            fs.append((i0, i0 + 1, i1 + 1, i1)); fs.append((i0 + 1, i0 + 2, i1 + 2, i1 + 1))
    me = bpy.data.meshes.new(nome + '_m'); me.from_pydata(vs, [], fs); me.update()
    mo = bpy.data.objects.new(nome + '_m', me); bpy.context.collection.objects.link(mo)
    for p in me.polygons: p.use_smooth = True
    mo.data.materials.append(mat_m); novos.append(mo)
    # interior escuro da garganta
    g = esfera(nome + '_g', tuple(b0 + a * .05), (r0 * .85, r0 * .85, r0 * .5), material(nome + '_gm', (.28, .05, .06), .6))
    novos.append(g)
    bpy.context.view_layer.update()
    for o in novos:
        prender(o, pai)
        if o.type == 'MESH': contorno(o, .018)
    _BOCAS[nome] = novos
    return novos
