# Móveis, equipamentos e veículos RETROFUTURISTAS (era atômica: cantos arredondados, cromo, pastel, mostradores) + alguns de estilo HIBORIANO/GÓTICO, vistos de cima.
# Rodar:  blender.exe -b -P moveis_rf.py -- <pasta de saída> [id1,id2,...]
# Reusa as funções de moveis_cima.py (caixa, cil, esf, materiais, render). Saída: <pasta>/<id>.png + _medidas.json (mesmo formato).
import sys, os, math, json
_aqui = os.path.dirname(os.path.abspath(__file__))
_src = open(os.path.join(_aqui, 'moveis_cima.py'), encoding='utf-8').read()
exec(compile(_src.split('# ---------------------------------------------------------------- peças')[0], 'moveis_cima(base)', 'exec'))

_mats_base = mats
def mats():
    _mats_base()
    M['menta'] = material('menta', cor('#7fd1c0'), .45, 1, 20.0, cor('#6cbfae'))
    M['coral'] = material('coral', cor('#e8664a'), .5)
    M['cromo'] = material('cromo', cor('#cdd6de'), .18, 1, 40.0, cor('#aeb8c2'))
    M['creme2'] = material('creme2', cor('#efe6cf'), .5)
    M['amarelo'] = material('amarelo', cor('#e8c14a'), .5)
    M['azul_rf'] = material('azul_rf', cor('#3a78b8'), .45)
    M['turq'] = material('turq', cor('#2fa8a8'), .45)
    M['bronze'] = material('bronze', cor('#a06f2c'), .3, 1, 26.0, cor('#7e5520'))
    M['ferro_n'] = material('ferro_n', cor('#26282d'), .45, 1, 14.0, cor('#1a1b1f'))
    M['pele'] = material('pele', cor('#b89a78'), .9, 1, 18.0, cor('#8a6e50'))
    M['osso'] = material('osso', cor('#e8dcc0'), .6)
    M['crt'] = brilho('crt', '#7dff9a', 1.8)
    M['reator'] = brilho('reator', '#7af0ff', 5.0)

def cap(w, d, h, mat, x=0, y=0, z=None, bisel=.22):  # caixa de cantos bem arredondados (estilo cápsula)
    return caixa((x, y, h / 2 if z is None else z), (w, d, h), mat, bisel)

# ------------------------------------------------ saúde
def capsula_recuperacao():
    cap(1.15, 2.4, .35, 'cromo', 0, 0, .18, .2)
    cap(.95, 2.1, .22, 'menta', 0, 0, .46, .16)
    cap(.8, 1.9, .5, 'vidro', 0, .05, .8, .3)
    cap(.7, 1.0, .1, 'branco', 0, -.3, .52, .08)
    esf((0, .75, .55), (.2, .22, .05), 'creme2', 14)
    caixa((0, 1.05, .6), (.7, .12, .5), 'cromo', .05); [caixa((dx, 1.1, .75), (.08, .03, .03), c, 0) for dx, c in ((-.22, 'led'), (0, 'ledg'), (.22, 'ledv'))]
    cil((.6, 0, .4), .06, .8, 'cromo', 14, 0, (math.pi / 2, 0, 0))
    return 1.25, 2.5
def cama_capsula():  # cama-cápsula (estilo japonês): casca arredondada com a boca aberta para o pé
    cap(1.1, 2.3, .8, 'cromo', 0, 0, .4, .35)
    cap(.86, 2.1, .6, 'creme2', 0, -.08, .6, .28)
    cap(.7, 1.6, .12, 'azul_rf', 0, -.08, .62, .1)
    esf((0, .72, .72), (.24, .22, .08), 'branco', 14)
    caixa((0, 1.0, .8), (.5, .08, .06), 'led', 0); caixa((.42, .2, .82), (.05, .3, .04), 'ledg', 0)
    return 1.2, 2.4
