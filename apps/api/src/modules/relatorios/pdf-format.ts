type Registro = Record<string, unknown>;
export function rotuloRelatorio(campo: string): string {
  const especiais: Record<string, string> = {
    id: "UUID do registro",
    competencia: "Competência",
    competenciaInicio: "Competência inicial",
    competenciaFim: "Competência final",
    inicio: "Início",
    fim: "Fim",
    bensDistintos: "Bens distintos",
    comissao: "Comissão",
    processamento: "Processado em (São Paulo)",
    parametroId: "UUID do parâmetro",
    numeroPatrimonioAtual: "Número patrimonial atual",
    descricaoAtual: "Descrição cadastral atual",
    numeroSnapshot: "Número registrado no evento",
    descricaoSnapshot: "Descrição registrada no evento",
    comissaoSnapshot: "Comissão registrada no evento",
    autorSnapshot: "Autor registrado no evento",
    patrimonioId: "UUID do bem",
    numeroPatrimonio: "Número patrimonial atual",
    descricao: "Descrição cadastral atual",
    dataSaida: "Saída (data civil)",
    registroEm: "Instante de registro",
    valorIncorporacao: "Incorporação (R$)",
    valorBrutoAtual: "Bruto atual (R$)",
    depreciacaoAcumuladaAtual: "Acumulado atual (R$)",
    valorLiquidoAtual: "Líquido atual (R$)",
    valorContabilAnterior: "Líquido anterior (R$)",
    valorDepreciado: "Quota processada (R$)",
    valorContabilNovo: "Líquido posterior (R$)",
    valorOrcamento: "Orçamento vigente (R$)",
    valorRealizado: "Realizado (R$)",
    valorReavaliado: "Novo bruto (R$)",
    valorResidualNovo: "Residual novo (R$)",
    valorResidualAnterior: "Residual anterior (R$)",
    setorAtual: "Setor cadastral atual",
    responsavelAtual: "Responsável cadastral atual",
    porTipo: "Quantidade por tipo",
    porCompetencia: "Quotas por competência",
    quantidade: "Quantidade de registros",
    semContabilidade: "Bens sem situação contábil",
    brutoAtual: "Total bruto atual (R$)",
    acumuladoAtual: "Total acumulado atual (R$)",
    liquidoAtual: "Total líquido atual (R$)",
    incorporacao: "Total de incorporação (R$)",
    quotas: "Total de quotas (R$)",
    orcamentoConhecido: "Orçamento conhecido (R$)",
    realizadoConhecido: "Realizado conhecido (R$)",
    vidaUtilNovaMeses: "Vida útil nova (meses)",
    vidaUtilAnteriorMeses: "Vida útil anterior (meses)",
  };
  return (
    especiais[campo] ??
    campo
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/^./, (c) => c.toUpperCase())
  );
}
export function textoRelatorio(v: unknown): string {
  if (v === null || v === undefined) return "Não informado no registro";
  if (Array.isArray(v)) return v.map((x) => textoRelatorio(x)).join("; ");
  if (typeof v === "object")
    return Object.entries(v as Registro)
      .map(
        ([k, x]) =>
          `${rotuloRelatorio(k)}: ${x === null && ["brutoAtual", "acumuladoAtual", "liquidoAtual"].includes(k) ? "Total indisponível" : textoRelatorio(x)}`,
      )
      .join("; ");
  if (typeof v === "string" && /^-?\d+\.\d{7}$/.test(v)) {
    const [a, b] = v.split(".");
    return `${a!.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${b}`;
  }
  if (typeof v === "string" && /^\d{4}-\d{2}$/.test(v))
    return `${v.slice(5)}/${v.slice(0, 4)}`;
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v))
    return v.split("-").reverse().join("/");
  if (
    typeof v === "string" &&
    /^\d{4}-\d{2}-\d{2}T.*Z$/.test(v) &&
    !Number.isNaN(Date.parse(v))
  )
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "short",
      timeStyle: "medium",
    }).format(new Date(v));
  return Array.from(String(v))
    .filter((c) => {
      const n = c.codePointAt(0)!;
      return n === 9 || n === 10 || n === 13 || (n >= 32 && n !== 127);
    })
    .join("");
}
