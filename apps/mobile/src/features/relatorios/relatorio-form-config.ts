import {
  FichaRelatorioParamsSchema,
  opcoesPorRelatorio,
  queryRelatorio,
  titulosRelatorios,
  type CatalogoOpcaoRelatorio,
  type TipoRelatorio,
} from "@repo/contracts";
import { dateInputToIso, formatDateInput } from "../../lib/forms/date-input";

export type RelatorioDraft = Record<string, string>;
export type RelatorioOption = Readonly<{ value: string; label: string }>;
export type RelatorioField = Readonly<{
  name: string;
  label: string;
  kind: "text" | "date" | "month" | "catalog" | "enum";
  required?: boolean;
  placeholder?: string;
  catalog?: CatalogoOpcaoRelatorio;
  options?: readonly RelatorioOption[];
}>;

const option = (value: string, label: string): RelatorioOption => ({
  value,
  label,
});
const patrimonio = (required = false): RelatorioField => ({
  name: "patrimonioId",
  label: "Patrimônio",
  kind: "catalog",
  catalog: "patrimonios",
  required,
  placeholder: "Selecione um bem",
});
const periodo: readonly RelatorioField[] = [
  {
    name: "inicio",
    label: "Data inicial",
    kind: "date",
    required: true,
    placeholder: "DD/MM/AAAA",
  },
  {
    name: "fim",
    label: "Data final",
    kind: "date",
    required: true,
    placeholder: "DD/MM/AAAA",
  },
];
const periodoOpcional: readonly RelatorioField[] = periodo.map((field) => ({
  ...field,
  required: false,
}));
const comissao: RelatorioField = {
  name: "comissaoId",
  label: "Comissão",
  kind: "catalog",
  catalog: "comissoes",
  placeholder: "Todas as comissões",
};

