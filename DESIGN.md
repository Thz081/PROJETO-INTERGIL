# Design · X Intergil Armoriar

## Visão

O site de competição recupera as capas, cards e movimento do Intergil de 2025 dentro da identidade Armoriar de 2026. A moldura de bandeirolas e mandacaru enquadra o cartaz oficial. O carrossel concentra a interação visual e leva aos banners panorâmicos. A Gestão e a Monitoria têm superfícies de trabalho próprias.

## Cor e tipografia

Os tokens públicos têm como fonte `frontend/src/styles/armoriar.css`.

| Token | Valor | Uso |
|---|---|---|
| `--arm-tinta` | `#161b2d` | Fundo público e contraste das ações |
| `--arm-papel` | `#f5e7c7` | Texto principal sobre tinta |
| `--arm-laranja` | `#ff904e` | Botões primários, estado ativo e títulos auxiliares |
| `--arm-turquesa` | `#68dddd` | Links, foco e sinais de navegação |
| `--arm-vinho` | `#813047` | Acento da paleta para a expansão em revisão |
| `--arm-display` | Young Serif | Títulos da prova principal |
| `--arm-text` | Poppins | Formulários, navegação, rótulos e ações |
| `--arm-margem` | `clamp(16px,5vw,68px)` | Margens públicas fluidas |

O arquivo `frontend/public/fonts/armoriar.css` declara as fontes locais e `frontend/public/fonts/` contém as licenças. Tacyo escolheu Young Serif para títulos após a revisão lado a lado com Press Start 2P. Poppins atende a navegação, os rótulos, o texto e os controles.

## Ativos e composição

- O cabeçalho usa uma assinatura horizontal transparente. A home exibe o cartaz inteiro.
- As capas quadradas continuam em `public/images/gravuras/`. Os banners 16:9 ficam em `public/images/gravuras/banners/`. Um banner publicado pelo painel tem prioridade sobre o padrão.
- A prova tem um banner de Futsal criado para essa modalidade e composições preliminares com as demais gravuras. O acervo de 2025 continua disponível como referência de composição e para a revisão posterior.
- O carrossel mostra um trecho do card seguinte no celular, setas em todas as larguras e navegação pelo gesto nativo. As artes reservam espaço nominal para evitar deslocamento durante o carregamento.
