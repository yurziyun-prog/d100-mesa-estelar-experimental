# Atualização 55 — seleção, entrada e edição na mesa

- A troca de ficha renderiza o personagem antes do mercado. Falhas em atualizações secundárias não impedem a seleção. A ficha selecionada passa também para o mapa, fora de combate.
- O jogador vê suas fichas em “Atuar como”, mesmo fora do mapa. “Entrar” coloca a ficha escolhida sem o mestre precisar preparar ou adicionar o personagem. A entrada ocorre fora de combate; durante combate, o mestre mantém a inclusão com iniciativa existente. As regras conferem a propriedade da ficha.
- Em “Atuar como → Mestre”, objetos podem ser movidos, removidos, duplicados, redimensionados, girados e colocados em camadas. Há retângulo, quadrado, triângulo, círculo, elipse, lápis, cores, bordas, opacidade e sombra. Elementos originais selecionados podem ser removidos; “Aplicar ao selecionado” os converte em objeto visual editável.
- Para criar um muro, escolha Retângulo, camada 3, marque “Bloqueia movimento” e arraste no mapa. Camadas diferentes dos personagens não bloqueiam seu movimento.
- As edições do cenário são locais até **Salvar mapa**. Desfazer/refazer e descartar operam antes da publicação. Salvar atualiza a cena compartilhada, seu arquivo e, quando existe, o mapa no banco. Movimentos de personagens e combate continuam em tempo real.
- O salvamento reaplica as edições sobre o estado mais recente; não restaura PV, fogo ou efeitos anteriores. A galeria continua disponível para inserir imagens, itens e objetos dos bancos. As ferramentas completas de configuração de fundo/textura da Oficina 2 continuam na própria Oficina.
- O mestre pode atacar e defender por personagens de jogador em “Atuar como”. Ataques respeitam o turno, gastam ações e munição normalmente. Outros jogadores continuam impedidos de agir por fichas alheias. Falhas no envio do ataque ficam visíveis no aviso da mesa.

## Diagnóstico de Sérgio Leone

Os pedidos reais estavam rejeitados com “Você não controla este personagem”. A autoria era da conta do mestre. A regra antiga permitia ao mestre controlar PJ somente fora do combate, embora a interface permitisse selecioná-lo durante combate. A validação foi alinhada à interface.

## Publicação

Na pasta `work/mesa-sync`:

```powershell
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```

Após publicar, atualizar com Ctrl+F5 nas contas do mestre e jogadores. Nenhum deploy foi feito automaticamente nesta etapa.

## Verificação

Testes das regras de entrada no simulador oficial (sem gravar dados de jogo): dono permitido, outra conta negada, entrada em combate negada e atualização de participação própria permitida. Testes do controlador em dois navegadores usam um banco simulado; não substituem uma sessão final no Firebase publicado.
