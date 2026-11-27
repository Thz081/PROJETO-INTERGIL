# Comportamento da interface · Intergil 2026

## Donos dos componentes

| Capacidade | Referência |
|---|---|
| Carrossel e filtro | `ModalidadesCarousel` usa lista com links, seletor nativo, rolagem por toque, setas e controle de avanço automático |
| Marca e menu público | `Header` usa um menu com estado expandido e fechamento por Escape |
| Portais | `PortalAcesso` reúne layout, botão, exibição de senha, validação e erro. O portal do aluno mantém as etapas de primeiro acesso. |
| Navegação de detalhe | `ModalidadeDetalhe` usa o banner publicado e volta à seção de modalidades. |
| Gestão e inscrição | Inscrição por categoria e perfil com resumo. Gestão recebe uma linha por aluno inscrito. |

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | Nativo | UX-CONTRACT.md | Categoria no carrossel e seletores do acervo e do editor de Momentos, com popup do navegador | Teclado, filtro e largura estreita |
| Form | PortalAcesso e formulário do aluno | UX-CONTRACT.md | Credenciais e etapas de primeiro acesso | Vazio, erro e sucesso |
| Scrollbar | CSS público e trilho de ModalidadesCarousel | DESIGN.md | Rolagem horizontal do carrossel | Toque, teclado e setas |

## Uso e recuperação

- O conteúdo e os rótulos são em pt-BR. O foco é visível e as ações têm nomes acessíveis. Links navegáveis usam links e ações usam botões.
- O carrossel preserva a ordem do catálogo. A categoria reduz a mesma lista e permanece na URL ao voltar do detalhe. Os botões refletem os limites de rolagem. A tela preserva uma área de carregamento e permite tentar novamente após erro.
- O detalhe distingue modalidade ausente de falha na API. Uma falha de imagem usa a moldura padrão. A seção de edital e chaveamento mostra o estado antes da publicação e o documento geral ou por formato quando cadastrado. PDFs hospedados no site têm ação de baixar e links externos abrem em outra aba.
- O edital geral fica à vista na abertura da home, junto das ações da edição. A área sinaliza a espera enquanto o PDF está pendente e mostra o download assim que a Gestão publica o arquivo na Visão geral.
- Campo obrigatório, data inválida e formato inválido mostram mensagem em texto e apontam o foco para o campo. Falha de autenticação preserva as entradas. A senha começa oculta. O usuário pode alternar a exibição, colar e usar preenchimento automático.
- O portal do aluno continua usando matrícula e data de nascimento para o primeiro acesso. Os portais da Gestão e Monitoria continuam com seus próprios modos de autenticação e redirecionamento. Os endpoints e permissões pertencem à frente de backend.
- O carrossel avança a cada cinco segundos enquanto está visível e permite pausar. O toque, o cursor sobre o carrossel e o foco pelo teclado suspendem o avanço. Preferência por movimento reduzido desliga o avanço por padrão e faz os botões rolarem sem animação. A página comporta menus e formulários em telas estreitas.

## Painéis da equipe

- `PainelEquipe` define navegação, menu móvel, foco ao fechar com Escape e saída. `ArquivoCampo` concentra seleção e remoção de anexo, formato, limite e erro. Formulários mostram a resposta do servidor junto à ação.
- Gestão lista alunos ativos por turma, situação, modalidade e formato. O Excel geral preserva as abas Todos os alunos, Inscritos e Pendentes e acrescenta uma aba por turma. O Excel da seleção aplica os filtros da tela. Ao selecionar uma modalidade, a lista para monitoria tem os inscritos agrupados por turma e separa os formatos em abas quando o filtro está em Todos os formatos.
- Monitoria carrega até três modalidades atribuídas ao perfil. Horários, editais e chaveamentos seguem o mesmo escopo na interface e na API. O monitor pode publicar PDF ou link por modalidade ou por formato. Cada publicação mostra o link gravado.
- Gestão edita categoria e formatos de participação do catálogo. IDs e posições de opções já usadas sustentam as inscrições. O servidor rejeita exclusões e mudanças de formato que invalidariam fichas gravadas.
- Pontuação registra um pódio por competição do catálogo. As três colocações valem 500, 300 e 100 pontos. Uma correção substitui apenas os pontos daquela competição. Os botões de adição e desconto em Salas exigem um motivo que aparece no extrato público da turma.
- Resultados fica na navegação pública, inclusive no menu móvel. Ocultar ranking esconde a classificação e os extratos na interface e na API, mantendo os pódios disponíveis.
- A AGR TV tem acesso editorial independente das atribuições de modalidade. O mesmo editor atende Gestão e AGR TV. Fotos e vídeos têm publicações separadas. Os arquivos em andamento mostram o estado e ficam privados até a publicação. O painel pode retomar o mesmo arquivo do último trecho confirmado.
- Momentos separa Álbuns, Vídeos e Lances. Filtros ficam na URL. A lista pede só capas e o vídeo toca no visor ou no feed vertical de Lances. Fotos e lances podem ser percorridos com toque ou botões.
- Perfis e álbuns públicos vêm do catálogo. Os perfis mostram Álbuns de fotos, Vídeos e Danças. Uma publicação vinculada aparece nos perfis de todas as turmas marcadas. A equipe abre o álbum de fotos de uma combinação pelo atalho do catálogo ou prepara um vídeo para o mesmo grupo. Um álbum no ar pode receber fotos novas e manter as anteriores durante a conversão.
- As fotos do álbum avançam pelo arraste horizontal ou pelas setas. Lances tem uma área de rolagem vertical, controles por botão e teclado, som inicialmente desligado e um único vídeo ativo. A tela cheia preserva o enquadramento e tenta a orientação horizontal quando o aparelho oferece esse controle.

- No ranking, o link de cada sala se limita à célula com o nome. Voltar do extrato restaura a sala consultada.
- No Futmesa, Individual e Dupla podem ser marcados juntos e contam como duas modalidades. As categorias por sexo e as regras combinadas dos demais jogos vêm da ficha da API.
- A Gestão ativa e desativa a manutenção na Visão geral. Alunos e monitores veem a tela de manutenção. O acesso da Gestão permanece disponível.
- A Gestão e a AGR TV podem excluir um rascunho do acervo com confirmação. O botão fica indisponível durante o processamento de um arquivo.
