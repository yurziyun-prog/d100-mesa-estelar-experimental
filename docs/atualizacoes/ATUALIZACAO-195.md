# Atualização 195 — mapa editado como rascunho, construtor no 🧪, sem grade

- **Editar o mapa não salva mais sozinho.** O editor da mesa (`nova-editor.js`) deixou de salvar 1,5 s depois da última edição e de gravar na hora o que se move ou retira. Tudo vira rascunho; o aviso diz quantas alterações faltam salvar e só **💾 Salvar mapa** grava. (Os antigos modos voltam com `window.mesaAutoSalvar=true` e `window.mesaEditorImediato=true`.)
- **Oficina 3.0 e construtor também são rascunho.** Paredes, cômodos, chão, teto, portas e objetos colocados vão para o mesmo rascunho do editor; o painel ganha **💾 Salvar mapa (N)** e **🗑️ Descartar**. Pinceladas continuam gravando na hora (documento à parte). Para o modo antigo: `window.mesaOficina3Imediato=true`.
- **👷 Construtor reintroduzido no botão 🧪** (o do Kael): o 🧪 agora abre um menu com Construtor (andar e construir neste mapa), Oficina 3.0 e Ver como jogador.
- **Sem grade.** A grade não aparece na mesa nem no editor (`window.mesaGradeNaMesa=true` a traz de volta); mapas novos nascem sem grade. Miniaturas de porte médio nunca ficam abaixo de 0,9 m (antes 0,75 m).
- Nada do que o Kimi fez nas v194–v209 foi retirado.
- Testes: `tests/v193-rascunho-browser.cjs` (novo); `tests/v112-barra` e `v209` ajustados.

Publicar: `npx firebase-tools deploy --only hosting --project d100-mesa-estelar`

## Complemento — bairro, construtor com miniatura, grade ▦
- **🏘️ Começar o bairro** (menu do 🧪, pede confirmação e guarda cópia em `combatesAtivos/backupBairro_*_v195`): a Cidade Baixa (`cenario_c002`) perde a imagem de fundo e as casas desenhadas, passa de 73,3×53,65 m para **40×26 m**, vazia, e fica com **só duas ligações**: Portão de Véspera ↔ Cidade Baixa (canto de baixo à esquerda) e Cidade Baixa ↔ Escadaria da Cidade Alta (canto de cima à direita). As outras ligações da Cidade Baixa são desfeitas. Quem estava no mapa vai para perto do portão. Se um dos três mapas não for achado, nada muda.
- A conferência automática de estrutura (`mesa-estrutura.js`) não religa mais mapas soltos depois disso (o mestre cuida das ligações), e não liga a masmorra à Cidade Baixa.
- **👷 Construtor = Brunel Obras**: agora é uma pessoa, com miniatura gerada pelo mesmo gerador das fichas (como o Kael), **do mesmo tamanho (1 m)** das demais. No 🧪: "Construtor (outra aba)" abre uma aba (`?construtor=1`) que entra sozinha no modo construtor; "nesta aba" continua existindo.
- **▦ Grade de referência** (botão ▦ na coluna da esquerda): desligada por padrão em todos os mapas; um clique mostra uma régua de 1 m por quadrado, de novo esconde. Botões da esquerda reorganizados: 🧪 96, 🎬 136, ❓ 176, 🏰 216, ▦ 256.
- Testes: `tests/v195-bairro.test.mjs` (7).
- Brunel Obras tem visual próprio (capacete e mochila de ferramentas), no mesmo tamanho do Kael; imagem de conferência: docs/imagens/v195-construtor.png.

- **Controle no site inteiro** (ficha, inventário, mercado, regras…): fora do mapa, as setas ou a alavanca esquerda movem o foco entre os botões, **A** aperta, **LB/RB** trocam de aba, **B** fecha janela, **Y** volta ao topo, **Start** abre ⚙️ Configurações e a alavanca direita rola a página. No mapa, o menu da **LT** ganhou atalhos para as abas (Ficha, Mapa, Mercado…). Teste: `tests/v195-controle-site-browser.cjs`.

## v196 — grade, escala e bairro automático
- **Grade**: a grade de 1 m do `mesa-vista.js` (a das linhas brancas do print) vinha LIGADA por padrão. Agora vem **desligada** para todos, em todos os mapas (a escolha antiga de cada navegador foi zerada); o botão ▦ ao lado do zoom liga e desliga. Removido o botão ▦ duplicado que eu tinha criado.
- **Escala**: jogador, Kael, modo diretor e a aba do construtor (`?construtor=1` ou modo construtor ligado) veem o mapa sempre ampliado a **~52 px por metro** (como a taverna da Última Bateria), em qualquer mapa ou janela (`mesa-camera.js`). O mestre na aba principal continua com o mapa inteiro e o zoom dele.
- **Miniaturas**: pessoa de porte médio ocupa **1 m × 1 m** (antes 0,75–0,99 m guardados nas fichas agora sobem para 1 m) e o desenho de uma pessoa vista de cima agora preenche a base (antes só ~28% da largura). Kael e Brunel têm o mesmo tamanho.
- **Bairro automático**: "Começar o bairro" agora roda **sozinho, uma vez**, quando o mestre abre o site (flag `configuracoes/bairroV196`); a cópia de segurança original nunca é sobrescrita.
- Testes: `tests/v196-escala-browser.cjs` (jogador, construtor e mestre; medidas em pixels; imagens em `docs/imagens/v196-construtor-e-kael*.png`), `tests/v195-bairro.test.mjs`.

## v196 (2) — construtor: aparece, responde na hora e constrói tudo pelo controle
- **O Brunel não aparecia** no modo construtor: um comentário que eu tinha posto na mesma linha engolia as linhas que posicionam o avatar. Corrigido (e coberto por teste).
- **Atraso**: cada peça posta refazia o mapa inteiro (milhares de nós, ~200 ms por clique em mapa grande). Agora o desenho da mesa é **incremental** (`nova-direta.js`), o rascunho do editor não clona a cena toda (`nova-editor-estado.js`) e a lista de objetos não é refeita por inteiro (`nova-editor.js`): **~25 ms por peça numa cena de 3000 objetos** (era ~200 ms). Mira, colisão, quebrar e pintar agora enxergam também as peças ainda não salvas (antes só as salvas, por isso era preciso apertar A/X várias vezes). Apertar A duas vezes no mesmo lugar não duplica.
- **Paleta do construtor (RT ou P)**: Estruturas, Pisos e materiais, Cores e os **móveis/objetos do banco por categoria** (Móveis, Natureza, Luz e tecnologia, Caixas e barris, Veículos e naves, Construção, Decoração, Outros). Setas ou alavanca esquerda movem, LB/RB trocam de grupo, A escolhe, B/RT fecham. Objetos giram com LB/RB e são postos com A.
- **12 pisos novos** (terra, areia, grama, lajota, rocha, tijolo, tábuas, palha, azulejo, metal, telha, água rasa) — valem em qualquer peça de chão (inclusive o chão das casas prontas).
- Testes: `tests/v196-construtor-browser.cjs` (controle simulado de ponta a ponta), `tests/v196-desempenho-browser.cjs`, `tests/v180.test.mjs`. Imagem: `docs/imagens/v196-construtor-no-mapa.png`.
