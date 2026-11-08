# Móveis, objetos e veículos do D100 modelados no Blender e renderizados VISTOS DE CIMA (mesmo estilo das miniaturas: contorno escuro, luz de cima, pele/material com ruído).
# Rodar:  blender.exe -b -P moveis_cima.py -- <pasta de saída> [id1,id2,...]
# Saída: <pasta>/<id>.png (fundo transparente) + <pasta>/_medidas.json com o tamanho real (metros) de cada peça.
# Convenção: o "frente" da peça fica para BAIXO da imagem (−Y); a peça é centrada em (0,0); alturas em Z.
import sys, os, math, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bl_lib import *
import bl_lib

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
SAIDA = ARGS[0] if ARGS else os.path.join(os.getcwd(), 'moveis')
SO = ARGS[1].split(',') if len(ARGS) > 1 and ARGS[1] else None
os.makedirs(SAIDA, exist_ok=True)

def cor(h):
    h = h.lstrip('#')
    f = lambda c: ((c / 255.0) / 12.92 if c / 255.0 <= .04045 else (((c / 255.0) + .055) / 1.055) ** 2.4)
    return tuple(f(int(h[i:i + 2], 16)) for i in (0, 2, 4))

M = {}
def mats():
    M.clear()
    M['mad'] = material('mad', cor('#7a4e2a'), .72, 1, 24.0, cor('#5a3a1e'))
    M['mad2'] = material('mad2', cor('#4a2e18'), .7, 1, 20.0, cor('#33200f'))
    M['madc'] = material('madc', cor('#b58a55'), .7, 1, 26.0, cor('#9a7140'))
    M['metal'] = material('metal', cor('#8c949c'), .35, 1, 30.0, cor('#6c747c'))
    M['metal2'] = material('metal2', cor('#3a3f47'), .4, 1, 18.0, cor('#2a2e34'))
    M['ferro'] = material('ferro', cor('#2e3138'), .5)
    M['pedra'] = material('pedra', cor('#8a8780'), .85, 1, 14.0, cor('#6e6c66'))
    M['pedra2'] = material('pedra2', cor('#5c5a56'), .9, 1, 10.0, cor('#46443f'))
    M['pano_v'] = material('pano_v', cor('#9a2a2a'), .9)
    M['pano_a'] = material('pano_a', cor('#2f5fa8'), .9)
    M['pano_g'] = material('pano_g', cor('#3a6a3a'), .9)
    M['branco'] = material('branco', cor('#e8e4da'), .85)
    M['creme'] = material('creme', cor('#d6c9a6'), .85)
    M['couro'] = material('couro', cor('#6a3e24'), .6, 1, 12.0, cor('#52301b'))
    M['ouro'] = material('ouro', cor('#d9a63a'), .35)
    M['vidro'] = material('vidro', cor('#9fd8ee'), .08)
    M['vidro'].use_nodes = True
    try:
        M['vidro'].surface_render_method = 'BLENDED'; M['vidro'].node_tree.nodes['Principled BSDF'].inputs['Alpha'].default_value = .55
    except Exception: pass
    M['verde'] = material('verde', cor('#4f8c3e'), .8, 1, 16.0, cor('#356a2a'))
    M['terra'] = material('terra', cor('#6a4a2e'), .95)
    M['preto'] = material('preto', cor('#15171b'), .6)
    M['led'] = brilho('led', '#3ad8ff', 3.0)
    M['ledv'] = brilho('ledv', '#ff4a3a', 3.0)
    M['ledg'] = brilho('ledg', '#4aff7a', 3.0)
    M['tela'] = brilho('tela', '#5ad8ff', 1.6)
    M['fogo'] = brilho('fogo', '#ff8a2a', 4.0)
    M['vela'] = brilho('vela', '#ffd27a', 5.0)