def cama_hospital():
    cap(1.0, 2.1, .3, 'creme2', 0, 0, .55, .12); cap(.9, 1.9, .12, 'branco', 0, 0, .74, .08)
    caixa((0, .95, .95), (1.0, .08, .5), 'cromo', .04); caixa((0, -.95, .8), (1.0, .08, .3), 'cromo', .04)
    for sx in (-1, 1): caixa((sx * .52, 0, .9), (.04, 1.6, .04), 'cromo', 0)
    caixa((0, -.2, .8), (.8, 1.1, .05), 'menta', .04); cil((.75, .5, .6), .06, 1.2, 'cromo', 10, 0); caixa((.75, .5, 1.25), (.4, .1, .3), 'preto', .02); caixa((.75, .46, 1.25), (.34, .02, .24), 'tela', 0)
    return 1.35, 2.2
def maca_flutuante():
    cap(.8, 2.0, .1, 'cromo', 0, 0, .7, .1); cap(.7, 1.8, .08, 'menta', 0, 0, .78, .1)
    for y in (-.7, .7): cil((0, y, .4), .22, .12, 'cromo', 20, .01); cil((0, y, .35), .16, .05, 'led', 20, 0)
    return .85, 2.05
def monitor_vital():
    cil((0, 0, .06), .28, .12, 'cromo', 24); cil((0, 0, .7), .05, 1.4, 'cromo', 12, 0)
    caixa((0, 0, 1.45), (.55, .12, .4), 'preto', .04); caixa((0, -.07, 1.45), (.5, .02, .34), 'tela', 0)
    return .6, .6
def armario_medico():
    cap(1.0, .5, 1.9, 'creme2', 0, 0, .95, .06); caixa((0, -.26, 1.0), (.03, .02, 1.7), 'cromo', 0); caixa((0, -.26, 1.5), (.5, .02, .02), 'coral', 0); caixa((0, -.26, 1.54), (.16, .02, .16), 'coral', 0); caixa((0, -.26, 1.54), (.02, .02, .16), 'branco', 0)
    return 1.05, .55
def bancada_cirurgica():
    cil((0, 0, .02), .5, .04, 'cromo', 32); cil((0, 0, .45), .1, .9, 'cromo', 16); cap(.9, 2.0, .12, 'cromo', 0, 0, .95, .1); cap(.8, 1.9, .06, 'menta', 0, 0, 1.0, .08)
    cil((0, .2, 1.8), .32, .05, 'cromo', 32); [esf((math.cos(a) * .22, .2 + math.sin(a) * .22, 1.76), (.05, .05, .04), 'vela', 10) for a in (0, 1.05, 2.1, 3.14, 4.2, 5.2)]
    return 1.0, 2.1
# ------------------------------------------------ casa e convívio
def poltrona_ovo():
    cil((0, 0, .05), .4, .1, 'cromo', 24); esf((0, .05, .6), (.55, .55, .55), 'coral', 28); esf((0, -.12, .78), (.42, .4, .3), 'creme2', 24)
    return 1.1, 1.1
def sofa_modular():
    for i, x in enumerate((-.85, 0, .85)): cap(.85, .95, .4, 'menta', x, 0, .3, .2); cap(.8, .7, .16, 'creme2', x, -.06, .55, .12); cap(.85, .22, .55, 'menta', x, .38, .6, .18)
    caixa((0, 0, .1), (2.5, .8, .1), 'cromo', .02)
    return 2.6, 1.0
def mesa_atomica():
    cil((0, 0, .72), .65, .05, 'creme2', 40); cil((0, 0, .72), .66, .02, 'cromo', 40, 0)
    for a in (0, 2.1, 4.2): caixa((math.cos(a) * .3, math.sin(a) * .3, .36), (.05, .05, .74), 'cromo', 0, a); esf((math.cos(a) * .42, math.sin(a) * .42, .05), (.06, .06, .05), 'coral', 10)
    return 1.3, 1.3
def mesa_boomerang():
    cap(1.5, .7, .06, 'amarelo', 0, 0, .45, .3); cap(1.2, .5, .02, 'cromo', 0, 0, .485, .2); [caixa((sx, 0, .22), (.05, .05, .44), 'cromo', 0) for sx in (-.6, .6)]
    return 1.55, .75
def cadeira_moldada():
    cap(.5, .5, .08, 'turq', 0, 0, .45, .15); cap(.5, .1, .5, 'turq', 0, .22, .7, .1)
    for sx in (-1, 1):
        for sy in (-1, 1): cil((sx * .17, sy * .15, .22), .02, .44, 'cromo', 10, 0)
    return .56, .56
