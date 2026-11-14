import type { TipoRelatorio } from "@repo/contracts";
import {
  relatorioFormConfig,
  type RelatorioDraft,
  type RelatorioField,
} from "./relatorio-form-config";

const labels: Record<string, string> = {
  quantidade: "Registros",
  bensDistintos: "Bens distintos",
  semNumeroOficial: "Sem número oficial",
  semContabilidade: "Sem contabilidade",
  incorporacao: "Total de incorporação",
  brutoAtual: "Total bruto atual",
  acumuladoAtual: "Total acumulado atual",
  liquidoAtual: "Total líquido atual",
  pendentes: "Pendentes",
  retornados: "Retornados",
  devolvidos: "Devolvidos",
  atrasados: "Em atraso",
  semPrevisao: "Sem previsão",
  semOrcamento: "Sem orçamento",
  semRealizado: "Sem valor realizado",
  pedidosDistintos: "Pedidos distintos",
  gruposDistintos: "Grupos distintos",
  orcamentoConhecido: "Orçamento conhecido",
  realizadoConhecido: "Realizado conhecido",
  quotas: "Quotas do período",
  porCompetencia: "Por competência",
  porTipo: "Por tipo",
  competencia: "Competência",
  competenciaMaisAntiga: "Competência mais antiga",
  primeiraCompetencia: "Primeira competência",
  ultimaCompetenciaProcessada: "Última competência processada",
  competenciaEsperada: "Competência esperada",
  quantidadeCompetencias: "Competências pendentes",
  quantidadePendencias: "Pendências",
  semReferencia: "Sem referência",
  verificados: "Verificados",
  corretos: "Corretos",
  divergentes: "Divergentes",
  naoLocalizados: "Não localizados",
  correcoesOriginaisPendentes: "Correções originais pendentes",
  correcoesOriginaisConcluidas: "Correções originais concluídas",
  correcoesPosterioresPendentes: "Correções posteriores pendentes",
  correcoesPosterioresConcluidas: "Correções posteriores concluídas",
  numeroPatrimonio: "Número patrimonial",
  numeroPatrimonioAtual: "Número patrimonial atual",
  numeroAnterior: "Número anterior",
  numeroNovo: "Número novo",
  numeroSnapshot: "Número registrado no evento",
  descricao: "Descrição",
  descricaoAtual: "Descrição atual",
  descricaoSnapshot: "Descrição registrada no evento",
  especie: "Espécie",
  natureza: "Natureza",
  status: "Situação",
  setorAtual: "Setor atual",
  setorOrigem: "Setor de origem",
  setorDestino: "Setor de destino",
  setorEsperado: "Setor esperado",
  setorEncontrado: "Setor encontrado",
  setorLocalizacao: "Setor da localização",
  setorVinculo: "Setor vinculado",
  responsavelAtual: "Responsável atual",
  salaAtual: "Sala atual",
  tipoNumeroPatrimonial: "Tipo de número patrimonial",
  valorIncorporacao: "Valor de incorporação",
  valorBrutoAtual: "Valor bruto atual",
  depreciacaoAcumuladaAtual: "Depreciação acumulada",
  valorLiquidoAtual: "Valor líquido atual",
  valorContabilAnterior: "Valor líquido anterior",
  valorContabilNovo: "Valor líquido posterior",
  valorDepreciado: "Quota processada",
  valorResidual: "Valor residual",
  valorResidualNovo: "Novo valor residual",
  valorResidualAnterior: "Valor residual anterior",
  valorReavaliado: "Novo valor bruto",
  quotaPrevista: "Quota prevista",
  valorOrcamento: "Orçamento vigente",
  valorRealizado: "Valor realizado",
  valor: "Valor",
  dataTombamento: "Data de tombamento",
  dataTransferencia: "Data da transferência",
  dataReavaliacao: "Data da reavaliação",
  dataReferencia: "Data de referência",
  dataEnvio: "Data de envio",
  previsaoRetorno: "Previsão de retorno",
  dataRetorno: "Data de retorno",
  dataSaida: "Data de saída",
  dataDevolucao: "Data de devolução",
  dataBaixa: "Data da baixa",
  dataVerificacao: "Data da conferência",
  dataCorrecao: "Data da correção",
  dataLocalizacao: "Data da localização",
  dataCorrecaoPosterior: "Data da correção posterior",
  registroEm: "Registrado em",
  processamento: "Processado em",
  ocorrencia: "Data da ocorrência",
  autor: "Responsável pelo registro",
  comissao: "Comissão",
  autorSnapshot: "Responsável registrado no evento",
  comissaoSnapshot: "Comissão registrada no evento",
  autorAtual: "Responsável atual",
  comissaoAtual: "Comissão atual",
  autorVerificacao: "Responsável pela conferência",
  autorCorrecao: "Responsável pela correção",
  autorLocalizacao: "Responsável pela localização",
  autorCorrecaoPosterior: "Responsável pela correção posterior",
  autorSaida: "Responsável pela saída",
  comissaoSaida: "Comissão da saída",
  autorDevolucao: "Responsável pela devolução",
  comissaoDevolucao: "Comissão da devolução",
  verificacao: "Conferência",
  statusInventario: "Situação do inventário",
  statusNaVerificacao: "Situação na conferência",
  ausenciaJustificada: "Ausência justificada",
  correcao: "Correção original",
  tipoCorrecao: "Tipo da correção",
  correcaoPosterior: "Correção posterior",
  tipoCorrecaoPosterior: "Tipo da correção posterior",
  situacao: "Situação",
  tipo: "Tipo",
  origem: "Natureza",
  inventario: "Inventário",
  observacao: "Observação",
  laudo: "Laudo",
  marca: "Marca",
  modelo: "Modelo",
  serie: "Série",
  processo: "Processo",
  parametro: "Parâmetros de depreciação",
  metodo: "Método",
  vidaUtilMeses: "Vida útil (meses)",
  vidaUtilNovaMeses: "Nova vida útil (meses)",
  vidaUtilAnteriorMeses: "Vida útil anterior (meses)",
  residual: "Valor residual",
  base: "Valor base",
  inicio: "Início",
  requisicao: "Requisição",
  fornecedor: "Fornecedor",
  versaoOrcamento: "Versão do orçamento",
  versao: "Versão",
  servico: "Serviço",
  garantia: "Garantia",
  vencimentoGarantia: "Vencimento da garantia",
  modoAgrupamento: "Forma de agrupamento",
  destinatario: "Destinatário",
  finalidade: "Finalidade",
  previsao: "Previsão",
  emAtraso: "Em atraso",
  motivo: "Motivo",
  parametroAnteriorSituacao: "Situação do parâmetro anterior",
};

