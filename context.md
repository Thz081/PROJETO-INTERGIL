# Contexto do X Intergil 2026

## Projeto e estado atual

O Intergil é o interclasse da ETE Advogado José David Gil Rodrigues, em Jaboatão dos Guararapes. A décima edição se chama **Armoriar**. A identidade parte do Movimento Armorial e do cartaz oficial da escola. Alunos consultam a programação e se inscrevem. Gestão e monitoria mantêm turmas, regulamentos, jogos, classificação e registros do evento.

A aplicação usa React com JavaScript e Vite, API Express, MongoDB com replica set, Nginx e Docker Compose. A edição local está em `http://localhost:8086`. O código atual está na [branch develop](https://github.com/Thz081/PROJETO-INTERGIL/tree/develop), cujo snapshot inicial é `4910884`. A [main](https://github.com/Thz081/PROJETO-INTERGIL/tree/main), no ponto `c6c7298` quando foi criado o snapshot, é a referência da edição anterior.

A base da edição foi conferida com **503 alunos em 12 turmas**. Primeiro acesso por matrícula e nascimento, cadastro de e-mail e senha com bcrypt, vagas ao vivo, horários, importação, exportação, ranking, Hall, editais e galeria já existem. A instalação anterior foi testada em Docker limpo. A revisão atual deve cobrir esses fluxos outra vez depois da integração. [Relatório anterior](VERIFICACAO.md)

O GitHub é público. Planilhas nominais, credenciais, variáveis de ambiente e volumes ficam fora do Git. As artes e a programação pública acompanham o código. A planilha de horários e o edital da organização servem como fonte de regras. Nas divergências registradas, vale a confirmação mais recente da organização.

## O que recuperar e o que melhorar

- **Home e modalidades.** Recuperar o carrossel de cards e a navegação para o detalhe. Cada modalidade tem uma capa e um banner panorâmico próprios. As gravuras atuais foram aprovadas como ponto de partida. O catálogo permanece dividido pelas categorias do edital.
- **Marca.** O cartaz completo entra na home. O cabeçalho usa uma versão horizontal e legível em tamanho pequeno. A Gestão continua podendo atualizar o nome do evento e enviar imagens.
- **Portais.** Aluno, Gestão e Monitoria ganham o mesmo padrão de campos, senha e feedback. Hoje há colisões de CSS, contraste ruim no portal do aluno e links de equipe encostados.
- **Gestão.** A estrutura e o visual geral foram aprovados. Os ajustes são organização de modalidades, seletor de arquivos, prévias de capa e banner e os cortes horizontais das telas capturadas. Monitoria segue o mesmo padrão de upload e recebe correções de uso que aparecerem no teste.
- **História.** Alatares foi a campeã geral de 2025. Tacyo informou que a cadastrou pelo painel. Na conferência anterior, a instalação local consultada ainda não retornava esse registro. Cadastros feitos no painel pertencem ao banco de cada instalação. A entrega precisa incluir a arte fornecida e preencher 2025 nas instalações em que o ano estiver ausente.
- **Apresentações.** Xaxado e cangaceiros, caboclo de lança e rei do Congo, caboclinho e bumba meu boi, vaqueiro e cavalo-marinho. Os pares podem aparecer como quatro estandartes de apresentações depois do aceite dos fluxos principais.

## Catálogo e regras confirmadas

Categoria agrupa modalidades. Modalidade é a unidade de contagem da inscrição. Formatos e categorias de participação, como masculino, feminino, individual, dupla e nível, aparecem dentro da modalidade pertinente. Os identificadores e a posição das opções existentes precisam continuar reconhecíveis para as inscrições já gravadas.

| Categoria | Modalidades |
|---|---|
| Esportes de Quadra | Futsal, Quadrado, Futmesa, Vôlei, Vôleimesa, Vôlei quase de praia, Basquete e Queimado |
| Esportes de Oposição | Ping-pong e Badminton |
| Esportes de Precisão | Bocha |
| Atletismo | Corrida |
| Esportes de Marca | Arremesso de Peso |
| Ginástica | Calistenia |
| Lutas | Kata |
| Jogos de Tabuleiro | UNO, Dama, Dominó e Xadrez |
| Jogos Matemáticos | Cubo Mágico e Sudoku |
| Jogos Digitais | Just Dance, Street Fight, Mobile Legends, Free Fire e FIFA |
| Jogos de Imaginação | RPG, com RPG de mesa, Card Game, Cosplay e PVP |

- **1º e 2º anos** escolhem de 2 a 3 modalidades. **3º ano** escolhe de 3 a 4. O prazo inclui todo o dia 1º de dezembro, no horário de Pernambuco.
- **Basquete** agrupa 5×5 e 3×3 na contagem. O 3×3 feminino permanece disponível sozinho.
- **Free Fire** agrupa 4×4 e X1 na contagem. X1 tem uma vaga por sala.
- **FIFA** permite selecionar X1 e X2 e conta o conjunto como uma modalidade. X1 tem **uma vaga por sala**, conforme a confirmação mais recente. X2 tem uma dupla por sala, com duas vagas individuais para compô-la.
- **RPG** permite marcar as quatro atividades livres, com um único ponto na contagem de modalidades.
- **Corrida** oferece 100 m, 200 m e revezamento de 800 m dentro do Atletismo e conta como uma modalidade. **Kata** permite escolher uma entre Karatê, Judô e Taekwondo.
- **Futsal, Quadrado e Futmesa** são modalidades independentes. O mesmo vale para Vôlei, Vôleimesa e Vôlei quase de praia. Golzinho, X1 de futsal, Brawl e Clash saíram.
- **Vagas** são conferidas no servidor pela sala e pelo formato. UNO tem quatro vagas por sala. Inscrição e cancelamento atualizam o contador ao vivo. Por outra sala, vale uma modalidade por visitante e até duas pessoas de fora por sala, com presença nas duas listas.

O snapshot ainda usa o estado pendente para FIFA e tem duas vagas no X1. Também aponta a capa e o detalhe para a mesma gravura em cada modalidade. Essas diferenças são tarefas da rodada, não regras da edição.

## Referências

- [Carrossel original do Intergil](https://github.com/Thz081/PROJETO-INTERGIL/tree/main/FRONTEND/src/components/ModalidadesCarousel)
- [Banners da edição antiga](https://github.com/Thz081/PROJETO-INTERGIL/tree/main/BACKEND/uploads)
- [Home e carrossel da ETE Gamificada](https://github.com/erickgustavo2025/Leilao-ETE-Gamificada/tree/main/frontend/src/pages/public/home/components)
- [Cards da dashboard da ETE Gamificada](https://github.com/erickgustavo2025/Leilao-ETE-Gamificada/tree/main/frontend/src/pages/dashboard/components)
- [Museu Armorial dos Sertões](https://cms.cultura.pe.gov.br/pagina/literatura/museu-armorial-dos-sertoes/)
- [Mostra Movimento Armorial 50 anos](https://ccbb.com.br/programacao-digital/movimento-armorial-50-anos-tour-virtual/)
- [Planejamento de Tacyo e Erick](planejamento%20tacyo%20e%20erick.md)
