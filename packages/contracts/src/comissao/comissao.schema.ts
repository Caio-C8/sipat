import * as z from "zod";
import {
  PaginacaoQuerySchema,
  criarRespostaSucessoPaginadaSchema,
  criarRespostaSucessoSchema,
} from "../common";
import { DataCivilSchema } from "../patrimonio/patrimonio-fields.schema";

export const TIPOS_MEMBRO_COMISSAO = ["PRESIDENTE", "MEMBRO"] as const;
export const LIMITE_MEMBROS_COMISSAO = 50;

export const TipoMembroComissaoSchema = z.enum(TIPOS_MEMBRO_COMISSAO);

const NomeComissaoSchema = z
  .string()
  .trim()
  .min(1, { error: "O nome da comissão é obrigatório." })
  .max(150, {
    error: "O nome da comissão deve possuir no máximo 150 caracteres.",
  });
const DescricaoComissaoSchema = z
  .string()
  .trim()
  .min(1, { error: "A descrição da comissão não pode ser vazia." })
  .max(2_000, {
    error: "A descrição da comissão deve possuir no máximo 2.000 caracteres.",
  });
const NumeroAtoComissaoSchema = z
  .string()
  .trim()
  .min(1, { error: "O número do ato não pode ser vazio." })
  .max(100, {
    error: "O número do ato deve possuir no máximo 100 caracteres.",
  });
const DateTimeUtcResponseSchema = z.iso.datetime({ precision: 3 });

function validarPeriodoVigencia(
  dados: {
    dataVigenciaInicio?: string;
    dataVigenciaFim?: string;
  },
  contexto: z.RefinementCtx,
) {
  if (
    dados.dataVigenciaInicio !== undefined &&
    dados.dataVigenciaFim !== undefined &&
    dados.dataVigenciaFim < dados.dataVigenciaInicio
  ) {
    contexto.addIssue({
      code: "custom",
      path: ["dataVigenciaFim"],
      message: "A data final da vigência não pode ser anterior à data inicial.",
    });
  }
}

export const ComissaoParamsSchema = z.strictObject({
  comissaoId: z.uuid({
    error: "O identificador da comissão deve ser um UUID válido.",
  }),
});

export const MembroComissaoParamsSchema = z.strictObject({
  comissaoId: z.uuid({
    error: "O identificador da comissão deve ser um UUID válido.",
  }),
  membroComissaoId: z.uuid({
    error: "O identificador do integrante deve ser um UUID válido.",
  }),
});

export const MembroInicialComissaoSchema = z.strictObject({
  responsavelId: z.uuid({
    error: "O identificador do responsável deve ser um UUID válido.",
  }),
  papel: TipoMembroComissaoSchema,
});

export const CriarComissaoBodySchema = z
  .strictObject({
    nome: NomeComissaoSchema,
    descricao: DescricaoComissaoSchema.optional(),
    numeroAto: NumeroAtoComissaoSchema.optional(),
    dataVigenciaInicio: DataCivilSchema,
    dataVigenciaFim: DataCivilSchema,
    membros: z
      .array(MembroInicialComissaoSchema)
      .max(LIMITE_MEMBROS_COMISSAO, {
        error: `A comissão deve possuir no máximo ${LIMITE_MEMBROS_COMISSAO} integrantes.`,
      })
      .default([]),
  })
  .superRefine((dados, contexto) => {
    validarPeriodoVigencia(dados, contexto);

    const responsaveis = new Set<string>();
    let encontrouPresidente = false;

    dados.membros.forEach((membro, indice) => {
      if (responsaveis.has(membro.responsavelId)) {
        contexto.addIssue({
          code: "custom",
          path: ["membros", indice, "responsavelId"],
          message: "O responsável não pode aparecer mais de uma vez.",
        });
      }
      responsaveis.add(membro.responsavelId);

      if (membro.papel === "PRESIDENTE") {
        if (encontrouPresidente) {
          contexto.addIssue({
            code: "custom",
            path: ["membros", indice, "papel"],
            message: "A comissão deve possuir no máximo um presidente.",
          });
        }
        encontrouPresidente = true;
      }
    });
  });

export const AlterarComissaoBodySchema = z
  .strictObject({
    nome: NomeComissaoSchema.optional(),
    descricao: DescricaoComissaoSchema.nullable().optional(),
    numeroAto: NumeroAtoComissaoSchema.nullable().optional(),
    dataVigenciaInicio: DataCivilSchema.optional(),
    dataVigenciaFim: DataCivilSchema.optional(),
  })
  .superRefine((dados, contexto) => {
    if (!Object.values(dados).some((valor) => valor !== undefined)) {
      contexto.addIssue({
        code: "custom",
        message: "Informe ao menos um campo para a atualização.",
      });
    }

    validarPeriodoVigencia(dados, contexto);
  });

