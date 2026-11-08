# Pequena SALA (gabinete / refúgio retrofuturista elegante) vista de cima: paredes com espessura e topo chanfrado, porta com vão real, janela,
# estante, escrivaninha, tapete — peças separadas (para o jogador abrir, destruir ou mover) + uma cena de demonstração montada.
# Rodar:  blender.exe -b -P sala_pecas.py -- <pasta de saída> [id1,id2,...|demo]
# Depois: node scripts/blender/montar-moveis.cjs <pasta> sl retrofuturista   (registra sl_<id> no Banco de Objetos)
# Decisões (guia de Blender do Yuri, 23/10/2026): paredes com espessura real; bevel pequeno nas arestas para a luz revelar o contorno;
# sem contorno preto em cada subpeça (só a silhueta, fina); sem sombra direcional gravada na imagem (a sombra de contato é a do mapa).
import sys, os, math, json
_aqui = os.path.dirname(os.path.abspath(__file__))
_src = open(os.path.join(_aqui, 'moveis_cima.py'), encoding='utf-8').read()
exec(compile(_src.split('# ---------------------------------------------------------------- peças')[0], 'moveis_cima(base)', 'exec'))

_mats_base = mats
def mats():
    _mats_base()
    M['reboco'] = material('reboco', cor('#cfc6b4'), .88, 1, 16.0, cor('#bcb29e'))
    M['reboco_t'] = material('reboco_t', cor('#e2dac8'), .8, 1, 22.0, cor('#d2c9b4'))
    M['tabua'] = material('tabua', cor('#8a5c34'), .62, 1, 26.0, cor('#74492a'))
    M['tabua2'] = material('tabua2', cor('#9a6a3c'), .62, 1, 30.0, cor('#80562f'))
    M['latao'] = material('latao', cor('#b58a3a'), .32, 1, 30.0, cor('#946e2a'))
    M['verde_e'] = material('verde_e', cor('#2f4a3c'), .85, 1, 18.0, cor('#263d31'))
    M['vinho'] = material('vinho', cor('#6a2430'), .85, 1, 14.0, cor('#561c26'))
    M['livro_a'] = material('livro_a', cor('#2d4a6a'), .8); M['livro_b'] = material('livro_b', cor('#7a3a2a'), .8); M['livro_c'] = material('livro_c', cor('#3a5a3a'), .8); M['livro_d'] = material('livro_d', cor('#c9b27a'), .8)
    M['papel'] = material('papel', cor('#e6dfc9'), .9)
    M['lamp'] = brilho('lamp', '#ffe2a8', 4.0)
    M['agua_a'] = material('agua_a', cor('#5aa6c8'), .12, 1, 30.0, cor('#4a92b6')); M['agua_b'] = material('agua_b', cor('#78bcd8'), .1, 1, 26.0, cor('#5aa6c8')); M['espuma'] = material('espuma', cor('#f2f6f8'), .55, 1, 40.0, cor('#d6e2ea'))
    M['tapete_m'] = material('tapete_m', cor('#4a2a38'), .95, 1, 40.0, cor('#3c202d'))

ESP = .36   # espessura das paredes (m)
def parede(comprimento, vao=None):
    """bloco de parede com topo chanfrado e junta de blocos; vao=(inicio, fim) abre um vão ao longo do comprimento"""
    L = comprimento
    trechos = [(-L / 2, L / 2)] if not vao else [(-L / 2, vao[0] - L / 2), (vao[1] - L / 2, L / 2)]
    for a, b in trechos:
        w = b - a; cx = (a + b) / 2
        caixa((cx, 0, .55), (w, ESP, 1.1), 'reboco', .035)
        caixa((cx, 0, 1.115), (w - .02, ESP - .06, .035), 'reboco_t', .012)        # tampa clara: lê o topo da parede de cima
        for k in range(1, int(w / .6)): caixa((a + k * .6, 0, 1.12), (.012, ESP - .08, .006), 'pedra2', 0)  # juntas
        caixa((cx, -ESP / 2 + .006, .12), (w, .012, .2), 'tabua2', 0)                 # rodapé (aparece só na borda)
    return L, ESP
