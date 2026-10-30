export function dataCivilSaoPaulo(agora = new Date()): string {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(agora);
  const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((parte) => parte.type === tipo)?.value;
  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

export function deslocarDataCivil(data: string, dias: number): string {
  const instante = new Date(`${data}T12:00:00.000Z`);
  instante.setUTCDate(instante.getUTCDate() + dias);
  return instante.toISOString().slice(0, 10);
}

export const SETORES_DEMO = [
  "Diretoria Administrativa",
  "Gestão Patrimonial",
  "Tecnologia da Informação",
  "Contabilidade e Finanças",
  "Compras e Licitações",
  "Recursos Humanos",
  "Arquivo e Protocolo",
  "Comunicação Institucional",
  "Apoio Legislativo",
  "Serviços Gerais",
] as const;

export const NATUREZAS_ESPECIES_DEMO = [
  ["Equipamentos de informática", "Notebook", "Estação de trabalho"],
  ["Periféricos e imagem", "Monitor", "Projetor multimídia"],
  ["Impressão e digitalização", "Impressora", "Scanner documental"],
  [
    "Infraestrutura predial",
    "Aparelho de ar-condicionado",
    "Equipamento de rede",
  ],
  ["Mobiliário corporativo", "Mesa de trabalho", "Cadeira ergonômica"],
] as const;

export const ITENS_DEMO = [
  ["Notebook corporativo", "Aurora", "N14"],
  ["Estação de trabalho compacta", "Horizonte", "E500"],
  ["Monitor LED de 24 polegadas", "Lumen", "M24"],
  ["Projetor multimídia", "Prisma", "P3600"],
  ["Impressora laser monocromática", "Folha", "L420"],
  ["Scanner documental duplex", "Arquivo", "D40"],
  ["Aparelho de ar-condicionado", "Brisa", "AC12000"],
  ["Switch gerenciável de rede", "Conecta", "S24G"],
  ["Mesa de trabalho com gaveteiro", "Ofício", "M160"],
  ["Cadeira ergonômica", "Postura", "C2"],
] as const;

export function criarCnpjSintetico(indice: number): string {
  const base = `DEMOSEED${String(indice).padStart(4, "0")}`;
  const digito = (valor: string) => {
    let peso = 2;
    let soma = 0;
    for (let i = valor.length - 1; i >= 0; i -= 1) {
      soma += (valor.charCodeAt(i) - 48) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const primeiro = digito(base);
  return `${base}${primeiro}${digito(`${base}${primeiro}`)}`;
}
