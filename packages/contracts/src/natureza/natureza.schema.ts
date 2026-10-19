import * as z from "zod";
import {
  PaginacaoQuerySchema,
  criarRespostaSucessoPaginadaSchema,
  criarRespostaSucessoSchema,
} from "../common";

const NomeNaturezaSchema = z.string().trim().min(1).max(100);
const DescricaoNaturezaSchema = z.string().trim().min(1).max(2_000);
const DateTimeUtcResponseSchema = z.iso.datetime({ precision: 3 });

export const NaturezaParamsSchema = z.strictObject({
  naturezaId: z.uuid({
    error: "O identificador da natureza deve ser um UUID válido.",
  }),
});

export const CriarNaturezaSchema = z.strictObject({
  nome: NomeNaturezaSchema,
  descricao: DescricaoNaturezaSchema.optional(),
});

export const AlterarNaturezaSchema = z
  .strictObject({
    nome: NomeNaturezaSchema.optional(),
    descricao: DescricaoNaturezaSchema.nullable().optional(),
  })
  .refine(
    (dados) => Object.values(dados).some((valor) => valor !== undefined),
    {
      error: "Informe ao menos um campo para a atualização.",
    },
  );

export const ListarNaturezasQuerySchema = PaginacaoQuerySchema.extend({
  busca: z.string().trim().min(1).max(100).optional(),
});

export const NaturezaResumoSchema = z.strictObject({
  id: z.uuid(),
  nome: NomeNaturezaSchema,
});

export const NaturezaDetalheSchema = NaturezaResumoSchema.extend({
  descricao: DescricaoNaturezaSchema.nullable(),
  nomeNormalizado: z.string().min(1).max(100),
  createdById: z.uuid(),
  createdAt: DateTimeUtcResponseSchema,
  updatedAt: DateTimeUtcResponseSchema.nullable(),
});

export const ListarNaturezasResponseSchema =
  criarRespostaSucessoPaginadaSchema(NaturezaResumoSchema);
export const CriarNaturezaResponseSchema = criarRespostaSucessoSchema(
  NaturezaDetalheSchema,
);
export const ConsultarNaturezaResponseSchema = criarRespostaSucessoSchema(
  NaturezaDetalheSchema,
);
export const AlterarNaturezaResponseSchema = criarRespostaSucessoSchema(
  NaturezaDetalheSchema,
);

export type NaturezaParamsInput = z.input<typeof NaturezaParamsSchema>;
export type NaturezaParamsData = z.output<typeof NaturezaParamsSchema>;
export type CriarNaturezaInput = z.input<typeof CriarNaturezaSchema>;
export type CriarNaturezaData = z.output<typeof CriarNaturezaSchema>;
export type AlterarNaturezaInput = z.input<typeof AlterarNaturezaSchema>;
export type AlterarNaturezaData = z.output<typeof AlterarNaturezaSchema>;
export type ListarNaturezasQueryInput = z.input<
  typeof ListarNaturezasQuerySchema
>;
export type ListarNaturezasQueryData = z.output<
  typeof ListarNaturezasQuerySchema
>;
export type NaturezaResumo = z.output<typeof NaturezaResumoSchema>;
export type NaturezaDetalhe = z.output<typeof NaturezaDetalheSchema>;
export type ListarNaturezasResponse = z.output<
  typeof ListarNaturezasResponseSchema
>;
export type CriarNaturezaResponse = z.output<
  typeof CriarNaturezaResponseSchema
>;
export type ConsultarNaturezaResponse = z.output<
  typeof ConsultarNaturezaResponseSchema
>;
export type AlterarNaturezaResponse = z.output<
  typeof AlterarNaturezaResponseSchema
>;