def banqueta_cromo():
    cil((0, 0, .65), .24, .08, 'coral', 24); cil((0, 0, .32), .03, .65, 'cromo', 12, 0); cil((0, 0, .03), .2, .05, 'cromo', 24)
    return .5, .5
def estante_modular():
    cap(1.6, .4, 1.8, 'creme2', 0, 0, .9, .04)
    for i in range(4): caixa((-.55 + i * .37, 0, 1.82), (.3, .34, .02), ['coral', 'menta', 'amarelo', 'turq'][i], 0)
    for i in range(7): caixa((-.65 + i * .21, .02, 1.92), (.05, .2, .2 + (i % 2) * .06), ['coral', 'azul_rf', 'amarelo', 'branco'][i % 4], .008)
    return 1.64, .44
def balcao_curvo():
    for i in range(7):
        a = -1.1 + i * .37; x = math.sin(a) * 1.3; y = -math.cos(a) * 1.3 + 1.3
        caixa((x, y, .55), (.62, .55, 1.1), 'menta', .05, -a)
        caixa((x, y, 1.12), (.66, .6, .05), 'cromo', .02, -a)
    for sx in (-.8, 0, .8): cil((sx * 1.2, .55 + abs(sx) * .12, 1.2), .06, .14, 'vidro', 12, 0)
    return 3.2, 1.3
def cozinha_compacta():
    cap(1.4, .75, .95, 'creme2', 0, 0, .475, .08); cap(1.44, .78, .04, 'cromo', 0, 0, .97, .02)
    for sx in (-.3, .1): cil((sx, .0, 1.0), .12, .02, 'ferro_n', 18, 0); cil((sx, 0, 1.015), .06, .01, 'preto', 14, 0)
    caixa((.5, 0, 1.0), (.36, .46, .03), 'metal2', .01); caixa((-.45, -.38, .7), (.4, .03, .04), 'cromo', 0)
    for sx, c in ((-.5, 'coral'), (-.3, 'amarelo'), (-.1, 'turq')): cil((sx, -.37, .85), .03, .03, c, 10, 0, (math.pi / 2, 0, 0))
    return 1.45, .8
def geladeira_retro():
    cap(.85, .8, 1.8, 'menta', 0, 0, .9, .14); caixa((.3, -.4, 1.0), (.04, .03, .5), 'cromo', 0); caixa((.3, -.4, 1.55), (.04, .03, .2), 'cromo', 0)
    cap(.8, .18, .3, 'cromo', 0, .3, 1.7, .05)
    return .9, .85
def tapete_circular():
    cil((0, 0, .02), 1.3, .03, 'coral', 48, 0); cil((0, 0, .04), 1.05, .02, 'creme2', 48, 0); cil((0, 0, .06), .75, .02, 'turq', 48, 0); cil((0, 0, .08), .35, .02, 'amarelo', 48, 0)
    return 2.7, 2.7
def luminaria_starburst():
    cil((0, 0, .03), .22, .06, 'cromo', 24); cil((0, 0, .8), .025, 1.6, 'cromo', 10, 0)
    for i in range(10): a = i * .628; caixa((math.cos(a) * .22, math.sin(a) * .22, 1.65), (.5, .03, .03), 'cromo', 0, a); esf((math.cos(a) * .45, math.sin(a) * .45, 1.65), (.045, .045, .045), 'vela', 8)
    return 1.0, 1.0
def vaso_hidroponico():
    cap(.9, .5, .5, 'creme2', 0, 0, .25, .08); cap(.78, .38, .06, 'terra', 0, 0, .52, .04)
    for i in range(7): a = i * .9; esf((-.3 + (i % 4) * .2, math.sin(a) * .12, .66), (.13, .07, .06), 'verde', 12).rotation_euler = (0, .4, a)
    caixa((0, -.26, .35), (.5, .02, .04), 'led', 0)
    return .95, .55
def radiola_jukebox():
    cap(.9, .6, 1.45, 'coral', 0, 0, .72, .22); cil((0, -.05, 1.5), .3, .08, 'cromo', 28, 0); caixa((0, -.31, .9), (.5, .02, .5), 'amarelo', .02); [cil((sx, -.3, 1.2), .05, .03, 'cromo', 12, 0, (math.pi / 2, 0, 0)) for sx in (-.2, 0, .2)]
    return .95, .65