def parede_reta(): return parede(3.0)
def parede_curta(): return parede(1.5)
def parede_canto():
    caixa((0, 0, .55), (ESP + .04, ESP + .04, 1.1), 'reboco', .04); caixa((0, 0, 1.115), (ESP - .02, ESP - .02, .035), 'reboco_t', .012)
    return ESP + .04, ESP + .04
def porta():
    L = 1.5
    for sx in (-1, 1):
        a = sx * (.6 + (L / 2 - .6) / 2)
        caixa((a, 0, .55), (L / 2 - .6, ESP, 1.1), 'reboco', .035); caixa((a, 0, 1.115), (L / 2 - .6 - .02, ESP - .06, .035), 'reboco_t', .012)
    caixa((0, 0, 1.06), (1.2, ESP, .1), 'reboco', .02)                                 # verga
    for sx in (-1, 1): caixa((sx * .6, 0, .55), (.07, ESP + .02, 1.1), 'mad2', .015)    # batentes
    caixa((0, 0, .5), (1.12, .07, 1.0), 'tabua', .02)                                  # folha da porta (fechada)
    for dz in (.2, .5, .8): caixa((0, .0, dz), (1.1, .075, .02), 'mad2', 0)
    cil((.42, -.05, .52), .028, .05, 'latao', 16, .005, (math.pi / 2, 0, 0))            # maçaneta
    for dz in (.18, .82): caixa((-.52, .045, dz), (.06, .02, .12), 'latao', 0)           # dobradiças
    return L, ESP
def janela():
    L = 1.8
    for sx in (-1, 1):
        a = sx * (.55 + (L / 2 - .55) / 2)
        caixa((a, 0, .55), (L / 2 - .55, ESP, 1.1), 'reboco', .035); caixa((a, 0, 1.115), (L / 2 - .55 - .02, ESP - .06, .035), 'reboco_t', .012)
    caixa((0, 0, .3), (1.1, ESP, .6), 'reboco', .03); caixa((0, 0, 1.115), (1.1, ESP - .06, .035), 'reboco_t', .012)
    caixa((0, 0, .8), (1.04, .05, .45), 'vidro', .01); caixa((0, 0, .8), (.03, .06, .45), 'mad2', 0); caixa((0, 0, .8), (1.04, .06, .03), 'mad2', 0)
    caixa((0, ESP / 2 - .02, .62), (1.16, .1, .035), 'tabua', .01)                      # peitoril
    return L, ESP
def estante():
    caixa((0, 0, .9), (1.6, .42, 1.8), 'mad2', .02)
    for i in range(4):
        y = -.15 + i * .1
    for r in range(3):
        z = .35 + r * .55; x = -.72
        caixa((0, 0, z + .24), (1.5, .36, .02), 'mad', .005)
        k = 0
        while x < .7:
            w = .05 + .02 * ((k * 7) % 4); mat = ('livro_a', 'livro_b', 'livro_c', 'livro_d')[(k * 5 + r) % 4]
            caixa((x + w / 2, 0, z + .13 + .02 * (k % 3), ), (w, .26, .22 + .03 * (k % 3)), mat, .004); x += w + .004; k += 1
    caixa((0, 0, 1.815), (1.64, .44, .03), 'mad', .015)
    for k, (x, mat) in enumerate(((-.55, 'livro_a'), (-.3, 'livro_b'), (.2, 'livro_c'))):   # livros deitados e um vaso em cima (o que se vê de cima)
        caixa((x, 0, 1.86 + .03 * (k % 2)), (.26, .2, .05 + .03 * (k % 2)), mat, .006, .2 * k)
    cil((.58, 0, 1.9), .09, .14, 'terra', 18, .01); esf((.58, 0, 2.0), (.14, .14, .1), 'verde', 14)
    return 1.7, .5
