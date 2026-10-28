import * as z from "zod";
import {
  PaginacaoQuerySchema,
  criarRespostaSucessoSchema,
  criarRespostaSucessoPaginadaSchema,
} from "../common";
import {
  DataCivilSchema,
  NumeroPatrimonialSchema,
  TipoNumeroPatrimonialSchema,
} from "../patrimonio";
import { ComissaoResumoSchema } from "../comissao";

const UuidMovimentacaoSchema = z.uuid().transform((id) => id.toLowerCase());
export const LIMITE_ITENS_MOVIMENTACAO = 10;
export const ORIGENS_REGISTRO_MOVIMENTACAO = [
  "COMUM",
  "CORRECAO_INVENTARIO",
] as const;
export const CODIGOS_ERRO_MOVIMENTACAO = [
  "MOVIMENTACAO_NAO_ENCONTRADA",
  "MOVIMENTACAO_IMPEDIDA",
  "PATRIMONIO_NAO_ENCONTRADO",
  "PATRIMONIO_NAO_ATIVO",
  "ORIGEM_ALTERADA",
  "DESTINO_NAO_ENCONTRADO",
  "DESTINO_INATIVO",
  "DESTINO_IGUAL_ORIGEM",
  "SETOR_EM_INVENTARIO_PENDENTE",
  "SETOR_EM_INVENTARIO_EM_ANDAMENTO",
  "DESTINO_FORA_INVENTARIO_ABERTO",
  "COMISSAO_NAO_ENCONTRADA",
  "COMISSAO_FORA_DA_VIGENCIA",
  "CHAVE_IDEMPOTENCIA_REUTILIZADA",
  "MOVIMENTACAO_EM_PROCESSAMENTO",
  "CONFLITO_CONCORRENTE_MOVIMENTACAO",
] as const;
export const CodigoErroMovimentacaoSchema = z.enum(CODIGOS_ERRO_MOVIMENTACAO);
export const OrigemRegistroMovimentacaoSchema = z.enum(
  ORIGENS_REGISTRO_MOVIMENTACAO,
);
export const ItemMovimentacaoBodySchema = z.strictObject({
  patrimonioId: UuidMovimentacaoSchema,
  setorOrigemEsperadoId: UuidMovimentacaoSchema,
  setorDestinoId: UuidMovimentacaoSchema,
});
export const CriarMovimentacaoBodySchema = z
  .strictObject({
    chaveIdempotencia: UuidMovimentacaoSchema,
    comissaoId: UuidMovimentacaoSchema,
    observacao: z
      .string()
      .trim()
      .min(1, { error: "Informe o motivo da movimentação." })
      .max(2_000),
    itens: z
      .array(ItemMovimentacaoBodySchema)
      .min(1)
      .max(LIMITE_ITENS_MOVIMENTACAO),
  })
  .superRefine((dados, contexto) => {
    const ids = new Set<string>();
    dados.itens.forEach((item, indice) => {
      if (ids.has(item.patrimonioId))
        contexto.addIssue({
          code: "custom",
          path: ["itens", indice, "patrimonioId"],
          message: "O patrimônio não pode ser repetido.",
        });
      ids.add(item.patrimonioId);
      if (item.setorOrigemEsperadoId === item.setorDestinoId)
        contexto.addIssue({
          code: "custom",
          path: ["itens", indice, "setorDestinoId"],
          message: "O destino deve ser diferente da origem.",
        });
    });
  });