const enumLabels: Record<string, string> = {
  ATIVO: "Ativo",
  BAIXADO: "Baixado",
  EMPRESTADO: "Emprestado",
  EM_MANUTENCAO: "Em manutenção",
  OFICIAL: "Oficial",
  SEM_NUMERO_OFICIAL: "Sem número oficial",
  NUMERO: "Número patrimonial",
  TOMBAMENTO: "Data de tombamento",
  PENDENTE: "Pendente",
  RETORNADO: "Retornado",
  DEVOLVIDO: "Devolvido",
  CORRECAO_INVENTARIO: "Correção de inventário",
  COMUM: "Comum",
  REGISTRO: "Registro",
  REFERENCIA: "Referência",
  ENVIO: "Envio",
  RETORNO: "Retorno",
  SAIDA: "Saída",
  PREVISAO: "Previsão",
  VERIFICADO: "Verificado",
  CORRETO: "Correto",
  DIVERGENCIA: "Divergência",
  NAO_LOCALIZADO: "Não localizado",
  CORRIGIDO: "Corrigido",
  PRIMEIRO_PARAMETRO: "Primeiro parâmetro",
  NAO_INFORMADO_LEGADO: "Não informado no registro legado",
  REGISTRADO: "Registrado",
  SIM: "Sim",
  NAO: "Não",
  SUBSTITUICAO_NUMERO: "Substituição de número",
  TRANSFERENCIA: "Transferência",
  REAVALIACAO: "Reavaliação",
  DEPRECIACAO: "Depreciação",
  EMPRESTIMO: "Empréstimo",
  DEVOLUCAO: "Devolução",
  BAIXA: "Baixa",
  ENVIO_MANUTENCAO: "Envio para manutenção",
  REVISAO_ORCAMENTO: "Revisão de orçamento",
  RETORNO_MANUTENCAO: "Retorno da manutenção",
  CONFERENCIA_INVENTARIO: "Conferência de inventário",
  LOCALIZACAO_POSTERIOR: "Localização posterior",
  CORRECAO_LOCALIZACAO: "Correção de localização",
  DIA: "Dia",
  INSTANTE: "Instante",
  DESCONHECIDA: "Data desconhecida",
  ADMINISTRADOR: "Administrador",
  DIRETOR_PATRIMONIO: "Diretor de Patrimônio",
};

