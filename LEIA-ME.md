# D100 · Mesa Estelar — como a pasta está organizada

## Publicar

```
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```

Antes de enviar, o deploy roda `scripts/preparar-hosting.cjs` sozinho. Ele:

1. junta as partes de `js/app/` no `app.js` publicado;
2. confere a sintaxe de todos os módulos e se todo `import` aponta para um arquivo que existe. Se algo estiver errado, o deploy é cancelado e o site no ar continua como estava;
3. dá a cada módulo um endereço único, com a "impressão digital" do conteúdo (`?h=...`). Cada módulo carrega uma vez só, e o navegador pode guardar os arquivos em cache: na segunda visita o jogo abre sem baixar nada de novo. Quando um arquivo muda, o endereço muda junto;
4. avisa o navegador para baixar todos os módulos em paralelo logo no início (`modulepreload`).

Só `index.html`, os favicons e os módulos `.js` são publicados. CSVs, documentos e testes não.

## Onde fica cada coisa

| Pasta / arquivo | O que é |
|---|---|
| `index.html` | página do jogo (HTML e estilos) |
| `js/app/NN-assunto.js` | o código principal, dividido por assunto e montado em ordem (01, 02, …) |
| `js/mesa-*.js`, `js/nova-*.js` | módulos da mesa (mapa, conversas, objetos, Cidade Alta…) |
| `firestore.rules` | regras de segurança do banco |
| `scripts/` | montagem para o deploy (`montar.cjs`, `preparar-hosting.cjs`) |
| `tests/` | testes automáticos (`node --test tests/*.test.mjs`) |
| `docs/atualizacoes/` | notas de cada versão (ATUALIZACAO-NNN.md) |
| `dados/` | CSVs e planilhas de importação, backups de imagens |
| `docs/antigos/` | documentos de fases antigas (direcional, psi, suporte) e o app.js velho que estava solto na raiz |
| `_historia/` | história do jogo |
| `imagens/` | imagens de referência (Vaelkor, moedas, criaturas) |
| `arte/mapas/` | imagens de fundo dos mapas (publicadas junto com o site) |
| `arte-fonte/` | de onde saem as artes dos mapas (scripts, layouts e a imagem original da IA) |
| `arte-fonte/imagens-ia/` | **coloque aqui as imagens novas de mapas** (geradas por IA) para eu transformar em mapa |
| `_entregas/` | pacotes de cada entrega e cópias de segurança |

## Para quem for mexer no código

- **Não existe mais um `js/app.js` solto.** Edite a parte certa em `js/app/`. A ordem das partes importa: elas viram um arquivo só, na ordem do nome. Se aparecer um `js/app.js` solto, a montagem para e avisa.
- Os `?v=NNN` nos imports não precisam mais ser trocados à mão; a montagem cuida disso.
- As partes de `js/app/`:
  - 01 núcleo (login, ficha, dados)
  - 02 dados padrão
  - 03 mercado
  - 04 navegação
  - 05 banco de mapas
  - 06 batalha
  - 07 perícias
  - 08 banco de dados
  - 09 importação CSV
  - 10 regras e escudo
  - 11 inventário, idioma e configurações
  - 12 Calico (mundo)
  - 13 objetos e imagens
  - 14 progressão
  - 15 psi e combate
  - 16 Oficina
  - 17 Oficina 2, texturas e mapas por referência
  - 18 alvo e objetos na mesa
  - 19 exploração
  - 20 sincronização
  - 21 movimento direcional
  - 22 mesa e instalação dos módulos
  - 23 rádio, ficha e naves
  - 24 localização e mapas