export const relatorioFormConfig = {
  patrimonios: {
    subtitle: "Refine a relação patrimonial antes de conferir a prévia.",
    fields: [
      patrimonio(),
      {
        name: "busca",
        label: "Busca",
        kind: "text",
        placeholder: "Número ou descrição",
      },
      {
        name: "setorId",
        label: "Setor",
        kind: "catalog",
        catalog: "setores",
        placeholder: "Todos os setores",
      },
      {
        name: "responsavelId",
        label: "Responsável",
        kind: "catalog",
        catalog: "responsaveis",
        placeholder: "Todos os responsáveis",
      },
      {
        name: "especieId",
        label: "Espécie",
        kind: "catalog",
        catalog: "especies",
        placeholder: "Todas as espécies",
      },
      {
        name: "naturezaId",
        label: "Natureza",
        kind: "catalog",
        catalog: "naturezas",
        placeholder: "Todas as naturezas",
      },
      {
        name: "status",
        label: "Status",
        kind: "enum",
        options: [
          option("ATIVO", "Ativo"),
          option("BAIXADO", "Baixado"),
          option("EMPRESTADO", "Emprestado"),
          option("EM_MANUTENCAO", "Em manutenção"),
        ],
      },
      {
        name: "tipoNumero",
        label: "Numeração",
        kind: "enum",
        options: [
          option("OFICIAL", "Número oficial"),
          option("SEM_NUMERO_OFICIAL", "Sem número oficial"),
        ],
      },
      ...periodoOpcional,
      {
        name: "ordenacao",
        label: "Ordenação",
        kind: "enum",
        required: true,
        options: [
          option("NUMERO", "Número patrimonial"),
          option("TOMBAMENTO", "Data de tombamento"),
        ],
      },
    ],
    defaults: { ordenacao: "NUMERO" },
  },
  "ficha-bem": {
    subtitle: "Selecione o bem e, se necessário, filtre os eventos da ficha.",
    fields: [
      patrimonio(true),
      ...periodoOpcional,
      {
        name: "evento",
        label: "Evento",
        kind: "enum",
        options: [
          option("SUBSTITUICAO_NUMERO", "Substituição de número"),
          option("TRANSFERENCIA", "Transferência"),
          option("REAVALIACAO", "Reavaliação"),
          option("DEPRECIACAO", "Depreciação"),
          option("EMPRESTIMO", "Empréstimo"),
          option("DEVOLUCAO", "Devolução"),
          option("BAIXA", "Baixa"),
          option("ENVIO_MANUTENCAO", "Envio à manutenção"),
          option("REVISAO_ORCAMENTO", "Revisão de orçamento"),
          option("RETORNO_MANUTENCAO", "Retorno da manutenção"),
          option("CONFERENCIA_INVENTARIO", "Conferência de inventário"),
          option("CORRECAO_INVENTARIO", "Correção de inventário"),
          option("LOCALIZACAO_POSTERIOR", "Localização posterior"),
          option("CORRECAO_LOCALIZACAO", "Correção de localização"),
        ],
      },
      {
        name: "busca",
        label: "Buscar nos eventos",
        kind: "text",
        placeholder: "Termo do histórico",
      },
    ],
    defaults: {},
  },
  movimentacoes: {
    subtitle: "Consulte transferências no período informado.",
    fields: [
      patrimonio(),
      comissao,
      ...periodo,
      {
        name: "setorOrigemId",
        label: "Setor de origem",
        kind: "catalog",
        catalog: "setores",
        placeholder: "Todos",
      },
      {
        name: "setorDestinoId",
        label: "Setor de destino",
        kind: "catalog",
        catalog: "setores",
        placeholder: "Todos",
      },
      {
        name: "origem",
        label: "Origem",
        kind: "enum",
        options: [
          option("COMUM", "Movimentação comum"),
          option("CORRECAO_INVENTARIO", "Correção de inventário"),
        ],
      },
    ],
    defaults: {},
  },
  manutencoes: {
    subtitle: "Consulte envios ou retornos de manutenção no período.",
    fields: [
      patrimonio(),
      ...periodo,
      {
        name: "base",
        label: "Data-base",
        kind: "enum",
        required: true,
        options: [option("ENVIO", "Envio"), option("RETORNO", "Retorno")],
      },
      {
        name: "pedidoId",
        label: "Pedido",
        kind: "text",
        placeholder: "Identificador do pedido",
      },
      {
        name: "fornecedorId",
        label: "Fornecedor",
        kind: "catalog",
        catalog: "fornecedores",
        placeholder: "Todos os fornecedores",
      },
      {
        name: "tipo",
        label: "Tipo",
        kind: "enum",
        options: [
          option("PREVENTIVA", "Preventiva"),
          option("CORRETIVA", "Corretiva"),
        ],
      },
      {
        name: "situacao",
        label: "Situação",
        kind: "enum",
        options: [
          option("PENDENTE", "Pendente"),
          option("RETORNADO", "Retornado"),
        ],
      },
    ],
    defaults: {},
  },
  depreciacoes: {
    subtitle: "Informe um intervalo de até 12 competências.",
    fields: [
      patrimonio(),
      comissao,
      {
        name: "competenciaInicio",
        label: "Competência inicial",
        kind: "month",
        required: true,
        placeholder: "AAAA-MM",
      },
      {
        name: "competenciaFim",
        label: "Competência final",
        kind: "month",
        required: true,
        placeholder: "AAAA-MM",
      },
    ],
    defaults: {},
  },
  "pendencias-depreciacao": {
    subtitle: "Consulte pendências por bem e competência.",
    fields: [
      patrimonio(),
      {
        name: "competencia",
        label: "Competência",
        kind: "month",
        placeholder: "AAAA-MM",
      },
    ],
    defaults: {},
  },
  reavaliacoes: {
    subtitle: "Consulte reavaliações no período e pela data-base escolhida.",
    fields: [
      patrimonio(),
      comissao,
      ...periodo,
      {
        name: "base",
        label: "Data-base",
        kind: "enum",
        required: true,
        options: [
          option("REGISTRO", "Registro"),
          option("REFERENCIA", "Referência"),
        ],
      },
    ],
    defaults: {},
  },
  inventarios: {
    subtitle: "Selecione o inventário obrigatório e refine as inconsistências.",
    fields: [
      patrimonio(),
      {
        name: "inventarioId",
        label: "Inventário",
        kind: "catalog",
        catalog: "inventarios",
        required: true,
        placeholder: "Selecione um inventário",
      },
      {
        name: "setorEsperadoId",
        label: "Setor esperado",
        kind: "catalog",
        catalog: "setores",
        placeholder: "Todos",
      },
      {
        name: "setorEncontradoId",
        label: "Setor encontrado",
        kind: "catalog",
        catalog: "setores",
        placeholder: "Todos",
      },
      {
        name: "verificacao",
        label: "Verificação",
        kind: "enum",
        options: [
          option("VERIFICADO", "Verificado"),
          option("PENDENTE", "Pendente"),
        ],
      },
      {
        name: "situacao",
        label: "Situação",
        kind: "enum",
        options: [
          option("CORRETO", "Correto"),
          option("DIVERGENCIA", "Divergência"),
          option("NAO_LOCALIZADO", "Não localizado"),
        ],
      },
      {
        name: "correcao",
        label: "Correção original",
        kind: "enum",
        options: [
          option("CORRIGIDO", "Corrigido"),
          option("PENDENTE", "Pendente"),
        ],
      },
      {
        name: "correcaoPosterior",
        label: "Correção posterior",
        kind: "enum",
        options: [
          option("CORRIGIDO", "Corrigido"),
          option("PENDENTE", "Pendente"),
        ],
      },
    ],
    defaults: {},
  },
  emprestimos: {
    subtitle: "Consulte empréstimos pelo período e data-base escolhidos.",
    fields: [
      patrimonio(),
      ...periodo,
      {
        name: "base",
        label: "Data-base",
        kind: "enum",
        required: true,
        options: [
          option("SAIDA", "Saída"),
          option("PREVISAO", "Previsão"),
          option("DEVOLUCAO", "Devolução"),
        ],
      },
      {
        name: "grupoId",
        label: "Grupo",
        kind: "text",
        placeholder: "Identificador do grupo",
      },
      { name: "destinatario", label: "Destinatário", kind: "text" },
      {
        name: "situacao",
        label: "Situação",
        kind: "enum",
        options: [
          option("PENDENTE", "Pendente"),
          option("DEVOLVIDO", "Devolvido"),
        ],
      },
      {
        name: "emAtraso",
        label: "Em atraso",
        kind: "enum",
        options: [option("true", "Sim"), option("false", "Não")],
      },
    ],
    defaults: {},
  },
  baixas: {
    subtitle: "Consulte baixas com período opcional e demais filtros.",
    fields: [
      patrimonio(),
      comissao,
      ...periodoOpcional,
      {
        name: "tipo",
        label: "Tipo de baixa",
        kind: "enum",
        options: [
          option("ALIENACAO", "Alienação"),
          option("INUTILIZACAO", "Inutilização"),
          option("SINISTRO", "Sinistro"),
          option("FURTO", "Furto"),
          option("EXTRAVIO", "Extravio"),
          option("TRANSFERENCIA", "Transferência"),
          option("RECLASSIFICACAO", "Reclassificação"),
          option("ABANDONO", "Abandono"),
          option("ERRO_REGISTRO", "Erro de registro"),
          option("OUTRO", "Outro"),
        ],
      },
    ],
    defaults: {},
  },
} as const satisfies Record<
  TipoRelatorio,
  Readonly<{
    subtitle: string;
    fields: readonly RelatorioField[];
    defaults: RelatorioDraft;
  }>