def escrivaninha():
    caixa((0, 0, .72), (1.7, .85, .07), 'mad', .025)
    for sx in (-1, 1): caixa((sx * .74, 0, .36), (.16, .78, .72), 'mad2', .015)
    caixa((0, .05, .765), (1.1, .6, .012), 'verde_e', .005)                            # mata-borrão
    caixa((-.3, .0, .775), (.34, .24, .01), 'papel', 0, .12); caixa((-.22, .06, .78), (.3, .22, .01), 'papel', 0, -.2)
    esf((.45, .2, .82), (.07, .07, .09), 'metal2', 18); cil((.45, .2, .79), .06, .05, 'latao', 20, .004)  # tinteiro
    cil((.62, -.18, .86), .055, .2, 'latao', 18, .006); esf((.62, -.18, .98), (.1, .1, .05), 'lamp', 18)  # abajur
    cil((.62, -.18, .775), .12, .015, 'latao', 24, .004)
    return 1.8, .95
def tapete():
    caixa((0, 0, .012), (2.4, 1.6, .024), 'tapete_m', .01)
    caixa((0, 0, .03), (2.2, 1.4, .012), 'vinho', .004); caixa((0, 0, .04), (1.9, 1.1, .012), 'tapete_m', .004)
    for sx in (-1, 1):
        for k in range(-3, 4): caixa((sx * 1.26, k * .2, .02), (.06, .1, .015), 'creme', 0)
    cil((0, 0, .05), .35, .012, 'ouro', 6, 0, (0, 0, math.pi / 6))
    return 2.4, 1.6

def mesa_redonda():
    cil((0, 0, .72), .7, .06, 'mad', 40); cil((0, 0, .36), .09, .72, 'mad2'); cil((0, 0, .03), .32, .05, 'mad2')
    for a in (0, 1.05, 2.1): caixa((0, 0, .755), (1.36, .012, .004), 'mad2', 0, a)
    return 1.4, 1.4
def cadeira():
    caixa((0, 0, .46), (.46, .44, .05), 'mad', .015)
    for sx in (-1, 1):
        for sy in (-1, 1): caixa((sx * .19, sy * .17, .22), (.04, .04, .44), 'mad2', .005)
    caixa((0, .21, .74), (.46, .05, .5), 'mad2', .012)
    return .56, .56

def ponte_madeira():
    # passarela de tábuas sobre um córrego: tábuas com folga, duas longarinas, corrimãos e postes (peça caminhável, sem colisão)
    L, Wd = 5.4, 1.7
    for i in range(int(L / .22)): caixa((0, -L / 2 + .11 + i * .22, .35), (Wd - .3, .2, .06), 'tabua' if i % 2 else 'tabua2', .008)
    for sx in (-1, 1):
        caixa((sx * (Wd / 2 - .12), 0, .28), (.12, L, .1), 'mad2', .01)
        caixa((sx * (Wd / 2 - .02), 0, .78), (.06, L - .3, .05), 'mad', .01)
        for k in range(5): caixa((sx * (Wd / 2 - .02), -L / 2 + .25 + k * (L - .5) / 4, .55), (.09, .09, .6), 'mad2', .01)
    return Wd, L
