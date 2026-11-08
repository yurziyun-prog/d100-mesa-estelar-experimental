# Mesa Estelar v129 — Estética futurista, retrofuturista e feudal galáctica + mapas recheados

## 🎨 19 móveis novos nos três estilos
Entram sozinhos no banco de objetos do mapa na primeira vez que o mestre abre o site (aparece um aviso). O botão "Adicionar objetos novos", no Banco, continua funcionando.

| Estilo | Móveis |
|---|---|
| 🛰️ **Futurista** (metal escuro e neon ciano) | Console holográfico, Cápsula de descanso, **Armário de metal** (guarda itens), **Painel de luz neon** (liga/desliga), **Porta deslizante** (abre/fecha), Mesa de vidro iluminada, Cadeira ergonômica |
| 📻 **Retrofuturista** (creme, laranja, petróleo e cromo) | Sofá retrô curvo, **Luminária atômica**, Mesa bumerangue, **Rádio de válvulas**, Poltrona ovo |
| 👑 **Feudal galáctico** (carmim, ouro e circuitos de luz) | Trono estelar, Estandarte da casa, **Braseiro de plasma**, **Baú brasonado** (guarda itens), Mesa de banquete, Armadura cerimonial, **Portão de bronze** |

Os itens em negrito já funcionam com a v124/v125: abrem, ligam, trancam e guardam itens.

## 🗺️ Gerador de mapas com estilo
- **Na tela do gerador:** novo campo **Estilo**. Paredes, portas, piso e chão mudam de cor, e os móveis do estilo são espalhados (os de parede encostados nas paredes).
  - **Futurista:** chão metálico e faixas de luz.
  - **Retrofuturista:** piso creme e ladrilhos petróleo.
  - **Feudal:** pedra escura e passadeira carmim.
- **Sugestão pelo lugar:** quando não é escolhido, o estilo vem do nome:
  - palácio, tribunal, Cidade Superior, residência → feudal;
  - mercado, feira, bar, pátio, galeria → retrô;
  - porto, clínica, arquivo, Ruas Escavadas → futurista.
- **Onde mais vale:** o 🎬 Preparar a sessão e os mapas intermediários de rua (v126) também usam o estilo sugerido.

## 🎁 Mapas recheados com itens e bilhetes
**🕸️ Mapa geral → 🎁 Rechear mapas.** Em cada mapa de cenário ainda não recheado:
- **Armário/baú:** usa um que já exista ou coloca um **Armário de metal / Baú brasonado** no estilo do lugar, às vezes **trancado**.
- **Conteúdo:** guarda 1 a 3 itens do banco (kits, munição, ração, ferramentas…) e um **bilhete com uma pista tirada do próprio cenário** (eventos, segredos, objetivo).
  - O título combina com o lugar: "Pergaminho selado — Por ordem da Casa…", "Registro de dados [REGISTRO RECUPERADO]…" ou "Bilhete amassado".
- **No chão:** solta um recado ou um item.
- **Segurança:** nada é apagado e cada mapa é recheado uma vez só. Revise os bilhetes no balão do armário (✕ tira, ＋ acrescenta) antes de mostrar aos jogadores.
- **Mapas nunca abertos** são pulados e listados ("abra o mapa uma vez").

## Técnico
- **Arquivos:**
  - `js/mesa-arte-objetos.js`: 19 desenhos novos e o `PACOTE_NOVO` com `estiloV129`;
  - `js/mesa-arte-ui.js`: pacote automático;
  - `js/mesa-gerador-mapas.js`: `ESTILOS`, `sugerirEstilo` e `gerarMapa({estilo})`;
  - `js/mesa-mapas-ui.js`: campo Estilo;
  - `js/mesa-recheio.js` (novo);
  - `js/mesa-objetos.js`: reconhece braseiro e neon como luz.
- **Versão:** `app.js?v=46.142-v129-mesa`.

## Validação
- **Navegador de teste:**
  - os 19 móveis entraram no banco com imagem;
  - o interior gerado nos três estilos mudou cores e móveis (trono, armaduras, console holográfico, rádios, luminária atômica…);
  - "Rechear mapas" encheu a Residência de Ilü-Mus-Ki (Baú brasonado + "Pergaminho selado") e a Última Bateria (Armário de metal + "Bilhete amassado"), cada um com um recado no chão;
  - atuando como Qozae, o armário abriu e o bilhete foi lido;
  - os testes das v125 e v126 continuam passando.
- `node --test`: 374 de 406. Só falham os mesmos 32 antigos.

## Deploy
```
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```