def brilho(nome, hexa, forca):
    m = bpy.data.materials.new(nome); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    e = nt.nodes.new('ShaderNodeEmission'); e.inputs['Color'].default_value = (*cor(hexa), 1); e.inputs['Strength'].default_value = forca
    o = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(e.outputs['Emission'], o.inputs['Surface']); return m

def caixa(pos, dim, mat, bisel=.02, rot=0, nome='cx'):
    bpy.ops.mesh.primitive_cube_add(location=pos)
    o = bpy.context.object; o.name = nome; o.scale = (dim[0] / 2, dim[1] / 2, dim[2] / 2)
    bpy.ops.object.transform_apply(scale=True)
    if bisel > 0:
        b = o.modifiers.new('bis', 'BEVEL'); b.width = min(bisel, min(dim) * .4); b.segments = 2
    for p in o.data.polygons: p.use_smooth = True
    o.rotation_euler = (0, 0, rot)
    o.data.materials.append(mat if not isinstance(mat, str) else M[mat]); return o

def cil(pos, r, h, mat, seg=28, bisel=.012, rot=(0, 0, 0), nome='cl'):
    bpy.ops.mesh.primitive_cylinder_add(vertices=seg, radius=r, depth=h, location=pos, rotation=rot)
    o = bpy.context.object; o.name = nome
    if bisel > 0:
        b = o.modifiers.new('bis', 'BEVEL'); b.width = min(bisel, r * .4); b.segments = 2
    for p in o.data.polygons: p.use_smooth = True
    o.data.materials.append(mat if not isinstance(mat, str) else M[mat]); return o

def esf(pos, esc, mat, seg=20, nome='es'):
    return esfera(nome, pos, esc, mat if not isinstance(mat, str) else M[mat], seg=seg)

# ---------------------------------------------------------------- peças (cada uma devolve (largura, altura) em metros)
def barril(r=.34, h=.85):
    cil((0, 0, h / 2), r, h, 'mad', 32)
    for z in (h * .18, h * .5, h * .82): cil((0, 0, z), r * 1.035, .05, 'ferro', 32)
    cil((0, 0, h + .005), r * .93, .03, 'madc', 32)
    for a in range(6):
        t = a * math.pi / 3; caixa((math.cos(t) * r * .45, math.sin(t) * r * .45, h + .03), (r * .5, .018, .012), 'mad2', 0, t + math.pi / 2)
    return 2 * r + .1, 2 * r + .1
def tonel(): return barril(.55, 1.1)
def caixote(w=.85, d=.7, h=.5):
    caixa((0, 0, h / 2), (w, d, h), 'madc', .025)
    for dx in (-w / 2 + .04, w / 2 - .04): caixa((dx, 0, h / 2 + .01), (.07, d + .01, h + .02), 'mad2', .01)
    for i in range(3): caixa((0, -d / 2 + (i + .5) * d / 3, h + .005), (w - .1, .02, .012), 'mad2', 0)
    return w, d
def caixa_grande(): return caixote(1.3, 1.0, .8)
def bau():
    caixa((0, 0, .27), (1.2, .78, .54), 'mad', .03)
    cil((0, 0, .54), .39, 1.18, 'mad', 28, .01, (0, math.pi / 2, 0)); bpy.context.object.scale.z = 1; bpy.context.object.scale = (1, 1, 1)
    for dx in (-.4, 0, .4): caixa((dx, 0, .62), (.06, .82, .5), 'ferro', .01)
    caixa((0, -.4, .45), (.12, .05, .14), 'ouro', .01)
    return 1.3, .9
def mesa(w, d, h=.72, mat='mad'):
    caixa((0, 0, h), (w, d, .07), mat, .02)
    for sx in (-1, 1):
        for sy in (-1, 1): caixa((sx * (w / 2 - .09), sy * (d / 2 - .09), h / 2), (.09, .09, h), 'mad2', .01)
    n = max(2, int(d / .22))
    for i in range(1, n): caixa((0, -d / 2 + i * d / n, h + .037), (w - .03, .01, .004), 'mad2', 0)  # tábuas
    return w, d