def tv_retro():
    cap(.8, .55, .5, 'creme2', 0, 0, .35, .1); cap(.62, .3, .05, 'preto', 0, -.06, .62, .05); caixa((0, -.08, .66), (.5, .22, .02), 'crt', 0)
    cap(.8, .5, .1, 'turq', 0, 0, .6, .06); [cil((sx, -.12, .45), .035, .04, 'coral', 10, 0) for sx in (.3, .38)]
    for sx in (-1, 1): caixa((sx * .16, .15, .85), (.02, .02, .5), 'cromo', 0, sx * .5)
    return .85, .6
def mainframe_retro():
    cap(1.6, .8, 1.8, 'cromo', 0, 0, .9, .06)
    for i in range(9): caixa((-.65 + i * .163, .1, 1.82), (.09, .5, .012), 'metal2', 0)  # grade de ventilação no topo
    for sx in (-.4, .4): cil((sx, -.3, 1.4), .22, .05, 'ferro_n', 26, 0, (math.pi / 2, 0, 0)); cil((sx, -.32, 1.4), .12, .02, 'coral', 20, 0, (math.pi / 2, 0, 0))
    for i in range(10): caixa((-.65 + i * .144, -.35, .8), (.06, .03, .06), ['ledv', 'ledg', 'amarelo', 'led'][i % 4], 0)
    return 1.7, .85
def painel_retro():
    cap(1.8, .5, 1.1, 'azul_rf', 0, 0, .55, .1); cap(1.7, .4, .06, 'cromo', 0, -.02, 1.12, .04)
    for i in range(5): cil((-.7 + i * .35, -.1, 1.17), .1, .03, 'creme2', 18, 0); caixa((-.7 + i * .35, -.1, 1.19), (.02, .08, .01), 'coral', 0, i * .6)
    caixa((0, .2, 1.4), (1.5, .05, .55), 'preto', .02); caixa((0, .18, 1.4), (1.42, .02, .48), 'crt', 0)
    return 1.85, .6
def reator_atomico():
    cil((0, 0, .15), .9, .3, 'cromo', 40, .03); esf((0, 0, .85), (.5, .5, .5), 'reator', 28)
    for a in (0, 1.05, 2.1): caixa((0, 0, .85), (1.3, .05, .05), 'cromo', 0, a); cil((math.cos(a) * .65, math.sin(a) * .65, .5), .05, .8, 'cromo', 10, 0); cil((-math.cos(a) * .65, -math.sin(a) * .65, .5), .05, .8, 'cromo', 10, 0)
    return 1.9, 1.9
def tambor_combustivel():
    cil((0, 0, .45), .36, .9, 'azul_rf', 32, .03); [cil((0, 0, z), .375, .06, 'cromo', 32, 0) for z in (.15, .45, .75)]; cil((0, 0, .91), .3, .03, 'cromo', 32, 0); cil((.12, .08, .94), .05, .04, 'coral', 14, 0); cil((-.12, -.05, .94), .035, .04, 'amarelo', 12, 0)
    return .8, .8
def caixa_suprimentos():
    cap(1.0, .7, .5, 'menta', 0, 0, .25, .06); caixa((0, 0, .52), (.9, .6, .04), 'cromo', .01)
    for sx in (-.35, .35): caixa((sx, -.36, .3), (.12, .04, .12), 'cromo', .01)
    caixa((0, 0, .56), (.34, .2, .02), 'coral', 0); caixa((0, 0, .575), (.1, .1, .02), 'branco', 0)
    return 1.05, .75
def cofre():
    cap(1.0, .9, .9, 'metal2', 0, 0, .45, .05); cil((0, -.46, .5), .26, .06, 'cromo', 28, 0, (math.pi / 2, 0, 0)); cil((0, -.5, .5), .1, .05, 'ledv', 14, 0, (math.pi / 2, 0, 0)); [caixa((sx, -.45, .8), (.08, .05, .1), 'cromo', 0) for sx in (-.4, .4)]
    return 1.05, .95