def cachoeira_queda():
    # v205: SÓ o leito — pedras molhadas nas margens, lábio de pedra no alto da queda e rochas no poço. A ÁGUA é animada no site (js/mesa-cachoeira.js):
    # o miolo fica transparente. Antes eram faixas de água estáticas (tapete listrado).
    Wd, L = 2.6, 7.0
    for sx in (-1, 1):
        caixa((sx * 1.18, 0, .04), (.34, L - .4, .05), 'pedra2', .02)
    for k, x in enumerate((-.95, -.45, .1, .6, 1.0)): esf((x, L / 2 - .55 + (k % 2) * .08, .16), (.3, .24, .16), 'pedra' if k % 2 else 'pedra2', 18)
    for k, x in enumerate((-1.0, -.5, 0, .5, 1.0)): esf((x, -.2 + (k % 2) * .1, .13), (.26, .2, .12), 'pedra2' if k % 2 else 'pedra', 18)
    for j, (x, y, r) in enumerate(((-1.25, -L / 2 + .6, .38), (1.22, -L / 2 + .9, .34), (-1.3, -.4, .3), (1.28, .3, .36), (-1.2, 1.6, .32), (1.25, 2.1, .3), (-1.3, 2.9, .3), (1.3, 3.1, .28))): esf((x, y, .2), (r, r * 1.2, .2), 'pedra' if j % 2 else 'pedra2', 18)
    return Wd + .6, L
def lirio_agua():
    # v205: vitória-régia de cima: folha redonda com entalhe, nervuras e, em uma das variantes, flor rosa (peça de enfeite, não bloqueia)
    M['verde_l'] = material('verde_l', cor('#3f8a3c'), .55, 1, 22.0, cor('#2f7030')); M['verde_l2'] = material('verde_l2', cor('#58a64a'), .5, 1, 18.0, cor('#3f8a3c')); M['rosa_l'] = material('rosa_l', cor('#f0b4cc'), .5); M['ouro_l'] = material('ouro_l', cor('#f4d05a'), .5)
    cil((0, 0, .04), .48, .04, 'verde_l', 36, .01); cil((0, 0, .062), .4, .02, 'verde_l2', 36, .005)
    for i in range(8):
        a = i * math.pi / 4 + .3; caixa((math.cos(a) * .22, math.sin(a) * .22, .075), (.44, .015, .006), 'verde_l', 0, a)
    for i in range(8):
        a = i * math.pi / 4; esf((math.cos(a) * .11 + .04, math.sin(a) * .11 + .04, .11), (.07, .035, .035), 'rosa_l', 12)
    esf((.04, .04, .13), (.05, .05, .05), 'ouro_l', 12)
    return 1.1, 1.1
def junco_agua():
    # touceira de junco de cima: lâminas que saem do centro em leque e espigas marrons
    M['junco_a'] = material('junco_a', cor('#4f8a3a'), .7, 1, 20.0, cor('#3a6e2c')); M['junco_b'] = material('junco_b', cor('#86ad4a'), .7, 1, 20.0, cor('#5f8a3a')); M['espiga_l'] = material('espiga_l', cor('#6a4426'), .8)
    import random as _r; rr = _r.Random(11)
    for i in range(64):   # lâminas finas em leque: base juntinha no centro, pontas abertas (parece touceira, não palitos soltos)
        a = i / 64 * 2 * math.pi + rr.random() * .18; L = .32 + rr.random() * .5
        caixa((math.cos(a) * (.05 + L / 2), math.sin(a) * (.05 + L / 2), .05 + (i % 5) * .012), (L, .024, .012), 'junco_a' if i % 3 else 'junco_b', 0, a)
    for i in range(4):
        a = rr.random() * 2 * math.pi; L = .12 + rr.random() * .28; esf((math.cos(a) * L, math.sin(a) * L, .22), (.035, .035, .13), 'espiga_l', 10)
    return 1.6, 1.6
def pedra_margem(v):
    M['musgo_l'] = material('musgo_l', cor('#5f8a3a'), .9, 1, 24.0, cor('#4a7230'))
    import random as _r; rr = _r.Random(20 + v)
    esf((0, 0, .16), (.42 + v * .05, .34, .16 + v * .03), 'pedra', 22); esf((.18, .1, .12), (.26, .22, .12), 'pedra2', 16); esf((-.2, -.08, .1), (.22, .2, .1), 'pedra', 16)
    for i in range(7): esf((rr.uniform(-.28, .28), rr.uniform(-.2, .2), .26 + rr.random() * .04), (rr.uniform(.04, .1), rr.uniform(.03, .08), .02), 'musgo_l', 10)
    return 1.2, 1.0