def mesa_quadrada(): return mesa(1.1, 1.1)
def mesa_retangular(): return mesa(1.8, .9)
def mesa_longa(): return mesa(2.6, .7)
def mesa_redonda():
    cil((0, 0, .72), .7, .06, 'mad', 40); cil((0, 0, .36), .09, .72, 'mad2'); cil((0, 0, .03), .32, .05, 'mad2')
    for a in (0, 1.05, 2.1): caixa((0, 0, .755), (1.36, .012, .004), 'mad2', 0, a)
    return 1.4, 1.4
def cadeira(mat='mad'):
    caixa((0, 0, .46), (.46, .44, .05), mat, .015)
    for sx in (-1, 1):
        for sy in (-1, 1): caixa((sx * .19, sy * .17, .22), (.04, .04, .44), 'mad2', .005)
    caixa((0, .21, .74), (.46, .05, .5), 'mad2', .012)
    for dx in (-.14, 0, .14): caixa((dx, .21, .78), (.03, .045, .36), 'mad2', .004)
    return .56, .56
def banco(w=1.4):
    caixa((0, 0, .45), (w, .36, .06), 'mad', .015)
    for sx in (-1, 1): caixa((sx * (w / 2 - .1), 0, .22), (.06, .32, .44), 'mad2', .01)
    return w + .1, .45
def banqueta(): cil((0, 0, .45), .22, .06, 'madc'); [caixa((math.cos(a) * .15, math.sin(a) * .15, .22), (.04, .04, .44), 'mad2', 0) for a in (.8, 2.4, 3.9, 5.5)]; return .5, .5
def poltrona(w=.95, cm='pano_v'):
    caixa((0, 0, .26), (w, .9, .34), 'mad2', .03)
    caixa((0, .06, .42), (w - .36, .7, .18), cm, .06)
    caixa((0, .38, .6), (w - .1, .18, .56), cm, .06)
    for sx in (-1, 1): caixa((sx * (w / 2 - .1), 0, .42), (.2, .84, .34), cm, .07)
    return w + .06, 1.0
def sofa():
    caixa((0, 0, .26), (2.3, .95, .34), 'mad2', .03)
    for i in range(3): caixa((-.72 + i * .72, -.02, .45), (.7, .66, .16), 'pano_a', .06)
    caixa((0, .4, .62), (2.2, .18, .55), 'pano_a', .06)
    for sx in (-1, 1): caixa((sx * 1.12, 0, .42), (.2, .92, .34), 'pano_a', .07)
    return 2.4, 1.0
def cama(w=1.0, l=2.0):
    caixa((0, 0, .22), (w + .1, l + .1, .3), 'mad', .03)
    caixa((0, 0, .42), (w, l - .06, .16), 'branco', .05)
    caixa((0, l / 2 - .02, .6), (w + .1, .1, .6), 'mad2', .03)
    caixa((0, -l / 2, .38), (w + .1, .08, .4), 'mad2', .03)
    caixa((0, -.28, .55), (w - .06, l * .62, .07), 'pano_a', .05)
    for sx in ((-.22, .22) if w > 1.2 else (0,)): caixa((sx, l / 2 - .3, .56), (min(.5, w * .42), .34, .1), 'creme', .05)
    return w + .15, l + .15
def cama_casal(): return cama(1.6, 2.0)
def estante():
    caixa((0, 0, .9), (1.6, .38, 1.8), 'mad', .02)
    caixa((0, 0, 1.82), (1.64, .42, .05), 'mad2', .01)
    for i in range(7): caixa((-.65 + i * .21, .02, 1.88), (.05 + (i % 3) * .01, .2, .22 + (i % 2) * .06), ['pano_v', 'pano_a', 'pano_g', 'couro'][i % 4], .008)
    return 1.64, .42
