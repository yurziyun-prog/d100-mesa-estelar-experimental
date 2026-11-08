# Troncos de árvore vistos de cima (a base sólida de cada copa): tronco com casca, raízes e galhos cortados.
# Rodar:  blender.exe -b -P troncos_cima.py -- <pasta de saída>     (reusa as funções de moveis_cima.py)
import sys, os, math, json
_aqui = os.path.dirname(os.path.abspath(__file__))
_src = open(os.path.join(_aqui, 'moveis_cima.py'), encoding='utf-8').read()
exec(compile(_src.split('# ---------------------------------------------------------------- peças')[0], 'moveis_cima(base)', 'exec'))

def casca(r, h, mat='mad2', rugas=10):
    cil((0, 0, h / 2), r, h, mat, 28, .02)
    for k in range(rugas):  # sulcos da casca
        a = k * 2 * math.pi / rugas + .2; caixa((math.cos(a) * r * .93, math.sin(a) * r * .93, h * .55), (.03, r * .5, h * .8), 'preto', 0, a + math.pi / 2)
def raizes(r, n=6, comp=.12):
    for k in range(n):
        a = k * 2 * math.pi / n + .3 + (k % 2) * .25; x, y = math.cos(a) * r, math.sin(a) * r
        t = tubo('raiz', [(x * .8, y * .8, .22), (x * 1.2, y * 1.2, .1), (x * 1.2 + math.cos(a) * comp, y * 1.2 + math.sin(a) * comp, .03)], [.15, .11, .06], M['mad2']);
def tronco_folhosa():
    casca(.36, .9); raizes(.36, 7, .12)
    cil((0, 0, .91), .3, .03, 'madc', 28, 0)
    for k in range(7): a = k * .9; cil((math.cos(a) * .12, math.sin(a) * .12, .925), .09 + (k % 3) * .035, .02, 'mad', 14, 0)
    cil((0, 0, .94), .035, .015, 'mad2', 10, 0)
    for a in (.8, 3.4): cil((math.cos(a) * .3, math.sin(a) * .3, .6), .06, .22, 'madc', 12, 0, (0, math.pi / 2, a))  # cotos de galhos cortados
    return 1.1, 1.1
def tronco_palmeira():
    casca(.2, 1.2, 'mad', 14)
    for k in range(5): cil((0, 0, .15 + k * .22), .215, .045, 'mad2', 22, 0)  # anéis das folhas antigas
    for k in range(7): a = k * .9; tubo('frond', [(0, 0, 1.2), (math.cos(a) * .15, math.sin(a) * .15, 1.22), (math.cos(a) * .32, math.sin(a) * .32, 1.14)], [.03, .025, .01], M['verde'])
    esf((0, 0, 1.22), (.12, .12, .06), 'mad2', 12)
    return .6, .6
def tronco_fino():
    casca(.2, .9, 'mad2', 8); raizes(.2, 5, .1)
    cil((0, 0, .91), .17, .03, 'madc', 20, 0)
    return .75, .75

PECAS_TR = {'tronco_folhosa': (tronco_folhosa, 'Tronco', 'planta', True, 'Madeira', 60, 4), 'tronco_palmeira': (tronco_palmeira, 'Tronco de palmeira', 'planta', True, 'Madeira', 40, 3), 'tronco_fino': (tronco_fino, 'Tronco fino', 'planta', True, 'Madeira', 30, 3)}

def renderiza(pid, w, h):
    ppm = 160; rx = int(math.ceil((w + .16) * ppm)); ry = int(math.ceil((h + .16) * ppm))
    sc = bpy.context.scene; sc.render.resolution_x = rx; sc.render.resolution_y = ry
    cam = sc.camera; cam.data.ortho_scale = max(rx, ry) / ppm; cam.location = (0, 0, 40); cam.rotation_euler = (0, 0, 0)
    sc.render.filepath = os.path.join(SAIDA, pid + '.png'); bpy.ops.render.render(write_still=True)

medidas = {}
for pid, (fn, nome, cat, bloq, mat, pv, dur) in PECAS_TR.items():
    limpa(); mats(); cam = luz_e_camera(256, 90, 6)
    w, h = fn()
    for o in list(bpy.context.scene.objects):
        if o.type == 'MESH': contorno(o, .016)
    renderiza(pid, w, h)
    medidas[pid] = {'nome': nome, 'larguraM': round(w + .16, 3), 'alturaM': round(h + .16, 3), 'cat': cat, 'bloq': bloq, 'material': mat, 'pvMax': pv, 'dureza': dur, 'camada': 3}
    print('feito', pid, flush=True)
json.dump(medidas, open(os.path.join(SAIDA, '_medidas.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
