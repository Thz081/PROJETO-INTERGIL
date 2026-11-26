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
| `--arm-display` | Young Serif | Títulos secundários e títulos dinâmicos sem arte |
| `--arm-text` | Poppins | Formulários, navegação, rótulos e ações |
| `--arm-margem` | `clamp(16px,5vw,68px)` | Margens públicas fluidas |

O arquivo `frontend/public/fonts/armoriar.css` declara as fontes locais e `frontend/public/fonts/` contém as licenças. Tacyo escolheu Young Serif para títulos após a revisão lado a lado com Press Start 2P. Poppins atende a navegação, os rótulos, o texto e os controles. O letreiro e os títulos principais usam a Tipografia Armorial de 2000 em WebP transparente. As artes têm texto alternativo e dimensões reservadas. Títulos de modalidades personalizadas continuam como texto. A incorporação da fonte como texto web depende de autorização e de cobertura de português. [Referência do arquivo](https://baralhoarmorial.wordpress.com/2011/02/01/tipografia-armorial/) · [Especificação de incorporação](https://learn.microsoft.com/en-us/typography/opentype/spec/os2)

## Ativos e composição

- O cabeçalho usa uma assinatura horizontal transparente. A home exibe o cartaz inteiro.
- As capas quadradas continuam em `public/images/gravuras/`. Os banners 16:9 ficam em `public/images/gravuras/banners/`. Um banner publicado pelo painel tem prioridade sobre o padrão.
- A prova tem um banner de Futsal criado para essa modalidade e composições preliminares com as demais gravuras. O acervo de 2025 continua disponível como referência de composição e para a revisão posterior.
- O carrossel mostra um trecho do card seguinte no celular, setas em todas as larguras e navegação pelo gesto nativo. O avanço automático dispõe de botão para pausar, para durante a interação e inicia desligado com preferência por movimento reduzido. As artes reservam espaço nominal para evitar deslocamento durante o carregamento.

## Gestão e Monitoria

O componente `PainelEquipe` usa a marca horizontal e as fontes públicas com superfícies próprias de trabalho. O menu lateral vira uma navegação recolhível em telas estreitas. O botão mantém o rótulo e a indicação de menu aberto. Tabelas largas rolam dentro da região nomeada. Campos de arquivo compartilham o estilo, as instruções de formato e a mensagem de validação.

Em Momentos, a arte do título e o crédito da AGR TV abrem a galeria. A tinta e o papel seguem a identidade da edição, com laranja na aba ativa e turquesa nos links. As capas usam quadros de proporção fixa na lista. O visor mostra a proporção original da foto ou do vídeo. Gestão e AGR TV usam o mesmo editor em duas colunas no desktop e uma no celular.

Os brasões identificam os perfis de turma. O trilho horizontal cabe no celular e vira uma grade no desktop. Os álbuns agrupam formatos sob cada modalidade. Nos Lances, a mídia ocupa o quadro central e as turmas creditadas aparecem abaixo do vídeo, com brasões que abrem seus perfis.