def armario():
    caixa((0, 0, 1.0), (1.2, .55, 2.0), 'mad', .025)
    caixa((0, 0, 2.02), (1.26, .6, .05), 'mad2', .01)
    caixa((0, -.28, 1.0), (.03, .02, 1.7), 'ferro', 0)
    for dx in (-.08, .08): caixa((dx, -.29, 1.0), (.03, .03, .3), 'ouro', .006)
    return 1.26, .6
def balcao():
    caixa((0, 0, .55), (2.4, .7, 1.1), 'mad', .025); caixa((0, 0, 1.12), (2.5, .8, .06), 'madc', .02)
    for dx in (-.7, 0, .6): cil((dx, .05, 1.2), .06, .13, 'metal', 16, .006); cil((dx, .05, 1.28), .05, .03, 'branco', 16, 0)
    return 2.5, .8
def fogao():
    caixa((0, 0, .45), (.9, .75, .9), 'metal', .03)
    for sx in (-1, 1):
        for sy in (-1, 1): cil((sx * .2, sy * .17 + .04, .92), .12, .02, 'ferro', 20, 0); cil((sx * .2, sy * .17 + .04, .935), .06, .012, 'preto', 16, 0)
    caixa((0, -.39, .62), (.5, .03, .04), 'ferro', 0)
    return .95, .8
def lareira():
    caixa((0, .2, .5), (1.5, .4, 1.0), 'pedra', .03)
    caixa((0, -.1, .18), (1.1, .6, .36), 'pedra2', .02)
    caixa((0, -.05, .22), (.8, .38, .08), 'preto', 0)
    for dx, g in ((-.18, 1), (.12, .8), (0, 1.1)): esf((dx, -.05, .34), (.2 * g, .16, .2 * g), 'fogo', 14)
    for dx in (-.25, .22): cil((dx, -.1, .16), .06, .5, 'mad2', 10, 0, (0, math.pi / 2, .4))
    return 1.5, 1.0
def bancada_pia():
    caixa((0, 0, .45), (1.8, .7, .9), 'branco', .02); caixa((0, 0, .91), (1.84, .74, .05), 'metal', .015)
    caixa((-.3, 0, .935), (.6, .46, .03), 'metal2', .01)
    cil((.2, .25, 1.05), .02, .2, 'metal', 10, 0); caixa((.2, .17, 1.14), (.03, .18, .03), 'metal', 0)
    return 1.84, .74
def terminal():
    caixa((0, .1, .38), (1.0, .55, .76), 'metal2', .02)
    caixa((0, .05, .8), (.6, .36, .06), 'metal', .015)
    caixa((0, .18, .98), (.55, .05, .34), 'preto', .01); caixa((0, .16, .98), (.5, .02, .28), 'tela', 0)
    caixa((0, -.17, .78), (.44, .14, .02), 'ferro', .005)
    return 1.0, .8
def console_scifi():
    caixa((0, 0, .5), (1.5, .55, 1.0), 'metal2', .03)
    caixa((0, -.06, 1.02), (1.4, .38, .05), 'metal', .02)
    for i in range(10): caixa((-.55 + i * .122, -.1, 1.06), (.07, .05, .02), ['led', 'ledg', 'ledv', 'led'][i % 4], 0)
    caixa((0, .2, 1.3), (1.0, .05, .5), 'preto', .01); caixa((0, .18, 1.3), (.94, .02, .44), 'tela', 0)
    return 1.5, .6
def rack():
    caixa((0, 0, 1.0), (.7, 1.0, 2.0), 'metal2', .02)
    for i in range(6): caixa((0, -.2 + i * .1, 2.02), (.5, .06, .02), 'metal', 0); caixa((.28, -.2 + i * .1, 2.02), (.06, .04, .02), ['led', 'ledg', 'ledv'][i % 3], 0)
    return .75, 1.05
