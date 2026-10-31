import * as z from "zod";
import {
  ChaveIdempotenciaSchema,
  PaginacaoQuerySchema,
  criarRespostaSucessoPaginadaSchema,
  criarRespostaSucessoSchema,
} from "../common";
import { DataCivilSchema } from "../patrimonio/patrimonio-fields.schema";

const DateTimeUtcResponseSchema = z.iso.datetime({ precision: 3 });
const NumeroNotaFiscalSchema = z.string().trim().min(1).max(50);
const AnoSchema = z.number().int().min(1).max(9999);

export const NotaFiscalParamsSchema = z.strictObject({
  notaFiscalId: z.uuid(),
});

export const CriarNotaFiscalDadosSchema = z.strictObject({
  chaveIdempotencia: ChaveIdempotenciaSchema,
  processoCompraId: z.uuid(),
  numeroNotaFiscal: NumeroNotaFiscalSchema,
  anoNotaFiscal: AnoSchema,
  dataEmissao: DataCivilSchema,
  fornecedorId: z.uuid(),
});

export const AlterarNotaFiscalBodySchema = z
  .strictObject({
    numeroNotaFiscal: NumeroNotaFiscalSchema.optional(),
    anoNotaFiscal: AnoSchema.optional(),
    dataEmissao: DataCivilSchema.optional(),
    fornecedorId: z.uuid().optional(),
  })
  .refine(
    (dados) => Object.values(dados).some((valor) => valor !== undefined),
    { error: "Informe ao menos um campo para a atualização." },
  );

export const ListarNotasFiscaisQuerySchema = PaginacaoQuerySchema.extend({
  busca: z.string().trim().min(1).max(200).optional(),
  processoCompraId: z.uuid().optional(),
  fornecedorId: z.uuid().optional(),
  anoNotaFiscal: z
    .string()
    .regex(/^\d{1,4}$/)
    .transform(Number)
    .pipe(AnoSchema)
    .optional(),
});

const FornecedorNotaFiscalResponseSchema = z.strictObject({
  id: z.uuid(),
  razaoSocial: z.string().trim().min(1).max(150),
});

const ProcessoCompraNotaFiscalResponseSchema = z.strictObject({
  id: z.uuid(),
  numeroProcesso: z.string().min(1).max(50).nullable(),
  anoProcesso: AnoSchema.nullable(),
});

export const NotaFiscalResumoSchema = z
  .strictObject({
    id: z.uuid(),
    numeroNotaFiscal: NumeroNotaFiscalSchema,
    anoNotaFiscal: AnoSchema,
    dataEmissao: DataCivilSchema,
    fornecedor: FornecedorNotaFiscalResponseSchema,
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

export const NotaFiscalDetalheSchema = NotaFiscalResumoSchema.safeExtend({
  processoCompra: ProcessoCompraNotaFiscalResponseSchema,
  createdAt: DateTimeUtcResponseSchema,
  updatedAt: DateTimeUtcResponseSchema.nullable(),
});

export const ListarNotasFiscaisResponseSchema =
  criarRespostaSucessoPaginadaSchema(NotaFiscalResumoSchema);
export const CriarNotaFiscalResponseSchema = criarRespostaSucessoSchema(
  NotaFiscalDetalheSchema,
);
export const ConsultarNotaFiscalResponseSchema = criarRespostaSucessoSchema(
  NotaFiscalDetalheSchema,
);
export const AlterarNotaFiscalResponseSchema = criarRespostaSucessoSchema(
  NotaFiscalDetalheSchema,
);
export const AlterarAnexoNotaFiscalResponseSchema = criarRespostaSucessoSchema(
  NotaFiscalDetalheSchema,
);
export const RemoverAnexoNotaFiscalResponseSchema = criarRespostaSucessoSchema(
  NotaFiscalDetalheSchema,
);

export type NotaFiscalParamsData = z.output<typeof NotaFiscalParamsSchema>;
export type CriarNotaFiscalDadosInput = z.input<
  typeof CriarNotaFiscalDadosSchema
>;
export type CriarNotaFiscalDados = z.output<typeof CriarNotaFiscalDadosSchema>;
export type AlterarNotaFiscalBodyInput = z.input<
  typeof AlterarNotaFiscalBodySchema
>;
export type AlterarNotaFiscalBodyData = z.output<
  typeof AlterarNotaFiscalBodySchema
>;
export type ListarNotasFiscaisQueryInput = z.input<
  typeof ListarNotasFiscaisQuerySchema
>;
export type ListarNotasFiscaisQueryData = z.output<
  typeof ListarNotasFiscaisQuerySchema
>;
export type NotaFiscalResumo = z.output<typeof NotaFiscalResumoSchema>;
export type NotaFiscalDetalhe = z.output<typeof NotaFiscalDetalheSchema>;
export type ListarNotasFiscaisResponse = z.output<
  typeof ListarNotasFiscaisResponseSchema
>;
export type CriarNotaFiscalResponse = z.output<
  typeof CriarNotaFiscalResponseSchema
>;
export type ConsultarNotaFiscalResponse = z.output<
  typeof ConsultarNotaFiscalResponseSchema
>;
export type AlterarNotaFiscalResponse = z.output<
  typeof AlterarNotaFiscalResponseSchema
>;
export type AlterarAnexoNotaFiscalResponse = z.output<
  typeof AlterarAnexoNotaFiscalResponseSchema
>;
export type RemoverAnexoNotaFiscalResponse = z.output<
  typeof RemoverAnexoNotaFiscalResponseSchema
>;
