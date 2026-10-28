const formatadorDia = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
export function diaSaoPaulo(instante: Date): string {
  const partes = formatadorDia.formatToParts(instante);
  const obter = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)!.value;
  return `${obter("year")}-${obter("month")}-${obter("day")}`;
}
// Busca a primeira ocorrência do dia civil, inclusive nos dias históricos sem meia-noite por DST.
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