def mesa_laboratorio():
    cil((0, 0, .9), 1.0, .06, 'creme2', 40); cil((0, 0, .45), .12, .9, 'cromo', 16); cil((0, 0, .03), .5, .06, 'cromo', 24)
    for a, c in ((0, 'led'), (1.3, 'ledg'), (2.6, 'ledv'), (4.0, 'amarelo')): cil((math.cos(a) * .55, math.sin(a) * .55, 1.05), .08, .24, 'vidro', 12, 0); cil((math.cos(a) * .55, math.sin(a) * .55, 1.0), .06, .1, c, 10, 0)
    return 2.0, 2.0
def terminal_crt():
    cap(1.0, .55, .75, 'creme2', 0, .1, .375, .08); cap(.62, .5, .45, 'creme2', 0, .12, 1.0, .12); caixa((0, -.1, 1.0), (.5, .02, .34), 'crt', 0)
    caixa((0, -.25, .78), (.5, .16, .03), 'cromo', .01); [caixa((sx, -.25, .8), (.04, .04, .02), 'coral', 0) for sx in (-.15, 0, .15)]
    return 1.05, .8
def console_dials():
    cap(1.6, .6, 1.0, 'turq', 0, 0, .5, .1); cap(1.5, .4, .06, 'cromo', 0, -.08, 1.02, .03)
    for i in range(6): cil((-.65 + i * .26, -.1, 1.08), .09, .04, 'preto', 18, 0); caixa((-.65 + i * .26, -.1, 1.1), (.02, .1, .01), 'coral', 0, i)
    for i in range(5): esf((-.5 + i * .25, .12, 1.06), (.04, .04, .03), ['ledv', 'ledg', 'led'][i % 3], 8)
    return 1.65, .65
# ------------------------------------------------ hiboriano / gótico
def braseiro():
    for a in (0, 2.1, 4.2): cil((math.cos(a) * .3, math.sin(a) * .3, .4), .03, .85, 'bronze', 8, 0)
    cil((0, 0, .85), .42, .15, 'bronze', 28, .02); esf((0, 0, 1.02), (.3, .3, .2), 'fogo', 14); esf((.05, 0, 1.2), (.14, .14, .2), 'vela', 10)
    return 1.0, 1.0
def altar_hiboriano():
    caixa((0, 0, .45), (1.4, .9, .9), 'pedra', .05); caixa((0, 0, .95), (1.5, 1.0, .1), 'pedra2', .04)
    for sx in (-.55, .55): cil((sx, .3, 1.2), .08, .45, 'bronze', 12, 0); esf((sx, .3, 1.5), (.05, .05, .1), 'vela', 8)
    esf((0, 0, 1.12), (.2, .2, .12), 'osso', 14); caixa((0, -.3, 1.02), (.9, .04, .02), 'ouro', 0)
    return 1.55, 1.05
def trono():
    caixa((0, 0, .3), (1.2, 1.1, .6), 'pedra', .05); caixa((0, .45, 1.05), (1.1, .25, 1.5), 'pedra2', .05); caixa((0, -.05, .66), (.9, .8, .1), 'pano_v', .05)
    for sx in (-1, 1): caixa((sx * .62, 0, .6), (.16, 1.0, .5), 'bronze', .04); cil((sx * .5, .45, 1.9), .09, .2, 'ouro', 10, 0)
    return 1.3, 1.2
def sarcofago_gotico():
    caixa((0, 0, .35), (.95, 2.2, .7), 'pedra2', .06); caixa((0, 0, .78), (.82, 2.05, .18), 'pedra', .1)
    caixa((0, .45, .9), (.1, .9, .04), 'osso', 0); caixa((0, .7, .9), (.55, .1, .04), 'osso', 0); [cil((0, y, 1.0), .05, .2, 'ferro_n', 6, 0) for y in (-.9, .9)]
    return 1.0, 2.25
def estatua_guerreiro():
    caixa((0, 0, .3), (.9, .9, .6), 'pedra2', .04); esf((0, 0, 1.1), (.25, .18, .5), 'pedra', 16); esf((0, 0, 1.68), (.17, .17, .19), 'pedra', 14)
    cil((.32, 0, 1.2), .03, 1.2, 'bronze', 8, 0); caixa((-.3, 0, 1.1), (.04, .4, .6), 'bronze', .02)
    return .95, .95
