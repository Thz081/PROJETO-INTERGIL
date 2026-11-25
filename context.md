# Contexto do X Intergil 2026

## Projeto e estado atual

O Intergil é o interclasse da ETE Advogado José David Gil Rodrigues, em Jaboatão dos Guararapes. A décima edição se chama **Armoriar**. A identidade parte do Movimento Armorial e do cartaz oficial da escola. Alunos consultam a programação e se inscrevem. Gestão e monitoria mantêm turmas, regulamentos, jogos, classificação e registros do evento.

A aplicação usa React com JavaScript e Vite, API Express, MongoDB com replica set, Nginx e Docker Compose. A edição local está em `http://localhost:8086`. Na sessão de desenvolvimento, a prévia também está em `http://10.0.0.178:4176` para aparelhos no mesmo Wi-Fi. O código atual está na [branch develop](https://github.com/Thz081/PROJETO-INTERGIL/tree/develop), cujo snapshot inicial é `4910884`. A [main](https://github.com/Thz081/PROJETO-INTERGIL/tree/main), no ponto `c6c7298` quando foi criado o snapshot, é a referência da edição anterior.

A base da edição foi conferida com **503 alunos em 12 turmas**. Primeiro acesso por matrícula e nascimento, cadastro de e-mail e senha com bcrypt, vagas ao vivo, horários, importação, exportação, ranking, Hall, editais e galeria já existem. A instalação anterior foi testada em Docker limpo. A revisão atual deve cobrir esses fluxos outra vez depois da integração. [Relatório anterior](VERIFICACAO.md)

O GitHub é público. Planilhas nominais, credenciais, variáveis de ambiente e volumes ficam fora do Git. As artes e a programação pública acompanham o código. A planilha de horários e o edital da organização servem como fonte de regras. Nas divergências registradas, vale a confirmação mais recente da organização.

## Estado da rodada Armoriar

- **Home e modalidades.** O carrossel voltou com cards, filtro de categoria, setas, toque e avanço automático com botão de pausa. Cada modalidade tem capa e banner WebP 16:9. A arte de Futsal foi composta para o detalhe e as demais usam as gravuras de 2026 em formato panorâmico. Os banners de 2025 são referência para a revisão editorial.
- **Marca e tipografia.** A abertura usa o novo letreiro ARMORIAR, composto com a Tipografia Armorial de 2000 e exportado como imagem. Acompanha o cartaz completo e a legenda provisória “INTERGIL 2026”. Os demais títulos usam Young Serif e os textos usam Poppins. O arquivo TTF de referência marca incorporação restrita. Para usar a fonte como texto no site, obter autorização e conferir acentos, números e títulos longos. [Alfabeto de Suassuna](https://casca-archive.org/pt-br/items/show/9266) · [Arquivo de referência](https://baralhoarmorial.wordpress.com/2011/02/01/tipografia-armorial/) · [Canal de direitos da Nova Fronteira](https://www.grupoediouro.com/direitos-autorais)
- **Portais.** Aluno, Gestão e Monitoria compartilham o padrão de campos, senha e feedback. Os logins de Gestão e Monitoria foram exercitados localmente.
- **Inscrição e perfil.** A inscrição agrupa as opções por categoria, mostra limite, formatos e vagas ao vivo e mantém o resumo acessível durante a rolagem. O perfil mostra confirmação, lista por modalidade e cancelamento com confirmação na própria tela. A lista e a exportação da Gestão exibem cada inscrição uma vez.
- **História.** Alatares está no Hall local como campeã de 2025. Sua arte acompanha o código. A carga idempotente de 2025 para instalações novas e para bancos em que o ano ainda estiver ausente faz parte da entrega de dados do Erick.
- **Gestão e Monitoria.** A estrutura visual da Gestão foi aprovada. Ainda faltam organização de modalidades no painel, seletor de arquivos, prévias e correção dos cortes horizontais. A Monitoria precisa de vistoria completa dos fluxos operacionais.
- **Trilha e apresentações.** Avaliar uma gravação autorizada ou uma faixa original com rabeca, pífano, viola e zabumba. Referências de som incluem “Repente”, do repertório armorial, e o Quinteto Armorial. Xaxado e cangaceiros, caboclo de lança e rei do Congo, caboclinho e bumba meu boi, vaqueiro e cavalo-marinho seguem como temas de apresentação. [Sesc](https://www.sescsp.org.br/editorial/a-musica-armorial-ana-de-oliveira-e-sergio-raz/) · [Instituto Moreira Salles](https://radiobatuta.ims.com.br/programas/instrumental-brasileiro/quinteto-armorial)

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
- **Vagas** são conferidas no servidor pela sala e pelo formato. UNO tem quatro vagas por sala. Inscrição e cancelamento atualizam o contador ao vivo. Cada inscrição pertence à turma do aluno. A migração preserva escolhas gravadas e contabiliza todas pela turma de origem.

A configuração do backend ainda usa o estado pendente para FIFA e tem duas vagas no X1. Essa correção e a atualização dos banners no catálogo persistido são tarefas da frente de Erick.

## Referências

- [Carrossel original do Intergil](https://github.com/Thz081/PROJETO-INTERGIL/tree/main/FRONTEND/src/components/ModalidadesCarousel)
- [Banners da edição antiga](https://github.com/Thz081/PROJETO-INTERGIL/tree/main/BACKEND/uploads)
- [Home e carrossel da ETE Gamificada](https://github.com/erickgustavo2025/Leilao-ETE-Gamificada/tree/main/frontend/src/pages/public/home/components)
- [Cards da dashboard da ETE Gamificada](https://github.com/erickgustavo2025/Leilao-ETE-Gamificada/tree/main/frontend/src/pages/dashboard/components)
- [Museu Armorial dos Sertões](https://cms.cultura.pe.gov.br/pagina/literatura/museu-armorial-dos-sertoes/)
- [Mostra Movimento Armorial 50 anos](https://ccbb.com.br/programacao-digital/movimento-armorial-50-anos-tour-virtual/)
- [Planejamento de Tacyo e Erick](planejamento%20tacyo%20e%20erick.md)
