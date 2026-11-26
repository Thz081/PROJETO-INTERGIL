# Momentos do Intergil com a AGR TV

## Proposta

Transformar [Momentos](http://localhost:4176/momentos) no acervo oficial da cobertura do Intergil. A AGR TV usa o portal da Monitoria para publicar fotos, álbuns e vídeos. A Gestão usa o mesmo editor dentro do próprio painel. O público pode voltar depois da competição, procurar a própria turma e abrir um registro por link direto. A cobertura tem crédito para a AGR TV e link para [@agr.tv_](https://www.instagram.com/agr.tv_/).

## O que existe hoje

- `frontend/src/pages/Momentos/` tem uma grade pública e um visor com tela cheia. Cada card de vídeo local carrega metadados do arquivo. A página recebe toda a coleção de uma vez.
- `frontend/src/pages/AdminMomentos/` envia um arquivo por registro, mostra o progresso e permite apagar. `backend/src/models/momento.model.js` guarda título, URL, tipo e ordem. A API pública lê os mesmos registros.
- `backend/src/middleware/upload.middleware.js` aceita MP4 e WebM e aplica 100 MiB por arquivo de Momentos. `frontend/nginx.conf` tem limite de 105 MiB para o corpo da requisição. A lista atual não inclui MOV nem HEIC. O volume Docker `arquivos` guarda uploads locais.
- O portal da Monitoria já valida a senha do aluno vinculado ou o hash próprio do monitor externo. A área atual só oferece horários, editais e chaveamentos, com escopo determinado pelas modalidades atribuídas.
- O documento `Edital Intergil - 2026.docx` lista as 12 turmas, mas deixa quatro linhas vazias na seção dos trios e subtemas. Um parágrafo anterior ainda fala em duas salas. A prévia também não tem um PDF do edital geral publicado. Usar a estrutura de trios solicitada e receber a lista final antes de associar os temas às turmas.

## Página pública

Preservar a marca Armoriar e reaproveitar a tinta, o papel e o laranja de `DESIGN.md`. Usar a arte Armorial no título, Young Serif nos títulos dinâmicos e Poppins em filtros, datas e legendas. A imagem principal é uma foto ou capa escolhida pela AGR TV. Uma faixa horizontal de cartazes dá acesso aos lances curtos no celular e por teclado. O destaque só ocupa espaço quando existe uma publicação escolhida.

```text
Momentos do Intergil                         Cobertura da AGR TV ↗
[ Foto ou capa escolhida pela equipe                 Ver momento ]

Recentes       Modalidades       Danças       Selecionar turma

Lances
[ Ponto decisivo ]  [ Defesa na final ]  [ Bastidores do jogo ]

Publicações recentes
[ Álbum · Vôlei ]  [ Vídeo · Dança geral ]  [ Álbum · Abertura ]
```

- **Modalidades.** Reaproveitar o catálogo e suas categorias, com vínculo por modalidade e formato quando fizer sentido. A publicação pode indicar duas turmas de um confronto, fase opcional e legenda. Um link no detalhe da modalidade abre seus Momentos quando houver cobertura. A mesma publicação pode aparecer em Recentes, em uma modalidade e no filtro da turma.
- **Danças.** Mostrar **Mascotes**, com álbum ou vídeo associado a uma turma, e **Dança geral**, com coleção por trio. Cada trio tem três turmas cadastradas por ID e o título oficial do tema. Buscar pelo filtro de qualquer uma das três turmas encontra a apresentação. Os nomes citados na conversa ajudam a conferir a lista final. O cadastro não deduz grupos nem combinações de temas.
- **Fotos e vídeos.** Cada publicação tem URL própria, título, legenda opcional, data da cobertura, capa e crédito. Álbum recebe várias fotos e permite avançar com toque, setas ou teclado. Exibir o vídeo na proporção original com controles, tela cheia e retorno ao filtro e à posição da lista. Dar opção de copiar o link do registro.
- **Lances.** Adicionar um formato editorial para clipes curtos, com duração proposta de até 90 segundos. Mostrar um vídeo por vez, com gesto vertical e botões de anterior e próximo. Começar a reprodução quando a pessoa escolhe o clipe, pausar ao sair e respeitar a preferência por movimento reduzido. Uma dança completa e um vídeo mais longo continuam no mesmo acervo. Temas culturais podem aparecer como título da apresentação e contexto da legenda.
- **Primeira abertura.** Usar capas responsivas, carregamento tardio fora da tela e `Carregar mais` com cursor. A lista não requisita arquivos ou manifestos de vídeo. Manter dimensões reservadas nas capas e estados de espera, vazio, erro e nova tentativa sem perder o filtro.

## Portal e publicação

| Perfil | Acesso a Momentos | Outras permissões |
| --- | --- | --- |
| Visitante | Vê e compartilha conteúdo publicado | Galeria pública sem login |
| Monitor de modalidade | Vê a galeria pública | Mantém horários e documentos dentro do escopo atual |
| AGR TV | Cria rascunho, carrega, edita, publica conteúdo liberado pela escola e retira publicações da cobertura | Só recebe acesso a Momentos, salvo atribuições de monitoria já existentes |
| Gestão | Usa o mesmo editor, organiza destaques e trios e pode retirar um registro | Mantém as demais funções da Gestão |

- Usar a matrícula de cada integrante que já é aluno com a senha existente. Para integrante externo, criar um usuário nominal com hash e credencial entregue em privado. O campo vira **Matrícula ou usuário**. Ao entrar, uma conta exclusiva da AGR TV vai direto a Momentos. Um integrante que também é monitor conserva as duas áreas. Evitar conta coletiva para permitir revogação individual e identificar quem publicou.
- O servidor consulta a atribuição vigente para toda operação editorial, inclusive abrir prévia, iniciar upload, publicar e retirar. A atribuição AGR TV é independente dos IDs das modalidades de monitoria. Usar ID e papel do autor no histórico. Nomes de integrantes e matrículas ficam fora da API pública.
- Um único editor recebe o modo Gestão ou AGR TV a partir das permissões. Tela inicial do painel com **Nova publicação**, busca e filtros por estado ou assunto. No formulário, escolher **Modalidade**, **Dança de mascote**, **Dança geral** ou **Evento**. Mostrar os vínculos correspondentes antes de escolher a mídia. Reaproveitar `PainelEquipe` e `ArquivoCampo`.
- O estado editorial da publicação é **Rascunho**, **Publicado** ou **Retirado**. Cada arquivo tem estado próprio de **Enviando**, **Processando**, **Pronto** ou **Falhou**. Assim, terminar um upload nunca publica o rascunho por acidente. Visualizar, reordenar e trocar mídias, mostrar progresso individual, continuar após queda de rede e permitir tentar novamente ou cancelar.
- A escola define quais registros podem ser públicos e quem atende pedidos de retirada. O painel oferece retirada do ar e mantém referência de auditoria. Antes da publicação, mídia e miniaturas ficam privadas. Depois da retirada, API e novas URLs de acesso param de entregar o material. Tokens já emitidos vencem em prazo curto, com revogação ou expurgo quando o provedor permitir. Remover GPS e outros metadados desnecessários dos arquivos públicos. [Orientação da ANPD sobre crianças e adolescentes](https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-divulga-enunciado-sobre-o-tratamento-de-dados-pessoais-de-criancas-e-adolescentes)

## Envio de iPhone e entrega de vídeo

A versão implementada usa os serviços do próprio Intergil. A API recebe trechos de até **4 MiB**, um de cada vez, e grava em volume privado. O painel pode reenviar o mesmo arquivo para retomar do último trecho. Um processo separado consome uma fila de até seis arquivos, converte um item por vez e remove o original do servidor ao terminar. Os membros da AGR TV conservam os originais para o arquivo da escola.

- **Vídeo.** Até **480 MiB e 15 min** por arquivo. MP4, MOV, M4V e WebM passam pelo FFmpeg e saem em MP4 H.264 com áudio AAC, até 720 pixels no lado maior e 30 quadros por segundo. A taxa de saída fica até aproximadamente 1,18 Mbit/s somando o teto do vídeo e o áudio. O modo de início rápido e a leitura por intervalos dispensam o download integral antes de reproduzir. Um Lance aceita até 90 s para publicar. [FFmpeg](https://ffmpeg.org/ffmpeg-formats.html) · [Formatos do iPhone](https://support.apple.com/pt-br/116944)
- **Fotos.** Até **25 MiB por foto e 12 por álbum**. JPEG, PNG, WebP e HEIC/HEIF são convertidos em WebP, com capa menor e remoção de metadados. A grade requisita capas e o visor carrega somente a foto aberta.
- **CPU e memória.** O processador tem limite de **0,75 CPU e 768 MiB**, usa uma tarefa e uma linha de processamento FFmpeg por vez. A API que atende ranking, horários e inscrições fica em outro contêiner. A conversão de gravações longas pode demorar, especialmente numa VPS com poucos núcleos. [Limites de serviço do Compose](https://docs.docker.com/reference/compose-file/services/)
- **Armazenamento.** O acervo reserva por padrão até 5 GiB para originais na fila e mídias prontas, além de exigir reserva livre de 1,5 GiB no sistema de arquivos. Os limites rejeitam novos uploads quando falta espaço. Rascunhos interrompidos expiram em aproximadamente 24 h. Arquivos parciais e processados ficam em volume próprio, separado dos PDFs e dos logos.
- **Rede.** O Nginx entrega a mídia autorizada usando o arquivo no volume. Limita o vídeo a 12 transferências simultâneas e 224 KiB/s por transferência após o primeiro bloco. O teto nominal de vídeo sustentado fica em cerca de 22 Mbit/s, além de fotos, uploads, respostas do site e picos do primeiro bloco. Ajustar para baixo conforme a banda real da VPS. A lista pública faz zero requisições de vídeo até a pessoa apertar play. Acesso extra ao vídeo pode aguardar ou receber 429 enquanto o restante do site segue disponível. [Nginx](https://nginx.org/en/docs/http/ngx_http_core_module.html#limit_rate)
- **Privacidade.** A API autoriza a mídia publicada e emite links de prévia de dez minutos para rascunhos. O diretório do Nginx é interno. A retirada bloqueia novas requisições públicas para arquivos novos. Vídeos já abertos ou já armazenados no navegador podem permanecer disponíveis naquela sessão. Os itens antigos mantêm URLs públicas preexistentes e devem ser migrados se precisarem de retirada do arquivo em si.

A transmissão é progressiva em uma qualidade, com pausa, busca por intervalos e reconexão do navegador. A VPS e a internet do visitante ainda definem o desempenho. A capa chega primeiro e só um vídeo toca por vez. O objetivo da primeira rodada é medir a experiência com o navegador do celular e provar a conversão com originais representativos.

## Dados, compatibilidade e entrega

Ampliar a coleção existente de Momentos para guardar assunto, vínculos, lista de mídias, capa, autor e estado editorial. Reter `_id`, ordenação e endereço dos itens antigos, com adaptação para o formato novo e validação para referências removidas. Tratar registros legados como já publicados e manter os arquivos no volume existente. Novos originais e rascunhos usam armazenamento privado desde o início. Um registro de dança geral aponta para a coleção de trios da edição. Uma edição de tema ou legenda não muda o link compartilhável.

Manter os dois serviços Docker e a publicação no GHCR. O Compose sobe o processador usando a mesma imagem da API com outro comando. O volume de Momentos é gravável pela API e pelo processador e montado como leitura no Nginx. O pacote de VPS deve levar o Compose atualizado além da nova tag. Antes de atualizar, preservar o volume de arquivos e testar as rotas antigas com dados de exemplo. O teste de recuperação inclui reiniciar os serviços enquanto um vídeo está processando. Manter o volume de Momentos e o Atlas em backup para o acervo sobreviver a uma atualização. Entregar à escola os originais e manter cópia das mídias publicadas e dos registros.

O trabalho pode começar pela prova técnica e pelo login com contas sintéticas. A operação real depende da lista de integrantes, da relação final de trios e temas e da confirmação de disco, memória, banda e proxy com Silvio. Os marcos e critérios de aceite estão no [checklist de implementação](todo.md).
