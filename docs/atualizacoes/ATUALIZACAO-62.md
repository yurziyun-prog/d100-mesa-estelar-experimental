# Mesa Estelar v62 — transparência de armadura, Oficina 2 e favicon

## Correções

- O histórico de ataques passa a discriminar a penalidade de armadura em vez de agrupá-la como “outros modificadores”. Ex.: base 58, armadura −10% → 52.
- A ficha, em **Outras Características**, agora mostra a penalidade de armadura aplicável aos testes de combate.
- Objetos duplicados na Oficina 2 recebem nova identidade de cena; após **Salvar mapa**, a cópia é publicada aos jogadores em vez de ser confundida com o objeto original.
- Objetos indestrutíveis (sem PV) deixam de aparecer em **Alvo de cenário**.
- A Oficina 2 embutida no Mapa da Mesa ganha campos **Dureza** e **PV** e o botão passa a se chamar **Aplicar**. PV 0/vazio mantém o objeto indestrutível; PV positivo torna-o atacável.
- A seção antiga **Objetos do banco** é ocultada apenas na Oficina 2 embutida no Mapa da Mesa. A Oficina 2 independente permanece intacta.
- O catálogo inferior **Adicionar ao mapa · personagens, objetos e itens** mantém as prévias e, enquanto a Oficina 2 estiver aberta, objetos/itens podem ser marcados por caixas de seleção e enviados para o rascunho com **Adicionar marcados à edição**.
- Favicon reforçado com PNG 32×32, ICO e Apple Touch Icon, além do SVG existente; o script de preparação do Hosting copia todos os formatos.

## Publicação

A v61 foi empacotada acidentalmente dentro de uma pasta `mesa_patch_v61/`. A v62 volta ao formato correto: os arquivos do patch ficam na raiz do ZIP e podem ser extraídos diretamente sobre `mesa-sync`.

Para publicar:

```powershell
npx firebase-tools deploy --only "hosting,firestore:rules" --project d100-mesa-estelar
```

## Validação

- 129 testes automatizados aprovados.
- `scripts/preparar-hosting.cjs` confirmado copiando `favicon.svg`, `favicon.ico`, `favicon-32.png` e `apple-touch-icon.png` para `.firebase-public`.
