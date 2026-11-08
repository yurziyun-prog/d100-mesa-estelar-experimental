# Mesa Estelar v104 — Biblioteca de imagens

Objetivo: tirar as imagens pesadas de dentro do banco (Firestore) para o site carregar mais rápido e para podermos adicionar muito mais mapas, objetos e miniaturas sem bater no limite de 1 MiB por documento.

## Como usar (mestre)
1. Banco de Dados → **Objetos de Mapa** → abra **🖼️ Biblioteca de imagens**.
2. **🔎 Analisar**: mostra quantas imagens pesadas existem em cada parte do banco (objetos de mapa, companheiros, veículos, naves, NPCs, criaturas, cenários, itens, espécies).
3. **🚀 Baixar backup e otimizar**:
   - baixa no seu computador um arquivo `backup-imagens-mesa-<data>.json` com todas as imagens originais;
   - converte cada imagem para WebP (até 1024 px), envia ao Storage na pasta que o site já usa (`personagens/<seu uid>/biblioteca/…`) e grava no banco só o endereço.
4. **↩️ Restaurar backup** desfaz tudo usando o arquivo baixado.

Pode clicar de novo sempre que adicionar objetos novos: o processo é repetível e só mexe no que ainda estiver pesado.

## CORS (opcional, uma vez só)
As imagens aparecem normalmente em qualquer caso. Só as ferramentas da Oficina que **recortam** ou **removem fundo** de uma imagem já salva precisam que o Storage permita leitura pelo navegador. O botão testa isso sozinho. Se faltar, ele mostra esta linha para colar no Cloud Shell (console.cloud.google.com → ícone `>_`):

```
echo '[{"origin":["*"],"method":["GET"],"maxAgeSeconds":3600}]' > cors.json && gsutil cors set cors.json gs://d100-mesa-estelar.firebasestorage.app
```

## Outras melhorias
- Objetos de mapa são carregados **em paralelo** ao entrar no site (antes era um por vez).
- As três ferramentas de recorte/remover fundo passam a pedir CORS ao carregar imagens remotas, para funcionarem com imagens do Storage.

## Segurança
- Módulo `js/mesa-imagens.js` carregado à parte: se faltar ou falhar, o site segue igual.
- Nada acontece sozinho: só quando o mestre clica.
- Backup baixado antes de qualquer alteração; cada documento só tem o campo da imagem trocado; documentos alterados depois da análise são pulados; nada é apagado do Storage.
- Sem mudança em `firestore.rules`.

## Validação
- Teste no navegador com o site inteiro (Firebase simulado) e os 20 objetos reais do CSV de 26/09: 17 imagens encontradas (2,0 MB dentro do banco) → 17 arquivos WebP somando ~0,4 MB; backup baixado; restauração devolveu as imagens originais.
- `node --test tests/*.test.mjs`: 277 de 310. Falhas = as 31 antigas + testes de cache da v102 e v103 (mudam a cada versão). 4/4 testes novos da v104 passam.

## Deploy
```
npx firebase-tools deploy --only hosting --project d100-mesa-estelar
```
