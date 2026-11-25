# Intergil 2026 na VPS

A aplicação usa React com JavaScript e Vite, uma API Express e um MongoDB com replica set de um membro. O Nginx entrega o site, os arquivos e o WebSocket pelo mesmo domínio. O Docker Compose persiste o banco e os uploads em volumes nomeados. A aplicação usa o banco `intergil2026`.

## Subir a edição

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

As artes padrão e os brasões ficam em `frontend/public/images`. A gestão pode alterar o título, a logo da capa e do cabeçalho, os brasões e as imagens das modalidades. A imagem enviada recebe um nome ASCII com identificador único e o banco passa a apontar para ela. O volume `arquivos` recebe uploads, inclusive os editais em PDF e as mídias da galeria. Em uma instalação nova os arquivos padrão já acompanham o frontend. Para mover fotos, vídeos, PDFs ou logos publicados posteriormente, transfira esse volume junto com o banco.

A galeria aceita fotos JPEG, PNG, WebP ou GIF e vídeos MP4 ou WebM até 100 MB. O proxy externo precisa aceitar o tamanho do envio e permitir o upgrade de WebSocket. Caddy permite ambos por padrão. Em um Nginx externo, ajuste `client_max_body_size 105m` e encaminhe os cabeçalhos de upgrade.

## Atribuir modalidades aos monitores

Cadastre a matrícula e, depois, atribua até três modalidades pelo slug. O primeiro comando cria um acesso e retorna a senha gerada ao operador. O segundo substitui a lista de modalidades atribuídas. O monitor só vê e altera horários, editais e chaveamentos dessas modalidades.

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