const recordFields: Partial<Record<TipoRelatorio, readonly string[]>> = {
  patrimonios: [
    "numeroPatrimonio",
    "descricao",
    "setorAtual",
    "valorLiquidoAtual",
    "tipoNumeroPatrimonial",
    "especie",
    "natureza",
    "salaAtual",
    "responsavelAtual",
    "status",
    "dataTombamento",
    "valorIncorporacao",
    "valorBrutoAtual",
    "depreciacaoAcumuladaAtual",
  ],
  movimentacoes: [
    "numeroPatrimonio",
    "descricao",
    "setorOrigem",
    "setorDestino",
    "dataTransferencia",
    "origem",
    "comissao",
    "autor",
    "registroEm",
    "observacao",
  ],
  manutencoes: [
    "requisicao",
    "numeroPatrimonio",
    "fornecedor",
    "situacao",
    "dataEnvio",
    "valorOrcamento",
    "descricao",
    "tipo",
    "previsaoRetorno",
    "dataRetorno",
    "valorRealizado",
    "versaoOrcamento",
    "servico",
    "garantia",
    "vencimentoGarantia",
    "comissao",
  ],
  depreciacoes: [
    "numeroPatrimonio",
    "descricao",
    "competencia",
    "valorContabilAnterior",
    "valorDepreciado",
    "valorContabilNovo",
    "processamento",
    "comissao",
    "autor",
  ],
  "pendencias-depreciacao": [
    "numeroPatrimonio",
    "descricao",
    "competenciaEsperada",
    "quantidadePendencias",
    "quotaPrevista",
    "status",
    "primeiraCompetencia",
    "ultimaCompetenciaProcessada",
    "valorLiquidoAtual",
    "valorResidual",
  ],
  reavaliacoes: [
    "numeroSnapshot",
    "descricaoSnapshot",
    "dataReferencia",
    "valorLiquidoAnterior",
    "valorReavaliado",
    "numeroPatrimonioAtual",
    "descricaoAtual",
    "dataReavaliacao",
    "valorBrutoAnterior",
    "depreciacaoAcumuladaAnterior",
    "valorResidualAnterior",
    "valorResidualNovo",
    "vidaUtilAnteriorMeses",
    "vidaUtilNovaMeses",
    "comissaoSnapshot",
    "autorSnapshot",
    "comissaoAtual",
    "autorAtual",
    "laudo",
    "observacao",
    "parametroAnteriorSituacao",
  ],
  inventarios: [
    "numeroPatrimonio",
    "descricao",
    "setorEsperado",
    "setorEncontrado",
    "verificacao",
    "situacao",
    "inventario",
    "statusInventario",
    "dataVerificacao",
    "autorVerificacao",
    "statusNaVerificacao",
    "ausenciaJustificada",
    "correcao",
    "tipoCorrecao",
    "dataCorrecao",
    "autorCorrecao",
    "dataLocalizacao",
    "setorLocalizacao",
    "autorLocalizacao",
    "correcaoPosterior",
    "tipoCorrecaoPosterior",
    "dataCorrecaoPosterior",
    "autorCorrecaoPosterior",
    "observacao",
  ],
  emprestimos: [
    "numeroPatrimonio",
    "destinatario",
    "dataSaida",
    "previsao",
    "dataDevolucao",
    "situacao",
    "descricao",
    "modoAgrupamento",
    "finalidade",
    "setorVinculo",
    "emAtraso",
    "comissaoSaida",
    "autorSaida",
    "comissaoDevolucao",
    "autorDevolucao",
    "observacao",
  ],
  baixas: [
    "numeroPatrimonio",
    "descricao",
    "dataBaixa",
    "tipo",
    "motivo",
    "comissao",
    "autor",
    "registroEm",
    "observacao",
  ],
};

const eventRecordType: Record<string, TipoRelatorio> = {
  TRANSFERENCIA: "movimentacoes",
  REAVALIACAO: "reavaliacoes",
  DEPRECIACAO: "depreciacoes",
  EMPRESTIMO: "emprestimos",
  DEVOLUCAO: "emprestimos",
  BAIXA: "baixas",
  ENVIO_MANUTENCAO: "manutencoes",
  RETORNO_MANUTENCAO: "manutencoes",
  CONFERENCIA_INVENTARIO: "inventarios",
  CORRECAO_INVENTARIO: "inventarios",
  LOCALIZACAO_POSTERIOR: "inventarios",
  CORRECAO_LOCALIZACAO: "inventarios",
};

const cadastroFields = [
  "numeroPatrimonio",
  "tipoNumeroPatrimonial",
  "descricao",
  "marca",
  "modelo",
  "serie",
  "especie",
  "natureza",
  "status",
  "dataTombamento",
  "setorAtual",
  "salaAtual",
  "responsavelAtual",
  "processo",
  "valorIncorporacao",
  "valorBrutoAtual",
  "depreciacaoAcumuladaAtual",
  "valorLiquidoAtual",
  "parametro",
] as const;

export type RelatorioDisplayEntry = {
  key: string;
  label: string;
  value: string;
};

export function isInternalRelatorioField(key: string) {
  return key === "id" || key.endsWith("Id") || key === "atributos";
}

