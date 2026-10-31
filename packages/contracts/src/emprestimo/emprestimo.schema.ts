import * as z from "zod";
import {
  PaginacaoQuerySchema,
  criarRespostaSucessoPaginadaSchema,
  criarRespostaSucessoSchema,
} from "../common";
import { DataCivilSchema, NumeroPatrimonialSchema } from "../patrimonio";

const UuidSchema = z.uuid().transform((id) => id.toLowerCase());
const BuscaSchema = z.string().trim().min(1).max(200);
const DataHoraSchema = z.iso.datetime({ precision: 3 });
const RelacionadoSchema = z.strictObject({
  id: z.uuid(),
  nome: z.string().min(1),
});
const TextoObrigatorioSchema = z.string().trim().min(1).max(2_000);

export const LIMITE_ITENS_EMPRESTIMO = 50;
export const ModoAgrupamentoEmprestimoSchema = z.enum([
  "EM_GRUPO",
  "SEPARADAMENTE",
]);
export const SituacaoEmprestimoSchema = z.enum(["EM_ANDAMENTO", "CONCLUIDO"]);
export const CODIGOS_ERRO_EMPRESTIMO = [
  "EMPRESTIMO_NAO_ENCONTRADO",
  "EMPRESTIMO_IMPEDIDO",
  "PATRIMONIO_NAO_ENCONTRADO",
  "PATRIMONIO_NAO_ATIVO",
  "EMPRESTIMO_INDIVIDUAL_NAO_ENCONTRADO",
  "EMPRESTIMO_INDIVIDUAL_FORA_GRUPO",
  "EMPRESTIMO_JA_DEVOLVIDO",
  "COMISSAO_NAO_ENCONTRADA",
  "COMISSAO_FORA_DA_VIGENCIA",
  "SETOR_EM_INVENTARIO_EM_ANDAMENTO",
  "CRONOLOGIA_PATRIMONIAL_CONFLITANTE",
  "CHAVE_IDEMPOTENCIA_REUTILIZADA",
  "EMPRESTIMO_EM_PROCESSAMENTO",
  "CONFLITO_CONCORRENTE_EMPRESTIMO",
] as const;
export const CodigoErroEmprestimoSchema = z.enum(CODIGOS_ERRO_EMPRESTIMO);

export const EmprestimoParamsSchema = z.strictObject({
  emprestimoId: UuidSchema,
});
export const ListarEmprestimosQuerySchema = PaginacaoQuerySchema.extend({
  busca: BuscaSchema.optional(),
  situacao: SituacaoEmprestimoSchema.optional(),
  somenteAtrasados: z
    .stringbool({
      truthy: ["true", "1"],
      falsy: ["false", "0"],
      case: "insensitive",
    })
    .optional(),
  dataInicio: DataCivilSchema.optional(),
  dataFim: DataCivilSchema.optional(),
}).superRefine((dados, contexto) => {
  if (dados.dataInicio && dados.dataFim && dados.dataInicio > dados.dataFim)
    contexto.addIssue({
      code: "custom",
      path: ["dataFim"],
      message: "A data final não pode ser anterior à inicial.",
    });
});
export const ListarOpcoesPatrimoniosEmprestimoQuerySchema =
  PaginacaoQuerySchema.extend({
    busca: BuscaSchema.optional(),
  });
export const ListarOpcoesComissoesEmprestimoQuerySchema =
  ListarOpcoesPatrimoniosEmprestimoQuerySchema.extend({
    dataReferencia: DataCivilSchema,
  });

export const CriarEmprestimoBodySchema = z
  .strictObject({
    chaveIdempotencia: UuidSchema,
    modoAgrupamento: ModoAgrupamentoEmprestimoSchema,
    patrimonioIds: z.array(UuidSchema).min(1).max(LIMITE_ITENS_EMPRESTIMO),
    destinatario: z.string().trim().min(1).max(200),
    finalidade: TextoObrigatorioSchema,
    observacao: TextoObrigatorioSchema.optional(),
    dataEmprestimo: DataCivilSchema,
    dataPrevistaDevolucao: DataCivilSchema,
    comissaoId: UuidSchema,
  })
  .superRefine((dados, contexto) => {
    const vistos = new Set<string>();
    dados.patrimonioIds.forEach((id, indice) => {
      if (vistos.has(id))
        contexto.addIssue({
          code: "custom",
          path: ["patrimonioIds", indice],
          message: "O patrimônio não pode ser repetido.",
        });
      vistos.add(id);
    });
    if (dados.dataPrevistaDevolucao < dados.dataEmprestimo)
      contexto.addIssue({
        code: "custom",
        path: ["dataPrevistaDevolucao"],
        message: "A previsão não pode anteceder a saída.",
      });
  });
export const RegistrarDevolucaoEmprestimoBodySchema = z
  .strictObject({
    chaveIdempotencia: UuidSchema,
    emprestimoIds: z.array(UuidSchema).min(1).max(LIMITE_ITENS_EMPRESTIMO),
    dataDevolucao: DataCivilSchema,
    comissaoId: UuidSchema,
    observacao: TextoObrigatorioSchema.optional(),
  })
  .superRefine((dados, contexto) => {
    const vistos = new Set<string>();
    dados.emprestimoIds.forEach((id, indice) => {
      if (vistos.has(id))
        contexto.addIssue({
          code: "custom",
          path: ["emprestimoIds", indice],
          message: "O empréstimo individual não pode ser repetido.",
        });
      vistos.add(id);
    });
  });