def pedra_margem_a(): return pedra_margem(0)
def pedra_margem_b(): return pedra_margem(2)
def tronco_caido():
    # v205: tronco caído de cima (pântano/floresta): corpo alongado de casca escura, topo claro, galhos curtos, musgo e um corte com anéis
    M['casca_t'] = material('casca_t', cor('#4a3524'), .9, 1, 26.0, cor('#33241a')); M['casca_t2'] = material('casca_t2', cor('#5e4630'), .9, 1, 20.0, cor('#46321f')); M['miolo_t'] = material('miolo_t', cor('#c79a62'), .8); M['musgo_t'] = material('musgo_t', cor('#5a8236'), .9, 1, 24.0, cor('#476a2a'))
    import random as _r; rr = _r.Random(31)
    esf((0, 0, .2), (1.25, .3, .24), 'casca_t', 24); esf((-.2, .03, .27), (.9, .22, .16), 'casca_t2', 20)
    for i in range(5): esf((-1.0 + i * .5, rr.uniform(-.05, .05), .36), (.22, .12, .06), 'casca_t', 10)
    esf((1.2, 0, .2), (.06, .26, .22), 'miolo_t', 18); esf((1.24, 0, .2), (.03, .17, .15), 'casca_t2', 14); esf((1.26, 0, .2), (.02, .08, .08), 'miolo_t', 10)
    for sx, sy, L in ((-.5, 1, .2), (.1, -1, .17), (.6, 1, .15)): esf((sx, sy * (.3 + L * .8), .2), (.07, L, .08), 'casca_t', 10)
    for i in range(9): esf((rr.uniform(-1.0, .9), rr.uniform(-.14, .14), .36 + rr.random() * .02), (rr.uniform(.1, .3), rr.uniform(.06, .14), .03), 'musgo_t', 10)
    return 2.8, 1.0
def raiz_pantano():
    # v205: emaranhado de raízes expostas (mangue): arcos que saem de um nó central e mergulham, com lama e musgo
    M['raiz_r'] = material('raiz_r', cor('#4b3826'), .9, 1, 28.0, cor('#352718')); M['raiz_r2'] = material('raiz_r2', cor('#62492f'), .9, 1, 22.0, cor('#46321f')); M['lama_r'] = material('lama_r', cor('#3b3a24'), .95); M['musgo_r'] = material('musgo_r', cor('#587f35'), .9, 1, 24.0, cor('#476a2a'))
    import random as _r; rr = _r.Random(47)
    esf((0, 0, .12), (.34, .3, .12), 'lama_r', 18)
    for i in range(9):
        a = i / 9 * 2 * math.pi + rr.random() * .3; L = .55 + rr.random() * .5
        for k in range(14):
            t = (k + .5) / 14; r = .1 + t * L; w = .075 * (1 - t * .55); esf((math.cos(a + t * .6) * r, math.sin(a + t * .6) * r, .2 * math.sin(t * 3.14) + .05), (w * 1.6, w, w), 'raiz_r' if (i + k) % 2 else 'raiz_r2', 10)
    for i in range(8): esf((rr.uniform(-.3, .3), rr.uniform(-.3, .3), .18), (rr.uniform(.05, .12), rr.uniform(.05, .1), .02), 'musgo_r', 10)
    return 1.9, 1.9
def pedra_submersa():
    # v205: rocha vista através da água: tons azul-esverdeados escuros e lodo (vai por baixo da superfície ambiente da lagoa)
    M['sub_a'] = material('sub_a', cor('#34484a'), .85, 1, 24.0, cor('#26393b')); M['sub_b'] = material('sub_b', cor('#415a58'), .85, 1, 20.0, cor('#2f4745')); M['alga_s'] = material('alga_s', cor('#2f5a3a'), .9)
    esf((0, 0, .12), (.5, .4, .12), 'sub_a', 22); esf((.22, .12, .1), (.3, .26, .1), 'sub_b', 16); esf((-.24, -.1, .1), (.26, .24, .1), 'sub_a', 16)
    for i in range(6): esf((math.cos(i) * .3, math.sin(i * 1.7) * .24, .2), (.08, .06, .02), 'alga_s', 10)
    return 1.3, 1.1