def mesa_holo():
    cil((0, 0, .3), .35, .6, 'metal2', 32); cil((0, 0, .65), .75, .06, 'metal', 40); cil((0, 0, .7), .62, .03, 'tela', 40, 0)
    return 1.6, 1.6
def capsula():
    caixa((0, 0, .15), (1.0, 2.2, .3), 'metal2', .05)
    cil((0, 0, .42), .42, 1.9, 'vidro', 32, 0, (math.pi / 2, 0, 0)); bpy.context.object.scale = (1, 1, 1)
    caixa((0, 0, .32), (.7, 1.6, .1), 'branco', .04)
    caixa((0, 1.0, .5), (.8, .12, .5), 'metal', .03); caixa((0, -1.0, .35), (.6, .1, .12), 'led', 0)
    return 1.05, 2.25
def gerador():
    caixa((0, 0, .55), (1.2, 1.2, 1.1), 'metal2', .04)
    for dx in (-.28, .28): cil((dx, -.1, 1.12), .24, .04, 'ferro', 28, 0); [caixa((dx, -.1, 1.13), (.4, .02, .015), 'metal', 0, a) for a in (0, math.pi / 2, .78, 2.35)]
    caixa((0, .5, 1.12), (1.0, .12, .06), 'ledv', 0); cil((.5, .5, 1.3), .08, .4, 'metal', 12, 0)
    return 1.25, 1.25
def bancada_lab():
    caixa((0, 0, .45), (2.0, .8, .9), 'branco', .02); caixa((0, 0, .92), (2.06, .86, .05), 'metal2', .015)
    for dx, c in ((-.7, 'led'), (-.3, 'ledg'), (.4, 'ledv')): cil((dx, .05, 1.05), .07, .22, 'vidro', 14, 0); cil((dx, .05, 1.0), .055, .1, c, 12, 0)
    caixa((.75, 0, 1.0), (.3, .24, .14), 'metal', .015); cil((.75, .06, 1.15), .04, .2, 'metal2', 10, 0)
    return 2.06, .86
def vaso():
    cil((0, 0, .2), .22, .4, 'terra', 24, .02); cil((0, 0, .41), .2, .03, 'mad2', 24, 0)
    for i in range(9): a = i * .7; esf((math.cos(a) * .12, math.sin(a) * .12, .55 + (i % 3) * .05), (.14, .06, .03), 'verde', 12).rotation_euler = (0, .5, a)
    return .62, .62
def estatua():
    caixa((0, 0, .25), (.8, .8, .5), 'pedra2', .03)
    esf((0, 0, .95), (.22, .2, .42), 'pedra', 16); esf((0, 0, 1.42), (.16, .16, .17), 'pedra', 14)
    for sx in (-1, 1): esf((sx * .26, 0, .95), (.08, .08, .3), 'pedra', 10)
    return .86, .86
def sarcofago():
    caixa((0, 0, .35), (.9, 2.1, .7), 'pedra', .05); caixa((0, 0, .78), (.78, 1.96, .16), 'pedra2', .08)
    caixa((0, .5, .88), (.1, .8, .03), 'ouro', 0); caixa((0, .75, .88), (.5, .09, .03), 'ouro', 0)
    return .95, 2.15
def altar():
    caixa((0, 0, .5), (1.4, .9, 1.0), 'pedra', .04); caixa((0, 0, 1.02), (1.5, .98, .05), 'pano_v', .02)
    for dx in (-.5, .5): cil((dx, .1, 1.2), .05, .3, 'creme', 14, 0); esf((dx, .1, 1.4), (.03, .03, .07), 'vela', 10)
    cil((0, .05, 1.14), .12, .18, 'ouro', 20, .01)
    return 1.5, 1.0
