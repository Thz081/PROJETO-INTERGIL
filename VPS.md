# Intergil 2026 na VPS

A aplicação usa React com JavaScript e Vite, uma API Express e um MongoDB com replica set de um membro. O Nginx entrega o site, os arquivos e o WebSocket pelo mesmo domínio. O Docker Compose persiste o banco e os uploads em volumes nomeados. A aplicação usa o banco `intergil2026`.

## Subir na VPS com GHCR e Atlas

O Silvio recebe `compose.vps.yaml`, `.env.example` e o SHA completo da versão publicado no GitHub Actions. O Compose usa `ghcr.io/thz081/intergil-web` e `ghcr.io/thz081/intergil-api`. As duas imagens têm a mesma tag e foram montadas para `linux/amd64`. Em cada atualização, altere apenas a tag no `.env` e repita os comandos. Para voltar, use o SHA anterior.

1. No Atlas, autorize o IP público de saída da VPS em **Network Access** e crie um usuário da aplicação com acesso de leitura e escrita ao banco `intergil2026`. Copie a string de conexão do próprio Atlas. A API usa `intergil2026`. A coleção antiga permanece na base `test`.
2. Na VPS, execute `umask 077` e `cp .env.example .env` apenas na primeira instalação. No `.env`, preencha `MONGO_URI` com a string do Atlas, `INTERGIL_VERSAO` com o SHA e `JWT_SECRET` com o resultado de `openssl rand -hex 48`. Use um canal privado para a URI. O ZIP de entrega acompanha apenas o modelo de variáveis.
3. Se os pacotes estiverem privados, entre em `ghcr.io` com o GitHub do operador autorizado e um token com `read:packages`, fornecido via `docker login ghcr.io --password-stdin -u USUARIO`. Pacotes públicos admitem download anônimo. [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
4. No proxy HTTPS do Silvio, encaminhe `intergil.etegilrodrigues.com.br` para `127.0.0.1:8086`, incluindo o WebSocket e o limite de upload descritos abaixo.

```sh
docker compose -f compose.vps.yaml pull
docker compose -f compose.vps.yaml up -d --no-build --wait
curl -fsS https://intergil.etegilrodrigues.com.br/api/config
```

O Atlas armazena as contas, as inscrições e o catálogo editável. Os arquivos enviados pelo painel ficam no volume Docker `arquivos`. Uma migração dos envios depende da cópia privada desse volume. As capas, banners, brasões e agenda padrão já vêm na imagem web. [Conexão ao Atlas](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/)

## Subir com Mongo local e build na máquina

Extraia o pacote de implantação em um diretório próprio na VPS com Docker Engine e Compose instalados. A partir desse diretório, crie o segredo da instalação, apenas na primeira vez.

```sh
umask 077
test -f .env || (printf 'JWT_SECRET=' && openssl rand -hex 48) > .env
docker compose up -d --build --wait
curl -fsS http://127.0.0.1:8086/api/config
```

O site escuta em `127.0.0.1:8086`. Para usar outra porta livre, defina `INTERGIL_PORT` no arquivo `.env`. No proxy HTTPS existente do Silva, encaminhe o domínio inteiro para essa porta, incluindo o upgrade WebSocket em `/api/vagas/ao-vivo`. Exemplo para Caddy executado no host, substituindo o domínio pelo real.

```caddyfile
intergil.example.org {
    reverse_proxy 127.0.0.1:8086
}
```

Se o proxy for um contêiner, ligue-o à rede do serviço web e encaminhe para o contêiner web na porta 80. Valide o HTTPS e o contador de vagas pelo domínio público antes de divulgar.

## Acessos e matrículas

Crie os acessos da equipe na VPS. Os comandos mostram a senha gerada uma vez no terminal e preservam um login já existente.

```sh
docker compose exec api node src/edicao/criar-acesso.js gestao gestao
docker compose exec api node src/edicao/criar-acesso.js monitor identificador "Nome do monitor"
```

Em **Gestão → Gerenciar salas → Importar alunos**, selecione juntas as duas planilhas fornecidas pela escola. O painel reconhece abas como `ADM2IN-A` e `TDS3IN-B`. A referência desta entrega é 503 alunos em 12 turmas. Confira a prévia e confirme a importação. A matrícula identifica o estudante. Coincidências de nome com mudança de matrícula também exigem nascimento correspondente e aparecem na prévia. A opção de lista completa inativa cadastros ausentes após conferência de todas as turmas. As inscrições e os pontos começam próprios da edição. As turmas e os 12 brasões são instalados na primeira inicialização.

O pacote de implantação contém código, imagens públicas e programação. As planilhas nominais, a senha local e o banco local ficam na máquina de trabalho. Para transferir uma edição já em uso com inscrições ou uploads, migre também os volumes por um canal privado e confira a quantidade de inscrições na origem e no destino.

## Configuração da competição

O prazo termina no início de 2 de dezembro de 2026, no horário de Pernambuco. X1 e X2 de FIFA contam juntos. Cada turma tem duas vagas no X1 e duas para montar a dupla no X2.

O PDF definitivo pode ser publicado em **Gestão → Visão geral → Atualizar edital geral**. A planilha de horários original acompanha a página Horários. Alterações feitas pela monitoria atualizam a agenda do site. A planilha para download é a versão de origem.

## Atualizações e cópia de segurança

Antes de uma atualização em produção, guarde cópias privadas do banco e dos arquivos enviados. Use nomes de arquivo novos para cada cópia.

```sh
umask 077
stamp=$(date +%Y%m%d-%H%M%S)
docker compose exec -T mongo mongodump --db intergil2026 --gzip --archive > "banco-$stamp.archive.gz"
docker compose exec -T api tar -C /app -czf - uploads > "uploads-$stamp.tar.gz"
docker compose up -d --build --wait
docker compose ps
```

No teste de aceite, confira o login de gestão, as 12 turmas, o mapa das abas e a página de horários. Para testar vagas em homologação, abra dois alunos da mesma sala em sessões diferentes, acompanhe a baixa após uma inscrição e a devolução após o cancelamento. O HTTP e o WebSocket devem usar o mesmo domínio público.

## Primeiro acesso dos alunos

No Portal do aluno, selecione **Primeiro acesso**, informe matrícula e nascimento e depois cadastre e-mail e senha com pelo menos seis caracteres. Nos acessos seguintes, use e-mail ou matrícula e a senha escolhida. A API usa bcrypt com custo 12. A preparação da edição reinicia as credenciais de aluno uma única vez. Atualizar o contêiner ou reimportar a planilha preserva as senhas já cadastradas. Gestão e monitoria têm acessos próprios.

## O que entregar ao Silvio

Envie o pacote da aplicação e o domínio que deverá apontar para a VPS. Gere um JWT_SECRET próprio no servidor. O Compose já configura a conexão com o Mongo do projeto. A pessoa da escola com acesso de gestão pode importar as duas planilhas pelo navegador com HTTPS. Assim o pacote de código pode circular separado dos dados dos alunos.

As artes padrão e os brasões ficam em `frontend/public/images`. A gestão pode alterar o título, a logo da capa e do cabeçalho, os brasões e as imagens das modalidades. A imagem enviada recebe um nome ASCII com identificador único e o banco passa a apontar para ela. O volume `arquivos` guarda editais, logos e mídias legadas. O volume `momentos` guarda envios e mídias novas do acervo. Para mover a instalação, transfira os dois volumes junto com o banco.

O acervo da AGR TV aceita fotos de até 25 MiB e vídeos de até 480 MiB e 15 minutos. Cada requisição de upload leva no máximo 4 MiB. Confira o envio pelo domínio e preserve o upgrade de WebSocket do site.

## Atribuir modalidades aos monitores

Para alunos da escola, a Monitoria usa a matrícula e a mesma senha do Portal do Aluno. Prepare um JSON privado com uma lista de objetos. Cada objeto tem `matricula`, `nome` completo, `turma` e `modalidades`, uma lista de até três objetos com `slug` e, se a atribuição for específica, `formatos` com os nomes do catálogo. O comando valida todos os vínculos antes de aplicar. O monitor só vê e altera horários, editais e chaveamentos da sua atribuição.

```sh
docker compose -f compose.vps.yaml exec -T api node src/edicao/vincular-monitores.js < monitores-privado.json
docker compose -f compose.vps.yaml exec -T api node src/edicao/vincular-monitores.js --aplicar < monitores-privado.json
```

Para monitores externos à base de alunos, crie um acesso próprio e atribua as modalidades pelo slug. O primeiro comando retorna a senha gerada ao operador. O segundo substitui a lista de atribuições. Os exemplos seguintes usam o Compose local.

```sh
docker compose exec api node src/edicao/criar-acesso.js monitor MATRICULA "Nome do monitor"
docker compose exec api node src/edicao/atribuir-monitor.js MATRICULA mobile-legends uno
```

Quando já houver uma senha definida para uma nova conta, o comando aceita a senha por entrada padrão. Este exemplo usa Bash e mantém a senha fora dos argumentos e do histórico de comandos.

```bash
read -rs -p 'Senha da nova conta de Gestão: ' senha_intergil
printf '\n'
printf '%s\n' "$senha_intergil" | docker compose exec -T api node src/edicao/criar-acesso.js gestao USUARIO --senha-stdin
unset senha_intergil
```

## Aceite para a equipe

- Em **Gestão → Inscrições**, confira os alunos por turma e o Excel. As abas são **Todos os alunos**, **Inscritos** e **Pendentes**. Os relatórios incluem matrícula e situação da inscrição.
- Em **Gestão → Visão geral**, confira o nome publicado, o cartaz, a marca horizontal e o PDF geral. Em **Modalidades**, confira as categorias, os formatos e os 27 banners. Alatares deve aparecer uma vez em 2025.
- Na **Monitoria**, confira as modalidades atribuídas e o local de um jogo. Em **Editais e chaveamentos**, confira que os dois tipos de arquivo abrem no detalhe público.
- Pelo domínio final, confira HTTPS, acesso móvel e a conexão de vagas ao vivo. Use uma instalação isolada para criar inscrições e mídias de teste.
- Registre o commit publicado e os backups. Para voltar ao código anterior em caso de regressão, reconstrua o último commit aceito na mesma instalação, com o mesmo projeto Compose e volumes. Aplique restauração de dados separadamente se houver motivo para recuperar o último backup.

[Docker Compose up](https://docs.docker.com/reference/cli/docker/compose/up/) · [Volumes do Compose](https://docs.docker.com/reference/compose-file/volumes/) · [Proxy WebSocket do Nginx](https://nginx.org/en/docs/http/websocket.html)

## Momentos da AGR TV

O processador usa a mesma imagem da API, com outro comando. O Compose desta versão inclui o serviço `processador-momentos` e o volume persistente `momentos`. Ao atualizar a partir de uma versão anterior ao acervo, use o novo Compose além da nova tag. Preserve os volumes `arquivos` e `momentos` e o backup do Atlas.

O envio usa trechos de até 4 MiB. A equipe pode selecionar o mesmo arquivo novamente para continuar do trecho confirmado. A publicação só fica disponível após o processamento. O original serve como entrada temporária, por isso a AGR TV deve preservar suas cópias. O acervo usa 5 GiB como teto padrão. Para mudar esse valor, defina `MOMENTOS_ACERVO_MIB` no ambiente antes de recriar a API. O trabalhador usa até 0,75 CPU e 768 MiB de RAM. O Nginx limita a entrega a 12 transferências simultâneas de vídeo. Confirme a memória, o espaço em disco e a banda disponível antes de abrir a cobertura.

A Gestão e a AGR TV usam o mesmo editor. Para vincular um aluno que já tem cadastro, informar o usuário externo ou retirar a permissão de uma conta, execute na VPS:

```sh
docker compose -f compose.vps.yaml exec api node src/edicao/agr-tv.js vincular MATRICULA
read -rs -p 'Senha do integrante: ' SENHA_AGR
printf '\n'
printf '%s\n' "$SENHA_AGR" | docker compose -f compose.vps.yaml exec -T api node src/edicao/agr-tv.js criar usuario-agr 'Nome do integrante'
unset SENHA_AGR
docker compose -f compose.vps.yaml exec api node src/edicao/agr-tv.js retirar USUARIO_OU_MATRICULA
```

Teste pelo domínio um envio acima de 100 MB e confira se o proxy entrega vídeo com resposta HTTP 206 para uma requisição de intervalo. Monitore `docker stats`, o espaço do volume e os logs do processador durante um ensaio com os celulares da AGR TV. Em uma máquina apertada, é possível pausar a conversão com `docker compose -f compose.vps.yaml stop processador-momentos`. O acervo publicado continua funcionando e os novos envios aguardam na fila. Para reativar, use `docker compose -f compose.vps.yaml start processador-momentos`.