export const AdicionarMembroComissaoBodySchema = z.strictObject({
  responsavelId: z.uuid({
    error: "O identificador do responsável deve ser um UUID válido.",
  }),
  papel: TipoMembroComissaoSchema,
});

export const AlterarMembroComissaoBodySchema = z.strictObject({
  papel: TipoMembroComissaoSchema,
});

export const ListarComissoesQuerySchema = PaginacaoQuerySchema.extend({
  busca: z.string().trim().min(1).max(150).optional(),
});

const ResponsavelMembroComissaoResponseSchema = z.strictObject({
  id: z.uuid(),
  nome: z.string().trim().min(1).max(100),
  matricula: z.string().trim().min(1).max(20),
  ativo: z.boolean(),
});

export const MembroComissaoResponseSchema = z.strictObject({
  id: z.uuid(),
  papel: TipoMembroComissaoSchema,
  responsavel: ResponsavelMembroComissaoResponseSchema,
  createdAt: DateTimeUtcResponseSchema,
  updatedAt: DateTimeUtcResponseSchema.nullable(),
});

export const ComissaoResumoSchema = z
  .strictObject({
    id: z.uuid(),
    nome: NomeComissaoSchema,
    numeroAto: NumeroAtoComissaoSchema.nullable(),
    dataVigenciaInicio: DataCivilSchema,
    dataVigenciaFim: DataCivilSchema,
  })
  .superRefine(validarPeriodoVigencia);

export const ComissaoDetalheSchema = ComissaoResumoSchema.safeExtend({
  descricao: DescricaoComissaoSchema.nullable(),
  membros: z.array(MembroComissaoResponseSchema).max(LIMITE_MEMBROS_COMISSAO),
  createdById: z.uuid(),
  createdAt: DateTimeUtcResponseSchema,
  updatedAt: DateTimeUtcResponseSchema.nullable(),
});

export const ListarComissoesResponseSchema =
  criarRespostaSucessoPaginadaSchema(ComissaoResumoSchema);
export const CriarComissaoResponseSchema = criarRespostaSucessoSchema(
  ComissaoDetalheSchema,
);
export const ConsultarComissaoResponseSchema = criarRespostaSucessoSchema(
  ComissaoDetalheSchema,
);
export const AlterarComissaoResponseSchema = criarRespostaSucessoSchema(
  ComissaoDetalheSchema,
);
export const AdicionarMembroComissaoResponseSchema = criarRespostaSucessoSchema(
  MembroComissaoResponseSchema,
);
export const AlterarMembroComissaoResponseSchema = criarRespostaSucessoSchema(
  MembroComissaoResponseSchema,
);

export type TipoMembroComissao = z.output<typeof TipoMembroComissaoSchema>;
export type ComissaoParamsInput = z.input<typeof ComissaoParamsSchema>;
export type ComissaoParamsData = z.output<typeof ComissaoParamsSchema>;
export type MembroComissaoParamsInput = z.input<
  typeof MembroComissaoParamsSchema
>;
export type MembroComissaoParamsData = z.output<
  typeof MembroComissaoParamsSchema
>;
export type MembroInicialComissaoInput = z.input<
  typeof MembroInicialComissaoSchema
>;
export type MembroInicialComissaoData = z.output<
  typeof MembroInicialComissaoSchema
>;
export type CriarComissaoBodyInput = z.input<typeof CriarComissaoBodySchema>;
export type CriarComissaoBodyData = z.output<typeof CriarComissaoBodySchema>;
export type AlterarComissaoBodyInput = z.input<
  typeof AlterarComissaoBodySchema
>;
export type AlterarComissaoBodyData = z.output<
  typeof AlterarComissaoBodySchema
>;
export type AdicionarMembroComissaoBodyData = z.output<
  typeof AdicionarMembroComissaoBodySchema
>;
export type AlterarMembroComissaoBodyData = z.output<
  typeof AlterarMembroComissaoBodySchema
>;
export type ListarComissoesQueryInput = z.input<
  typeof ListarComissoesQuerySchema
>;
export type ListarComissoesQueryData = z.output<
  typeof ListarComissoesQuerySchema
>;
export type MembroComissaoResponse = z.output<
  typeof MembroComissaoResponseSchema
>;
export type ComissaoResumo = z.output<typeof ComissaoResumoSchema>;
export type ComissaoDetalhe = z.output<typeof ComissaoDetalheSchema>;
export type ListarComissoesResponse = z.output<
  typeof ListarComissoesResponseSchema
>;
export type CriarComissaoResponse = z.output<
  typeof CriarComissaoResponseSchema
>;
export type ConsultarComissaoResponse = z.output<
  typeof ConsultarComissaoResponseSchema
>;
export type AlterarComissaoResponse = z.output<
  typeof AlterarComissaoResponseSchema
>;
export type AdicionarMembroComissaoResponse = z.output<
  typeof AdicionarMembroComissaoResponseSchema
>;
export type AlterarMembroComissaoResponse = z.output<
  typeof AlterarMembroComissaoResponseSchema
>;
