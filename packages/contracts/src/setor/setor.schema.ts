import * as z from "zod";
import {
  PaginacaoQuerySchema,
  criarRespostaSucessoPaginadaSchema,
  criarRespostaSucessoSchema,
} from "../common";

const NomeSetorSchema = z.string().trim().min(1).max(100);
const SalaSetorSchema = z.string().trim().min(1).max(50);
const RamalSetorSchema = z.string().trim().min(1).max(10);
const AtivoQuerySchema = z.stringbool({
  truthy: ["true", "1"],
  falsy: ["false", "0"],
  case: "insensitive",
  error: "O filtro de situação deve ser true, false, 1 ou 0.",
});
const ResponsavelSetorSchema = z.strictObject({
  id: z.uuid(),
  nome: z.string().trim().min(1).max(100),
  matricula: z.string().trim().min(1).max(20),
  ativo: z.boolean(),
});
const DateTimeUtcResponseSchema = z.iso.datetime({ precision: 3 });

export const SetorParamsSchema = z.strictObject({
  setorId: z.uuid({
    error: "O identificador do setor deve ser um UUID válido.",
  }),
});

export const CriarSetorSchema = z.strictObject({
  nome: NomeSetorSchema,
  sala: SalaSetorSchema.optional(),
  ramal: RamalSetorSchema.optional(),
  responsavelId: z.uuid({ error: "Informe um responsável válido." }),
});

export const AlterarSetorSchema = z
  .strictObject({
    nome: NomeSetorSchema.optional(),
    sala: SalaSetorSchema.nullable().optional(),
    ramal: RamalSetorSchema.nullable().optional(),
    responsavelId: z
      .uuid({ error: "Informe um responsável válido." })
      .optional(),
  })
  .refine(
    (dados) => Object.values(dados).some((valor) => valor !== undefined),
    {
      error: "Informe ao menos um campo para a atualização.",
    },
  );

export const AlterarSituacaoSetorSchema = z.strictObject({
  ativo: z.boolean({ error: "A situação do setor deve ser informada." }),
});

export const ListarSetoresQuerySchema = PaginacaoQuerySchema.extend({
  busca: z.string().trim().min(1).max(100).optional(),
  responsavelId: z.uuid().optional(),
  ativo: AtivoQuerySchema.optional(),
});

export const SetorResumoSchema = z.strictObject({
  id: z.uuid(),
  nome: NomeSetorSchema,
  sala: SalaSetorSchema.nullable(),
  ramal: RamalSetorSchema.nullable(),
  ativo: z.boolean(),
  responsavel: ResponsavelSetorSchema,
});

export const SetorDetalheSchema = SetorResumoSchema.extend({
  createdById: z.uuid(),
  createdAt: DateTimeUtcResponseSchema,
  updatedAt: DateTimeUtcResponseSchema.nullable(),
});

export const ListarSetoresResponseSchema =
  criarRespostaSucessoPaginadaSchema(SetorResumoSchema);
export const CriarSetorResponseSchema =
  criarRespostaSucessoSchema(SetorDetalheSchema);
export const ConsultarSetorResponseSchema =
  criarRespostaSucessoSchema(SetorDetalheSchema);
export const AlterarSetorResponseSchema =
  criarRespostaSucessoSchema(SetorDetalheSchema);
export const AlterarSituacaoSetorResponseSchema =
  criarRespostaSucessoSchema(SetorDetalheSchema);

export type SetorParamsInput = z.input<typeof SetorParamsSchema>;
export type SetorParamsData = z.output<typeof SetorParamsSchema>;
export type CriarSetorInput = z.input<typeof CriarSetorSchema>;
export type CriarSetorData = z.output<typeof CriarSetorSchema>;
export type AlterarSetorInput = z.input<typeof AlterarSetorSchema>;
export type AlterarSetorData = z.output<typeof AlterarSetorSchema>;
export type AlterarSituacaoSetorInput = z.input<
  typeof AlterarSituacaoSetorSchema
>;
export type AlterarSituacaoSetorData = z.output<
  typeof AlterarSituacaoSetorSchema
>;
export type ListarSetoresQueryInput = z.input<typeof ListarSetoresQuerySchema>;
export type ListarSetoresQueryData = z.output<typeof ListarSetoresQuerySchema>;
export type SetorResumo = z.output<typeof SetorResumoSchema>;
export type SetorDetalhe = z.output<typeof SetorDetalheSchema>;
export type ListarSetoresResponse = z.output<
  typeof ListarSetoresResponseSchema
>;
export type CriarSetorResponse = z.output<typeof CriarSetorResponseSchema>;
export type ConsultarSetorResponse = z.output<
  typeof ConsultarSetorResponseSchema
>;
export type AlterarSetorResponse = z.output<typeof AlterarSetorResponseSchema>;
export type AlterarSituacaoSetorResponse = z.output<
  typeof AlterarSituacaoSetorResponseSchema
>;
