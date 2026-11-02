import { isApiError } from "@/lib/api/core/api-error";
export function mensagemRelatorio(e: unknown): string {
  if (isApiError(e))
    return e.status === 401
      ? "Sessão expirada. Entre novamente."
      : e.status === 403
        ? "Você não possui permissão para consultar este relatório."
        : e.message;
  return "Não foi possível consultar o relatório. Confira os filtros e tente novamente.";
}
export function rotulo(campo: string): string {
  const nomes: Record<string, string> = {
    id: "UUID do registro",
    patrimonioId: "UUID do bem",
    numeroPatrimonio: "Número patrimonial atual",
    descricao: "Descrição atual",
    inicio: "Início",
    fim: "Fim",
    competenciaInicio: "Competência inicial",
    competenciaFim: "Competência final",
    valorIncorporacao: "Incorporação (R$)",
    valorBrutoAtual: "Bruto atual (R$)",
    depreciacaoAcumuladaAtual: "Acumulado atual (R$)",
    valorLiquidoAtual: "Líquido atual (R$)",
    valorOrcamento: "Orçamento vigente (R$)",
    valorRealizado: "Realizado (R$)",
    valorDepreciado: "Quota (R$)",
    valorContabilAnterior: "Líquido anterior (R$)",
    valorContabilNovo: "Líquido posterior (R$)",
    quantidade: "Quantidade de registros",
    quotas: "Quotas do período (R$)",
    brutoAtual: "Total bruto atual (R$)",
    acumuladoAtual: "Total acumulado atual (R$)",
    liquidoAtual: "Total líquido atual (R$)",
    incorporacao: "Total de incorporação (R$)",
    orcamentoConhecido: "Orçamento conhecido (R$)",
    realizadoConhecido: "Realizado conhecido (R$)",
    semContabilidade: "Bens sem contabilidade",
    correcao: "Correção original",
    correcaoPosterior: "Correção posterior",
    statusNaVerificacao: "Status na verificação",
    setorAtual: "Setor atual",
    responsavelAtual: "Responsável atual",
    salaAtual: "Sala atual",
    ordenacao: "Ordenação",
    tipoNumero: "Tipo de número",
    registroEm: "Registrado em",
    precisao: "Precisão da ocorrência",
    ocorrencia: "Ocorrência",
    atributos: "Atributos persistidos",
    numeroSnapshot: "Número em snapshot",
    descricaoSnapshot: "Descrição em snapshot",
    parametroAnteriorId:
      "Parâmetro anterior (não informado em legados ou primeiro parâmetro)",
  };
  return (
    nomes[campo] ??
    campo
      .replace(/Id$/, " (UUID)")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/^./, (x) => x.toUpperCase())
  );
}
export function valor(v: unknown): string {
  if (v === null || v === undefined) return "Não informado no registro";
  if (Array.isArray(v)) return v.map(valor).join("; ");
  if (typeof v === "object")
    return Object.entries(v)
      .map(([k, x]) => `${rotulo(k)}: ${valor(x)}`)
      .join("; ");
  if (typeof v === "string" && /^-?\d+\.\d{7}$/.test(v)) {
    const [a, b] = v.split(".");
    return `${a!.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${b}`;
  }
  return String(v);
}
export const painel =
  "rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6";
export const campo =
  "mt-1 min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-700";
export function DadosRegistro({ dados }: { dados: Record<string, unknown> }) {
  return (
    <dl className="grid gap-2 text-sm sm:grid-cols-2">
      {Object.entries(dados).map(([k, v]) => (
        <div key={k} className="min-w-0 break-words">
          <dt className="font-semibold">{rotulo(k)}</dt>
          <dd className="whitespace-pre-wrap">
            {v === null &&
            ["brutoAtual", "acumuladoAtual", "liquidoAtual"].includes(k)
              ? "Total indisponível"
              : valor(v)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
