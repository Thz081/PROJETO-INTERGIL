# Implementação e aceite · AGR TV

Escopo e decisões no [plano de Momentos](plan.md). Os caminhos indicam pontos de entrada já identificados. Cada etapa entrega um fluxo verificável.

## Verificado na prévia local

- [x] Conversão de HEIC e MOV/HEVC sintéticos, incluindo um MOV de 210 MiB retomado após a interrupção simulada do envio.
- [x] Login e publicação pela AGR TV, retirada pela Gestão, bloqueio de monitores comuns e recusa de rascunho para visitantes.
- [x] Álbuns e vídeos em listas separadas, filtro das três turmas da dança, navegação entre fotos e entre Lances, e tela cheia em Chromium com viewport de 390 px.
- [x] Resposta HTTP 206 no vídeo e recusa da 13ª transferência concorrente pelo Nginx. Ranking e catálogo continuaram disponíveis no Docker local.
- [ ] Rodar o ensaio pelo domínio na VPS com vídeos reais da equipe em Safari no iPhone e Chrome no Android. Medir banda, CPU, RAM e latência de ranking e inscrições.

## 1. Provar o envio e a reprodução com um iPhone

- [ ] Criar uma prova isolada com foto HEIC, vídeo MOV/HEVC vertical, vídeo horizontal e arquivo pesado sem material pessoal. Exercitar conversão de foto com orientação e remoção de GPS.
- [ ] Interromper um upload de mais de 200 MB e retomar sem voltar ao início. Conferir status após fechar e reabrir o painel e vencimento de sessões de upload. Documentar o que ocorre se o Safari suspender a aba e pedir a seleção do arquivo novamente.
- [ ] Reproduzir o mesmo vídeo em Safari do iPhone e Chrome no Android com rede limitada. Conferir áudio, orientação, tela cheia e tempo de carregamento. Anotar codec, tamanho, duração e tempo até a primeira imagem.

**Dependências e arquivos.** Ambiente isolado do processador. Pontos de entrada `backend/src/middleware/upload.middleware.js`, `frontend/nginx.conf`, `compose.yaml` e configuração de mídia a criar.

## 2. Liberar o portal da AGR TV

- [ ] Autorizar a capacidade de Momentos no servidor com consulta à atribuição vigente. Permitir a matrícula de aluno vinculado e o usuário nominal de pessoa externa. Verificar revogação com a sessão existente.
- [ ] Colocar Momentos na Monitoria somente para quem tem essa atribuição. Redirecionar conta exclusiva da AGR TV ao mesmo editor que a Gestão usa.
- [ ] Checar Visitante, Aluno, Monitor de modalidade, AGR TV exclusiva, integrante com as duas atribuições e Gestão. Validar menu, login, tentativa de URL direta e respostas da API. Usar contas sintéticas até a equipe entregar sua lista.

**Arquivos.** `backend/src/models/monitor.model.js`, `backend/src/controllers/auth.controller.js`, `backend/src/middleware/auth.middleware.js`, `backend/src/routes/monitor.routes.js`, `frontend/src/components/PortalAcesso/`, `frontend/src/components/MonitorLayout/`, `frontend/src/context/AuthProvider.jsx` e `frontend/src/App.jsx`.

## 3. Publicar e retirar uma foto

- [ ] Fazer o fluxo completo de rascunho, aprovação editorial conforme a orientação da escola, prévia, publicação e retirada em ambos os painéis. Quando faltar uma informação obrigatória, preservar os campos já preenchidos e apontar o erro.
- [ ] Reusar a mesma tela e o mesmo conjunto de rotas editoriais. Provar que envio repetido não duplica registros, que uma falha permite nova tentativa e que um usuário sem permissão não abre arquivos privados.
- [ ] Conferir uma publicação antiga, uma nova publicada e uma recém-retirada na API, nos links compartilháveis e no cache. Registrar autor e alterações. Validar expiração e tratamento de arquivos órfãos.

