import * as z from "zod";
import {
  ChaveIdempotenciaSchema,
  PaginacaoQuerySchema,
  criarRespostaSucessoPaginadaSchema,
  criarRespostaSucessoSchema,
} from "../common";
import {
  DataCivilSchema,
  Decimal19_7Schema,
} from "../patrimonio/patrimonio-fields.schema";

const DateTimeUtcResponseSchema = z.iso.datetime({ precision: 3 });
const AnoSchema = z.number().int().min(1).max(9999);
const NumeroOpcionalSchema = z.string().trim().min(1).max(50);
const ObservacaoSchema = z.string().trim().min(1).max(5_000);

export const LIMITE_NOTAS_CRIAR_PROCESSO_COMPRA = 20;

export const ProcessoCompraParamsSchema = z.strictObject({
  processoCompraId: z.uuid(),
});

export const CriarNotaFiscalProcessoCompraSchema = z.strictObject({
  numeroNotaFiscal: z.string().trim().min(1).max(50),
  anoNotaFiscal: AnoSchema,
  dataEmissao: DataCivilSchema,
  fornecedorId: z.uuid(),
  anexoIndice: z.number().int().min(0).max(19).optional(),
});

const CamposProcessoCompraSchema = {
  numeroProcesso: NumeroOpcionalSchema.optional(),
  anoProcesso: AnoSchema.optional(),
  numeroEmpenho: NumeroOpcionalSchema.optional(),
  anoEmpenho: AnoSchema.optional(),
  valorTotal: Decimal19_7Schema.optional(),
  observacao: ObservacaoSchema.optional(),
};

export const CriarProcessoCompraDadosSchema = z.strictObject({
  chaveIdempotencia: ChaveIdempotenciaSchema,
  ...CamposProcessoCompraSchema,
  notas: z
    .array(CriarNotaFiscalProcessoCompraSchema)
    .max(LIMITE_NOTAS_CRIAR_PROCESSO_COMPRA)
    .default([]),
});

export const AlterarProcessoCompraBodySchema = z
  .strictObject({
    numeroProcesso: NumeroOpcionalSchema.nullable().optional(),
    anoProcesso: AnoSchema.nullable().optional(),
    numeroEmpenho: NumeroOpcionalSchema.nullable().optional(),
    anoEmpenho: AnoSchema.nullable().optional(),
    valorTotal: Decimal19_7Schema.nullable().optional(),
    observacao: ObservacaoSchema.nullable().optional(),
  })
  .refine(
    (dados) => Object.values(dados).some((valor) => valor !== undefined),
    { error: "Informe ao menos um campo para a atualização." },
  );

const AnoQuerySchema = z
  .string()
  .regex(/^\d{1,4}$/)
  .transform(Number)
  .pipe(AnoSchema);

export const ListarProcessosCompraQuerySchema = PaginacaoQuerySchema.extend({
  busca: z.string().trim().min(1).max(200).optional(),
  anoProcesso: AnoQuerySchema.optional(),
  anoEmpenho: AnoQuerySchema.optional(),
  fornecedorId: z.uuid().optional(),
});

const FornecedorProcessoCompraResponseSchema = z.strictObject({
  id: z.uuid(),
  razaoSocial: z.string().trim().min(1).max(150),
});

const NotaFiscalProcessoCompraResponseSchema = z
  .strictObject({
    id: z.uuid(),
    numeroNotaFiscal: z.string().trim().min(1).max(50),
    anoNotaFiscal: AnoSchema,
    dataEmissao: DataCivilSchema,
    fornecedor: FornecedorProcessoCompraResponseSchema,
    anexoUrl: z.string().nullable(),
  })
  .superRefine((nota, contexto) => {
    if (
      nota.anexoUrl !== null &&
      nota.anexoUrl !== `/api/notas-fiscais/${nota.id}/anexo`
    ) {
      contexto.addIssue({
        code: "custom",
        path: ["anexoUrl"],
        message: "A URL do anexo deve ser derivada do identificador da nota.",
      });
    }
  });

export const ProcessoCompraResumoSchema = z.strictObject({
  id: z.uuid(),
  numeroProcesso: NumeroOpcionalSchema.nullable(),
  anoProcesso: AnoSchema.nullable(),
  numeroEmpenho: NumeroOpcionalSchema.nullable(),
  anoEmpenho: AnoSchema.nullable(),
  valorTotal: Decimal19_7Schema.nullable(),
  quantidadeNotas: z.number().int().min(0),
});

export const ProcessoCompraDetalheSchema = ProcessoCompraResumoSchema.extend({
  observacao: ObservacaoSchema.nullable(),
  notas: z.array(NotaFiscalProcessoCompraResponseSchema),
  createdAt: DateTimeUtcResponseSchema,
  updatedAt: DateTimeUtcResponseSchema.nullable(),
});

export const ListarProcessosCompraResponseSchema =
  criarRespostaSucessoPaginadaSchema(ProcessoCompraResumoSchema);
export const CriarProcessoCompraResponseSchema = criarRespostaSucessoSchema(
  ProcessoCompraDetalheSchema,
);
export const ConsultarProcessoCompraResponseSchema = criarRespostaSucessoSchema(
  ProcessoCompraDetalheSchema,
);
export const AlterarProcessoCompraResponseSchema = criarRespostaSucessoSchema(
  ProcessoCompraDetalheSchema,
);

export type ProcessoCompraParamsData = z.output<
  typeof ProcessoCompraParamsSchema
>;
export type CriarProcessoCompraDadosInput = z.input<
  typeof CriarProcessoCompraDadosSchema
>;
export type CriarProcessoCompraDados = z.output<
  typeof CriarProcessoCompraDadosSchema
>;
export type AlterarProcessoCompraBodyInput = z.input<
  typeof AlterarProcessoCompraBodySchema
>;
export type AlterarProcessoCompraBodyData = z.output<
  typeof AlterarProcessoCompraBodySchema
>;
export type ListarProcessosCompraQueryInput = z.input<
  typeof ListarProcessosCompraQuerySchema
>;
export type ListarProcessosCompraQueryData = z.output<
  typeof ListarProcessosCompraQuerySchema
>;
export type ProcessoCompraResumo = z.output<typeof ProcessoCompraResumoSchema>;
export type ProcessoCompraDetalhe = z.output<
  typeof ProcessoCompraDetalheSchema
>;
export type ListarProcessosCompraResponse = z.output<
  typeof ListarProcessosCompraResponseSchema
>;
export type CriarProcessoCompraResponse = z.output<
  typeof CriarProcessoCompraResponseSchema
>;
export type ConsultarProcessoCompraResponse = z.output<
  typeof ConsultarProcessoCompraResponseSchema
>;
export type AlterarProcessoCompraResponse = z.output<
  typeof AlterarProcessoCompraResponseSchema
>;
