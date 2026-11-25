# Planejamento de Tacyo e Erick · Intergil 2026

**Os painéis, as regras e o pacote de VPS avançaram com Tacyo nesta rodada. Erick pode revisar ou assumir tarefas futuras quando necessário.** As duas frentes podem trabalhar em paralelo a partir da versão atual de `develop`. O contexto de produto está em [context.md](context.md).

## 1. Branches e fronteiras

1. Partir da [develop](https://github.com/Thz081/PROJETO-INTERGIL/tree/develop). O snapshot de código foi publicado em `4910884`.
2. Tacyo abre `feat/armoriar-visual`. Erick abre `feat/regras-gestao-2026`. Cada PR tem `develop` como base.
3. Tacyo conduz a rodada atual e valida os dois painéis. Uma revisão de Erick pode partir da versão integrada quando for necessária. A rodada de Tacyo já integra as mudanças de interface de inscrição e perfil e a retirada da representação entre turmas. Qualquer ajuste posterior nesses arquivos parte da versão integrada em `develop`.
4. Integrar o PR de regras e painéis em `develop` e validar o conjunto com a entrega visual já integrada. Só então Tacyo e Erick decidem o merge posterior na `main`. Fazer o aceite e preparar a VPS a partir do mesmo SHA testado.

## 2. Frente de Tacyo · visual, imagens e navegação pública

### A. Entregue nesta rodada

- **Home e carrossel.** Em `frontend/src/pages/Home/` e `frontend/src/components/ModalidadesCarousel/`, recuperar a composição de 2025. Trazer setas, swipe e cards clicáveis usando a API de 2026. Mostrar a categoria e oferecer um filtro de categoria no próprio carrossel. Em celular, caber um card inteiro com indicação do próximo. Manter navegação por teclado e foco visível. O avanço automático roda a cada 5 segundos, volta ao início, tem controle de pausa e começa desligado quando a pessoa prefere movimento reduzido.
- **Detalhe do Futsal.** Em `frontend/src/pages/ModalidadeDetalhe/`, recuperar a área panorâmica e a ida para inscrição, edital e chaveamento. Usar `imgDetalhe` para o banner e separar visualmente a categoria dos formatos de participação. Conferir o percurso card → banner → edital.
- **Portal do aluno.** Criar a prova de um formulário com contraste, campos alinhados e links de equipe separados. Comparar as três telas com o mesmo conteúdo a 390 e 1280 px antes de escolher a tipografia.

### B. Identidade aprovada e revisão restante

- **Fontes.** A primeira prova aprovou **Young Serif + Poppins**. Tacyo pediu o **Alfabeto Armorial** como direção final. O novo letreiro ARMORIAR usa a tipografia de 2000 em um WebP transparente no cabeçalho e na abertura. “INTERGIL 2026” é a legenda provisória. O TTF encontrado tem incorporação restrita. Solicitar a versão web aos autores ou pedir ao setor de direitos da Nova Fronteira que indique o responsável, informando o uso cultural escolar, o domínio e o prazo. Testar Vôlei, Inscrição, Gestão, 1º e 5×5, nomes compridos e larguras estreitas antes de trocar os títulos. [Alfabeto original no CASCA](https://casca-archive.org/pt-br/items/show/9266) · [Pesquisa de Luciano Cardinali](https://datjournal.anhembi.br/dat/article/view/20) · [Canal de direitos da Nova Fronteira](https://www.grupoediouro.com/direitos-autorais)
- **Paleta aplicada.** Azul-tinta `#161B2D`, papel `#F5E7C7`, laranja `#FF7A18`, turquesa `#22C9CF` e vinho `#811F35`. Conferir contraste e manter a paleta aprovada da Gestão. Concentrar a animação no carrossel e usar a ETE Gamificada como referência para transições.
- **Marca e imagens.** Em `frontend/src/components/Header/`, `Footer/` e `frontend/public/images/marca/`, preparar um logotipo horizontal transparente para a navegação. Usar o cartaz original inteiro na home. Preservar as capas existentes e criar 27 banners horizontais WebP de proporção 16:9 em `frontend/public/images/gravuras/banners/<slug>.webp`. Conferir cada imagem na largura real do detalhe. Salvar a imagem fornecida de Alatares em `frontend/public/images/historia/alatares.webp` para a carga do histórico.
- **Três portais.** Tacyo é dono de `frontend/src/pages/Login/`, `LoginAdmin/` e `LoginMonitor/`. Compartilhar layout e campo de senha entre os três. Preservar primeiro acesso, endpoints, rotas de sucesso e permissões. Testar mostrar senha, erros, foco, envio, teclado virtual e links para os outros portais.
- **Páginas públicas.** Tacyo é dono de `Horarios/`, `Historia/`, `Momentos/` e, se houver ajuste visual, `Ranking/` e `MeuPerfil/`. Preservar agenda, download da planilha, histórico, ranking e reprodução em tela cheia. Usar CSS escopado na navegação e nos portais. Estilos exclusivos dos painéis ficam em `PainelEquipe` e nas páginas de operação.
- **Inscrição e perfil.** A inscrição recebeu agrupamento de categorias, cartões, resumo e botão de confirmação. O perfil ganhou estados de carregamento, erro, vazio e confirmado, além de cancelamento sem recarregar. O Instagram do Hall ganhou espaço próprio no card. A inscrição entre turmas saiu do formulário, da API, do WebSocket e da exportação.
- **Acabamento pendente.** Avaliar os 26 banners compostos em comparação com os de 2025, escolher a legenda definitiva, obter autorização e versão web da fonte Armorial e definir trilha autorizada. Conferir Gestão e Monitoria no aparelho ou acesso do Tacyo e registrar eventuais problemas com capturas.
- **Referência de design.** Tacyo mantém a documentação do visual e das interações públicas em `DESIGN.md` e `UX-CONTRACT.md`. Pode usar as habilidades de design para validar contraste, foco, tipografia e movimento. Os estandartes de apresentações são opcionais após o aceite prioritário.

## 3. Gestão, Monitoria e infraestrutura

- **Catálogo e arte.** Gestão edita categoria, formatos, cotas, capa e banner. A atualização dos 27 banners preserva envios personalizados. O Hall inclui Alatares em 2025 quando o ano está vazio.
- **Turmas e inscrições.** Gestão consulta os alunos ativos, filtra por situação e exporta Todos os alunos, Inscritos e Pendentes. As planilhas de origem conferem com as 503 matrículas e 12 turmas da base local.
- **Monitoria.** Cada login recebe até três modalidades. A atribuição vale para consulta de horários e publicação de horários, editais e chaveamentos. O painel permite PDF ou link por modalidade ou formato. A lista definitiva de monitores ainda vem da organização.
- **Acessos.** Aluno, Gestão e Monitoria têm portais próprios. As senhas locais e os dados pessoais ficam fora dos arquivos de publicação.
- **VPS.** O pacote acompanha `compose.yaml`, os Dockerfiles, a configuração do Nginx e [VPS.md](VPS.md). A versão pública depende de domínio, acesso à VPS e aceite no endereço final.

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

**Próxima etapa.** Confirmar a lista de monitores e suas até três modalidades, o PDF oficial, o domínio e o acesso à VPS. O pacote de publicação e o roteiro de aceite estão em [VPS.md](VPS.md). A publicação, com acesso, domínio e proxy disponíveis, está estimada em 20–40 minutos após o aceite.
