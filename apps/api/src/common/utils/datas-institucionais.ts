const formatadorDia = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const formatadorDataHora = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export function diaSaoPaulo(instante: Date): string {
  const partes = formatadorDia.formatToParts(instante);
  const obter = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)!.value;
  return `${obter("year")}-${obter("month")}-${obter("day")}`;
}

export function instanteNoDiaComHoraAtualSaoPaulo(
  dia: string,
  agora = new Date(),
): Date {
  const partesAtuais = formatadorDataHora.formatToParts(agora);
  const obter = (tipo: Intl.DateTimeFormatPartTypes) =>
    partesAtuais.find((parte) => parte.type === tipo)!.value;
  const alvoLocal = Date.UTC(
    Number(dia.slice(0, 4)),
    Number(dia.slice(5, 7)) - 1,
    Number(dia.slice(8, 10)),
    Number(obter("hour")),
    Number(obter("minute")),
    Number(obter("second")),
    agora.getUTCMilliseconds(),
  );
  let candidato = alvoLocal;
  for (let tentativa = 0; tentativa < 3; tentativa += 1) {
    const partes = formatadorDataHora.formatToParts(new Date(candidato));
    const parte = (tipo: Intl.DateTimeFormatPartTypes) =>
      partes.find((item) => item.type === tipo)!.value;
    const localDoCandidato = Date.UTC(
      Number(parte("year")),
      Number(parte("month")) - 1,
      Number(parte("day")),
      Number(parte("hour")),
      Number(parte("minute")),
      Number(parte("second")),
      agora.getUTCMilliseconds(),
    );
    candidato += alvoLocal - localDoCandidato;
  }
  return new Date(candidato);
}

// A busca contempla dias históricos em que o horário de verão suprimiu a meia-noite.
export function inicioDiaSaoPaulo(dia: string): Date {
  const referencia = new Date(`${dia}T12:00:00.000Z`).getTime();
  let inicio = referencia - 36 * 3_600_000;
  let fim = referencia + 36 * 3_600_000;
  while (inicio < fim) {
    const meio = Math.floor((inicio + fim) / 2);
    if (diaSaoPaulo(new Date(meio)) < dia) inicio = meio + 1;
    else fim = meio;
  }
  return new Date(inicio);
}

export function proximoDiaCivil(dia: string): string {
  const data = new Date(`${dia}T12:00:00.000Z`);
  data.setUTCDate(data.getUTCDate() + 1);
  return data.toISOString().slice(0, 10);
}
