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
| Select/Listbox | Seletor nativo em ModalidadesCarousel | UX-CONTRACT.md | Filtro de categoria com popup do navegador | Teclado, filtro e largura estreita |
| Form | PortalAcesso e formulário do aluno | UX-CONTRACT.md | Credenciais e etapas de primeiro acesso | Vazio, erro e sucesso |
| Scrollbar | CSS público e trilho de ModalidadesCarousel | DESIGN.md | Rolagem horizontal do carrossel | Toque, teclado e setas |

## Uso e recuperação

- O conteúdo e os rótulos são em pt-BR. O foco é visível e as ações têm nomes acessíveis. Links navegáveis usam links e ações usam botões.
- O carrossel preserva a ordem do catálogo. A categoria reduz a mesma lista e permanece na URL ao voltar do detalhe. Os botões refletem os limites de rolagem. A tela preserva uma área de carregamento e permite tentar novamente após erro.
- O detalhe distingue modalidade ausente de falha na API. Uma falha de imagem usa a moldura padrão. URLs de editais e chaveamentos são exibidas quando cadastradas.
- Campo obrigatório, data inválida e formato inválido mostram mensagem em texto e apontam o foco para o campo. Falha de autenticação preserva as entradas. A senha começa oculta. O usuário pode alternar a exibição, colar e usar preenchimento automático.
- O portal do aluno continua usando matrícula e data de nascimento para o primeiro acesso. Os portais da Gestão e Monitoria continuam com seus próprios modos de autenticação e redirecionamento. Os endpoints e permissões pertencem à frente de backend.
- O carrossel avança a cada cinco segundos enquanto está visível e permite pausar. O toque, o cursor sobre o carrossel e o foco pelo teclado suspendem o avanço. Preferência por movimento reduzido desliga o avanço por padrão e faz os botões rolarem sem animação. A página comporta menus e formulários em telas estreitas.

## Painéis da equipe

- `PainelEquipe` define navegação, menu móvel, foco ao fechar com Escape e saída. `ArquivoCampo` concentra seleção e remoção de anexo, formato, limite e erro. Formulários mostram a resposta do servidor junto à ação.
- Gestão lista alunos ativos por turma e situação de inscrição. O Excel sempre representa a lista completa em três abas, independentemente dos filtros da tela.
- Monitoria carrega até três modalidades atribuídas ao perfil. Horários, editais e chaveamentos seguem o mesmo escopo na interface e na API. O monitor pode publicar PDF ou link por modalidade ou por formato. Cada publicação mostra o link gravado.
- Gestão edita categoria e formatos de participação do catálogo. IDs e posições de opções já usadas sustentam as inscrições. O servidor rejeita exclusões e mudanças de formato que invalidariam fichas gravadas.
