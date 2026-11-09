export function rotuloCompetencia(competencia: string): string {
  const [ano, mes] = competencia.split("-").map(Number);
  if (!ano || !mes || mes < 1 || mes > 12) return competencia;
  const texto = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(ano, mes - 1, 1)));
  return texto.charAt(0).toLocaleUpperCase("pt-BR") + texto.slice(1);
}

export function primeiraCompetencia(dataCivil: string): string {
  const [ano, mes] = dataCivil.slice(0, 7).split("-").map(Number);
  const proxima =
    mes === 12 ? { ano: ano! + 1, mes: 1 } : { ano: ano!, mes: mes! + 1 };
  return `${proxima.ano}-${String(proxima.mes).padStart(2, "0")}`;
}