def lampiao():
    # poste com lampião (luz de acampamento/casa)
    cil((0, 0, .8), .06, 1.6, 'ferro', 14, .008); cil((0, 0, .05), .22, .1, 'pedra2', 20, .01)
    esf((0, 0, 1.7), (.2, .2, .22), 'lamp', 16); caixa((0, 0, 1.92), (.34, .34, .05), 'latao', .01); cil((0, 0, 1.58), .22, .04, 'latao', 16, .005)
    return .6, .6

PECAS_SALA = {
 'parede_reta': (parede_reta, 'Parede reta (3 m)', 'cenario', True, 'Pedra', 90, 7), 'parede_curta': (parede_curta, 'Parede curta (1,5 m)', 'cenario', True, 'Pedra', 70, 7),
 'parede_canto': (parede_canto, 'Pilar de canto', 'cenario', True, 'Pedra', 90, 7), 'porta_sala': (porta, 'Parede com porta', 'cenario', False, 'Madeira', 40, 3),
 'janela_sala': (janela, 'Parede com janela', 'cenario', True, 'Pedra', 60, 4), 'estante_livros': (estante, 'Estante de livros', 'movel', True, 'Madeira', 30, 3),
 'escrivaninha': (escrivaninha, 'Escrivaninha com abajur', 'movel', True, 'Madeira', 28, 3), 'ponte_madeira': (ponte_madeira, 'Ponte de madeira', 'cenario', False, 'Madeira', 60, 4),
 'cachoeira_queda': (cachoeira_queda, 'Cachoeira (queda de água)', 'cenario', False, 'Pedra', 0, 0), 'lirio_agua': (lirio_agua, 'Vitória-régia', 'cenario', False, 'Planta', 0, 0), 'junco_agua': (junco_agua, 'Junco', 'cenario', False, 'Planta', 0, 0), 'pedra_margem_a': (pedra_margem_a, 'Pedra da margem (A)', 'cenario', False, 'Pedra', 0, 0), 'pedra_margem_b': (pedra_margem_b, 'Pedra da margem (B)', 'cenario', False, 'Pedra', 0, 0), 'tronco_caido': (tronco_caido, 'Tronco caído', 'cenario', False, 'Madeira', 0, 0), 'raiz_pantano': (raiz_pantano, 'Raízes de mangue', 'cenario', False, 'Madeira', 0, 0), 'pedra_submersa': (pedra_submersa, 'Pedra submersa', 'cenario', False, 'Pedra', 0, 0), 'lampiao': (lampiao, 'Luminária de poste', 'cenario', True, 'Metal', 12, 2), 'tapete_sala': (tapete, 'Tapete de sala', 'movel', False, 'Tecido', 0, 0),
}
SAIDA = os.path.abspath(ARGS[0]); os.makedirs(SAIDA, exist_ok=True)
SO = [a for a in ARGS[1:] if not a.startswith('--') and a]; SO = SO[0].split(',') if SO else []

def renderiza(pid, w, h, resolucao=96):
    ppm = min(resolucao, 1000 / max(w, h)); rx = int(math.ceil((w + .16) * ppm)); ry = int(math.ceil((h + .16) * ppm))
    sc = bpy.context.scene; sc.render.resolution_x = rx; sc.render.resolution_y = ry
    cam = sc.camera; cam.data.ortho_scale = max(rx, ry) / ppm; cam.location = (0, 0, 40); cam.rotation_euler = (0, 0, 0)
    sc.render.filepath = os.path.join(SAIDA, pid + '.png'); bpy.ops.render.render(write_still=True)
    return ppm

