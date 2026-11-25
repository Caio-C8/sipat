const formatador = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function paraDataHoraLocalSaoPaulo(instante: Date | string): string {
  const data = typeof instante === "string" ? new Date(instante) : instante;
  const partes = formatador.formatToParts(data);
  const obter = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((parte) => parte.type === tipo)!.value;
  return `${obter("year")}-${obter("month")}-${obter("day")}T${obter("hour")}:${obter("minute")}`;
}

export function agoraLocalSaoPaulo(instante = new Date()): string {
  return paraDataHoraLocalSaoPaulo(instante);
}

export function hojeLocalSaoPaulo(instante = new Date()): string {
  return paraDataHoraLocalSaoPaulo(instante).slice(0, 10);
}

export function paraIsoSaoPaulo(valor: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(valor)) return valor;
  return new Date(`${valor}:00-03:00`).toISOString();
}