export const PatrimonioOpcaoEmprestimoSchema = z.strictObject({
  id: z.uuid(),
  numeroPatrimonio: NumeroPatrimonialSchema,
  descricao: z.string().min(1),
  setor: RelacionadoSchema,
  status: z.literal("ATIVO"),
});
export const ComissaoOpcaoEmprestimoSchema = RelacionadoSchema.extend({
  dataVigenciaInicio: DataCivilSchema,
  dataVigenciaFim: DataCivilSchema,
});
export const EmprestimoResumoSchema = z.strictObject({
  id: z.uuid(),
  modoAgrupamento: ModoAgrupamentoEmprestimoSchema.nullable(),
  destinatario: z.string().nullable(),
  dataEmprestimo: DataHoraSchema,
  dataPrevistaDevolucao: DataHoraSchema.nullable(),
  total: z.number().int().min(1),
  pendentes: z.number().int().min(0),
  situacao: SituacaoEmprestimoSchema,
  emAtraso: z.boolean(),
  createdAt: DataHoraSchema,
});
export const ItemEmprestimoSchema = z.strictObject({
  id: z.uuid(),
  patrimonio: z.strictObject({
    id: z.uuid(),
    numeroPatrimonio: NumeroPatrimonialSchema,
    descricao: z.string().min(1),
  }),
  setorVinculo: RelacionadoSchema.nullable(),
  pendente: z.boolean(),
  devolucao: z
    .strictObject({
      id: z.uuid(),
      dataDevolucao: DataHoraSchema,
      createdAt: DataHoraSchema,
      observacao: z.string().nullable(),
      comissao: RelacionadoSchema,
      registradoPor: RelacionadoSchema.nullable(),
      aposPrevisao: z.boolean().nullable(),
    })
    .nullable(),
});
export const EmprestimoDetalheSchema = EmprestimoResumoSchema.extend({
  finalidade: z.string().nullable(),
  observacao: z.string().nullable(),
  comissao: RelacionadoSchema,
  registradoPor: RelacionadoSchema,
  itens: z.array(ItemEmprestimoSchema).min(1),
});
export const ListarEmprestimosResponseSchema =
  criarRespostaSucessoPaginadaSchema(EmprestimoResumoSchema);
export const ConsultarEmprestimoResponseSchema = criarRespostaSucessoSchema(
  EmprestimoDetalheSchema,
);
export const CriarEmprestimoResponseSchema = criarRespostaSucessoSchema(
  z.union([
    EmprestimoDetalheSchema,
    z.array(EmprestimoDetalheSchema).min(1).max(LIMITE_ITENS_EMPRESTIMO),
  ]),
);
export const RegistrarDevolucaoEmprestimoResponseSchema =
  criarRespostaSucessoSchema(
    z.strictObject({
      devolvidos: z
        .array(ItemEmprestimoSchema)
        .min(1)
        .max(LIMITE_ITENS_EMPRESTIMO),
      emprestimo: EmprestimoDetalheSchema,
    }),
  );
export const ListarOpcoesPatrimoniosEmprestimoResponseSchema =
  criarRespostaSucessoPaginadaSchema(PatrimonioOpcaoEmprestimoSchema);
export const ListarOpcoesComissoesEmprestimoResponseSchema =
  criarRespostaSucessoPaginadaSchema(ComissaoOpcaoEmprestimoSchema);

export type CriarEmprestimoBodyData = z.output<
  typeof CriarEmprestimoBodySchema
>;
export type CriarEmprestimoBodyInput = z.input<
  typeof CriarEmprestimoBodySchema
>;
export type RegistrarDevolucaoEmprestimoBodyData = z.output<
  typeof RegistrarDevolucaoEmprestimoBodySchema
>;
export type RegistrarDevolucaoEmprestimoBodyInput = z.input<
  typeof RegistrarDevolucaoEmprestimoBodySchema
>;
export type ListarEmprestimosQueryData = z.output<
  typeof ListarEmprestimosQuerySchema
>;
export type ListarEmprestimosQueryInput = z.input<
  typeof ListarEmprestimosQuerySchema
>;
export type ListarOpcoesPatrimoniosEmprestimoQueryData = z.output<
  typeof ListarOpcoesPatrimoniosEmprestimoQuerySchema
>;
export type ListarOpcoesPatrimoniosEmprestimoQueryInput = z.input<
  typeof ListarOpcoesPatrimoniosEmprestimoQuerySchema
>;
export type ListarOpcoesComissoesEmprestimoQueryData = z.output<
  typeof ListarOpcoesComissoesEmprestimoQuerySchema
>;
export type ListarOpcoesComissoesEmprestimoQueryInput = z.input<
  typeof ListarOpcoesComissoesEmprestimoQuerySchema
>;
export type EmprestimoResumo = z.output<typeof EmprestimoResumoSchema>;
export type EmprestimoDetalhe = z.output<typeof EmprestimoDetalheSchema>;
export type ItemEmprestimo = z.output<typeof ItemEmprestimoSchema>;
export type ListarEmprestimosResponse = z.output<
  typeof ListarEmprestimosResponseSchema
>;
export type ConsultarEmprestimoResponse = z.output<
  typeof ConsultarEmprestimoResponseSchema
>;
export type CriarEmprestimoResponse = z.output<
  typeof CriarEmprestimoResponseSchema
>;
export type RegistrarDevolucaoEmprestimoResponse = z.output<
  typeof RegistrarDevolucaoEmprestimoResponseSchema
>;
export type ListarOpcoesPatrimoniosEmprestimoResponse = z.output<
  typeof ListarOpcoesPatrimoniosEmprestimoResponseSchema
>;
export type ListarOpcoesComissoesEmprestimoResponse = z.output<
  typeof ListarOpcoesComissoesEmprestimoResponseSchema
>;
