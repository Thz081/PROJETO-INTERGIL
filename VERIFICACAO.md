# Verificação do X Intergil em 24 de novembro de 2026

O pacote de implantação foi extraído em outro diretório e usado para construir e iniciar uma segunda instalação Docker. Os testes com cadastros e mídias ocorreram nessa instalação de homologação. A edição preparada para a escola tem 503 alunos ativos, 12 turmas e zero inscrições de teste.

| Fluxo | Resultado observado |
|---|---|
| Importação pelo painel | As 12 abas foram associadas às turmas. Nome, matrícula, nascimento, sexo e turma dos 503 registros coincidiram com as planilhas. Os dois registros com nome coincidente mantiveram suas matrículas distintas. |
| Primeiro acesso | Uma matrícula aleatória do primeiro ano e outra do terceiro validaram o nascimento, cadastraram e-mail e senha e voltaram a entrar. A API recusou senha com cinco caracteres. O banco de homologação armazenou os hashes bcrypt com custo 12. |
| Inscrição | O primeiro ano confirmou duas modalidades e o terceiro confirmou três. Foram testados o cancelamento, as quatro atividades de imaginação, basquete, Free Fire, corrida, exclusividade no kata e limites por sexo e por série. |
| Vagas ao vivo | A inscrição e o cancelamento mudaram o contador sem recarregar a página. O navegador recuperou a contagem após a reconexão do WebSocket. Duas requisições simultâneas disputaram a última vaga de UNO e somente uma foi confirmada. |
| Inscrição por outra sala | A vaga de visitante foi contabilizada na sala representada e a outra modalidade ficou na turma de origem. O aluno declara no formulário que sua sala não tem time. |
| Gestão e monitoria | Foram exercitadas criação, edição e exclusão de sala e modalidade, troca de brasão, capa, nome do evento e logo da página inicial, lançamento de pontos, ranking, histórico, registro de ações e exportação XLSX. A monitoria incluiu, alterou e excluiu horários e publicou chaveamento. |
| Editais | Foram enviados PDFs de teste nos níveis geral, modalidade e opção. As páginas públicas abriram os arquivos. O edital definitivo da escola ainda precisa ser publicado pela gestão. |
| Galeria | Foram enviados uma foto e um MP4 de aproximadamente 9 MB. A foto abriu ampliada, o vídeo reproduziu com controles e o Nginx entregou intervalos de bytes com HTTP 206. Foto e vídeo entraram e saíram da tela cheia. |
| Interface | Foram percorridas 17 rotas da edição em Chromium com larguras de 360 e 1280 pixels. O formulário do Hall da Fama foi ajustado para caber na tela estreita. A inscrição também foi testada a 390 pixels. |
| Distribuição | O pacote contém código, artes públicas e programação. Foram conferidos os nomes ASCII e as respostas HTTP das 27 imagens de modalidades e dos 12 brasões. O build segue os arquivos de lock e a auditoria npm consultada nesta entrega apresentou zero alertas no frontend e nas dependências de produção do backend. |

## Artes

Os 12 brasões vieram da organização e a capa usa o cartaz Armoriar fornecido pela escola. As ilustrações das modalidades foram geradas com o ImageGen integrado, em duas pranchas. A direção visual foi uma série de emblemas esportivos em xilogravura armorial, com papel marfim, tinta escura, laranja e turquesa, hachuras e figuras legíveis em tamanho pequeno. As imagens finais estão em `frontend/public/images/gravuras`; os brasões estão em `frontend/public/images/turmas`. A referência de pesquisa foi a [mostra Movimento Armorial 50 anos do CCBB](https://ccbb.com.br/programacao-digital/movimento-armorial-50-anos-tour-virtual/).

## Pendências para a escola

1. Confirmar com a organização se FIFA X1 e X2 podem ser acumulados e como devem ser contados. Os três modos de configuração foram testados.
2. Publicar o PDF definitivo quando a pessoa responsável o entregar.
3. Instalar o pacote na VPS, configurar o domínio e o HTTPS, carregar as matrículas e conferir o WebSocket pelo proxy público. A estimativa operacional é de 20 a 40 minutos com acesso, DNS e proxy disponíveis.

Os testes de tela estreita usaram navegador desktop redimensionado. O domínio público e aparelhos físicos continuam fora da cobertura desta rodada.
