import * as z from "zod";
import {
  PaginacaoQuerySchema,
  criarRespostaSucessoPaginadaSchema,
  criarRespostaSucessoSchema,
} from "../common";

const NomeResponsavelSchema = z
  .string()
  .trim()
  .min(1, { error: "O nome do responsável é obrigatório." })
  .max(100, {
    error: "O nome do responsável deve possuir no máximo 100 caracteres.",
  });

const MatriculaResponsavelSchema = z
  .string()
  .trim()
  .min(1, { error: "A matrícula do responsável é obrigatória." })
  .max(20, { error: "A matrícula deve possuir no máximo 20 caracteres." });

const AtivoQuerySchema = z.stringbool({
  truthy: ["true", "1"],
  falsy: ["false", "0"],
  case: "insensitive",
  error: "O filtro de situação deve ser true, false, 1 ou 0.",
});

const DateTimeUtcResponseSchema = z.iso.datetime({ precision: 3 });

export const ResponsavelParamsSchema = z.strictObject({
  responsavelId: z.uuid({
    error: "O identificador do responsável deve ser um UUID válido.",
  }),
});

export const CriarResponsavelSchema = z.strictObject({
  nome: NomeResponsavelSchema,
  matricula: MatriculaResponsavelSchema,
});

export const AlterarResponsavelSchema = z
  .strictObject({
    nome: NomeResponsavelSchema.optional(),
    matricula: MatriculaResponsavelSchema.optional(),
  })
  .refine(
    (dados) => Object.values(dados).some((valor) => valor !== undefined),
    {
      error: "Informe ao menos um campo para a atualização.",
    },
  );

export const AlterarSituacaoResponsavelSchema = z.strictObject({
  ativo: z.boolean({ error: "A situação do responsável deve ser informada." }),
});

export const ListarResponsaveisQuerySchema = PaginacaoQuerySchema.extend({
  busca: z.string().trim().min(1).max(100).optional(),
  ativo: AtivoQuerySchema.optional(),
});

export const ResponsavelResumoSchema = z.strictObject({
  id: z.uuid(),
  nome: NomeResponsavelSchema,
  matricula: MatriculaResponsavelSchema,
  ativo: z.boolean(),
});

export const ResponsavelDetalheSchema = ResponsavelResumoSchema.extend({
  createdById: z.uuid(),
  createdAt: DateTimeUtcResponseSchema,
  updatedAt: DateTimeUtcResponseSchema.nullable(),
});

export const ListarResponsaveisResponseSchema =
  criarRespostaSucessoPaginadaSchema(ResponsavelResumoSchema);
export const CriarResponsavelResponseSchema = criarRespostaSucessoSchema(
  ResponsavelDetalheSchema,
);
export const ConsultarResponsavelResponseSchema = criarRespostaSucessoSchema(
  ResponsavelDetalheSchema,
);
export const AlterarResponsavelResponseSchema = criarRespostaSucessoSchema(
  ResponsavelDetalheSchema,
);
export const AlterarSituacaoResponsavelResponseSchema =
  criarRespostaSucessoSchema(ResponsavelDetalheSchema);

export type ResponsavelParamsInput = z.input<typeof ResponsavelParamsSchema>;
export type ResponsavelParamsData = z.output<typeof ResponsavelParamsSchema>;
export type CriarResponsavelInput = z.input<typeof CriarResponsavelSchema>;
export type CriarResponsavelData = z.output<typeof CriarResponsavelSchema>;
export type AlterarResponsavelInput = z.input<typeof AlterarResponsavelSchema>;
export type AlterarResponsavelData = z.output<typeof AlterarResponsavelSchema>;
export type AlterarSituacaoResponsavelData = z.output<
  typeof AlterarSituacaoResponsavelSchema
>;
export type AlterarSituacaoResponsavelInput = z.input<
  typeof AlterarSituacaoResponsavelSchema
>;
export type ListarResponsaveisQueryInput = z.input<
  typeof ListarResponsaveisQuerySchema
>;
export type ListarResponsaveisQueryData = z.output<
  typeof ListarResponsaveisQuerySchema
>;
export type ResponsavelResumo = z.output<typeof ResponsavelResumoSchema>;
export type ResponsavelDetalhe = z.output<typeof ResponsavelDetalheSchema>;
export type ListarResponsaveisResponse = z.output<
  typeof ListarResponsaveisResponseSchema
>;
export type CriarResponsavelResponse = z.output<
  typeof CriarResponsavelResponseSchema
>;
export type ConsultarResponsavelResponse = z.output<
  typeof ConsultarResponsavelResponseSchema
>;
export type AlterarResponsavelResponse = z.output<
  typeof AlterarResponsavelResponseSchema
>;
export type AlterarSituacaoResponsavelResponse = z.output<
  typeof AlterarSituacaoResponsavelResponseSchema
>;
