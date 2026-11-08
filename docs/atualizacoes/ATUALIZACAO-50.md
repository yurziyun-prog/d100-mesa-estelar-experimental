# Versão 50 — fogo, extintor e publicação oficial

## Fogo

Ataques que acertam objetos inflamáveis podem incendiá-los. Foram extraídas as regras do mapa anterior: calor 5 para incendiários, 4 para plasma, 3 para laser/lâmina energética e 2 para blaster/phaser; crítico acrescenta 2. O calor deve alcançar 6 menos a inflamabilidade (mínimo 1). Inflamabilidade zero impede ignição.

O fogo causa ceil(inflamabilidade / 2) PV por rodada, de 1 a 3, ignorando dureza como na regra anterior. Pode se espalhar para objetos próximos da mesma camada, conforme inflamabilidade e distância. A proximidade das miniaturas considera suas bordas e o retângulo girado do objeto. Contato até 0,15 m causa 2 PV; entre 0,15 e 0,45 m há 45% de chance de causar 1 PV. O dano entra na saúde por localização, usando o resolvedor de ferimentos existente.

As chamas aparecem nas duas contas. Zero PV conserva restos e libera passagem. Restaurar apaga o fogo e recupera os bloqueios anteriores.

Em combate o fogo avança por rodada completa, não por ação nem por personagem. Fora de combate, a cada 6 segundos, enquanto o mestre está conectado e o mapa está aberto. A mudança de modo preserva o tempo restante do próximo pulso. Não há simulação contínua no servidor nem cobrança acumulada de todos os pulsos durante ausência do mestre/mapa fechado; ao voltar, um pulso vencido é processado e o relógio é retomado. Uma defesa pendente pausa a aplicação do fogo até a resolução do ataque.

## Extintor

Equipe um extintor com carga na ficha. Selecione um objeto em chamas em **Alvo de cenário**: aparece **Apagar fogo**. É preciso estar a até 1,5 m da borda. Cada uso consome uma carga e uma ação durante combate; remove até 100 kg da quantidade a extinguir. Um objeto de 150 kg exige dois usos. O consumo é salvo no inventário junto à alteração do cenário e à ação, sem duplicar cobrança por reprocessamento. Fora de combate consome somente carga. Extintores sem carga ou guardados na mochila não habilitam o botão.

## Tornar oficial

A aba nova é **Mapa da Mesa**; a anterior fica como **Mapa anterior**, para acesso aos dados antigos. Os identificadores internos e documentos compartilhados foram preservados, sem copiar a mesa antiga sobre a atual.

O site usa Firebase Hosting; Firestore guarda os dados, Authentication as contas e Storage as imagens. A configuração mantém o projeto `d100-mesa-estelar`. Não cria banco novo, não precisa importar CSV novamente e não muda as regras de acesso.

O preparo de publicação copia somente `index.html` e os módulos `js/*.js` para `.firebase-public`. CSVs, testes e documentos não são enviados. O Firebase executa esse preparo automaticamente antes da publicação. Arquivos do site pedem revalidação de cache para facilitar atualizações.

## Publicar pelo PowerShell

Abra o PowerShell e execute:

```powershell
Set-Location 'C:\Users\yurzi\Documents\Codex\2026-09-09\referenced-chatgpt-conversation-this-is-an\work\mesa-sync'
npx firebase-tools deploy --only hosting --project d100-mesa-estelar
```

Se solicitar autenticação, execute `npx firebase-tools login`, entre na conta administradora do projeto e repita o deploy. Não é necessário executar `firebase init`, substituir configurações ou publicar regras do Firestore nesta versão.

Ao terminar com `Deploy complete`, abra o Hosting URL informado. Para o site padrão do projeto, o endereço esperado é https://d100-mesa-estelar.web.app (também https://d100-mesa-estelar.firebaseapp.com). A publicação substitui o conteúdo atual desse site padrão, se já houver. O comando não remove o site anterior no GitHub Pages. Depois de validar login, mapa, fichas e imagens na nova URL, compartilhe essa URL com o grupo; o GitHub pode continuar apenas como repositório de código.

Se houver erro de domínio na autenticação, confira no Firebase Console → Authentication → Settings → Authorized domains o domínio exato informado pelo Hosting. As contas continuam sendo as mesmas; pode ser necessário entrar novamente por ser outro endereço. Não apague os dados locais do endereço anterior antes de conferir eventuais alterações ainda não salvas.

Confira com uma conta de mestre e uma de jogador: abrir Mapa da Mesa, ver o mesmo cenário e miniaturas, testar um objeto inflamável, observar uma rodada de fogo, equipar extintor e apagá-lo. Use Ctrl+F5 após publicar. Para reverter apenas uma publicação, use o histórico de versões do Firebase Hosting; isso não reverte alterações feitas nos dados do Firestore.

## Arquivos e schema

Alterados: `index.html`, `js/app.js`, `js/nova-ataques.js`, `js/nova-direta.js`, `js/nova-painel.js`, `js/nova-dano-objetos.js`, `tests/nova-resolucao.test.mjs`.

Novos: `js/nova-fogo.js`, `tests/nova-fogo.test.mjs`, `tests/nova-fogo-browser.cjs`, `firebase.json`, `scripts/preparar-hosting.cjs`, `.gitignore` e este documento.

Estado da instância: `pegandoFogo`, `estadoFogo.clock` (6 segundos/rodada) e `estadoFogo.restanteKg` durante extinção parcial. O inventário usa `usoAtual`, como no mapa anterior. Relógios ausentes são inicializados ao abrir. Não exige migração manual nem novas regras Firestore.

Documentação Firebase: https://firebase.google.com/docs/hosting/quickstart e https://firebase.google.com/docs/hosting/full-config

Preparação local concluída; a publicação ao ambiente online depende da execução do comando acima.
