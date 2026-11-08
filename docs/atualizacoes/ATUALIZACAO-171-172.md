# v171–v172 — Veículos e naves: decoração, venda e a nave do grupo

## Peças
- Os 32 veículos de `arte-fonte/imagens-ia/veiculos-vista-superior-dimensoes` usam as medidas do nome do arquivo (L = largura, C = comprimento). Exemplos: moto 1,2 × 2,8 m; sedã 2,6 × 5,6 m; cargueiro dourado 15 × 24 m.
- Cada um tem também uma versão "deitada", com o nariz para a direita.
- Peças novas desenhadas para a nave: cozinha, vaso, chuveiro, pia, console de armas e arsenal (`arte-fonte/pecas_nave.py`).

## Nos cenários (v172)
- Os carros e cargueiros antigos de todos os mapas viraram os veículos novos, no tamanho real.
- No espaço-porto, o casco das naves com interior (cargueiro, caça, disco, transporte) virou a nave nova correspondente, deitada e grande o bastante para cobrir o interior.
- Cópias de segurança: `backupCena_<mapa>_v172`.

## Nave do grupo
- No espaço-porto, a nave do grupo agora tem o casco da Nave exploradora azul (13 × 18 m).
- Por dentro:
  - porão com arsenal;
  - banheiro (vaso, chuveiro e pia);
  - cozinha, e mesa com 4 cadeiras;
  - 3 beliches (6 camas);
  - cabine com pilotagem, console de armas e assentos.
- O casco some quando alguém do grupo entra.
- Banco → Naves ganha o modelo "Nave do grupo (exploradora)".
- Na ficha, a nave do grupo tem o Sérgio Leone como "Capitão (dono)" e os outros personagens do grupo como tripulantes.
- O porão é compartilhado: todos os jogadores do grupo podem mexer na carga.
- Se já existia uma nave do grupo na ficha, ela é atualizada, sem duplicar.

## Venda (v171)
- 16 veículos e 16 naves, com preço, porte, medidas e ficha:
  - veículos de 3.800 (scooter) a 52.000 (limusine);
  - naves de 130.000 a 900.000; o interceptador e o caça são de acesso Militar.
- Vendedores:
  - **Concessionária do espaço-porto** e **Estaleiro de Véspera**, no espaço-porto;
  - **Motos e carros da feira**, na Grande Feira.
- Para comprar, clique no vendedor e escolha. O navegador do mestre confere os recursos, desconta e entrega o veículo ou a nave na ficha do personagem.
- Qualquer comerciante pode virar concessionária ou estaleiro: no 🧾, ligue os ramos 🚗 Veículos ou 🚀 Naves.
- Estacionados como decoração: 15 no espaço-porto e 7 na Grande Feira, sem fechar passagem.
