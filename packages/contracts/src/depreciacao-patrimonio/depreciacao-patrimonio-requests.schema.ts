import * as z from "zod";
import { PaginacaoQuerySchema } from "../common";
import { CompetenciaMensalSchema } from "./depreciacao-patrimonio-fields.schema";

const ComissaoDepreciacaoIdSchema = z.uuid({
  error: "O identificador da comissão deve ser um UUID válido.",
});

const ConfirmacaoValorResidualSchema = z.boolean({
  error:
    "A confirmação para ignorar patrimônios no valor residual deve ser informada explicitamente.",
});

export const ListarDepreciacoesPendentesQuerySchema =
  PaginacaoQuerySchema.extend({
    competencia: CompetenciaMensalSchema,
  });

export const ExecutarDepreciacoesEmMassaBodySchema = z.strictObject({
  competencia: CompetenciaMensalSchema,
  comissaoId: ComissaoDepreciacaoIdSchema,
  confirmarIgnorarValorResidual: ConfirmacaoValorResidualSchema,
});

export const ExecutarDepreciacaoPatrimonioBodySchema = z.strictObject({
  competencia: CompetenciaMensalSchema,
  comissaoId: ComissaoDepreciacaoIdSchema,
  confirmarIgnorarValorResidual: ConfirmacaoValorResidualSchema,
});

export type ListarDepreciacoesPendentesQueryInput = z.input<
  typeof ListarDepreciacoesPendentesQuerySchema
>;
export type ListarDepreciacoesPendentesQueryData = z.output<
  typeof ListarDepreciacoesPendentesQuerySchema
>;
export type ExecutarDepreciacoesEmMassaBodyInput = z.input<
  typeof ExecutarDepreciacoesEmMassaBodySchema
>;
export type ExecutarDepreciacoesEmMassaBodyData = z.output<
  typeof ExecutarDepreciacoesEmMassaBodySchema
>;
export type ExecutarDepreciacaoPatrimonioBodyInput = z.input<
  typeof ExecutarDepreciacaoPatrimonioBodySchema
>;
export type ExecutarDepreciacaoPatrimonioBodyData = z.output<
  typeof ExecutarDepreciacaoPatrimonioBodySchema
>;