export const MovimentacaoParamsSchema = z.strictObject({
  movimentacaoId: UuidMovimentacaoSchema,
});
const BuscaSchema = z.string().trim().min(1).max(200);
export const ListarMovimentacoesQuerySchema = PaginacaoQuerySchema.extend({
  busca: BuscaSchema.optional(),
  patrimonioId: UuidMovimentacaoSchema.optional(),
  setorOrigemId: UuidMovimentacaoSchema.optional(),
  setorDestinoId: UuidMovimentacaoSchema.optional(),
  comissaoId: UuidMovimentacaoSchema.optional(),
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
export const ListarOpcoesMovimentacaoQuerySchema = PaginacaoQuerySchema.extend({
  busca: BuscaSchema.optional(),
  contexto: z.enum(["REGISTRO", "FILTRO"]),
});
const RelacionadoSchema = z.strictObject({
  id: z.uuid(),
  nome: z.string().min(1).max(150),
});
const DateTimeSchema = z.iso.datetime({ precision: 3 });
export const MovimentacaoResumoSchema = z.strictObject({
  id: z.uuid(),
  patrimonio: z.strictObject({
    id: z.uuid(),
    numeroPatrimonio: NumeroPatrimonialSchema,
    tipoNumeroPatrimonial: TipoNumeroPatrimonialSchema,
    descricao: z.string().min(1).max(1_000),
  }),
  setorOrigem: RelacionadoSchema,
  setorDestino: RelacionadoSchema,
  comissao: RelacionadoSchema,
  dataTransferencia: DateTimeSchema,
  origemRegistro: OrigemRegistroMovimentacaoSchema,
});
const DetalheBaseSchema = MovimentacaoResumoSchema.extend({
  observacao: z.string().nullable(),
  createdAt: DateTimeSchema,
  registradoPor: RelacionadoSchema,
});
export const MovimentacaoDetalheSchema = z.discriminatedUnion(
  "origemRegistro",
  [
    DetalheBaseSchema.extend({
      origemRegistro: z.literal("COMUM"),
      correcaoInventario: z.null(),
    }),
    DetalheBaseSchema.extend({
      origemRegistro: z.literal("CORRECAO_INVENTARIO"),
      correcaoInventario: z.strictObject({
        inventarioId: z.uuid(),
        itemInventarioId: z.uuid(),
      }),
    }),
  ],
);
export const SetorOpcaoMovimentacaoSchema = RelacionadoSchema.extend({
  ativo: z.boolean(),
  responsavelAtual: RelacionadoSchema,
});
export const ComissaoOpcaoMovimentacaoSchema = ComissaoResumoSchema;
export const CriarMovimentacaoResponseSchema = criarRespostaSucessoSchema(
  z.array(MovimentacaoDetalheSchema).min(1).max(LIMITE_ITENS_MOVIMENTACAO),
);
export const ConsultarMovimentacaoResponseSchema = criarRespostaSucessoSchema(
  MovimentacaoDetalheSchema,
);
export const ListarMovimentacoesResponseSchema =
  criarRespostaSucessoPaginadaSchema(MovimentacaoResumoSchema);
export const ListarSetoresMovimentacaoResponseSchema =
  criarRespostaSucessoPaginadaSchema(SetorOpcaoMovimentacaoSchema);
export const ListarComissoesMovimentacaoResponseSchema =
  criarRespostaSucessoPaginadaSchema(ComissaoOpcaoMovimentacaoSchema);

export type CodigoErroMovimentacao = z.output<
  typeof CodigoErroMovimentacaoSchema
>;
export type OrigemRegistroMovimentacao = z.output<
  typeof OrigemRegistroMovimentacaoSchema
>;
export type CriarMovimentacaoBodyInput = z.input<
  typeof CriarMovimentacaoBodySchema
>;
export type CriarMovimentacaoBodyData = z.output<
  typeof CriarMovimentacaoBodySchema
>;
export type ItemMovimentacaoBodyData = z.output<
  typeof ItemMovimentacaoBodySchema
>;
export type MovimentacaoParamsInput = z.input<typeof MovimentacaoParamsSchema>;
export type MovimentacaoParamsData = z.output<typeof MovimentacaoParamsSchema>;
export type ListarMovimentacoesQueryInput = z.input<
  typeof ListarMovimentacoesQuerySchema
>;
export type ListarMovimentacoesQueryData = z.output<
  typeof ListarMovimentacoesQuerySchema
>;
export type ListarOpcoesMovimentacaoQueryInput = z.input<
  typeof ListarOpcoesMovimentacaoQuerySchema
>;
export type ListarOpcoesMovimentacaoQueryData = z.output<
  typeof ListarOpcoesMovimentacaoQuerySchema
>;
export type MovimentacaoResumo = z.output<typeof MovimentacaoResumoSchema>;
export type MovimentacaoDetalhe = z.output<typeof MovimentacaoDetalheSchema>;
export type SetorOpcaoMovimentacao = z.output<
  typeof SetorOpcaoMovimentacaoSchema
>;
export type ComissaoOpcaoMovimentacao = z.output<
  typeof ComissaoOpcaoMovimentacaoSchema
>;
export type CriarMovimentacaoResponse = z.output<
  typeof CriarMovimentacaoResponseSchema
>;
export type ConsultarMovimentacaoResponse = z.output<
  typeof ConsultarMovimentacaoResponseSchema
>;
export type ListarMovimentacoesResponse = z.output<
  typeof ListarMovimentacoesResponseSchema
>;
export type ListarSetoresMovimentacaoResponse = z.output<
  typeof ListarSetoresMovimentacaoResponseSchema
>;
export type ListarComissoesMovimentacaoResponse = z.output<
  typeof ListarComissoesMovimentacaoResponseSchema
>;
