import * as z from "zod";
import {
  PaginacaoQuerySchema,
  criarRespostaSucessoPaginadaSchema,
  criarRespostaSucessoSchema,
} from "../common";

const NomeEspecieSchema = z.string().trim().min(1).max(100);
const DescricaoEspecieSchema = z.string().trim().min(1).max(2_000);
const NaturezaVinculadaSchema = z.strictObject({
  id: z.uuid(),
  nome: z.string().trim().min(1).max(100),
});
const DateTimeUtcResponseSchema = z.iso.datetime({ precision: 3 });

export const EspecieParamsSchema = z.strictObject({
  especieId: z.uuid({
    error: "O identificador da espécie deve ser um UUID válido.",
  }),
});

export const CriarEspecieSchema = z.strictObject({
  nome: NomeEspecieSchema,
  descricao: DescricaoEspecieSchema.optional(),
  naturezaId: z.uuid({ error: "Informe uma natureza válida." }),
});

export const AlterarEspecieSchema = z
  .strictObject({
    nome: NomeEspecieSchema.optional(),
    descricao: DescricaoEspecieSchema.nullable().optional(),
    naturezaId: z.uuid({ error: "Informe uma natureza válida." }).optional(),
  })
  .refine(
    (dados) => Object.values(dados).some((valor) => valor !== undefined),
    {
      error: "Informe ao menos um campo para a atualização.",
    },
  );

export const ListarEspeciesQuerySchema = PaginacaoQuerySchema.extend({
  busca: z.string().trim().min(1).max(100).optional(),
  naturezaId: z.uuid().optional(),
});

export const EspecieResumoSchema = z.strictObject({
  id: z.uuid(),
  nome: NomeEspecieSchema,
  natureza: NaturezaVinculadaSchema,
});

export const EspecieDetalheSchema = EspecieResumoSchema.extend({
  descricao: DescricaoEspecieSchema.nullable(),
  nomeNormalizado: z.string().min(1).max(100),
  createdById: z.uuid(),
  createdAt: DateTimeUtcResponseSchema,
  updatedAt: DateTimeUtcResponseSchema.nullable(),
});

export const ListarEspeciesResponseSchema =
  criarRespostaSucessoPaginadaSchema(EspecieResumoSchema);
export const CriarEspecieResponseSchema =
  criarRespostaSucessoSchema(EspecieDetalheSchema);
export const ConsultarEspecieResponseSchema =
  criarRespostaSucessoSchema(EspecieDetalheSchema);
export const AlterarEspecieResponseSchema =
  criarRespostaSucessoSchema(EspecieDetalheSchema);

export type EspecieParamsInput = z.input<typeof EspecieParamsSchema>;
export type EspecieParamsData = z.output<typeof EspecieParamsSchema>;
export type CriarEspecieInput = z.input<typeof CriarEspecieSchema>;
export type CriarEspecieData = z.output<typeof CriarEspecieSchema>;
export type AlterarEspecieInput = z.input<typeof AlterarEspecieSchema>;
export type AlterarEspecieData = z.output<typeof AlterarEspecieSchema>;
export type ListarEspeciesQueryInput = z.input<
  typeof ListarEspeciesQuerySchema
>;
export type ListarEspeciesQueryData = z.output<
  typeof ListarEspeciesQuerySchema
>;
export type EspecieResumo = z.output<typeof EspecieResumoSchema>;
export type EspecieDetalhe = z.output<typeof EspecieDetalheSchema>;
export type ListarEspeciesResponse = z.output<
  typeof ListarEspeciesResponseSchema
>;
export type CriarEspecieResponse = z.output<typeof CriarEspecieResponseSchema>;
export type ConsultarEspecieResponse = z.output<
  typeof ConsultarEspecieResponseSchema
>;
export type AlterarEspecieResponse = z.output<
  typeof AlterarEspecieResponseSchema
>;