def fogueira():
    for i in range(10): a = i * .628; esf((math.cos(a) * .5, math.sin(a) * .5, .1), (.14, .12, .1), 'pedra2', 10)
    for a in (0, 1.05, 2.1): cil((0, 0, .17), .06, .8, 'mad2', 10, 0, (0, math.pi / 2, a))
    esf((0, 0, .38), (.22, .22, .38), 'fogo', 14); esf((.05, .03, .6), (.1, .1, .2), 'vela', 10)
    return 1.2, 1.2
def tapete():
    caixa((0, 0, .02), (2.0, 3.0, .03), 'pano_v', .01); caixa((0, 0, .04), (1.7, 2.7, .02), 'creme', 0); caixa((0, 0, .05), (1.5, 2.5, .02), 'pano_v', 0)
    for y in (-1.0, 0, 1.0): caixa((0, y, .06), (1.0, .18, .015), 'ouro', 0)
    return 2.1, 3.1
# ---- veículos
def carroca():
    caixa((0, .2, .5), (1.2, 2.0, .3), 'mad', .03)
    for sx in (-1, 1): caixa((sx * .6, .2, .75), (.06, 2.0, .35), 'mad2', .02); cil((sx * .78, .35, .45), .45, .12, 'mad2', 24, .01, (0, math.pi / 2, 0))
    caixa((0, 1.25, .75), (1.2, .06, .35), 'mad2', .02); caixa((0, -.8, .75), (1.2, .06, .35), 'mad2', .02)
    for sx in (-1, 1): caixa((sx * .35, -1.7, .45), (.06, 1.6, .06), 'mad2', .02)
    for i in range(3): esf((-.3 + i * .3, .1 + (i % 2) * .6, .85), (.2, .2, .16), 'couro', 12)
    return 1.9, 3.4
def aerocarro():
    esf((0, 0, .5), (.9, 2.1, .38), 'metal', 28); esf((0, .3, .8), (.55, .9, .3), 'vidro', 24)
    for sx in (-1, 1): esf((sx * .9, -.9, .4), (.22, .5, .12), 'metal2', 16); esf((sx * .9, -1.3, .4), (.14, .18, .1), 'led', 12)
    caixa((0, -1.95, .55), (1.3, .1, .06), 'ledv', 0); caixa((0, 1.95, .55), (1.0, .06, .06), 'led', 0)
    return 2.4, 4.4
def caminhao():
    caixa((0, 2.0, .95), (2.2, 2.0, 1.5), 'pano_a', .08); caixa((0, 2.9, 1.4), (1.9, .4, .6), 'vidro', .04)
    caixa((0, -.9, 1.1), (2.3, 4.4, 1.9), 'branco', .06)
    for sy in (-2.5, 0, 2.3):
        for sx in (-1, 1): cil((sx * 1.2, sy, .45), .45, .3, 'ferro', 20, .02, (0, math.pi / 2, 0))
    caixa((0, 3.0, .45), (2.1, .15, .3), 'metal', .03)
    return 2.5, 6.6
def moto():
    esf((0, 0, .5), (.28, .75, .22), 'pano_v', 20); caixa((0, -.2, .78), (.3, .6, .1), 'couro', .04)
    caixa((0, .6, .92), (.8, .06, .06), 'metal', .015); cil((0, 1.0, .3), .3, .14, 'ferro', 20, .01, (0, math.pi / 2, 0)); cil((0, -.95, .3), .3, .14, 'ferro', 20, .01, (0, math.pi / 2, 0))
    return .9, 2.2
def nave_pequena():
    esf((0, 0, .5), (.7, 2.4, .5), 'metal', 28); esf((0, .9, .85), (.4, .7, .25), 'vidro', 20)
    for sx in (-1, 1):
        caixa((sx * 1.6, -.5, .45), (1.8, 1.4, .1), 'metal2', .03, sx * .5); esf((sx * .55, -1.8, .5), (.25, .5, .22), 'metal2', 14); esf((sx * .55, -2.3, .5), (.18, .16, .16), 'led', 12)
    esf((0, -2.2, .45), (.3, .3, .26), 'led', 12)
    return 4.6, 5.2