>;

export const relatorioTitles = titulosRelatorios;

export function createRelatorioDraft(tipo: TipoRelatorio): RelatorioDraft {
  return { ...relatorioFormConfig[tipo].defaults };
}

export function configuredCatalogs(tipo: TipoRelatorio) {
  const fields = relatorioFormConfig[tipo].fields as readonly RelatorioField[];
  return [
    ...new Set(
      fields.flatMap((field) => (field.catalog ? [field.catalog] : [])),
    ),
  ];
}

export function validateRelatorioDraft(
  tipo: TipoRelatorio,
  draft: RelatorioDraft,
) {
  const fields = relatorioFormConfig[tipo].fields as readonly RelatorioField[];
  const values = Object.fromEntries(
    Object.entries(draft)
      .map(([key, value]) => {
        const normalized = value.trim();
        const field = fields.find((candidate) => candidate.name === key);
        if (field?.kind !== "date" || !normalized) return [key, normalized];
        return [key, dateInputToIso(normalized) ?? normalized];
      })
      .filter(([, value]) => value),
  );
  const patrimonioId = values.patrimonioId;
  delete values.patrimonioId;
  if (tipo === "ficha-bem") {
    const idResult = FichaRelatorioParamsSchema.safeParse({ patrimonioId });
    const queryResult = queryRelatorio(tipo).safeParse(values);
    if (!idResult.success || !queryResult.success) {
      const issues = [
        ...(idResult.success ? [] : idResult.error.issues),
        ...(queryResult.success ? [] : queryResult.error.issues),
      ];
      return {
        success: false as const,
        errors: issuesToErrors(tipo, issues),
      };
    }
    return {
      success: true as const,
      patrimonioId: idResult.data.patrimonioId,
      query: queryResult.data,
    };
  }
  const result = queryRelatorio(tipo).safeParse({
    ...values,
    ...(patrimonioId ? { patrimonioId } : {}),
  });
  if (!result.success)
    return {
      success: false as const,
      errors: issuesToErrors(tipo, result.error.issues),
    };
  return { success: true as const, query: result.data };
}