**Depende de** 2. **Arquivos.** `backend/src/models/momento.model.js`, `backend/src/routes/admin.routes.js`, `backend/src/controllers/admin.controller.js`, `backend/src/controllers/modalidade.controller.js`, `frontend/src/pages/AdminMomentos/` e `frontend/src/pages/Momentos/`.

## 4. Associar jogos, turmas e danças

- [ ] Publicar um álbum de modalidade com formato e confronto quando aplicável. Conferir que filtros e links do detalhe levam ao mesmo registro. Manter proporção e ordem das fotos no visor.
- [ ] Cadastrar um registro de mascote de uma turma e um registro de dança geral de três turmas. Conferir que a API valida IDs distintos e que cada turma do trio encontra a apresentação pelo filtro público.
- [ ] Exibir cobertura recente por chave estável de ordenação, com filtros na URL, botão de carregar mais e restauração ao voltar do visor. Confirmar que os trios reais entram assim que a lista oficial estiver disponível.

**Depende de** 3. **Arquivos.** `backend/src/models/momento.model.js`, `backend/src/models/modalidade.model.js`, `backend/src/routes/api.routes.js`, `frontend/src/pages/AdminMomentos/`, `frontend/src/pages/Momentos/` e `frontend/src/pages/ModalidadeDetalhe/`.

## 5. Publicar vídeo pesado e ativar Lances

- [ ] Integrar upload retomável, processamento assíncrono com recuperação da fila e player progressivo com requisições por intervalo. Impedir publicação antes de todas as mídias escolhidas estarem prontas. Simular interrupção, cancelamento, sessão expirada, trecho repetido e erro de conversão.
- [ ] Verificar dança completa em tela cheia e Lance vertical de até 90 segundos. Trocar de Lance com toque e teclado e confirmar que o anterior para. O registro é o mesmo que aparece na galeria e em seu link compartilhável.
- [ ] Conferir aceites de desempenho. Na abertura de Momentos não há requisições de segmentos ou manifestos de vídeo. Carregar 12 capas inicialmente com dimensões reservadas. Medir como meta o primeiro quadro em até 4 s após play a 5 Mbps e 100 ms de latência com cache frio. Documentar o resultado e o player de fallback.

**Depende de** 1, 3 e 4. **Arquivos.** Editor e galeria de Momentos, `backend/src/edicao/processar-momentos.js`, `backend/server.js` e configuração Docker/Nginx.

## 6. Ensaiar a publicação com Silvio

- [ ] Executar `npm test` no backend, `npm run build` no frontend e o fluxo inteiro no Compose com dados de teste. Validar preview em 360 e 390 px, desktop e iPhone real. Conferir teclado, leitor de tela, conexões lentas, uploads simultâneos e ausência de bloqueio perceptível ao consultar ranking e inscrições durante o processamento.
- [ ] Testar a publicação depois de reiniciar os serviços, recuperar o volume antigo e ensaiar a volta à versão anterior com a edição do acervo preservada. Guardar métricas de tempo, fila, erros e tráfego de vídeo.
- [ ] Só atualizar o ZIP e a tag do GHCR após os testes. Confirmar com Silvio o ambiente privado e a retenção do acervo. Na VPS, checar monitoria comum, AGR TV, Gestão e público e testar a retirada de um registro sintético antes de usar mídia real.

**Depende de** 1 a 5. **Arquivos.** `.github/workflows/`, `compose.yaml`, `intergil/compose.vps.yaml`, `intergil/.env.example`, `intergil/LEIA-ME.md`, `DESIGN.md` e `UX-CONTRACT.md`.

## Marcos

- [ ] **Prova de acesso.** Uma conta AGR TV no ambiente de teste entra pelo portal certo e publica uma foto. O monitor de modalidade segue com seu escopo original.
- [ ] **Acervo navegável.** Uma modalidade, um álbum, um mascote, uma dança geral e uma publicação antiga podem ser abertos, filtrados e compartilhados.
- [ ] **Pronto para cobertura.** iPhone envia o original e recupera uma interrupção, Android reproduz o resultado, a galeria continua responsiva e o roteiro de publicação na Hostinger foi ensaiado.
