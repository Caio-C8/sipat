import * as z from "zod";
import { PaginacaoQuerySchema } from "../common";
import { NumeroPatrimonialSchema } from "../patrimonio";
import {
  NomeInventarioSchema,
  SituacaoItemInventarioSchema,
  StatusCorrecaoItemInventarioSchema,
  StatusInventarioSchema,
  StatusSetorInventarioSchema,
  StatusVerificacaoItemInventarioSchema,
  TextoLongoInventarioSchema,
} from "./inventario-fields.schema";

const BuscaInventarioSchema = z
  .string()
  .trim()
  .min(1, { error: "A busca não pode ser vazia." })
  .max(200, { error: "A busca deve possuir no máximo 200 caracteres." });

export const InventarioParamsSchema = z.strictObject({
  inventarioId: z.uuid({
    error: "O identificador do inventário deve ser um UUID válido.",
  }),
});

export const SetorInventarioParamsSchema = z.strictObject({
  inventarioId: z.uuid({
    error: "O identificador do inventário deve ser um UUID válido.",
  }),
  setorInventarioId: z.uuid({
    error: "O identificador do setor do inventário deve ser um UUID válido.",
  }),
});

export const ItemInventarioParamsSchema = z.strictObject({
  inventarioId: z.uuid({
    error: "O identificador do inventário deve ser um UUID válido.",
  }),
  itemInventarioId: z.uuid({
    error: "O identificador do item do inventário deve ser um UUID válido.",
  }),
});

export const CriarInventarioBodySchema = z.strictObject({
  nome: NomeInventarioSchema,
  descricao: TextoLongoInventarioSchema.optional(),
  observacao: TextoLongoInventarioSchema.optional(),
  comissaoId: z.uuid({
    error: "O identificador da comissão deve ser um UUID válido.",
  }),
});

export const ListarInventariosQuerySchema = PaginacaoQuerySchema.extend({
  busca: BuscaInventarioSchema.optional(),
  status: StatusInventarioSchema.optional(),
  comissaoId: z.uuid().optional(),
});

export const ListarSetoresInventarioQuerySchema = PaginacaoQuerySchema.extend({
  busca: BuscaInventarioSchema.optional(),
  status: StatusSetorInventarioSchema.optional(),
});

export const ListarItensInventarioQuerySchema = PaginacaoQuerySchema.extend({
  busca: BuscaInventarioSchema.optional(),
  setorInventarioId: z.uuid().optional(),
  statusVerificacao: StatusVerificacaoItemInventarioSchema.optional(),
  situacao: SituacaoItemInventarioSchema.optional(),
  statusCorrecao: StatusCorrecaoItemInventarioSchema.optional(),
});

export const IniciarSetorInventarioBodySchema = z.strictObject({});
export const ConcluirSetorInventarioBodySchema = z.strictObject({});

export const VerificarItemInventarioBodySchema = z.strictObject({
  numeroPatrimonial: NumeroPatrimonialSchema,
});

const ObservacaoCorrecaoSchema = TextoLongoInventarioSchema.optional();

export const CorrigirItemInventarioBodySchema = z.discriminatedUnion(
  "tipoCorrecao",
  [
    z.strictObject({
      tipoCorrecao: z.literal("RETORNO_AO_SETOR_CADASTRADO"),
      observacao: ObservacaoCorrecaoSchema,
    }),
    z.strictObject({
      tipoCorrecao: z.literal("TRANSFERENCIA_CADASTRAL"),
      observacao: ObservacaoCorrecaoSchema,
    }),
  ],
);

export const FinalizarInventarioBodySchema = z.strictObject({
  confirmarCorrecoesPendentes: z.boolean({
    error:
      "A confirmação sobre correções pendentes deve ser informada explicitamente.",
  }),
});

export type InventarioParamsInput = z.input<typeof InventarioParamsSchema>;
export type InventarioParamsData = z.output<typeof InventarioParamsSchema>;
export type SetorInventarioParamsInput = z.input<
  typeof SetorInventarioParamsSchema
>;
export type SetorInventarioParamsData = z.output<
  typeof SetorInventarioParamsSchema
>;
export type ItemInventarioParamsInput = z.input<
  typeof ItemInventarioParamsSchema
>;
export type ItemInventarioParamsData = z.output<
  typeof ItemInventarioParamsSchema
>;
export type CriarInventarioBodyInput = z.input<
  typeof CriarInventarioBodySchema
>;
export type CriarInventarioBodyData = z.output<
  typeof CriarInventarioBodySchema
>;
export type ListarInventariosQueryInput = z.input<
  typeof ListarInventariosQuerySchema
>;
export type ListarInventariosQueryData = z.output<
  typeof ListarInventariosQuerySchema
>;
export type ListarSetoresInventarioQueryInput = z.input<
  typeof ListarSetoresInventarioQuerySchema
>;
export type ListarSetoresInventarioQueryData = z.output<
  typeof ListarSetoresInventarioQuerySchema
>;
export type ListarItensInventarioQueryInput = z.input<
  typeof ListarItensInventarioQuerySchema
>;
export type ListarItensInventarioQueryData = z.output<
  typeof ListarItensInventarioQuerySchema
>;
export type IniciarSetorInventarioBodyData = z.output<
  typeof IniciarSetorInventarioBodySchema
>;
export type ConcluirSetorInventarioBodyData = z.output<
  typeof ConcluirSetorInventarioBodySchema
>;
export type VerificarItemInventarioBodyData = z.output<
  typeof VerificarItemInventarioBodySchema
>;
export type CorrigirItemInventarioBodyData = z.output<
  typeof CorrigirItemInventarioBodySchema
>;
export type FinalizarInventarioBodyData = z.output<
  typeof FinalizarInventarioBodySchema
>;
