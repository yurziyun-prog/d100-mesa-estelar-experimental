# v215 — Predador Quitinoso, conceito aprovado (27/10/2026)

**Publicado no Hosting em 27/10/2026.** Catálogo, escala e cinco atlas conferidos byte a byte no site público. Aguarda avaliação visual do Yuri no mapa da campanha.

Pedido do Yuri: modelar e colocar no mapa o artrópode alienígena aprovado na imagem. Esta etapa troca só a arte do monstro `insetoide_predador_1` (Predador Quitinoso); não troca o insetoide bípede jogável nem o Artrópode de Fenda/Rastejante de Cinzas.

## Entrega

- Modelo original no Blender: seis patas, tórax e abdômen com placas sobrepostas, serrilhas, cristas, sensores âmbar sem emissão e mandíbulas articuladas.
- Esqueleto real de 22 ossos, armadura vinculada por grupos de vértices. Cinco ações guardadas no arquivo-fonte.
- 64 quadros transparentes de 256 px: parado 12, andar 16, atacar 14, golpe 8, morrer 14. Marcha de trípode alternado com IK analítico; o pé de apoio percorre uma linha, e só o pé em recuperação levanta. Animações no lugar, sem girar ou deslocar o token por conta própria.
- Cinco folhas WebP, aproximadamente 794 KiB no total. Renderização prévia do Blender, sem exigir WebGL ou carregar o modelo 3D no jogo.
- Mesmo ID `cima_insetoide_predador_1`: tokens que já usam essa aparência e tokens com a aparência padrão da espécie recebem a arte nova. Escolhas manuais de outra aparência continuam valendo. Não foi necessário escrever no banco da campanha nem recriar o mapa.
- Escala recalculada pela extensão medida do modelo: quadro 3,505 m para manter a pegada adulta anterior de 2,8 m; colisão anterior de 1,3 m preservada. Sem aura, base circular ou chão gravado na imagem.

A imagem aprovada é uma referência de desenho. A miniatura é uma adaptação para a leitura pequena e vista de cima do jogo, não uma reprodução de todos os microdetalhes da ilustração.

## Fonte para continuar no Blender/Claude

- `arte-fonte/predador-quitinoso/conceito-aprovado.png`: referência do Yuri.
- `arte-fonte/predador-quitinoso/predador-quitinoso.blend`: malhas, materiais, esqueleto e ações. As trilhas NLA ficam silenciadas para não somar ações ao editar; no editor de ações, selecionar `Predador_parado`, `Predador_andar`, `Predador_atacar`, `Predador_golpe` ou `Predador_morrer`. Não ativar todas as trilhas juntas.
- `scripts/blender/predador_quitinoso.py`: fonte reprodutível. Executar Blender em segundo plano, com `-- arte-fonte/predador-quitinoso`. `--previa` gera duas imagens maiores sem modificar o catálogo.
- `scripts/blender/montar-predador.cjs`: valida margens/alpha e monta as folhas. Depois executar `node scripts/escala-fisica.cjs`.
- `catalogo-antes-v215.json`, `medida-antes-v215.json` e os atlas antigos continuam preservados para reversão.

Ao refinar: manter câmera, escala e centro iguais entre ações; não recortar cada quadro individualmente. Preservar o apoio das patas e o ponto central do corpo. Texturas finas ficam no material e não substituem a silhueta. Refinamentos posteriores podem aumentar a fidelidade das placas à imagem de conceito.

Não regenerar esta espécie com a receita genérica antiga de `criaturas_cima.py`: isso voltaria ao inseto anterior. Usar a fonte específica desta entrega e preservar os nomes de atlas versionados para evitar cache antigo.

## Validação

- Empacotador: todos os 64 quadros têm corpo visível, transparência e margem; nenhuma pata cortada.
- `tests/predador-quitinoso-browser.cjs`: app/renderizador reais com banco simulado; token salvo com aparência anterior recebe as folhas novas; escala em metros; ausência de aura; avanço de quadros; caminhada, ataque, golpe, morte com quadro final persistente; visível em 1280 e 390 px.
- 780 testes de unidade/contratos aprovados.
- `docs/predador-quitinoso/no-mapa.png` e `ataque-no-mapa.png`: capturas do mapa de testes local com Kael como referência. Não são captura da campanha autenticada.

Não foram alterados atributos, dano, espécie, comportamento, fichas ou a posição dos monstros da campanha.