def coluna():
    cil((0, 0, .1), .5, .2, 'pedra2', 24); cil((0, 0, 1.2), .33, 2.0, 'pedra', 20, .02); cil((0, 0, 2.3), .5, .2, 'pedra2', 24)
    return 1.05, 1.05
def mesa_pedra():
    caixa((0, 0, .75), (2.0, .95, .16), 'pedra', .06); [caixa((sx, 0, .35), (.25, .8, .7), 'pedra2', .05) for sx in (-.75, .75)]
    return 2.05, 1.0
def cama_peles():
    caixa((0, 0, .18), (1.1, 2.0, .3), 'mad2', .06); caixa((0, 0, .38), (1.0, 1.9, .12), 'pele', .1); caixa((0, -.3, .46), (.95, 1.2, .06), 'pele', .08); esf((0, .75, .52), (.3, .2, .1), 'creme', 12)
    return 1.15, 2.05
def bau_bronze():
    caixa((0, 0, .27), (1.2, .78, .54), 'mad2', .03); cil((0, 0, .54), .39, 1.18, 'mad2', 28, .01, (0, math.pi / 2, 0))
    for dx in (-.42, 0, .42): caixa((dx, 0, .62), (.07, .82, .5), 'bronze', .01)
    caixa((0, -.4, .45), (.14, .05, .16), 'ouro', .01)
    return 1.3, .9
# ------------------------------------------------ veículos
def carroca_dragao():  # carroça estilizada para ser puxada por dragões-trombeta (cabeçalho duplo)
    cap(1.5, 2.3, .3, 'creme2', 0, .3, .55, .18); cap(1.2, 1.9, .08, 'menta', 0, .3, .72, .1)
    caixa((0, 1.2, .95), (1.5, .1, .5), 'coral', .05); caixa((0, -.7, .85), (1.5, .08, .3), 'coral', .05)
    for sx in (-1, 1): cil((sx * .88, .4, .5), .5, .16, 'cromo', 28, .02, (0, math.pi / 2, 0)); cil((sx * .88, .4, .5), .2, .2, 'coral', 20, .01, (0, math.pi / 2, 0))
    caixa((0, -1.6, .5), (.2, 1.6, .1), 'cromo', .04); caixa((0, -2.4, .5), (1.6, .14, .14), 'bronze', .05)
    for sx in (-.5, .5): cil((sx, -2.4, .6), .1, .14, 'ouro', 10, 0)
    for i in range(3): cap(.6, .5, .4, 'azul_rf', -.4 + i * .4, .4 + (i % 2) * .6, .96, .1)
    caixa((0, 1.3, 1.5), (.04, .04, .9), 'cromo', 0); caixa((.2, 1.3, 1.85), (.4, .03, .22), 'coral', 0)
    return 2.4, 6.0
def caminhao_levitador():
    cap(2.3, 2.2, 1.1, 'turq', 0, 2.2, .75, .35); cap(1.9, .8, .5, 'vidro', 0, 3.0, 1.35, .25)
    cap(2.4, 4.6, 1.3, 'creme2', 0, -1.0, .9, .22); [caixa((0, -1.0 + i * 1.5, 1.57), (2.3, .05, .03), 'coral', 0) for i in (-1, 0, 1)]
    for sx in (-1, 1): [cil((sx * 1.15, y, .45), .4, .2, 'cromo', 20, .02) for y in (-2.4, 0, 2.2)]; [cil((sx * 1.15, y, .3), .3, .05, 'led', 20, 0) for y in (-2.4, 0, 2.2)]
    cap(2.2, .12, .12, 'ledv', 0, -3.4, .6, .03)
    return 2.6, 7.0
def aerocarro_retro():
    esf((0, 0, .5), (.95, 2.3, .4), 'coral', 32); esf((0, .3, .85), (.6, .9, .32), 'vidro', 24)
    for sx in (-1, 1): caixa((sx * .95, -1.6, .55), (.6, 1.0, .06), 'cromo', .02, sx * .5); esf((sx * .95, -2.0, .4), (.2, .3, .15), 'led', 12)
    caixa((0, 2.2, .55), (.8, .1, .08), 'cromo', .02); caixa((0, 0, .72), (.1, 3.0, .02), 'creme2', 0)
    return 2.6, 4.9
