# Planejamento de Tacyo e Erick · Intergil 2026

**Tacyo assume design, imagens e interface pública com GPT e ImageGen. Erick assume regras, dados, Gestão, Monitoria e VPS com Claude Code.** As duas frentes podem trabalhar em paralelo a partir da versão atual de `develop`. O contexto de produto está em [context.md](context.md).

## 1. Branches e fronteiras

1. Partir da [develop](https://github.com/Thz081/PROJETO-INTERGIL/tree/develop). O snapshot de código foi publicado em `4910884`.
2. Tacyo abre `feat/armoriar-visual`. Erick abre `feat/regras-gestao-2026`. Cada PR tem `develop` como base.
3. Tacyo edita telas públicas, estilos públicos e de login, componentes de navegação e artes públicas. Erick edita o catálogo e as regras do backend, os painéis e a infraestrutura. A rodada de Tacyo já integra as mudanças de interface de inscrição e perfil e a retirada da representação entre turmas. Qualquer ajuste posterior nesses arquivos parte da versão integrada em `develop`.
4. Integrar o PR de regras e painéis em `develop` e validar o conjunto com a entrega visual já integrada. Só então Tacyo e Erick decidem o merge posterior na `main`. Fazer o aceite e preparar a VPS a partir do mesmo SHA testado.

## 2. Frente de Tacyo · visual, imagens e navegação pública

### A. Entregue nesta rodada

- **Home e carrossel.** Em `frontend/src/pages/Home/` e `frontend/src/components/ModalidadesCarousel/`, recuperar a composição de 2025. Trazer setas, swipe e cards clicáveis usando a API de 2026. Mostrar a categoria e oferecer um filtro de categoria no próprio carrossel. Em celular, caber um card inteiro com indicação do próximo. Manter navegação por teclado e foco visível. O avanço automático roda a cada 5 segundos, volta ao início, tem controle de pausa e começa desligado quando a pessoa prefere movimento reduzido.
- **Detalhe do Futsal.** Em `frontend/src/pages/ModalidadeDetalhe/`, recuperar a área panorâmica e a ida para inscrição, edital e chaveamento. Usar `imgDetalhe` para o banner e separar visualmente a categoria dos formatos de participação. Conferir o percurso card → banner → edital.
- **Portal do aluno.** Criar a prova de um formulário com contraste, campos alinhados e links de equipe separados. Comparar as três telas com o mesmo conteúdo a 390 e 1280 px antes de escolher a tipografia.

### B. Identidade aprovada e revisão restante

- **Fontes.** A primeira prova aprovou **Young Serif + Poppins**. Tacyo pediu o **Alfabeto Armorial** como direção final. O novo letreiro ARMORIAR usa a tipografia de 2000 em um WebP transparente no cabeçalho e na abertura. “INTERGIL 2026” é a legenda provisória. O TTF encontrado tem incorporação restrita. Solicitar a versão web aos autores ou pedir ao setor de direitos da Nova Fronteira que indique o responsável, informando o uso cultural escolar, o domínio e o prazo. Testar Vôlei, Inscrição, Gestão, 1º e 5×5, nomes compridos e larguras estreitas antes de trocar os títulos. [Alfabeto original no CASCA](https://casca-archive.org/pt-br/items/show/9266) · [Pesquisa de Luciano Cardinali](https://datjournal.anhembi.br/dat/article/view/20) · [Canal de direitos da Nova Fronteira](https://www.grupoediouro.com/direitos-autorais)
- **Paleta aplicada.** Azul-tinta `#161B2D`, papel `#F5E7C7`, laranja `#FF7A18`, turquesa `#22C9CF` e vinho `#811F35`. Conferir contraste e manter a paleta aprovada da Gestão. Concentrar a animação no carrossel e usar a ETE Gamificada como referência para transições.
- **Marca e imagens.** Em `frontend/src/components/Header/`, `Footer/` e `frontend/public/images/marca/`, preparar um logotipo horizontal transparente para a navegação. Usar o cartaz original inteiro na home. Preservar as capas existentes e criar 27 banners horizontais WebP de proporção 16:9 em `frontend/public/images/gravuras/banners/<slug>.webp`. Conferir cada imagem na largura real do detalhe. Salvar a imagem fornecida de Alatares em `frontend/public/images/historia/alatares.webp` e passar o caminho ao Erick.
- **Três portais.** Tacyo é dono de `frontend/src/pages/Login/`, `LoginAdmin/` e `LoginMonitor/`. Compartilhar layout e campo de senha entre os três. Preservar primeiro acesso, endpoints, rotas de sucesso e permissões. Testar mostrar senha, erros, foco, envio, teclado virtual e links para os outros portais.
- **Páginas públicas.** Tacyo é dono de `Horarios/`, `Historia/`, `Momentos/` e, se houver ajuste visual, `Ranking/` e `MeuPerfil/`. Preservar agenda, download da planilha, histórico, ranking e reprodução em tela cheia. Usar CSS escopado na navegação e nos portais. Estilos exclusivos dos painéis ficam com Erick.
- **Inscrição e perfil.** A inscrição recebeu agrupamento de categorias, cartões, resumo e botão de confirmação. O perfil ganhou estados de carregamento, erro, vazio e confirmado, além de cancelamento sem recarregar. O Instagram do Hall ganhou espaço próprio no card. A inscrição entre turmas saiu do formulário, da API, do WebSocket e da exportação.
- **Acabamento pendente.** Avaliar os 26 banners compostos em comparação com os de 2025, escolher a legenda definitiva, obter autorização e versão web da fonte Armorial e definir trilha autorizada. Conferir Gestão e Monitoria no aparelho ou acesso do Tacyo e registrar eventuais problemas com capturas.
- **Referência de design.** Tacyo mantém a documentação do visual e das interações públicas em `DESIGN.md` e `UX-CONTRACT.md`. Pode usar as habilidades de design para validar contraste, foco, tipografia e movimento. Os estandartes de apresentações são opcionais após o aceite prioritário.

## 3. Frente de Erick · código, regras, painéis e VPS

### A. Regras e dados da edição

- **Catálogo.** Em `backend/src/edicao/catalogo.js`, `regras.js`, `iniciar.js` e nos controllers e schemas correspondentes, usar as onze categorias de [context.md](context.md), com ordem estável no catálogo público e na ficha de inscrição. O endpoint de modalidades continua servindo o carrossel e o detalhe. A Gestão persiste o campo de categoria em criação e edição.
- **FIFA e Free Fire.** FIFA X1 e X2 podem coexistir e compartilham um grupo de contagem. A ficha aplica duas vagas no X1 e duas para a dupla no X2 por sala. Manter o X1 do Free Fire em 1 por sala e validar no servidor a disputa simultânea pela vaga. Manter Basquete, RPG, Corrida, Kata, os limites por ano e o contador exclusivo da turma ao vivo.
- **Atualização do Mongo.** Aplicar os ajustes também em bancos inicializados. Uma segunda execução deve produzir o mesmo estado. Preservar IDs, códigos de seleção, horários, editais, uploads customizados e inscrições. Alterar um banner existente só se estiver ausente ou corresponder à capa padrão. Se a quota nova ficar abaixo de inscrições já aceitas, preservar esses registros e apontar a divergência para a organização.
- **Alatares.** Erick é dono de `backend/src/edicao/historico.json` e da atualização do banco. Inserir Alatares como campeã geral de 2025 quando o ano estiver ausente, tanto em banco novo quanto existente. Se 2025 já existir, preservar o cadastro e sinalizar apenas se houver divergência. A imagem vem da frente de Tacyo.
- **Acessos.** Preservar a separação entre aluno, Gestão e Monitoria. Para a vistoria, usar os acessos locais existentes ou provisionar as contas autorizadas pelo fluxo normal com bcrypt. Credenciais e dados pessoais ficam fora dos Markdown, commits e anexos de entrega.

### B. Gestão, Monitoria e inscrição

- **Modalidades na Gestão.** Erick é dono de `frontend/src/pages/AdminModalidades/`. Agrupar por categoria, apresentar categorias de participação com rótulos claros, editar quotas e mostrar prévias próprias de capa e banner. Substituir o rótulo genérico “Subs” e o campo por vírgulas por entradas estruturadas quando aplicável. Manter códigos das escolhas existentes e proteger exclusões que apagariam a referência de uma inscrição.
- **Upload comum nos painéis.** Reutilizar um campo de arquivo com botão visível, nome, troca, remoção, indicação de formatos e feedback. Aplicar a Modalidades, configurações da marca, salas, Hall, Momentos, planilhas e editais da Monitoria. Em celulares e janelas médias, deixar o scroll horizontal dentro das tabelas. Preservar as cores, fontes e estrutura aprovadas da Gestão.
- **Monitoria.** Testar criação, edição e remoção de horário, PDF por modalidade ou opção e publicação de chaveamento. Corrigir problemas reproduzidos usando os componentes atuais.
- **Arquivos dos painéis.** Erick é dono de `frontend/src/pages/Admin*/`, `MonitorDashboard/`, `MonitorHorarios/`, `MonitorLinks/`, `frontend/src/components/AdminLayout/`, `MonitorLayout/` e do campo compartilhado de upload. Os portais de entrada `LoginAdmin/` e `LoginMonitor/` pertencem a Tacyo.
- **Testes e infraestrutura.** Erick é dono de `backend/test/`, `compose.yaml`, `Dockerfile` de cada serviço, `frontend/nginx.conf` e `VPS.md`.

## 4. Como integrar sem disputa de arquivos

| Contrato | Dono e entrega |
|---|---|
| Catálogo público | Erick mantém `GET /api/modalidades` com `categoria`, `slug`, `imgCarrossel` e `imgDetalhe`. Tacyo usa esses campos na navegação. |
| Banners | Tacyo entrega as imagens com slug ASCII em `/images/gravuras/banners/<slug>.webp`. Erick liga os padrões ao catálogo e à atualização do banco. |
| Logotipo e cartaz | Tacyo produz e renderiza os dois formatos. Se for preciso um segundo campo na configuração persistida, Erick implementa e comunica o nome para Tacyo antes da integração. |
| Hall | Tacyo entrega `/images/historia/alatares.webp` e é dono da apresentação em História. Erick é dono do dado de 2025, da carga e do painel. |
| Inscrição | A interface da rodada já está integrada. Erick ajusta as regras e o catálogo e confere o resultado em `Inscricao/` sobre a base nova. |
| CSS compartilhado | Tacyo mantém os estilos públicos globais e de autenticação. Erick mantém CSS dos painéis. Um ajuste no arquivo de outra frente é feito pelo dono desse arquivo. |

## 5. Aceite conjunto e publicação

### Aceite local

- **Visual.** Conferir a home, o carrossel, o detalhe e os três portais a 360, 390, 860 e 1280 px. Em celular real, navegar com swipe, abrir menu e editar campos com teclado na tela. No desktop, completar o percurso só com teclado. Verificar contraste, foco e movimento reduzido.
- **Inscrições.** Em base isolada, completar primeiro acesso de 1º e 3º ano, validar os limites e conferir permissões. Testar FIFA X1 e X2 juntos como uma modalidade, duas vagas em X2, última vaga do FIFA X1 e do Free Fire X1, UNO, cancelamento e reconexão. Conferir RPG completo, Basquete, Corrida, Kata, isolamento das vagas por turma e exportação sem linhas duplicadas.
- **Admin e mídia.** Testar criação e edição de categoria, prévias de capa e banner, troca de brasão e marca, planilhas, ranking, Hall, PDFs, horários, chaveamentos, foto e MP4 em tela cheia. Confirmar que o Hall exibe Alatares uma vez e que a importação preserva a associação correta dos 503 alunos.
- **Build.** Rodar `npm test --prefix backend`, build do frontend e build do Compose. Subir com Mongo vazio e com uma cópia isolada de um banco já iniciado. Reiniciar para testar persistência. Registrar o SHA e os resultados que passaram ou continuam pendentes.

### Publicação com Silvio

1. Empacotar o SHA aprovado com o [guia de VPS](VPS.md), a configuração de exemplo e as artes públicas. A escola entrega as planilhas por canal privado e importa pela conta de Gestão sobre HTTPS.
2. Usar o Compose com Mongo replica set na rede interna. Gerar `JWT_SECRET` no servidor, manter banco e uploads em volumes e apontar o proxy HTTPS do domínio para a porta local. Conferir upgrade de WebSocket e limite de upload para vídeo.
3. Na instalação nova, criar os acessos de produção, importar os 503 alunos e conferir as 12 turmas. Publicar o PDF definitivo quando a organização enviar. Os uploads de uma instalação em uso seguem com o banco por backup privado se houver migração.
4. Testar pelo domínio a sessão, inscrição, contador de vagas, PDFs e galeria. Registrar versão e backup. Se houver regressão, voltar à imagem anterior e preservar os volumes. Restaurar backup de dados apenas se necessário.

**Próxima etapa.** Erick começa pelos ajustes do catálogo na Gestão a partir da `develop` atual. Na sequência, revisa a migração de banners e Hall, os controles de upload e os painéis. Tacyo revisa a fonte, a trilha e os banners. Depois os dois fazem o aceite conjunto e liberam a VPS. A publicação, com acesso, domínio e proxy disponíveis, está estimada em 20–40 minutos após o aceite.