def shuttle():
    esf((0, 0, .8), (1.5, 4.4, .8), 'metal', 32); esf((0, 2.4, 1.3), (.8, 1.2, .4), 'vidro', 24)
    for sx in (-1, 1): caixa((sx * 2.6, -1.2, .7), (3.0, 2.6, .15), 'metal2', .04, sx * .35); cil((sx * 1.5, -3.0, .8), .42, 1.2, 'metal2', 20, .02, (math.pi / 2, 0, 0)); esf((sx * 1.5, -3.7, .8), (.32, .12, .32), 'led', 14)
    caixa((0, 0, 1.55), (.5, 4.0, .18), 'metal2', .03)
    return 8.2, 9.4
def cargueiro():
    caixa((0, 0, 1.5), (5.0, 17, 2.6), 'metal', .12)
    for i in range(5): caixa((0, -6 + i * 3.0, 2.9), (4.0, 2.6, .5), ['branco', 'metal2', 'pano_a', 'branco', 'pano_v'][i], .06)
    caixa((0, 9.0, 1.9), (3.2, 2.0, 2.2), 'metal2', .1); caixa((0, 9.9, 2.4), (2.6, .6, .6), 'vidro', .05)
    for sx in (-1, 1): cil((sx * 2.2, -9.6, 1.4), 1.0, 2.2, 'metal2', 24, .05, (math.pi / 2, 0, 0)); esf((sx * 2.2, -10.8, 1.4), (.8, .15, .8), 'led', 14)
    return 5.6, 21.8