def nave_foguete():
    esf((0, 0, .9), (.9, 3.8, .9), 'cromo', 32); esf((0, 2.4, 1.0), (.5, .9, .5), 'coral', 24); esf((0, .6, 1.5), (.45, .8, .3), 'vidro', 20)
    for a in (0, 2.09, 4.18): caixa((math.cos(a + 1.57) * .9, math.sin(a + 1.57) * 1.5 - 2.2, .8), (.08, 1.8, .9), 'coral', .03, a)
    cil((0, -3.5, .8), .6, .8, 'metal2', 24, .02, (math.pi / 2, 0, 0)); esf((0, -4.1, .8), (.4, .3, .4), 'fogo', 16)
    return 3.2, 8.6
def nave_disco():
    esf((0, 0, .6), (3.2, 3.2, .5), 'cromo', 40); esf((0, 0, 1.05), (1.4, 1.4, .8), 'vidro', 28)
    for i in range(10): a = i * .628; esf((math.cos(a) * 2.6, math.sin(a) * 2.6, .6), (.16, .16, .1), 'led', 8)
    cil((0, 0, .3), 1.3, .12, 'coral', 28, 0)
    return 6.6, 6.6

PECAS_RF = {
 'capsula_recuperacao': (capsula_recuperacao, 'Cápsula de recuperação', 'scifi', True, 'Metal', 50, 4), 'cama_capsula': (cama_capsula, 'Cama-cápsula', 'scifi', True, 'Metal', 40, 3),
 'cama_hospital': (cama_hospital, 'Cama de hospital', 'scifi', False, 'Metal', 30, 2), 'maca_flutuante': (maca_flutuante, 'Maca flutuante', 'scifi', False, 'Metal', 24, 2),
 'monitor_vital': (monitor_vital, 'Monitor de sinais vitais', 'scifi', True, 'Metal', 16, 2), 'armario_medico': (armario_medico, 'Armário médico', 'scifi', True, 'Metal', 30, 3), 'bancada_cirurgica': (bancada_cirurgica, 'Mesa cirúrgica', 'scifi', True, 'Metal', 40, 3),
 'poltrona_ovo': (poltrona_ovo, 'Poltrona ovo', 'movel', False, 'Tecido', 16, 1), 'sofa_modular': (sofa_modular, 'Sofá modular', 'movel', True, 'Tecido', 22, 1),
 'mesa_atomica': (mesa_atomica, 'Mesa atômica', 'movel', True, 'Metal', 20, 2), 'mesa_boomerang': (mesa_boomerang, 'Mesa de centro', 'movel', True, 'Metal', 14, 2),
 'cadeira_moldada': (cadeira_moldada, 'Cadeira moldada', 'movel', False, 'Metal', 10, 1), 'banqueta_cromo': (banqueta_cromo, 'Banqueta de cromo', 'movel', False, 'Metal', 10, 1),
 'estante_modular': (estante_modular, 'Estante modular', 'movel', True, 'Metal', 24, 2), 'balcao_curvo': (balcao_curvo, 'Balcão curvo', 'movel', True, 'Metal', 34, 3),
 'cozinha_compacta': (cozinha_compacta, 'Cozinha compacta', 'movel', True, 'Metal', 30, 3), 'geladeira_retro': (geladeira_retro, 'Geladeira retrô', 'movel', True, 'Metal', 30, 3),
 'tapete_circular': (tapete_circular, 'Tapete circular', 'movel', False, 'Tecido', 0, 0), 'luminaria_starburst': (luminaria_starburst, 'Luminária estrela', 'movel', False, 'Metal', 8, 1),
 'vaso_hidroponico': (vaso_hidroponico, 'Jardineira hidropônica', 'planta', True, 'Vegetal', 10, 0), 'radiola_jukebox': (radiola_jukebox, 'Radiola', 'movel', True, 'Metal', 24, 2), 'tv_retro': (tv_retro, 'Televisor retrô', 'scifi', True, 'Metal', 14, 2),
 'mainframe_retro': (mainframe_retro, 'Computador de fitas', 'scifi', True, 'Metal', 40, 4), 'painel_retro': (painel_retro, 'Painel de controle', 'scifi', True, 'Metal', 34, 3), 'reator_atomico': (reator_atomico, 'Reator atômico', 'scifi', True, 'Metal', 80, 6),
 'tambor_combustivel': (tambor_combustivel, 'Tambor de combustível', 'carga', True, 'Metal', 30, 4), 'caixa_suprimentos': (caixa_suprimentos, 'Caixa de suprimentos', 'carga', True, 'Metal', 24, 3), 'cofre': (cofre, 'Cofre', 'movel', True, 'Metal', 70, 7),
 'mesa_laboratorio': (mesa_laboratorio, 'Mesa de laboratório', 'scifi', True, 'Metal', 26, 3), 'terminal_crt': (terminal_crt, 'Terminal retrô', 'scifi', True, 'Metal', 20, 3), 'console_dials': (console_dials, 'Console de mostradores', 'scifi', True, 'Metal', 30, 3),
 'braseiro': (braseiro, 'Braseiro de bronze', 'cenario', True, 'Metal', 30, 3), 'altar_hiboriano': (altar_hiboriano, 'Altar hiboriano', 'masmorra', True, 'Pedra', 70, 6), 'trono': (trono, 'Trono', 'masmorra', True, 'Pedra', 60, 5),
 'sarcofago_gotico': (sarcofago_gotico, 'Sarcófago gótico', 'masmorra', True, 'Pedra', 70, 6), 'estatua_guerreiro': (estatua_guerreiro, 'Estátua de guerreiro', 'cenario', True, 'Pedra', 70, 6), 'coluna': (coluna, 'Coluna', 'cenario', True, 'Pedra', 90, 7),
 'mesa_pedra': (mesa_pedra, 'Mesa de pedra', 'movel', True, 'Pedra', 70, 6), 'cama_peles': (cama_peles, 'Cama de peles', 'movel', False, 'Madeira', 18, 1), 'bau_bronze': (bau_bronze, 'Baú de bronze', 'movel', True, 'Madeira', 36, 4),
 'carroca_dragao': (carroca_dragao, 'Carroça de dragão', 'veiculo', True, 'Metal', 60, 4), 'caminhao_levitador': (caminhao_levitador, 'Caminhão levitador', 'veiculo', True, 'Metal', 110, 6),
 'aerocarro_retro': (aerocarro_retro, 'Aerocarro retrô', 'veiculo', True, 'Metal', 70, 5), 'nave_foguete': (nave_foguete, 'Nave-foguete', 'veiculo', True, 'Metal', 160, 7), 'nave_disco': (nave_disco, 'Nave-disco', 'veiculo', True, 'Metal', 180, 8),
}