export function relatorioFieldLabel(key: string) {
  return (
    labels[key] ??
    key
      .replace(/_/g, " ")
      .replace(/([a-zá-ú])([A-Z])/g, "$1 $2")
      .replace(/^./, (value) => value.toLocaleUpperCase("pt-BR"))
  );
}

function formatObject(value: Record<string, unknown>) {
  return Object.entries(value)
    .filter(([key]) => !isInternalRelatorioField(key))
    .map(
      ([key, item]) =>
        `${relatorioFieldLabel(key)}: ${formatRelatorioValue(item)}`,
    )
    .join("\n");
}

export function formatRelatorioValue(value: unknown): string {
  if (value === null || value === undefined || value === "")
    return "Não informado";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (typeof value === "string" && enumLabels[value]) return enumLabels[value];
  if (typeof value === "string" && /^-?\d+\.\d{7}$/.test(value)) {
    const negative = value.startsWith("-");
    const [integer, decimal] = (negative ? value.slice(1) : value).split(".");
    return `${negative ? "-" : ""}${integer!.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${decimal}`;
  }
  if (typeof value === "string" && /^\d{4}-\d{2}$/.test(value))
    return `${value.slice(5)}/${value.slice(0, 4)}`;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value))
    return value.split("-").reverse().join("/");
  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T.*Z$/.test(value) &&
    !Number.isNaN(Date.parse(value))
  ) {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "short",
      timeStyle: "medium",
    }).format(new Date(value));
  }
  if (typeof value === "string" && /^[A-Z_]+$/.test(value))
    return value
      .toLocaleLowerCase("pt-BR")
      .replaceAll("_", " ")
      .replace(/^./, (character) => character.toLocaleUpperCase("pt-BR"));
  if (Array.isArray(value))
    return value.length ? value.map(formatRelatorioValue).join("\n") : "Nenhum";
  if (typeof value === "object")
    return formatObject(value as Record<string, unknown>);
  return String(value);
}

export function relatorioDisplayEntries(
  data: Record<string, unknown>,
  fields?: readonly string[],
): RelatorioDisplayEntry[] {
  return [...new Set(fields ?? Object.keys(data))]
    .filter((key) => key in data && !isInternalRelatorioField(key))
    .map((key) => ({
      key,
      label: relatorioFieldLabel(key),
      value: formatRelatorioValue(data[key]),
    }));
}

export function relatorioRecordFields(tipo: TipoRelatorio) {
  return recordFields[tipo];
}
export function relatorioCadastroEntries(data: Record<string, unknown>) {
  return relatorioDisplayEntries(data, cadastroFields);
}

export function relatorioEventEntries(event: Record<string, unknown>) {
  const type = String(event.tipo ?? "");
  const attributes =
    typeof event.atributos === "object" && event.atributos !== null
      ? (event.atributos as Record<string, unknown>)
      : {};
  const fields =
    type === "SUBSTITUICAO_NUMERO"
      ? ["numeroAnterior", "numeroNovo"]
      : type === "REVISAO_ORCAMENTO"
        ? ["versao", "descricao", "valor", "fornecedor"]
        : recordFields[eventRecordType[type]!];
  return relatorioDisplayEntries(attributes, fields);
}

export function relatorioEventMetadata(event: Record<string, unknown>) {
  return relatorioDisplayEntries(event, [
    "ocorrencia",
    "registroEm",
    "autor",
    "comissao",
  ]);
}

export function relatorioRecordTitle(record: Record<string, unknown>) {
  return formatRelatorioValue(
    record.numeroPatrimonio ??
      record.numeroPatrimonioAtual ??
      record.numeroSnapshot ??
      record.tipo ??
      "Registro",
  );
}

export function relatorioRecordSubtitle(record: Record<string, unknown>) {
  const value =
    record.descricao ??
    record.descricaoAtual ??
    record.descricaoSnapshot ??
    record.ocorrencia;
  return value === null || value === undefined
    ? ""
    : formatRelatorioValue(value);
}

export function appliedFilterEntries(
  tipo: TipoRelatorio,
  filtros: Readonly<Record<string, string | number>>,
  draft: RelatorioDraft,
  selectedLabels: Readonly<Record<string, string>>,
) {
  const fields = relatorioFormConfig[tipo].fields as readonly RelatorioField[];
  return Object.entries(filtros).map(([key, value]) => {
    const field = fields.find((candidate) => candidate.name === key);
    const display =
      selectedLabels[key] ||
      field?.options?.find((option) => option.value === String(draft[key]))
        ?.label ||
      (field?.kind === "catalog"
        ? "Opção selecionada"
        : formatRelatorioValue(value));
    return {
      key,
      label: field?.label ?? relatorioFieldLabel(key),
      value: display,
    };
  });
}