PECAS = {
 'barril': (barril, 'Barril', 'movel', True, 'Madeira', 20, 3, 3), 'tonel': (tonel, 'Tonel', 'movel', True, 'Madeira', 30, 3, 3),
 'caixote': (caixote, 'Caixote', 'carga', True, 'Madeira', 14, 2, 3), 'caixa_grande': (caixa_grande, 'Caixa grande', 'carga', True, 'Madeira', 24, 3, 3),
 'bau': (bau, 'Baú', 'movel', True, 'Madeira', 30, 4, 3),
 'mesa_quadrada': (mesa_quadrada, 'Mesa quadrada', 'movel', True, 'Madeira', 18, 2, 3), 'mesa_retangular': (mesa_retangular, 'Mesa', 'movel', True, 'Madeira', 20, 2, 3),
 'mesa_longa': (mesa_longa, 'Mesa longa', 'movel', True, 'Madeira', 20, 2, 3), 'mesa_redonda': (mesa_redonda, 'Mesa redonda', 'movel', True, 'Madeira', 20, 2, 3),
 'cadeira': (cadeira, 'Cadeira', 'movel', False, 'Madeira', 10, 1, 3), 'banco': (banco, 'Banco', 'movel', False, 'Madeira', 12, 1, 3), 'banqueta': (banqueta, 'Banqueta', 'movel', False, 'Madeira', 8, 1, 3),
 'poltrona': (poltrona, 'Poltrona', 'movel', False, 'Tecido', 14, 1, 3), 'sofa': (sofa, 'Sofá', 'movel', True, 'Tecido', 20, 1, 3),
 'cama_solteiro': (cama, 'Cama de solteiro', 'movel', False, 'Madeira', 20, 2, 3), 'cama_casal': (cama_casal, 'Cama de casal', 'movel', False, 'Madeira', 24, 2, 3),
 'estante': (estante, 'Estante', 'movel', True, 'Madeira', 22, 2, 3), 'armario': (armario, 'Armário', 'movel', True, 'Madeira', 26, 2, 3), 'balcao': (balcao, 'Balcão de bar', 'movel', True, 'Madeira', 30, 3, 3),
 'fogao': (fogao, 'Fogão', 'movel', True, 'Metal', 30, 4, 3), 'lareira': (lareira, 'Lareira', 'movel', True, 'Pedra', 60, 6, 3), 'bancada_pia': (bancada_pia, 'Bancada com pia', 'movel', True, 'Metal', 30, 3, 3),
 'terminal': (terminal, 'Terminal de computador', 'scifi', True, 'Metal', 20, 3, 3), 'console_scifi': (console_scifi, 'Console de comando', 'scifi', True, 'Metal', 30, 4, 3),
 'rack': (rack, 'Rack de servidores', 'scifi', True, 'Metal', 30, 4, 3), 'mesa_holo': (mesa_holo, 'Mesa holográfica', 'scifi', True, 'Metal', 24, 3, 3),
 'capsula': (capsula, 'Cápsula criogênica', 'scifi', True, 'Metal', 40, 4, 3), 'gerador': (gerador, 'Gerador', 'scifi', True, 'Metal', 50, 5, 3), 'bancada_lab': (bancada_lab, 'Bancada de laboratório', 'scifi', True, 'Metal', 26, 3, 3),
 'vaso': (vaso, 'Vaso de planta', 'planta', False, 'Vegetal', 6, 0, 3), 'estatua': (estatua, 'Estátua', 'cenario', True, 'Pedra', 60, 5, 3),
 'sarcofago': (sarcofago, 'Sarcófago', 'masmorra', True, 'Pedra', 70, 6, 3), 'altar': (altar, 'Altar', 'masmorra', True, 'Pedra', 70, 6, 3),
 'fogueira': (fogueira, 'Fogueira', 'cenario', False, 'Pedra', 0, 0, 2), 'tapete': (tapete, 'Tapete', 'movel', False, 'Tecido', 0, 0, 1),
 'carroca': (carroca, 'Carroça', 'veiculo', True, 'Madeira', 40, 3, 3), 'aerocarro': (aerocarro, 'Aerocarro', 'veiculo', True, 'Metal', 60, 4, 3),
 'caminhao': (caminhao, 'Caminhão', 'veiculo', True, 'Metal', 90, 5, 3), 'moto': (moto, 'Moto antigravitacional', 'veiculo', True, 'Metal', 30, 3, 3),
 'nave_pequena': (nave_pequena, 'Nave pequena', 'veiculo', True, 'Metal', 120, 6, 3), 'shuttle': (shuttle, 'Shuttle', 'veiculo', True, 'Metal', 200, 8, 3), 'cargueiro': (cargueiro, 'Cargueiro', 'veiculo', True, 'Metal', 400, 10, 3),
}

def renderiza(pid, w, h):
    ppm = min(96, 1000 / max(w, h)); rx = int(math.ceil((w + .16) * ppm)); ry = int(math.ceil((h + .16) * ppm))
    sc = bpy.context.scene; sc.render.resolution_x = rx; sc.render.resolution_y = ry
    cam = sc.camera; cam.data.ortho_scale = max(rx, ry) / ppm
    cam.location = (0, 0, 40); cam.rotation_euler = (0, 0, 0)
    sc.render.filepath = os.path.join(SAIDA, pid + '.png'); bpy.ops.render.render(write_still=True)
    return ppm

medidas = {}
for pid, (fn, nome, cat, bloq, mat, pv, dur, cam_) in PECAS.items():
    if SO and pid not in SO: continue
    limpa(); mats(); cam = luz_e_camera(256, 90, 6)
    w, h = fn()
    for o in list(bpy.context.scene.objects):
        if o.type == 'MESH': contorno(o, .016)
    ppm = renderiza(pid, w, h)
    medidas[pid] = {'nome': nome, 'larguraM': round(w + .16, 3), 'alturaM': round(h + .16, 3), 'cat': cat, 'bloq': bloq, 'material': mat, 'pvMax': pv, 'dureza': dur, 'camada': cam_}
    print('feito', pid, round(w, 2), round(h, 2), flush=True)
json.dump(medidas, open(os.path.join(SAIDA, '_medidas.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