function issuesToErrors(
  tipo: TipoRelatorio,
  issues: readonly Readonly<{
    path: readonly PropertyKey[];
    message: string;
    code?: string;
    format?: string;
    minimum?: number | bigint;
    maximum?: number | bigint;
  }>[],
) {
  const errors: Record<string, string> = {};
  const fields = relatorioFormConfig[tipo].fields as readonly RelatorioField[];
  for (const issue of issues) {
    const field = String(issue.path[0] ?? "form");
    const config = fields.find((candidate) => candidate.name === field);
    errors[field] ??= friendlyIssueMessage(config, issue);
  }
  return errors;
}

function friendlyIssueMessage(
  field: RelatorioField | undefined,
  issue: Readonly<{
    message: string;
    code?: string;
    format?: string;
    minimum?: number | bigint;
    maximum?: number | bigint;
  }>,
) {
  if (!field) return issue.message;
  const label = field.label.toLocaleLowerCase("pt-BR");
  const technical =
    issue.message.startsWith("Invalid ") ||
    issue.message.startsWith("Too ") ||
    issue.message.includes("expected ");
  if (!technical) return issue.message;
  if (field.kind === "date") return `Informe ${label} no formato DD/MM/AAAA.`;
  if (field.kind === "month") return `Informe ${label} no formato AAAA-MM.`;
  if (field.kind === "catalog")
    return `Selecione uma opção válida para ${label}.`;
  if (field.kind === "enum") return `Selecione uma opção válida para ${label}.`;
  if (issue.format === "uuid")
    return `Informe um identificador válido para ${label}.`;
  if (issue.code === "too_small") return `Preencha ${label}.`;
  if (issue.code === "too_big" && issue.maximum)
    return `Use no máximo ${String(issue.maximum)} caracteres em ${label}.`;
  return `Revise o valor informado em ${label}.`;
}

export function formatRelatorioFieldInput(
  field: RelatorioField,
  value: string,
) {
  return field.kind === "date" ? formatDateInput(value) : value;
}

export function configUsesOnlyApprovedCatalogs(tipo: TipoRelatorio) {
  return configuredCatalogs(tipo).every((catalog) =>
    opcoesPorRelatorio[tipo].includes(catalog),
  );
}
