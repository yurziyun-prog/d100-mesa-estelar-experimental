# Orla v0.60 no Mesa Estelar experimental

Atualização de `Orla_v060_para_continuar.zip` sobre a versão v0.59, exclusivamente em `orla/`.

- `orla/index.html` continua reconstituindo a v0.59 em `parts-v059/`, aplica `patch-v060.json` e valida o SHA-256 do HTML final antes de executar.
- Fonte v0.59 SHA-256: `7d137eaf6c953468a7899b95703b21b0733656f7427dc356e9cd5348ad15c755`.
- Arquivo Orla v0.60 SHA-256: `4b81a7fcfee4f3ce9ef014b50ebe3d27322db7ae8b257e87166d7f75aa7b2187`.
- O delta foi gerado por comparação de linhas dos HTMLs autocontidos; a reconstrução foi conferida byte a byte em ambiente local.
- Corrigidos: rotação rígida e limites de móveis, chaminé do piso superior, faces ocultas no 3D, remoção de botão da escada, cores dos painéis, movimento/corrida/fadiga e pausa em combate.
- O repositório principal e as outras abas não foram alterados; os arquivos v0.58 e v0.59 continuam disponíveis.
- Testes informados pelo pacote original: 22 testes unitários e 177 testes de navegador. Esses testes **não foram executados novamente no deploy**. O acesso público do Cloudflare também precisa ser confirmado por navegador.
