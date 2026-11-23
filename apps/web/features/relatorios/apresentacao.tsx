import { isApiError } from "@/lib/api/core/api-error";
export function mensagemRelatorio(e: unknown): string {
  if (typeof e === "string") return e;
  if (isApiError(e)) {
    if (e.status === 401) return "Sessão expirada. Entre novamente.";
    if (e.status === 403)
      return "Você não possui permissão para consultar este relatório.";
    if (e.status === 400 || e.codigo === "VALIDACAO_ENTRADA_INVALIDA")
      return "Os filtros não foram aceitos. Limpe ou revise os valores informados e consulte novamente.";
    if (e.status !== null && e.status >= 500)
      return "O serviço de relatórios está temporariamente indisponível. Tente novamente em instantes.";
    if (e.categoria === "rede" || e.categoria === "timeout")
      return "Não foi possível acessar o serviço de relatórios. Verifique a conexão e tente novamente.";
    return e.message;
  }
  return "Não foi possível carregar os registros. Tente novamente; se o problema continuar, atualize a página.";
}
export function rotulo(campo: string): string {
  const nomes: Record<string, string> = {
    id: "UUID do registro",
    patrimonioId: "UUID do bem",
    numeroPatrimonio: "Número patrimonial atual",
    descricao: "Descrição atual",
    inicio: "Início",
    fim: "Fim",
    competencia: "Competência",
    primeiraCompetencia: "Primeira competência",
    ultimaCompetenciaProcessada: "Última competência processada",
    competenciaEsperada: "Competência esperada",
    competenciaMaisAntiga: "Competência mais antiga",
    quantidadePendencias: "Quantidade de pendências",
    quantidadeCompetencias: "Quantidade de competências",
    bensDistintos: "Bens distintos",
    valorResidual: "Valor residual (R$)",
    quotaPrevista: "Quota prevista (R$)",
    valorIncorporacao: "Incorporação (R$)",
    valorBrutoAtual: "Bruto atual (R$)",
    depreciacaoAcumuladaAtual: "Acumulado atual (R$)",
    valorLiquidoAtual: "Líquido atual (R$)",
    valorOrcamento: "Orçamento vigente (R$)",
    valorRealizado: "Realizado (R$)",
    valorDepreciado: "Quota (R$)",
    valorContabilAnterior: "Líquido anterior (R$)",
    valorContabilNovo: "Líquido posterior (R$)",
    valorReavaliado: "Valor reavaliado (R$)",
    valorResidualNovo: "Novo residual (R$)",
    valorLiquidoAnterior: "Líquido anterior (R$)",
    dataReavaliacao: "Data da reavaliação",
    dataTransferencia: "Data da movimentação",
    dataEnvio: "Envio",
    dataBaixa: "Data da baixa",
    dataSaida: "Saída",
    previsao: "Previsão de devolução",
    setorOrigem: "Setor de origem",
    setorDestino: "Setor de destino",
    setorEsperado: "Setor esperado",
    verificacao: "Conferência",
    fornecedor: "Fornecedor",
    pedidoId: "Pedido",
    motivo: "Motivo",
    destinatario: "Destinatário",
    situacao: "Situação",
    tipo: "Tipo",
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
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [ano, mes, dia] = v.split("-");
    return `${dia}/${mes}/${ano}`;
  }
  if (typeof v === "string" && /^[A-Z][A-Z_]+$/.test(v)) return rotuloOpcao(v);
  return String(v);
}
export function rotuloOpcao(v: string): string {
  const nomes: Record<string, string> = {
    NUMERO: "Número patrimonial",
    TOMBAMENTO: "Data de tombamento",
    OFICIAL: "Com número oficial",
    SEM_NUMERO_OFICIAL: "Sem número oficial",
    ATIVO: "Ativo",
    BAIXADO: "Baixado",
    EMPRESTADO: "Emprestado",
    EM_MANUTENCAO: "Em manutenção",
    ENVIO: "Envio",
    RETORNO: "Retorno",
    PREVENTIVA: "Preventiva",
    CORRETIVA: "Corretiva",
    PENDENTE: "Pendente",
    RETORNADO: "Retornado",
    REGISTRO: "Data do registro",
    REFERENCIA: "Data de referência",
    VERIFICADO: "Verificado",
    CORRETO: "Correto",
    DIVERGENCIA: "Divergência",
    NAO_LOCALIZADO: "Não localizado",
    CORRIGIDO: "Corrigido",
    SAIDA: "Saída",
    PREVISAO: "Previsão",
    DEVOLUCAO: "Devolução",
    DEVOLVIDO: "Devolvido",
    ALIENACAO: "Alienação",
    INUTILIZACAO: "Inutilização",
    SINISTRO: "Sinistro",
    FURTO: "Furto",
    EXTRAVIO: "Extravio",
    TRANSFERENCIA: "Transferência",
    RECLASSIFICACAO: "Reclassificação",
    ABANDONO: "Abandono",
    ERRO_REGISTRO: "Erro de registro",
    OUTRO: "Outro",
    CORRECAO_INVENTARIO: "Correção de inventário",
    COMUM: "Comum",
  };
  return (
    nomes[v] ??
    v
      .replaceAll("_", " ")
      .toLocaleLowerCase("pt-BR")
      .replace(/^./, (c) => c.toUpperCase())
  );
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
