import * as z from "zod";

export const AlterarSituacaoUsuarioSchema = z.strictObject({
  ativo: z.boolean({ error: "A situação do usuário deve ser informada." }),
});

export type AlterarSituacaoUsuarioInput = z.input<
  typeof AlterarSituacaoUsuarioSchema
>;
export type AlterarSituacaoUsuarioData = z.output<
  typeof AlterarSituacaoUsuarioSchema
>;