def renderiza(pid, w, h):
    ppm = min(96, 1000 / max(w, h)); rx = int(math.ceil((w + .16) * ppm)); ry = int(math.ceil((h + .16) * ppm))
    sc = bpy.context.scene; sc.render.resolution_x = rx; sc.render.resolution_y = ry
    cam = sc.camera; cam.data.ortho_scale = max(rx, ry) / ppm
    cam.location = (0, 0, 40); cam.rotation_euler = (0, 0, 0)
    sc.render.filepath = os.path.join(SAIDA, pid + '.png'); bpy.ops.render.render(write_still=True)
    return ppm

medidas = {}
for pid, (fn, nome, cat, bloq, mat, pv, dur) in PECAS_RF.items():
    if SO and pid not in SO: continue
    limpa(); mats(); cam = luz_e_camera(256, 90, 6)
    w, h = fn()
    for o in list(bpy.context.scene.objects):
        if o.type == 'MESH': contorno(o, .016)
    renderiza(pid, w, h)
    medidas[pid] = {'nome': nome, 'larguraM': round(w + .16, 3), 'alturaM': round(h + .16, 3), 'cat': cat, 'bloq': bloq, 'material': mat, 'pvMax': pv, 'dureza': dur, 'camada': 3}
    print('feito', pid, round(w, 2), round(h, 2), flush=True)
json.dump(medidas, open(os.path.join(SAIDA, '_medidas.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