def luz_suave():
    # sol mais alto e sombra curta: o relevo aparece na luz e nas arestas, sem uma sombra longa gravada na imagem
    bpy.data.objects['sol'].rotation_euler = (math.radians(24), math.radians(6), math.radians(-35)); bpy.data.lights['sol'].energy = 3.0
    bpy.data.lights['sol'].angle = math.radians(14)

def silhueta(objs, esp=.012):
    for o in objs:
        if o.type == 'MESH' and len(o.data.vertices) > 8: contorno(o, esp)

if 'demo' in SO:
    # sala pequena montada de verdade: piso de tábuas, 4 paredes (porta ao sul, janela ao norte), tapete, escrivaninha, estante, cadeira e mesa
    limpa(); mats(); cam = luz_e_camera(256, 90, 6); luz_suave(); W, H = 7.0, 5.0
    for i in range(int(H / .22) + 1):                                 # piso: tábuas de comprimentos variados, juntas desencontradas
        y = -H / 2 + .11 + i * .22; x = -W / 2; k = 0
        while x < W / 2:
            c = min(W / 2 - x, 1.1 + ((i * 3 + k * 5) % 5) * .22); caixa((x + c / 2, y, .01), (c - .004, .21, .02), 'tabua' if (i + k) % 2 else 'tabua2', .004); x += c; k += 1
    def peca(fn, x, y, rot=0):
        antes = set(bpy.context.scene.objects); fn()
        novos = [o for o in bpy.context.scene.objects if o not in antes]
        for o in novos:
            o.rotation_euler[2] += rot; o.location = (x + o.location[0] * math.cos(rot) - o.location[1] * math.sin(rot), y + o.location[0] * math.sin(rot) + o.location[1] * math.cos(rot), o.location[2])
    for k, x in enumerate((-2.25, 0.75)): pass
    peca(lambda: parede(7.0), 0, H / 2 + ESP / 2 - .02 + .0)                       # norte
    peca(lambda: parede(2.5), -2.25, -H / 2 - ESP / 2 + .02); peca(porta, -.25, -H / 2 - ESP / 2 + .02); peca(lambda: parede(3.0), 2.0, -H / 2 - ESP / 2 + .02)  # sul com porta
    peca(lambda: parede(H + ESP), -W / 2 - ESP / 2 + .02, 0, math.pi / 2); peca(lambda: parede(H + ESP), W / 2 + ESP / 2 - .02, 0, math.pi / 2)
    peca(tapete, -.4, .2); peca(escrivaninha, -2.4, 1.6, math.pi); peca(estante, 2.6, 2.0, math.pi); peca(mesa_redonda, 2.5, -.8); peca(cadeira, -2.4, .65, math.pi)
    silhueta([o for o in bpy.context.scene.objects if o.type == 'MESH' and o.dimensions.x > 2.5], .012)
    renderiza('demo_sala', W + 1.0, H + 1.0, 130)
    print('demo pronta', flush=True); sys.exit(0)

medidas = {}
for pid, (fn, nome, cat, bloq, mat, pv, dur) in PECAS_SALA.items():
    if SO and pid not in SO: continue
    limpa(); mats(); cam = luz_e_camera(256, 90, 6); luz_suave()
    w, h = fn()
    silhueta([o for o in bpy.context.scene.objects if o.type == 'MESH'][:3] if pid.startswith('parede') else [], .012)
    renderiza(pid, w, h)
    medidas[pid] = {'nome': nome, 'larguraM': round(w + .16, 3), 'alturaM': round(h + .16, 3), 'cat': cat, 'bloq': bloq, 'material': mat, 'pvMax': pv, 'dureza': dur, 'camada': 3}
    print('feito', pid, round(w, 2), round(h, 2), flush=True)
json.dump(medidas, open(os.path.join(SAIDA, '_medidas.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
