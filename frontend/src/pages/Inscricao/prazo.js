const formato = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric', month: 'long', timeZone: 'America/Recife'
});

export const ultimoDiaInscricoes = fim => formato.format(Date.parse(fim) - 1);
